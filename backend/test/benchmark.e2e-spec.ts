/**
 * Benchmark Tests for Critical Endpoints
 *
 * This test suite measures response times under load for critical API endpoints:
 * - POST /api/v1/transactions (create transaction)
 * - GET /api/v1/debts (list debts with pagination)
 * - GET /api/v1/dashboard (dashboard summary)
 *
 * Usage:
 *   npm run test:e2e benchmark.e2e-spec.ts
 *
 * Environment:
 *   Ensure database is seeded with test data for realistic results
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransactionType, PaymentMethod, Currency, UserRole } from '@prisma/client';

describe('Benchmark Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let adminToken: string;
  let branchId: string;
  let userId: string;

  // Benchmark configuration
  const WARMUP_REQUESTS = 10; // Warm up JIT compiler and caches
  const BENCHMARK_REQUESTS = 100; // Number of requests for benchmark
  const CONCURRENT_REQUESTS = 10; // Concurrent requests to simulate load

  // Performance thresholds (milliseconds)
  const THRESHOLDS = {
    POST_TRANSACTION: {
      p50: 150, // 50th percentile (median)
      p95: 300, // 95th percentile
      p99: 500, // 99th percentile
    },
    GET_DEBTS: {
      p50: 100,
      p95: 200,
      p99: 350,
    },
    GET_DASHBOARD: {
      p50: 200,
      p95: 400,
      p99: 600,
    },
  };

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
    prisma = app.get<PrismaService>(PrismaService);

    // Setup: Create test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test branch
    const branch = await prisma.branch.create({
      data: {
        name: 'Benchmark Test Branch',
        location: 'Test Location',
        managerName: 'Test Manager',
        phone: '+1234567890',
      },
    });
    branchId = branch.id;

    // Create test user (accountant)
    const hashedPassword = '$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u'; // 'password123'
    const user = await prisma.user.create({
      data: {
        username: 'benchmark_accountant',
        passwordHash: hashedPassword,
        role: UserRole.ACCOUNTANT,
        branchId: branch.id,
      },
    });
    userId = user.id;

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'benchmark_admin',
        passwordHash: hashedPassword,
        role: UserRole.ADMIN,
      },
    });

    // Get auth tokens
    const accountantLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'benchmark_accountant',
        password: 'password123',
      });
    accessToken = accountantLogin.body.data.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        username: 'benchmark_admin',
        password: 'password123',
      });
    adminToken = adminLogin.body.data.accessToken;

    // Create sample data for benchmarking
    // Transactions
    for (let i = 0; i < 50; i++) {
      await prisma.transaction.create({
        data: {
          branchId: branch.id,
          type: i % 2 === 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
          amount: 100 + i * 10,
          currency: Currency.USD,
          paymentMethod: PaymentMethod.CASH,
          category: i % 2 === 0 ? 'sales' : 'utilities',
          date: new Date(),
          employeeVendorName: `Vendor ${i}`,
          createdBy: user.id,
        },
      });
    }

    // Debts
    for (let i = 0; i < 30; i++) {
      await prisma.debt.create({
        data: {
          branchId: branch.id,
          creditorName: `Creditor ${i}`,
          originalAmount: 1000 + i * 100,
          remainingAmount: 500 + i * 50,
          currency: Currency.USD,
          date: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdBy: user.id,
        },
      });
    }
  }

  async function cleanupTestData() {
    await prisma.transaction.deleteMany({
      where: { branchId },
    });
    await prisma.debt.deleteMany({
      where: { branchId },
    });
    await prisma.user.deleteMany({
      where: {
        OR: [
          { username: 'benchmark_accountant' },
          { username: 'benchmark_admin' },
        ],
      },
    });
    await prisma.branch.deleteMany({
      where: { name: 'Benchmark Test Branch' },
    });
  }

  /**
   * Calculate percentiles from sorted array of response times
   */
  function calculatePercentiles(times: number[]) {
    const sorted = times.sort((a, b) => a - b);
    const n = sorted.length;

    return {
      min: sorted[0],
      max: sorted[n - 1],
      mean: sorted.reduce((a, b) => a + b, 0) / n,
      p50: sorted[Math.floor(n * 0.5)],
      p75: sorted[Math.floor(n * 0.75)],
      p90: sorted[Math.floor(n * 0.90)],
      p95: sorted[Math.floor(n * 0.95)],
      p99: sorted[Math.floor(n * 0.99)],
    };
  }

  /**
   * Run benchmark for a given test function
   */
  async function runBenchmark(
    name: string,
    testFn: () => Promise<any>,
    warmupCount: number = WARMUP_REQUESTS,
    benchmarkCount: number = BENCHMARK_REQUESTS,
  ) {
    console.log(`\n📊 Benchmarking: ${name}`);
    console.log(`   Warmup: ${warmupCount} requests`);
    console.log(`   Benchmark: ${benchmarkCount} requests\n`);

    // Warmup phase
    console.log('   🔥 Warming up...');
    for (let i = 0; i < warmupCount; i++) {
      await testFn();
    }

    // Benchmark phase
    console.log('   ⏱️  Running benchmark...');
    const responseTimes: number[] = [];

    for (let i = 0; i < benchmarkCount; i++) {
      const start = Date.now();
      await testFn();
      const end = Date.now();
      responseTimes.push(end - start);
    }

    // Calculate statistics
    const stats = calculatePercentiles(responseTimes);

    // Print results
    console.log('\n   📈 Results:');
    console.log(`      Requests: ${benchmarkCount}`);
    console.log(`      Min:      ${stats.min}ms`);
    console.log(`      Mean:     ${stats.mean.toFixed(2)}ms`);
    console.log(`      P50:      ${stats.p50}ms`);
    console.log(`      P75:      ${stats.p75}ms`);
    console.log(`      P90:      ${stats.p90}ms`);
    console.log(`      P95:      ${stats.p95}ms`);
    console.log(`      P99:      ${stats.p99}ms`);
    console.log(`      Max:      ${stats.max}ms`);

    return stats;
  }

  /**
   * Run concurrent benchmark
   */
  async function runConcurrentBenchmark(
    name: string,
    testFn: () => Promise<any>,
    concurrency: number = CONCURRENT_REQUESTS,
    totalRequests: number = BENCHMARK_REQUESTS,
  ) {
    console.log(`\n📊 Concurrent Benchmark: ${name}`);
    console.log(`   Concurrency: ${concurrency}`);
    console.log(`   Total Requests: ${totalRequests}\n`);

    const responseTimes: number[] = [];
    const batches = Math.ceil(totalRequests / concurrency);

    console.log('   ⏱️  Running concurrent benchmark...');
    for (let batch = 0; batch < batches; batch++) {
      const batchPromises: Promise<void>[] = [];

      for (let i = 0; i < concurrency && batch * concurrency + i < totalRequests; i++) {
        batchPromises.push(
          (async () => {
            const start = Date.now();
            await testFn();
            const end = Date.now();
            responseTimes.push(end - start);
          })(),
        );
      }

      await Promise.all(batchPromises);
    }

    const stats = calculatePercentiles(responseTimes);

    console.log('\n   📈 Results:');
    console.log(`      Total Requests: ${responseTimes.length}`);
    console.log(`      Concurrency:    ${concurrency}`);
    console.log(`      Min:            ${stats.min}ms`);
    console.log(`      Mean:           ${stats.mean.toFixed(2)}ms`);
    console.log(`      P50:            ${stats.p50}ms`);
    console.log(`      P95:            ${stats.p95}ms`);
    console.log(`      P99:            ${stats.p99}ms`);
    console.log(`      Max:            ${stats.max}ms`);
    console.log(`      Throughput:     ${(responseTimes.length / (stats.max / 1000)).toFixed(2)} req/s`);

    return stats;
  }

  describe('POST /api/v1/transactions', () => {
    it('should meet performance baseline (sequential)', async () => {
      const stats = await runBenchmark(
        'POST /transactions (sequential)',
        async () => {
          return request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              type: TransactionType.EXPENSE,
              amount: 150.50,
              currency: Currency.USD,
              category: 'utilities',
              date: new Date().toISOString().split('T')[0],
              employeeVendorName: 'Test Vendor',
            })
            .expect(201);
        },
      );

      // Assertions
      expect(stats.p50).toBeLessThan(THRESHOLDS.POST_TRANSACTION.p50);
      expect(stats.p95).toBeLessThan(THRESHOLDS.POST_TRANSACTION.p95);
      expect(stats.p99).toBeLessThan(THRESHOLDS.POST_TRANSACTION.p99);
    });

    it('should handle concurrent requests', async () => {
      const stats = await runConcurrentBenchmark(
        'POST /transactions (concurrent)',
        async () => {
          return request(app.getHttpServer())
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              type: TransactionType.INCOME,
              amount: 200.00,
              currency: Currency.USD,
              paymentMethod: PaymentMethod.CASH,
              category: 'sales',
              date: new Date().toISOString().split('T')[0],
              employeeVendorName: 'Customer',
            })
            .expect(201);
        },
        CONCURRENT_REQUESTS,
        50, // Lower total for concurrent test
      );

      // Concurrent requests will be slower, so use relaxed thresholds
      expect(stats.p95).toBeLessThan(THRESHOLDS.POST_TRANSACTION.p95 * 2);
    });
  });

  describe('GET /api/v1/debts', () => {
    it('should meet performance baseline (sequential)', async () => {
      const stats = await runBenchmark(
        'GET /debts (sequential)',
        async () => {
          return request(app.getHttpServer())
            .get('/api/v1/debts')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ page: 1, limit: 10 })
            .expect(200);
        },
      );

      expect(stats.p50).toBeLessThan(THRESHOLDS.GET_DEBTS.p50);
      expect(stats.p95).toBeLessThan(THRESHOLDS.GET_DEBTS.p95);
      expect(stats.p99).toBeLessThan(THRESHOLDS.GET_DEBTS.p99);
    });

    it('should handle concurrent requests', async () => {
      const stats = await runConcurrentBenchmark(
        'GET /debts (concurrent)',
        async () => {
          return request(app.getHttpServer())
            .get('/api/v1/debts')
            .set('Authorization', `Bearer ${accessToken}`)
            .query({ page: 1, limit: 10 })
            .expect(200);
        },
        CONCURRENT_REQUESTS,
        50,
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.GET_DEBTS.p95 * 2);
    });
  });

  describe('GET /api/v1/dashboard', () => {
    it('should meet performance baseline (sequential)', async () => {
      const stats = await runBenchmark(
        'GET /dashboard (sequential)',
        async () => {
          return request(app.getHttpServer())
            .get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        },
      );

      expect(stats.p50).toBeLessThan(THRESHOLDS.GET_DASHBOARD.p50);
      expect(stats.p95).toBeLessThan(THRESHOLDS.GET_DASHBOARD.p95);
      expect(stats.p99).toBeLessThan(THRESHOLDS.GET_DASHBOARD.p99);
    });

    it('should handle concurrent requests', async () => {
      const stats = await runConcurrentBenchmark(
        'GET /dashboard (concurrent)',
        async () => {
          return request(app.getHttpServer())
            .get('/api/v1/dashboard')
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);
        },
        CONCURRENT_REQUESTS,
        50,
      );

      expect(stats.p95).toBeLessThan(THRESHOLDS.GET_DASHBOARD.p95 * 2);
    });
  });

  describe('Response time distribution', () => {
    it('should log performance summary', () => {
      console.log('\n' + '='.repeat(80));
      console.log('📊 PERFORMANCE BASELINE SUMMARY');
      console.log('='.repeat(80));
      console.log('\nThresholds (milliseconds):');
      console.log('\nPOST /transactions:');
      console.log(`  P50: ${THRESHOLDS.POST_TRANSACTION.p50}ms (median)`);
      console.log(`  P95: ${THRESHOLDS.POST_TRANSACTION.p95}ms (95th percentile)`);
      console.log(`  P99: ${THRESHOLDS.POST_TRANSACTION.p99}ms (99th percentile)`);
      console.log('\nGET /debts:');
      console.log(`  P50: ${THRESHOLDS.GET_DEBTS.p50}ms`);
      console.log(`  P95: ${THRESHOLDS.GET_DEBTS.p95}ms`);
      console.log(`  P99: ${THRESHOLDS.GET_DEBTS.p99}ms`);
      console.log('\nGET /dashboard:');
      console.log(`  P50: ${THRESHOLDS.GET_DASHBOARD.p50}ms`);
      console.log(`  P95: ${THRESHOLDS.GET_DASHBOARD.p95}ms`);
      console.log(`  P99: ${THRESHOLDS.GET_DASHBOARD.p99}ms`);
      console.log('\n' + '='.repeat(80));
      console.log('✅ All benchmarks complete!');
      console.log('='.repeat(80) + '\n');
    });
  });
});
