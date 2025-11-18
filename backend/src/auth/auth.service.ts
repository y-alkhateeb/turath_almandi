import { Injectable, UnauthorizedException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { LoginThrottleGuard } from './guards/login-throttle.guard';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenBlacklistService: TokenBlacklistService,
    @Inject(forwardRef(() => LoginThrottleGuard))
    private loginThrottleGuard: LoginThrottleGuard,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, password, role, branchId } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('المستخدم بهذا الاسم موجود مسبقاً');
    }

    // Hash password
    const saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS') || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        username,
        passwordHash: hashedPassword,
        role: role || 'ACCOUNTANT',
        branchId: branchId || null,
      },
      select: {
        id: true,
        username: true,
        role: true,
        branchId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const access_token = await this.generateToken(user.id, user.username, user.role, user.branchId);
    const refresh_token = await this.generateRefreshToken(user.id);

    return {
      user,
      access_token,
      refresh_token,
    };
  }

  async login(loginDto: LoginDto, request: Request): Promise<LoginResponseDto> {
    const { username, password, rememberMe } = loginDto;

    // Get client IP for throttling
    const ip = this.getClientIp(request);

    // Find user with branch relation
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      // Record failed attempt for non-existent user
      await this.loginThrottleGuard.recordFailedAttempt(ip);
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Check if account is locked
    const now = new Date();
    if (user.lockedUntil && user.lockedUntil > now) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / (1000 * 60));
      await this.loginThrottleGuard.recordFailedAttempt(ip);
      throw new UnauthorizedException(
        `تم قفل حسابك بسبب محاولات تسجيل دخول فاشلة متعددة. يرجى المحاولة مرة أخرى بعد ${remainingMinutes} دقيقة`,
      );
    }

    // Check if user is active
    if (!user.isActive) {
      // Record failed attempt for inactive user
      await this.loginThrottleGuard.recordFailedAttempt(ip);
      throw new UnauthorizedException('الحساب معطل. يرجى التواصل مع المسؤول');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const maxAttempts = 5;

      // Lock account if max attempts reached
      if (failedAttempts >= maxAttempts) {
        const lockDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
        const lockedUntil = new Date(Date.now() + lockDuration);

        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedAttempts,
            lockedUntil: lockedUntil,
          },
        });

        await this.loginThrottleGuard.recordFailedAttempt(ip);
        throw new UnauthorizedException(
          `تم قفل حسابك بسبب ${maxAttempts} محاولات تسجيل دخول فاشلة. يرجى المحاولة مرة أخرى بعد 30 دقيقة`,
        );
      }

      // Update failed attempts
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedAttempts,
        },
      });

      const remainingAttempts = maxAttempts - failedAttempts;
      await this.loginThrottleGuard.recordFailedAttempt(ip);
      throw new UnauthorizedException(
        `اسم المستخدم أو كلمة المرور غير صحيحة. تبقى ${remainingAttempts} محاولة قبل قفل الحساب`,
      );
    }

    // Successful login - reset account lockout
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }

    // Reset IP-based throttle attempts
    await this.loginThrottleGuard.resetAttempts(ip);

    // Generate tokens
    const access_token = await this.generateToken(user.id, user.username, user.role, user.branchId);
    const refresh_token = await this.generateRefreshToken(user.id, rememberMe);

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
      },
      access_token,
      refresh_token,
    };
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

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    // Check if user is active
    if (!user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async generateToken(userId: string, username: string, role: string, branchId: string | null) {
    const payload = {
      sub: userId,
      username,
      role,
      branch_id: branchId,
    };
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error: unknown) {
      // Type guard: check if error is an Error instance
      throw new UnauthorizedException('الرمز غير صالح');
    }
  }

  async generateRefreshToken(userId: string, rememberMe?: boolean): Promise<string> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    // Set expiration based on rememberMe and configuration
    const daysToAdd = rememberMe
      ? this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME') || 30
      : this.configService.get<number>('JWT_REFRESH_TOKEN_EXPIRATION') || 7;
    expiresAt.setDate(expiresAt.getDate() + daysToAdd);

    // Clean up old expired tokens
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        expiresAt: { lt: new Date() },
      },
    });

    // Store new token
    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async refreshAccessToken(refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string; refresh_token: string }> {
    const { refresh_token } = refreshTokenDto;

    // Check if the refresh token is blacklisted
    const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(refresh_token);
    if (isBlacklisted) {
      throw new UnauthorizedException('رمز التحديث تم إبطاله');
    }

    // Find token in database
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refresh_token },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('رمز التحديث غير صالح');
    }

    // Check if expired
    if (tokenRecord.expiresAt < new Date()) {
      // Delete expired token and add to blacklist
      await this.prisma.refreshToken.delete({
        where: { token: refresh_token },
      });
      await this.tokenBlacklistService.addToBlacklist(refresh_token, 60 * 60); // 1 hour TTL for expired tokens
      throw new UnauthorizedException('رمز التحديث منتهي الصلاحية');
    }

    // Check if user is active
    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('الحساب معطل');
    }

    // Add old refresh token to blacklist
    // Calculate TTL based on remaining time until expiration
    const now = new Date();
    const expiresAt = new Date(tokenRecord.expiresAt);
    const ttlMs = expiresAt.getTime() - now.getTime();
    const ttlSeconds = Math.max(Math.floor(ttlMs / 1000), 60); // Minimum 60 seconds

    await this.tokenBlacklistService.addToBlacklist(refresh_token, ttlSeconds);

    // Delete old refresh token from database
    await this.prisma.refreshToken.delete({
      where: { token: refresh_token },
    });

    // Generate new access token
    const access_token = await this.generateToken(
      tokenRecord.user.id,
      tokenRecord.user.username,
      tokenRecord.user.role,
      tokenRecord.user.branchId,
    );

    // Generate new refresh token
    const new_refresh_token = await this.generateRefreshToken(tokenRecord.user.id);

    return {
      access_token,
      refresh_token: new_refresh_token,
    };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async logout(userId: string, accessToken: string): Promise<{ message: string }> {
    // Get all refresh tokens for this user before deleting
    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: { userId },
      select: { token: true },
    });

    // Add access token to blacklist
    // Calculate remaining TTL from token expiration
    try {
      const decoded = this.jwtService.decode(accessToken) as { exp?: number };
      const now = Math.floor(Date.now() / 1000);
      const ttl = decoded?.exp ? decoded.exp - now : 7 * 24 * 60 * 60; // Default to 7 days if no exp

      if (ttl > 0) {
        await this.tokenBlacklistService.addToBlacklist(accessToken, ttl);
      }
    } catch (error) {
      // If token decode fails, add with default TTL
      await this.tokenBlacklistService.addToBlacklist(accessToken);
    }

    // Add all refresh tokens to blacklist
    const refreshTokenStrings = refreshTokens.map(rt => rt.token);
    if (refreshTokenStrings.length > 0) {
      await this.tokenBlacklistService.blacklistUserTokens(userId, refreshTokenStrings);
    }

    // Delete all refresh tokens from database
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}
