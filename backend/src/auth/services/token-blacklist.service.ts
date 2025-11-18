import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Token Blacklist Service
 *
 * Manages revoked JWT tokens to prevent their reuse after logout.
 * Supports both Redis (for production/distributed systems) and in-memory storage (for development/single instance).
 *
 * Security Features:
 * - Stores tokens with automatic expiration (TTL)
 * - Fast lookup for token validation
 * - Graceful fallback to in-memory when Redis unavailable
 * - Automatic cleanup of expired tokens
 *
 * Usage:
 * - Call addToBlacklist() when user logs out
 * - Call isBlacklisted() in JWT strategy to reject revoked tokens
 */
@Injectable()
export class TokenBlacklistService implements OnModuleInit {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private redisClient: RedisClientType | null = null;
  private inMemoryBlacklist: Map<string, number> = new Map(); // token -> expiry timestamp
  private useRedis = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Default TTL for tokens in seconds (7 days - should match JWT expiration)
  private readonly DEFAULT_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(private readonly configService: ConfigService) {}

  /**
   * Initialize Redis connection on module startup
   * Falls back to in-memory if Redis is not configured or connection fails
   */
  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      try {
        this.logger.log('Attempting to connect to Redis for token blacklist...');

        this.redisClient = createClient({
          url: redisUrl,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 10) {
                this.logger.error('Redis connection failed after 10 retries. Falling back to in-memory storage.');
                this.fallbackToInMemory();
                return false; // Stop reconnecting
              }
              return Math.min(retries * 100, 3000); // Exponential backoff, max 3 seconds
            },
          },
        });

        // Handle Redis errors
        this.redisClient.on('error', (err) => {
          this.logger.error(`Redis client error: ${err.message}`);
          if (!this.useRedis) {
            this.fallbackToInMemory();
          }
        });

        this.redisClient.on('connect', () => {
          this.logger.log('Redis client connected successfully');
          this.useRedis = true;
        });

        this.redisClient.on('disconnect', () => {
          this.logger.warn('Redis client disconnected. Using in-memory storage.');
          this.fallbackToInMemory();
        });

        await this.redisClient.connect();
        this.useRedis = true;
        this.logger.log('✅ Token blacklist using Redis storage');
      } catch (error) {
        this.logger.error(`Failed to connect to Redis: ${error.message}`);
        this.fallbackToInMemory();
      }
    } else {
      this.logger.warn('REDIS_URL not configured. Using in-memory token blacklist.');
      this.fallbackToInMemory();
    }
  }

  /**
   * Fallback to in-memory storage when Redis is unavailable
   */
  private fallbackToInMemory() {
    this.useRedis = false;
    this.logger.log('⚠️  Token blacklist using in-memory storage (not suitable for multi-instance deployments)');

    // Start cleanup interval for in-memory storage (every 5 minutes)
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        this.cleanupExpiredTokens();
      }, 5 * 60 * 1000); // 5 minutes

      this.logger.log('In-memory blacklist cleanup scheduled every 5 minutes');
    }
  }

  /**
   * Add a token to the blacklist
   *
   * @param token - The JWT token to blacklist
   * @param expiresIn - Optional expiration time in seconds (defaults to DEFAULT_TOKEN_TTL)
   * @returns Promise<void>
   *
   * Security Note:
   * - Tokens are stored with TTL matching their JWT expiration
   * - After expiration, tokens are automatically removed from blacklist
   * - This prevents indefinite storage growth
   */
  async addToBlacklist(token: string, expiresIn?: number): Promise<void> {
    const ttl = expiresIn || this.DEFAULT_TOKEN_TTL;
    const key = this.getBlacklistKey(token);

    try {
      if (this.useRedis && this.redisClient) {
        // Store in Redis with automatic expiration
        await this.redisClient.setEx(key, ttl, 'revoked');
        this.logger.debug(`Token added to Redis blacklist with TTL ${ttl}s`);
      } else {
        // Store in memory with expiration timestamp
        const expiryTimestamp = Date.now() + (ttl * 1000);
        this.inMemoryBlacklist.set(token, expiryTimestamp);
        this.logger.debug(`Token added to in-memory blacklist, expires at ${new Date(expiryTimestamp).toISOString()}`);
      }
    } catch (error) {
      this.logger.error(`Failed to add token to blacklist: ${error.message}`);
      // Fallback to in-memory on error
      if (this.useRedis) {
        this.logger.warn('Redis operation failed, falling back to in-memory for this token');
        const expiryTimestamp = Date.now() + (ttl * 1000);
        this.inMemoryBlacklist.set(token, expiryTimestamp);
      }
    }
  }

  /**
   * Check if a token is blacklisted
   *
   * @param token - The JWT token to check
   * @returns Promise<boolean> - true if token is blacklisted (revoked), false otherwise
   *
   * Security Note:
   * - This method is called on every authenticated request
   * - Fast lookup is critical for performance
   * - Redis provides O(1) lookup time
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.getBlacklistKey(token);

    try {
      if (this.useRedis && this.redisClient) {
        // Check Redis
        const result = await this.redisClient.get(key);
        return result !== null;
      } else {
        // Check in-memory
        const expiryTimestamp = this.inMemoryBlacklist.get(token);

        if (!expiryTimestamp) {
          return false;
        }

        // Check if token has expired
        if (Date.now() > expiryTimestamp) {
          // Remove expired token
          this.inMemoryBlacklist.delete(token);
          return false;
        }

        return true;
      }
    } catch (error) {
      this.logger.error(`Failed to check token blacklist: ${error.message}`);

      // On error, check in-memory as fallback
      if (this.useRedis) {
        const expiryTimestamp = this.inMemoryBlacklist.get(token);
        if (expiryTimestamp && Date.now() <= expiryTimestamp) {
          return true;
        }
      }

      // If we can't verify, allow the request (fail open)
      // The token will still be validated by JWT signature and expiration
      return false;
    }
  }

  /**
   * Remove a token from the blacklist (rarely needed)
   *
   * @param token - The JWT token to remove from blacklist
   * @returns Promise<void>
   */
  async removeFromBlacklist(token: string): Promise<void> {
    const key = this.getBlacklistKey(token);

    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
        this.logger.debug('Token removed from Redis blacklist');
      } else {
        this.inMemoryBlacklist.delete(token);
        this.logger.debug('Token removed from in-memory blacklist');
      }
    } catch (error) {
      this.logger.error(`Failed to remove token from blacklist: ${error.message}`);
    }
  }

  /**
   * Add all refresh tokens for a user to the blacklist
   * Called during logout to invalidate all user sessions
   *
   * @param userId - The user ID whose tokens should be blacklisted
   * @param tokens - Array of refresh tokens to blacklist
   * @returns Promise<void>
   */
  async blacklistUserTokens(userId: string, tokens: string[]): Promise<void> {
    this.logger.log(`Blacklisting ${tokens.length} token(s) for user ${userId}`);

    const promises = tokens.map(token => this.addToBlacklist(token));
    await Promise.all(promises);

    this.logger.log(`Successfully blacklisted ${tokens.length} token(s) for user ${userId}`);
  }

  /**
   * Get statistics about the blacklist
   * Useful for monitoring and debugging
   *
   * @returns Promise<object> - Statistics about blacklist usage
   */
  async getStats(): Promise<{ storage: string; size: number }> {
    try {
      if (this.useRedis && this.redisClient) {
        // Count keys in Redis with our prefix
        const keys = await this.redisClient.keys('blacklist:token:*');
        return {
          storage: 'redis',
          size: keys.length,
        };
      } else {
        return {
          storage: 'in-memory',
          size: this.inMemoryBlacklist.size,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get blacklist stats: ${error.message}`);
      return {
        storage: this.useRedis ? 'redis' : 'in-memory',
        size: this.inMemoryBlacklist.size,
      };
    }
  }

  /**
   * Clean up expired tokens from in-memory storage
   * Called periodically by cleanup interval
   */
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [token, expiryTimestamp] of this.inMemoryBlacklist.entries()) {
      if (now > expiryTimestamp) {
        this.inMemoryBlacklist.delete(token);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} expired token(s) from in-memory blacklist`);
    }
  }

  /**
   * Generate a consistent key for storing tokens
   * Adds prefix for Redis organization and prevents key collisions
   *
   * @param token - The JWT token
   * @returns string - The Redis/storage key
   */
  private getBlacklistKey(token: string): string {
    return `blacklist:token:${token}`;
  }

  /**
   * Cleanup resources on module shutdown
   */
  async onModuleDestroy() {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Disconnect Redis
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis client disconnected successfully');
      } catch (error) {
        this.logger.error(`Error disconnecting Redis: ${error.message}`);
      }
    }

    // Clear in-memory storage
    this.inMemoryBlacklist.clear();
  }
}
