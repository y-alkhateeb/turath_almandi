import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
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

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password, rememberMe } = loginDto;

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
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('الحساب معطل. يرجى التواصل مع المسؤول');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

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

  async refreshAccessToken(refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string }> {
    const { refresh_token } = refreshTokenDto;

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
      await this.prisma.refreshToken.delete({
        where: { token: refresh_token },
      });
      throw new UnauthorizedException('رمز التحديث منتهي الصلاحية');
    }

    // Check if user is active
    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedException('الحساب معطل');
    }

    // Generate new access token
    const access_token = await this.generateToken(
      tokenRecord.user.id,
      tokenRecord.user.username,
      tokenRecord.user.role,
      tokenRecord.user.branchId,
    );

    return { access_token };
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Revoke all refresh tokens for this user
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'تم تسجيل الخروج بنجاح' };
  }
}
