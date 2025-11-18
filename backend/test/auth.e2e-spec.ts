import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test user data
  const testUser = {
    id: 'test-user-id',
    username: 'testuser',
    password: 'password123',
    passwordHash: '',
    role: 'ACCOUNTANT',
    branchId: 'test-branch-id',
    isActive: true,
  };

  const inactiveUser = {
    id: 'inactive-user-id',
    username: 'inactiveuser',
    password: 'password123',
    passwordHash: '',
    role: 'ACCOUNTANT',
    branchId: 'test-branch-id',
    isActive: false,
  };

  beforeAll(async () => {
    // Create testing module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global validation pipe (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Hash passwords for test users
    testUser.passwordHash = await bcrypt.hash(testUser.password, 10);
    inactiveUser.passwordHash = await bcrypt.hash(inactiveUser.password, 10);

    // Clean up any existing test data
    await cleanupTestData();

    // Create test branch
    await prismaService.branch.create({
      data: {
        id: 'test-branch-id',
        name: 'Test Branch',
        location: 'Test Location',
      },
    });

    // Create test users
    await prismaService.user.create({
      data: {
        id: testUser.id,
        username: testUser.username,
        passwordHash: testUser.passwordHash,
        role: testUser.role,
        branchId: testUser.branchId,
        isActive: testUser.isActive,
      },
    });

    await prismaService.user.create({
      data: {
        id: inactiveUser.id,
        username: inactiveUser.username,
        passwordHash: inactiveUser.passwordHash,
        role: inactiveUser.role,
        branchId: inactiveUser.branchId,
        isActive: inactiveUser.isActive,
      },
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    // Delete in order of dependencies
    await prismaService.refreshToken.deleteMany({
      where: {
        userId: {
          in: [testUser.id, inactiveUser.id],
        },
      },
    });

    await prismaService.user.deleteMany({
      where: {
        id: {
          in: [testUser.id, inactiveUser.id],
        },
      },
    });

    await prismaService.branch.deleteMany({
      where: {
        id: 'test-branch-id',
      },
    });
  }

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toMatchObject({
            id: testUser.id,
            username: testUser.username,
            role: testUser.role,
            branchId: testUser.branchId,
            isActive: true,
          });
          expect(res.body.user).not.toHaveProperty('passwordHash');
        });
    });

    it('should return access and refresh tokens on login', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(typeof res.body.access_token).toBe('string');
          expect(typeof res.body.refresh_token).toBe('string');
          expect(res.body.access_token.length).toBeGreaterThan(0);
          expect(res.body.refresh_token.length).toBeGreaterThan(0);
        });
    });

    it('should fail with invalid username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'nonexistentuser',
          password: testUser.password,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('اسم المستخدم أو كلمة المرور غير صحيحة');
        });
    });

    it('should fail with invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('اسم المستخدم أو كلمة المرور غير صحيحة');
        });
    });

    it('should fail with inactive user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: inactiveUser.username,
          password: inactiveUser.password,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('الحساب معطل');
        });
    });

    it('should fail with missing username', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          password: testUser.password,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should fail with missing password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should fail with username too short', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'ab',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.some((msg: string) => msg.includes('3 أحرف على الأقل'))).toBe(true);
        });
    });

    it('should fail with password too short', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: '12345',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.some((msg: string) => msg.includes('6 أحرف على الأقل'))).toBe(true);
        });
    });

    it('should support rememberMe option', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
          rememberMe: true,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
        });
    });
  });

  describe('GET /auth/me (Protected Route)', () => {
    let validAccessToken: string;
    let expiredToken: string;

    beforeAll(async () => {
      // Get a valid access token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      validAccessToken = loginResponse.body.access_token;

      // Create an expired/invalid token
      expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    });

    it('should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sub', testUser.id);
          expect(res.body).toHaveProperty('username', testUser.username);
          expect(res.body).toHaveProperty('role', testUser.role);
          expect(res.body).toHaveProperty('branch_id', testUser.branchId);
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', validAccessToken) // Missing 'Bearer' prefix
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with expired token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('POST /auth/refresh', () => {
    let validRefreshToken: string;
    let validAccessToken: string;

    beforeAll(async () => {
      // Get valid tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      validRefreshToken = loginResponse.body.refresh_token;
      validAccessToken = loginResponse.body.access_token;
    });

    it('should return new access token with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: validRefreshToken,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(typeof res.body.access_token).toBe('string');
          expect(res.body.access_token.length).toBeGreaterThan(0);
          // The new access token should be different from the old one
          expect(res.body.access_token).not.toBe(validAccessToken);
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: 'invalid-refresh-token-12345',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('رمز التحديث غير صالح');
        });
    });

    it('should fail with missing refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
          expect(res.body.message.some((msg: string) => msg.includes('رمز التحديث مطلوب'))).toBe(true);
        });
    });

    it('should fail with empty refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: '',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should allow multiple refresh requests with same token', async () => {
      // First refresh
      const firstRefresh = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: validRefreshToken,
        })
        .expect(200);

      expect(firstRefresh.body).toHaveProperty('access_token');

      // Second refresh with same token should also work
      const secondRefresh = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: validRefreshToken,
        })
        .expect(200);

      expect(secondRefresh.body).toHaveProperty('access_token');

      // Both should generate different access tokens
      expect(firstRefresh.body.access_token).not.toBe(secondRefresh.body.access_token);
    });
  });

  describe('POST /auth/logout (Protected Route)', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      // Get fresh tokens for each test
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        });

      accessToken = loginResponse.body.access_token;
      refreshToken = loginResponse.body.refresh_token;
    });

    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('تم تسجيل الخروج بنجاح');
        });
    });

    it('should invalidate refresh token after logout', async () => {
      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use the refresh token - should fail
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: refreshToken,
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body.message).toContain('رمز التحديث غير صالح');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      // Step 1: Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201);

      const { access_token, refresh_token } = loginResponse.body;
      expect(access_token).toBeDefined();
      expect(refresh_token).toBeDefined();

      // Step 2: Access protected route
      const profileResponse = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${access_token}`)
        .expect(200);

      expect(profileResponse.body.username).toBe(testUser.username);

      // Step 3: Refresh access token
      const refreshResponse = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token })
        .expect(200);

      const newAccessToken = refreshResponse.body.access_token;
      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(access_token);

      // Step 4: Use new access token
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // Step 5: Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      // Step 6: Verify refresh token is invalidated
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token })
        .expect(401);
    });

    it('should handle concurrent logins from same user', async () => {
      // Login twice
      const login1 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201);

      const login2 = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(201);

      // Both sessions should be valid
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${login1.body.access_token}`)
        .expect(200);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${login2.body.access_token}`)
        .expect(200);

      // Both refresh tokens should work
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: login1.body.refresh_token })
        .expect(200);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: login2.body.refresh_token })
        .expect(200);
    });
  });
});
