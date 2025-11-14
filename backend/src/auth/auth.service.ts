import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';

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

    // Generate JWT token
    const access_token = await this.generateToken(
      user.id,
      user.username,
      user.role,
      user.branchId,
    );

    return {
      user,
      access_token,
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = loginDto;

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

    // Generate JWT token
    const access_token = await this.generateToken(
      user.id,
      user.username,
      user.role,
      user.branchId,
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        branchId: user.branchId,
        isActive: user.isActive,
      },
      access_token,
    };
  }

  async validateUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async generateToken(
    userId: string,
    username: string,
    role: string,
    branchId: string | null,
  ) {
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
    } catch (error) {
      throw new UnauthorizedException('الرمز غير صالح');
    }
  }
}
