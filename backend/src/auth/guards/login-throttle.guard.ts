import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { createClient, RedisClientType } from 'redis';

interface LoginAttempt {
  count: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  blockedUntil?: number;
}

/**
 * Login Throttle Guard
 *
 * Protects against brute force attacks by limiting failed login attempts per IP address.
 *
 * Features:
 * - Tracks failed login attempts per IP
 * - Blocks IP after 5 failed attempts for 15 minutes
 * - Automatically resets counter on successful login
 * - Supports both Redis (distributed) and in-memory (single instance) storage
 * - Configurable thresholds and block duration
 *
 * Security Benefits:
 * - Prevents credential stuffing attacks
 * - Mitigates brute force password guessing
 * - Rate limits authentication endpoints
 * - Protects against automated attacks
 *
 * Usage:
 * Apply to login endpoint with @UseGuards(LoginThrottleGuard)
 */
@Injectable()
export class LoginThrottleGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(LoginThrottleGuard.name);
  private redisClient: RedisClientType | null = null;
  private inMemoryAttempts: Map<string, LoginAttempt> = new Map();
  private useRedis = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Configuration constants
  private readonly MAX_ATTEMPTS = 5; // Maximum failed attempts before blocking
  private readonly BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds
  private readonly WINDOW_MS = 15 * 60 * 1000; // 15 minute sliding window
  private readonly CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Cleanup every 5 minutes

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Redis connection on module startup
   */
  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      try {
        this.logger.log('Attempting to connect to Redis for login throttle...');

        this.redisClient = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                this.logger.error('Redis connection failed for login throttle. Using in-memory storage.');
                this.fallbackToInMemory();
                return false;
              }
              return Math.min(retries * 100, 3000);
            },
          },
        });

        this.redisClient.on('error', (err) => {
          this.logger.error(`Redis client error (login throttle): ${err.message}`);
        });

        this.redisClient.on('connect', () => {
          this.logger.log('Redis client connected for login throttle');
          this.useRedis = true;
        });

        this.redisClient.on('disconnect', () => {
          this.logger.warn('Redis disconnected. Login throttle using in-memory storage.');
          this.fallbackToInMemory();
        });

        await this.redisClient.connect();
        this.useRedis = true;
        this.logger.log('✅ Login throttle using Redis storage');
      } catch (error) {
        this.logger.error(`Failed to connect to Redis: ${error.message}`);
        this.fallbackToInMemory();
      }
    } else {
      this.fallbackToInMemory();
    }
  }

  /**
   * Fallback to in-memory storage
   */
  private fallbackToInMemory() {
    this.useRedis = false;
    this.logger.log('⚠️  Login throttle using in-memory storage');

    // Start cleanup interval for in-memory storage
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpiredAttempts();
      }, this.CLEANUP_INTERVAL_MS);
    }
  }

  /**
   * CanActivate implementation
   * Checks if the IP is allowed to attempt login
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);

    // Skip throttling for whitelisted IPs (localhost in development)
    if (this.isWhitelisted(ip)) {
      return true;
    }

    // Check if IP is currently blocked
    const isBlocked = await this.isIpBlocked(ip);
    if (isBlocked) {
      const blockedUntil = await this.getBlockedUntil(ip);
      const remainingSeconds = blockedUntil ? Math.ceil((blockedUntil - Date.now()) / 1000) : 0;

      this.logger.warn(`Blocked login attempt from IP: ${ip} (${remainingSeconds}s remaining)`);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `تم حظر عنوان IP الخاص بك مؤقتًا بسبب محاولات تسجيل دخول فاشلة متعددة. يرجى المحاولة مرة أخرى بعد ${Math.ceil(remainingSeconds / 60)} دقيقة`,
          error: 'Too Many Requests',
          retryAfter: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Get current attempt count
    const attempts = await this.getAttempts(ip);

    // Check if approaching limit (for logging/monitoring)
    if (attempts >= this.MAX_ATTEMPTS - 2) {
      this.logger.warn(`IP ${ip} has ${attempts} failed login attempts (approaching limit)`);
    }

    return true;
  }

  /**
   * Record a failed login attempt
   * Call this after unsuccessful login
   */
  async recordFailedAttempt(ip: string): Promise<void> {
    const now = Date.now();
    const key = this.getAttemptKey(ip);

    try {
      if (this.useRedis && this.redisClient) {
        // Get current attempts from Redis
        const data = await this.redisClient.get(key);
        const attempt: LoginAttempt = data
          ? JSON.parse(data)
          : {
              count: 0,
              firstAttemptAt: now,
              lastAttemptAt: now,
            };

        // Increment count
        attempt.count += 1;
        attempt.lastAttemptAt = now;

        // Check if should be blocked
        if (attempt.count >= this.MAX_ATTEMPTS) {
          attempt.blockedUntil = now + this.BLOCK_DURATION_MS;
          this.logger.warn(`IP ${ip} blocked after ${attempt.count} failed attempts`);
        }

        // Store in Redis with expiration (block duration + window)
        const ttlSeconds = Math.ceil((this.BLOCK_DURATION_MS + this.WINDOW_MS) / 1000);
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(attempt));
      } else {
        // In-memory storage
        const attempt = this.inMemoryAttempts.get(ip) || {
          count: 0,
          firstAttemptAt: now,
          lastAttemptAt: now,
        };

        attempt.count += 1;
        attempt.lastAttemptAt = now;

        if (attempt.count >= this.MAX_ATTEMPTS) {
          attempt.blockedUntil = now + this.BLOCK_DURATION_MS;
          this.logger.warn(`IP ${ip} blocked after ${attempt.count} failed attempts`);
        }

        this.inMemoryAttempts.set(ip, attempt);
      }

      this.logger.debug(`Recorded failed login attempt for IP: ${ip}`);
    } catch (error) {
      this.logger.error(`Failed to record login attempt: ${error.message}`);
    }
  }

  /**
   * Reset attempts for an IP (call on successful login)
   */
  async resetAttempts(ip: string): Promise<void> {
    const key = this.getAttemptKey(ip);

    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
      } else {
        this.inMemoryAttempts.delete(ip);
      }

      this.logger.debug(`Reset login attempts for IP: ${ip}`);
    } catch (error) {
      this.logger.error(`Failed to reset attempts: ${error.message}`);
    }
  }

  /**
   * Check if IP is currently blocked
   */
  private async isIpBlocked(ip: string): Promise<boolean> {
    const key = this.getAttemptKey(ip);
    const now = Date.now();

    try {
      if (this.useRedis && this.redisClient) {
        const data = await this.redisClient.get(key);
        if (!data) return false;

        const attempt: LoginAttempt = JSON.parse(data);
        return !!(attempt.blockedUntil && attempt.blockedUntil > now);
      } else {
        const attempt = this.inMemoryAttempts.get(ip);
        if (!attempt) return false;

        return !!(attempt.blockedUntil && attempt.blockedUntil > now);
      }
    } catch (error) {
      this.logger.error(`Failed to check if IP is blocked: ${error.message}`);
      return false; // Fail open on error
    }
  }

  /**
   * Get blocked until timestamp
   */
  private async getBlockedUntil(ip: string): Promise<number | null> {
    const key = this.getAttemptKey(ip);

    try {
      if (this.useRedis && this.redisClient) {
        const data = await this.redisClient.get(key);
        if (!data) return null;

        const attempt: LoginAttempt = JSON.parse(data);
        return attempt.blockedUntil || null;
      } else {
        const attempt = this.inMemoryAttempts.get(ip);
        return attempt?.blockedUntil || null;
      }
    } catch (error) {
      this.logger.error(`Failed to get blocked until: ${error.message}`);
      return null;
    }
  }

  /**
   * Get current attempt count for an IP
   */
  private async getAttempts(ip: string): Promise<number> {
    const key = this.getAttemptKey(ip);

    try {
      if (this.useRedis && this.redisClient) {
        const data = await this.redisClient.get(key);
        if (!data) return 0;

        const attempt: LoginAttempt = JSON.parse(data);
        return attempt.count;
      } else {
        const attempt = this.inMemoryAttempts.get(ip);
        return attempt?.count || 0;
      }
    } catch (error) {
      this.logger.error(`Failed to get attempts: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get client IP address from request
   * Handles proxies and load balancers
   */
  private getClientIp(request: Request): string {
    // Check for IP from reverse proxy
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    // Check for real IP header
    const realIp = request.headers['x-real-ip'];
    if (realIp) {
      return Array.isArray(realIp) ? realIp[0] : realIp;
    }

    // Fall back to socket IP
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  /**
   * Check if IP is whitelisted (always allowed)
   */
  private isWhitelisted(ip: string): boolean {
    // Whitelist localhost in development
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    const localhostIps = ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost'];

    if (isDevelopment && localhostIps.includes(ip)) {
      return true;
    }

    // Could add configurable whitelist here
    // const whitelist = this.configService.get<string>('LOGIN_THROTTLE_WHITELIST', '').split(',');
    // return whitelist.includes(ip);

    return false;
  }

  /**
   * Generate Redis/storage key for IP attempts
   */
  private getAttemptKey(ip: string): string {
    return `login:attempts:${ip}`;
  }

  /**
   * Clean up expired attempts from in-memory storage
   */
  private cleanupExpiredAttempts(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [ip, attempt] of this.inMemoryAttempts.entries()) {
      // Remove if block expired and outside window
      const blockExpired = !attempt.blockedUntil || attempt.blockedUntil < now;
      const windowExpired = attempt.lastAttemptAt + this.WINDOW_MS < now;

      if (blockExpired && windowExpired) {
        this.inMemoryAttempts.delete(ip);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} expired login attempt record(s)`);
    }
  }

  /**
   * Get statistics about login attempts
   */
  async getStats(): Promise<{
    storage: string;
    totalIps: number;
    blockedIps: number;
  }> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys('login:attempts:*');
        let blockedCount = 0;

        for (const key of keys) {
          const data = await this.redisClient.get(key);
          if (data) {
            const attempt: LoginAttempt = JSON.parse(data);
            if (attempt.blockedUntil && attempt.blockedUntil > Date.now()) {
              blockedCount++;
            }
          }
        }

        return {
          storage: 'redis',
          totalIps: keys.length,
          blockedIps: blockedCount,
        };
      } else {
        const now = Date.now();
        let blockedCount = 0;

        for (const attempt of this.inMemoryAttempts.values()) {
          if (attempt.blockedUntil && attempt.blockedUntil > now) {
            blockedCount++;
          }
        }

        return {
          storage: 'in-memory',
          totalIps: this.inMemoryAttempts.size,
          blockedIps: blockedCount,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`);
      return {
        storage: this.useRedis ? 'redis' : 'in-memory',
        totalIps: 0,
        blockedIps: 0,
      };
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    if (this.redisClient) {
      try {
        await this.redisClient.quit();
      } catch (error) {
        this.logger.error(`Error disconnecting Redis: ${error.message}`);
      }
    }

    this.inMemoryAttempts.clear();
  }
}
