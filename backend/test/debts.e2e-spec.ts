import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Debts E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Test users
  const adminUser = {
    id: 'admin-user-id',
    username: 'adminuser',
    password: 'password123',
    passwordHash: '',
    role: 'ADMIN',
    branchId: null,
  };

  const accountantBranch1 = {
    id: 'accountant-branch1-id',
    username: 'accountant1',
    password: 'password123',
    passwordHash: '',
    role: 'ACCOUNTANT',
    branchId: 'branch-1-id',
  };

  const accountantBranch2 = {
    id: 'accountant-branch2-id',
    username: 'accountant2',
    password: 'password123',
    passwordHash: '',
    role: 'ACCOUNTANT',
    branchId: 'branch-2-id',
  };

  // Test branches
  const branch1 = {
    id: 'branch-1-id',
    name: 'Branch 1',
    location: 'Location 1',
  };

  const branch2 = {
    id: 'branch-2-id',
    name: 'Branch 2',
    location: 'Location 2',
  };

  // Tokens
  let adminToken: string;
  let accountant1Token: string;
  let accountant2Token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);

    // Hash passwords
    adminUser.passwordHash = await bcrypt.hash(adminUser.password, 10);
    accountantBranch1.passwordHash = await bcrypt.hash(accountantBranch1.password, 10);
    accountantBranch2.passwordHash = await bcrypt.hash(accountantBranch2.password, 10);

    // Clean up
    await cleanupTestData();

    // Create branches
    await prismaService.branch.createMany({
      data: [branch1, branch2],
    });

    // Create users
    await prismaService.user.createMany({
      data: [
        {
          id: adminUser.id,
          username: adminUser.username,
          passwordHash: adminUser.passwordHash,
          role: adminUser.role,
          branchId: adminUser.branchId,
          isActive: true,
        },
        {
          id: accountantBranch1.id,
          username: accountantBranch1.username,
          passwordHash: accountantBranch1.passwordHash,
          role: accountantBranch1.role,
          branchId: accountantBranch1.branchId,
          isActive: true,
        },
        {
          id: accountantBranch2.id,
          username: accountantBranch2.username,
          passwordHash: accountantBranch2.passwordHash,
          role: accountantBranch2.role,
          branchId: accountantBranch2.branchId,
          isActive: true,
        },
      ],
    });

    // Get auth tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: adminUser.username, password: adminUser.password });
    adminToken = adminLogin.body.access_token;

    const acc1Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: accountantBranch1.username, password: accountantBranch1.password });
    accountant1Token = acc1Login.body.access_token;

    const acc2Login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: accountantBranch2.username, password: accountantBranch2.password });
    accountant2Token = acc2Login.body.access_token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function cleanupTestData() {
    // Delete in order of dependencies
    await prismaService.debtPayment.deleteMany({});
    await prismaService.debt.deleteMany({});
    await prismaService.auditLog.deleteMany({});
    await prismaService.refreshToken.deleteMany({});
    await prismaService.user.deleteMany({
      where: {
        id: {
          in: [adminUser.id, accountantBranch1.id, accountantBranch2.id],
        },
      },
    });
    await prismaService.branch.deleteMany({
      where: {
        id: {
          in: [branch1.id, branch2.id],
        },
      },
    });
  }

  describe('POST /debts', () => {
    afterEach(async () => {
      await prismaService.debtPayment.deleteMany({});
      await prismaService.debt.deleteMany({});
    });

    it('should create debt for accountant with their branch', async () => {
      const createDebtDto = {
        creditorName: 'Test Creditor',
        amount: 1000,
        date: '2024-01-15',
        dueDate: '2024-02-15',
        notes: 'Test debt',
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(createDebtDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.creditorName).toBe('Test Creditor');
          expect(res.body.originalAmount).toBe(1000);
          expect(res.body.remainingAmount).toBe(1000);
          expect(res.body.status).toBe('ACTIVE');
          expect(res.body.branchId).toBe(branch1.id);
          expect(res.body.createdBy).toBe(accountantBranch1.id);
        });
    });

    it('should create debt for admin with provided branchId', async () => {
      const createDebtDto = {
        creditorName: 'Admin Creditor',
        amount: 2000,
        date: '2024-01-15',
        dueDate: '2024-02-15',
        notes: 'Admin debt',
        branchId: branch1.id,
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDebtDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.branchId).toBe(branch1.id);
          expect(res.body.createdBy).toBe(adminUser.id);
        });
    });

    it('should fail if admin does not provide branchId', async () => {
      const createDebtDto = {
        creditorName: 'Admin Creditor',
        amount: 2000,
        date: '2024-01-15',
        dueDate: '2024-02-15',
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(createDebtDto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail without authentication', async () => {
      const createDebtDto = {
        creditorName: 'Test Creditor',
        amount: 1000,
        date: '2024-01-15',
        dueDate: '2024-02-15',
      };

      return request(app.getHttpServer())
        .post('/debts')
        .send(createDebtDto)
        .expect(401);
    });

    it('should fail with negative amount', async () => {
      const createDebtDto = {
        creditorName: 'Test Creditor',
        amount: -100,
        date: '2024-01-15',
        dueDate: '2024-02-15',
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(createDebtDto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should fail with zero amount', async () => {
      const createDebtDto = {
        creditorName: 'Test Creditor',
        amount: 0,
        date: '2024-01-15',
        dueDate: '2024-02-15',
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(createDebtDto)
        .expect(400);
    });

    it('should fail if dueDate is before date', async () => {
      const createDebtDto = {
        creditorName: 'Test Creditor',
        amount: 1000,
        date: '2024-02-15',
        dueDate: '2024-01-15', // Before date
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(createDebtDto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should fail with missing required fields', async () => {
      const invalidDto = {
        amount: 1000,
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(invalidDto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(Array.isArray(res.body.message)).toBe(true);
        });
    });

    it('should include branch and creator information in response', async () => {
      const createDebtDto = {
        creditorName: 'Test Creditor',
        amount: 1000,
        date: '2024-01-15',
        dueDate: '2024-02-15',
      };

      return request(app.getHttpServer())
        .post('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(createDebtDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('branch');
          expect(res.body.branch).toHaveProperty('id', branch1.id);
          expect(res.body.branch).toHaveProperty('name', branch1.name);
          expect(res.body).toHaveProperty('creator');
          expect(res.body.creator).toHaveProperty('id', accountantBranch1.id);
        });
    });
  });

  describe('GET /debts', () => {
    let debt1: any;
    let debt2: any;
    let debt3: any;

    beforeAll(async () => {
      // Create debts for branch 1
      debt1 = await prismaService.debt.create({
        data: {
          creditorName: 'Creditor 1',
          originalAmount: 1000,
          remainingAmount: 1000,
          status: 'ACTIVE',
          date: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          branchId: branch1.id,
          createdBy: accountantBranch1.id,
        },
      });

      debt2 = await prismaService.debt.create({
        data: {
          creditorName: 'Creditor 2',
          originalAmount: 2000,
          remainingAmount: 2000,
          status: 'ACTIVE',
          date: new Date('2024-01-20'),
          dueDate: new Date('2024-02-20'),
          branchId: branch1.id,
          createdBy: accountantBranch1.id,
        },
      });

      // Create debt for branch 2
      debt3 = await prismaService.debt.create({
        data: {
          creditorName: 'Creditor 3',
          originalAmount: 3000,
          remainingAmount: 3000,
          status: 'ACTIVE',
          date: new Date('2024-01-25'),
          dueDate: new Date('2024-02-25'),
          branchId: branch2.id,
          createdBy: accountantBranch2.id,
        },
      });
    });

    afterAll(async () => {
      await prismaService.debt.deleteMany({});
    });

    it('should return all debts for admin', async () => {
      return request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(3);
          expect(res.body.meta).toMatchObject({
            page: 1,
            limit: 50,
            total: 3,
            totalPages: 1,
          });
        });
    });

    it('should return only branch debts for accountant', async () => {
      return request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(2);
          expect(res.body.data.every((debt: any) => debt.branchId === branch1.id)).toBe(true);
          expect(res.body.meta.total).toBe(2);
        });
    });

    it('should return different debts for different branch accountants', async () => {
      const acc1Response = await request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .expect(200);

      const acc2Response = await request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', `Bearer ${accountant2Token}`)
        .expect(200);

      expect(acc1Response.body.data.length).toBe(2);
      expect(acc2Response.body.data.length).toBe(1);
      expect(acc1Response.body.data[0].branchId).toBe(branch1.id);
      expect(acc2Response.body.data[0].branchId).toBe(branch2.id);
    });

    it('should handle pagination correctly', async () => {
      return request(app.getHttpServer())
        .get('/debts')
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBe(2);
          expect(res.body.meta).toMatchObject({
            page: 1,
            limit: 2,
            total: 3,
            totalPages: 2,
          });
        });
    });

    it('should fail without authentication', async () => {
      return request(app.getHttpServer())
        .get('/debts')
        .expect(401);
    });

    it('should include related data (branch, creator, payments)', async () => {
      return request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .expect(200)
        .expect((res) => {
          const debt = res.body.data[0];
          expect(debt).toHaveProperty('branch');
          expect(debt).toHaveProperty('creator');
          expect(debt).toHaveProperty('payments');
          expect(Array.isArray(debt.payments)).toBe(true);
        });
    });
  });

  describe('POST /debts/:id/payments', () => {
    let testDebt: any;
    let otherBranchDebt: any;

    beforeEach(async () => {
      // Create debt for branch 1
      testDebt = await prismaService.debt.create({
        data: {
          creditorName: 'Test Creditor',
          originalAmount: 1000,
          remainingAmount: 1000,
          status: 'ACTIVE',
          date: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          branchId: branch1.id,
          createdBy: accountantBranch1.id,
        },
      });

      // Create debt for branch 2
      otherBranchDebt = await prismaService.debt.create({
        data: {
          creditorName: 'Other Branch Creditor',
          originalAmount: 2000,
          remainingAmount: 2000,
          status: 'ACTIVE',
          date: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          branchId: branch2.id,
          createdBy: accountantBranch2.id,
        },
      });
    });

    afterEach(async () => {
      await prismaService.debtPayment.deleteMany({});
      await prismaService.debt.deleteMany({});
    });

    it('should make partial payment successfully', async () => {
      const paymentDto = {
        amountPaid: 500,
        paymentDate: '2024-01-20',
        notes: 'Partial payment',
      };

      return request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(paymentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.remainingAmount).toBe(500);
          expect(res.body.status).toBe('PARTIAL');
          expect(res.body).toHaveProperty('payments');
          expect(Array.isArray(res.body.payments)).toBe(true);
          expect(res.body.payments.length).toBe(1);
          expect(res.body.payments[0].amountPaid).toBe(500);
        });
    });

    it('should make full payment and update status to PAID', async () => {
      const paymentDto = {
        amountPaid: 1000,
        paymentDate: '2024-01-20',
        notes: 'Full payment',
      };

      return request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(paymentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.remainingAmount).toBe(0);
          expect(res.body.status).toBe('PAID');
        });
    });

    it('should fail if payment exceeds remaining amount', async () => {
      const paymentDto = {
        amountPaid: 1500,
        paymentDate: '2024-01-20',
      };

      return request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(paymentDto)
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should fail with negative amount', async () => {
      const paymentDto = {
        amountPaid: -100,
        paymentDate: '2024-01-20',
      };

      return request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(paymentDto)
        .expect(400);
    });

    it('should fail with zero amount', async () => {
      const paymentDto = {
        amountPaid: 0,
        paymentDate: '2024-01-20',
      };

      return request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(paymentDto)
        .expect(400);
    });

    it('should fail if accountant tries to pay debt from different branch', async () => {
      const paymentDto = {
        amountPaid: 500,
        paymentDate: '2024-01-20',
      };

      return request(app.getHttpServer())
        .post(`/debts/${otherBranchDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(paymentDto)
        .expect(403)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should allow admin to pay debt from any branch', async () => {
      const paymentDto = {
        amountPaid: 500,
        paymentDate: '2024-01-20',
      };

      return request(app.getHttpServer())
        .post(`/debts/${otherBranchDebt.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(paymentDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.remainingAmount).toBe(1500);
        });
    });

    it('should fail if debt does not exist', async () => {
      const paymentDto = {
        amountPaid: 500,
        paymentDate: '2024-01-20',
      };

      return request(app.getHttpServer())
        .post('/debts/non-existent-id/payments')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(paymentDto)
        .expect(404);
    });

    it('should fail without authentication', async () => {
      const paymentDto = {
        amountPaid: 500,
        paymentDate: '2024-01-20',
      };

      return request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .send(paymentDto)
        .expect(401);
    });

    it('should handle multiple payments correctly', async () => {
      // First payment
      const payment1 = {
        amountPaid: 300,
        paymentDate: '2024-01-20',
      };

      const firstResponse = await request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(payment1)
        .expect(201);

      expect(firstResponse.body.remainingAmount).toBe(700);
      expect(firstResponse.body.status).toBe('PARTIAL');

      // Second payment
      const payment2 = {
        amountPaid: 400,
        paymentDate: '2024-01-25',
      };

      const secondResponse = await request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(payment2)
        .expect(201);

      expect(secondResponse.body.remainingAmount).toBe(300);
      expect(secondResponse.body.status).toBe('PARTIAL');
      expect(secondResponse.body.payments.length).toBe(2);

      // Third payment (final)
      const payment3 = {
        amountPaid: 300,
        paymentDate: '2024-01-30',
      };

      const thirdResponse = await request(app.getHttpServer())
        .post(`/debts/${testDebt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send(payment3)
        .expect(201);

      expect(thirdResponse.body.remainingAmount).toBe(0);
      expect(thirdResponse.body.status).toBe('PAID');
      expect(thirdResponse.body.payments.length).toBe(3);
    });
  });

  describe('Authorization and Access Control', () => {
    let branch1Debt: any;
    let branch2Debt: any;

    beforeAll(async () => {
      branch1Debt = await prismaService.debt.create({
        data: {
          creditorName: 'Branch 1 Debt',
          originalAmount: 1000,
          remainingAmount: 1000,
          status: 'ACTIVE',
          date: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          branchId: branch1.id,
          createdBy: accountantBranch1.id,
        },
      });

      branch2Debt = await prismaService.debt.create({
        data: {
          creditorName: 'Branch 2 Debt',
          originalAmount: 2000,
          remainingAmount: 2000,
          status: 'ACTIVE',
          date: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          branchId: branch2.id,
          createdBy: accountantBranch2.id,
        },
      });
    });

    afterAll(async () => {
      await prismaService.debt.deleteMany({});
    });

    it('should prevent accountant from accessing debts from another branch', async () => {
      const response = await request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', `Bearer ${accountant1Token}`)
        .expect(200);

      const hasOtherBranchDebt = response.body.data.some(
        (debt: any) => debt.id === branch2Debt.id,
      );
      expect(hasOtherBranchDebt).toBe(false);
    });

    it('should allow admin to see all debts regardless of branch', async () => {
      const response = await request(app.getHttpServer())
        .get('/debts')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const hasBranch1Debt = response.body.data.some((debt: any) => debt.id === branch1Debt.id);
      const hasBranch2Debt = response.body.data.some((debt: any) => debt.id === branch2Debt.id);

      expect(hasBranch1Debt).toBe(true);
      expect(hasBranch2Debt).toBe(true);
    });

    it('should enforce branch isolation in payment operations', async () => {
      // Accountant 1 trying to pay debt from branch 2
      await request(app.getHttpServer())
        .post(`/debts/${branch2Debt.id}/payments`)
        .set('Authorization', `Bearer ${accountant1Token}`)
        .send({
          amountPaid: 100,
          paymentDate: '2024-01-20',
        })
        .expect(403);

      // Accountant 2 trying to pay debt from branch 1
      await request(app.getHttpServer())
        .post(`/debts/${branch1Debt.id}/payments`)
        .set('Authorization', `Bearer ${accountant2Token}`)
        .send({
          amountPaid: 100,
          paymentDate: '2024-01-20',
        })
        .expect(403);
    });

    it('should allow admin to perform operations on any branch', async () => {
      // Admin paying branch 1 debt
      await request(app.getHttpServer())
        .post(`/debts/${branch1Debt.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountPaid: 100,
          paymentDate: '2024-01-20',
        })
        .expect(201);

      // Admin paying branch 2 debt
      await request(app.getHttpServer())
        .post(`/debts/${branch2Debt.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amountPaid: 100,
          paymentDate: '2024-01-20',
        })
        .expect(201);
    });
  });
});
