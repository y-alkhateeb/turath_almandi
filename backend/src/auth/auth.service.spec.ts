import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt');
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      username: 'testuser',
      password: 'password123',
      rememberMe: false,
    };

    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      passwordHash: '$2b$10$hashedpassword',
      role: 'ACCOUNTANT',
      branchId: 'branch-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      branch: {
        id: 'branch-1',
        name: 'Main Branch',
      },
    };

    it('should login user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });
      mockConfigService.get.mockReturnValue(7);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        user: {
          id: 'user-1',
          username: 'testuser',
          role: 'ACCOUNTANT',
          branchId: 'branch-1',
          isActive: true,
        },
        access_token: 'mock-access-token',
        refresh_token: expect.any(String),
      });

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
        include: {
          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedpassword');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        username: 'testuser',
        role: 'ACCOUNTANT',
        branch_id: 'branch-1',
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow(
        'اسم المستخدم أو كلمة المرور غير صحيحة',
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow(
        'الحساب معطل. يرجى التواصل مع المسؤول',
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow(
        'اسم المستخدم أو كلمة المرور غير صحيحة',
      );
    });

    it('should use rememberMe flag for refresh token expiration', async () => {
      const loginWithRememberMe = { ...loginDto, rememberMe: true };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME') return 30;
        if (key === 'JWT_REFRESH_TOKEN_EXPIRATION') return 7;
        return undefined;
      });

      await service.login(loginWithRememberMe);

      // Verify that config was queried for remember me expiration
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME');
    });

    it('should include branch information in response', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwtService.sign.mockReturnValue('mock-access-token');
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });
      mockConfigService.get.mockReturnValue(7);

      const result = await service.login(loginDto);

      expect(result.user).toHaveProperty('branchId', 'branch-1');
    });
  });

  describe('validateUser', () => {
    const mockUser = {
      id: 'user-1',
      username: 'testuser',
      passwordHash: '$2b$10$hashedpassword',
      role: 'ACCOUNTANT',
      branchId: 'branch-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return user without password if credentials are valid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await service.validateUser('testuser', 'password123');

      expect(result).toEqual({
        id: 'user-1',
        username: 'testuser',
        role: 'ACCOUNTANT',
        branchId: 'branch-1',
        isActive: true,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', '$2b$10$hashedpassword');
    });

    it('should return null if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password123');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await service.validateUser('testuser', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should not check password if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await service.validateUser('nonexistent', 'password123');

      expect(mockBcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    const refreshTokenDto = {
      refresh_token: 'valid-refresh-token',
    };

    const mockTokenRecord = {
      id: 'token-1',
      token: 'valid-refresh-token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      user: {
        id: 'user-1',
        username: 'testuser',
        passwordHash: '$2b$10$hashedpassword',
        role: 'ACCOUNTANT',
        branchId: 'branch-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should return new access token if refresh token is valid', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockTokenRecord);
      mockJwtService.sign.mockReturnValue('new-access-token');

      const result = await service.refreshAccessToken(refreshTokenDto);

      expect(result).toEqual({
        access_token: 'new-access-token',
      });

      expect(mockPrismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token' },
        include: { user: true },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        username: 'testuser',
        role: 'ACCOUNTANT',
        branch_id: 'branch-1',
      });
    });

    it('should throw UnauthorizedException if refresh token does not exist', async () => {
      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshAccessToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshAccessToken(refreshTokenDto)).rejects.toThrow(
        'رمز التحديث غير صالح',
      );
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredTokenRecord);
      mockPrismaService.refreshToken.delete.mockResolvedValue(expiredTokenRecord);

      await expect(service.refreshAccessToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshAccessToken(refreshTokenDto)).rejects.toThrow(
        'رمز التحديث منتهي الصلاحية',
      );

      // Should delete expired token
      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: 'valid-refresh-token' },
      });
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUserTokenRecord = {
        ...mockTokenRecord,
        user: {
          ...mockTokenRecord.user,
          isActive: false,
        },
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(inactiveUserTokenRecord);

      await expect(service.refreshAccessToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.refreshAccessToken(refreshTokenDto)).rejects.toThrow('الحساب معطل');
    });

    it('should delete expired token when found', async () => {
      const expiredTokenRecord = {
        ...mockTokenRecord,
        expiresAt: new Date(Date.now() - 1000), // Just expired
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredTokenRecord);
      mockPrismaService.refreshToken.delete.mockResolvedValue(expiredTokenRecord);

      await expect(service.refreshAccessToken(refreshTokenDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrismaService.refreshToken.delete).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate JWT with correct payload', async () => {
      mockJwtService.sign.mockReturnValue('generated-token');

      const result = await service.generateToken('user-1', 'testuser', 'ADMIN', 'branch-1');

      expect(result).toBe('generated-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        username: 'testuser',
        role: 'ADMIN',
        branch_id: 'branch-1',
      });
    });

    it('should handle null branchId', async () => {
      mockJwtService.sign.mockReturnValue('generated-token');

      await service.generateToken('user-1', 'testuser', 'ADMIN', null);

      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        username: 'testuser',
        role: 'ADMIN',
        branch_id: null,
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate and store refresh token with default expiration', async () => {
      mockConfigService.get.mockReturnValue(7);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      const result = await service.generateRefreshToken('user-1', false);

      expect(result).toMatch(/^[a-f0-9]{128}$/); // 64 bytes = 128 hex chars
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          expiresAt: { lt: expect.any(Date) },
        },
      });
      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          userId: 'user-1',
          expiresAt: expect.any(Date),
        },
      });
      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_EXPIRATION');
    });

    it('should use extended expiration for rememberMe', async () => {
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME') return 30;
        return 7;
      });
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      await service.generateRefreshToken('user-1', true);

      expect(mockConfigService.get).toHaveBeenCalledWith('JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME');
    });

    it('should clean up expired tokens before creating new one', async () => {
      mockConfigService.get.mockReturnValue(7);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });
      mockPrismaService.refreshToken.create.mockResolvedValue({
        id: 'token-1',
        token: 'mock-refresh-token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      await service.generateRefreshToken('user-1', false);

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalled();
      // Verify deleteMany was called before create
      const deleteManyCall = mockPrismaService.refreshToken.deleteMany.mock.invocationCallOrder[0];
      const createCall = mockPrismaService.refreshToken.create.mock.invocationCallOrder[0];
      expect(deleteManyCall).toBeLessThan(createCall);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockPayload = {
        sub: 'user-1',
        username: 'testuser',
        role: 'ADMIN',
        branch_id: 'branch-1',
      };
      mockJwtService.verify.mockReturnValue(mockPayload);

      const result = await service.verifyToken('valid-token');

      expect(result).toEqual(mockPayload);
      expect(mockJwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      await expect(service.verifyToken('invalid-token')).rejects.toThrow('الرمز غير صالح');
    });
  });

  describe('logout', () => {
    it('should revoke all refresh tokens for user', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.logout('user-1');

      expect(result).toEqual({
        message: 'تم تسجيل الخروج بنجاح',
      });
      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should succeed even if no tokens exist', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 0 });

      const result = await service.logout('user-1');

      expect(result).toEqual({
        message: 'تم تسجيل الخروج بنجاح',
      });
    });
  });
});
