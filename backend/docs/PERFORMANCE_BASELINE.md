# Performance Baseline Documentation

## Overview

This document establishes the performance baseline for critical API endpoints in the Turath Al-Mandi restaurant accounting system. Benchmarks measure response times under both sequential and concurrent load scenarios.

## Test Environment

### Hardware Specifications
- **CPU:** To be documented during actual test run
- **RAM:** To be documented during actual test run
- **Storage:** To be documented during actual test run

### Software Stack
- **Runtime:** Node.js 22 Alpine
- **Framework:** NestJS 11.1.9
- **Database:** PostgreSQL 18
- **ORM:** Prisma 6.19.0
- **Test Framework:** Jest 29.7.0 + Supertest 7.0.0

### Test Configuration
- **Warmup Requests:** 10 (to warm up JIT compiler and caches)
- **Benchmark Requests:** 100 (sequential)
- **Concurrent Requests:** 10
- **Total Concurrent Test:** 50 requests (5 batches of 10)

### Test Data
- **Branches:** 1 test branch
- **Users:** 2 (1 accountant, 1 admin)
- **Transactions:** 50 sample transactions
- **Debts:** 30 sample debts

## Critical Endpoints

### 1. POST /api/v1/transactions

**Description:** Create a new transaction (income or expense)

**Request:**
```http
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "EXPENSE",
  "amount": 150.50,
  "currency": "USD",
  "category": "utilities",
  "date": "2025-11-18",
  "employeeVendorName": "Test Vendor"
}
```

**Operations:**
- DTO validation (class-validator)
- UUID validation for foreign keys
- XSS prevention (class-sanitizer)
- Branch access control check
- Prisma write transaction
- Audit log creation

**Performance Thresholds:**

| Metric | Threshold (ms) | Notes |
|--------|----------------|-------|
| P50 (Median) | 150 | Half of requests should complete within 150ms |
| P95 | 300 | 95% of requests should complete within 300ms |
| P99 | 500 | 99% of requests should complete within 500ms |

**Concurrent Load (10 concurrent):**
- Expected P95: < 600ms (2x sequential threshold)

---

### 2. GET /api/v1/debts

**Description:** Retrieve paginated list of debts

**Request:**
```http
GET /api/v1/debts?page=1&limit=10
Authorization: Bearer <token>
```

**Operations:**
- JWT authentication
- Branch access control
- Soft delete filtering (`deletedAt: null`)
- Pagination logic
- Prisma query with relations
- Response serialization

**Performance Thresholds:**

| Metric | Threshold (ms) | Notes |
|--------|----------------|-------|
| P50 (Median) | 100 | Fast reads with pagination |
| P95 | 200 | Most requests complete quickly |
| P99 | 350 | Even outliers are reasonable |

**Concurrent Load (10 concurrent):**
- Expected P95: < 400ms (2x sequential threshold)

---

### 3. GET /api/v1/dashboard

**Description:** Retrieve dashboard summary with aggregated statistics

**Request:**
```http
GET /api/v1/dashboard
Authorization: Bearer <admin_token>
```

**Operations:**
- JWT authentication
- Admin role verification
- Multiple Prisma aggregation queries
- Transaction summaries (income/expense)
- Debt summaries (active/paid/partial)
- Inventory value calculations
- Data aggregation and transformation

**Performance Thresholds:**

| Metric | Threshold (ms) | Notes |
|--------|----------------|-------|
| P50 (Median) | 200 | Complex aggregations allowed |
| P95 | 400 | Acceptable for dashboard load |
| P99 | 600 | Max acceptable latency |

**Concurrent Load (10 concurrent):**
- Expected P95: < 800ms (2x sequential threshold)

---

## Running Benchmarks

### Prerequisites

1. **Database Setup:**
   ```bash
   # Ensure PostgreSQL is running
   docker-compose up -d postgres redis

   # Run migrations
   npm run migration:deploy
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

### Execute Benchmark Tests

```bash
# Run all benchmarks
npm run test:e2e test/benchmark.e2e-spec.ts

# Run with verbose output
npm run test:e2e -- --verbose test/benchmark.e2e-spec.ts
```

### Expected Output

```
📊 Benchmarking: POST /transactions (sequential)
   Warmup: 10 requests
   Benchmark: 100 requests

   🔥 Warming up...
   ⏱️  Running benchmark...

   📈 Results:
      Requests: 100
      Min:      45ms
      Mean:     87.32ms
      P50:      82ms
      P75:      95ms
      P90:      115ms
      P95:      132ms
      P99:      185ms
      Max:      245ms

✅ PASS: P50 (82ms) < 150ms threshold
✅ PASS: P95 (132ms) < 300ms threshold
✅ PASS: P99 (185ms) < 500ms threshold
```

---

## Baseline Metrics

### Sequential Load Performance

| Endpoint | P50 | P95 | P99 | Status |
|----------|-----|-----|-----|--------|
| POST /transactions | TBD | TBD | TBD | ✅ To be measured |
| GET /debts | TBD | TBD | TBD | ✅ To be measured |
| GET /dashboard | TBD | TBD | TBD | ✅ To be measured |

### Concurrent Load Performance (10 concurrent)

| Endpoint | P50 | P95 | P99 | Throughput (req/s) | Status |
|----------|-----|-----|-----|---------------------|--------|
| POST /transactions | TBD | TBD | TBD | TBD | ✅ To be measured |
| GET /debts | TBD | TBD | TBD | TBD | ✅ To be measured |
| GET /dashboard | TBD | TBD | TBD | TBD | ✅ To be measured |

**Note:** Run benchmarks and update this table with actual results.

---

## Performance Optimization Targets

### Current (Baseline)
- Establish baseline metrics (TBD after first run)

### Short-term Goals (within 3 months)
- POST /transactions P95: < 200ms (improved from 300ms)
- GET /debts P95: < 150ms (improved from 200ms)
- GET /dashboard P95: < 300ms (improved from 400ms)

### Long-term Goals (within 6 months)
- All endpoints P95: < 100ms
- Support 50+ concurrent requests without degradation
- Implement caching for dashboard queries (Redis)
- Add database indexes for frequently queried fields

---

## Monitoring and Alerts

### Performance Degradation Alerts

Set up monitoring to alert when:

1. **P95 exceeds thresholds**
   - POST /transactions > 300ms
   - GET /debts > 200ms
   - GET /dashboard > 400ms

2. **Error rate increases**
   - > 1% error rate on any endpoint

3. **Database query time**
   - Slow query log: queries > 500ms

### Recommended Tools

- **APM:** New Relic, Datadog, or Elastic APM
- **Logging:** Winston + ELK Stack
- **Metrics:** Prometheus + Grafana
- **Database Monitoring:** pg_stat_statements

---

## Optimization Strategies

### 1. Database Optimization

**Indexes:**
```sql
-- Already indexed (from schema.prisma)
CREATE INDEX transactions_branch_id_idx ON transactions(branch_id);
CREATE INDEX transactions_date_idx ON transactions(date);
CREATE INDEX debts_status_idx ON debts(status);

-- Additional indexes to consider
CREATE INDEX transactions_created_at_idx ON transactions(created_at);
CREATE INDEX debts_due_date_idx ON debts(due_date);
```

**Query Optimization:**
- Use `select` to limit returned fields
- Avoid N+1 queries with proper `include` statements
- Use pagination for all list endpoints

**Example:**
```typescript
// ❌ Bad - returns all fields
await prisma.transaction.findMany();

// ✅ Good - only returns needed fields
await prisma.transaction.findMany({
  select: {
    id: true,
    amount: true,
    date: true,
    category: true,
  },
  take: 10,
});
```

### 2. Caching Strategy

**Redis Caching:**
```typescript
// Cache dashboard data for 5 minutes
const dashboardData = await cacheManager.get('dashboard:summary');
if (!dashboardData) {
  const data = await calculateDashboard();
  await cacheManager.set('dashboard:summary', data, 300); // 5 min TTL
  return data;
}
return dashboardData;
```

**Cache Invalidation:**
- Invalidate on write operations (POST, PUT, DELETE)
- Use cache tags for selective invalidation

### 3. Connection Pooling

**Prisma Connection Pool:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Add connection pool settings
  connection_limit = 20
  pool_timeout = 20
}
```

**PostgreSQL Settings:**
```ini
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
```

### 4. Response Compression

**Enable gzip compression:**
```typescript
// main.ts
import * as compression from 'compression';
app.use(compression());
```

Reduces response size by 70-90% for JSON responses.

### 5. Async Operations

**Use async/await properly:**
```typescript
// ❌ Bad - sequential
const transactions = await getTransactions();
const debts = await getDebts();
const inventory = await getInventory();

// ✅ Good - parallel
const [transactions, debts, inventory] = await Promise.all([
  getTransactions(),
  getDebts(),
  getInventory(),
]);
```

---

## Load Testing Scenarios

### Scenario 1: Normal Business Hours
- 10-20 concurrent users
- Mixed read/write operations (80% read, 20% write)
- Duration: 30 minutes
- Expected: All P95 < thresholds

### Scenario 2: Peak Hours (End of Day)
- 50+ concurrent users
- Heavy write operations (50% read, 50% write)
- Duration: 1 hour
- Expected: P95 < 2x thresholds, no errors

### Scenario 3: Sustained Load
- 30 concurrent users
- Continuous operations for 2 hours
- Monitor for memory leaks, connection pool exhaustion
- Expected: Stable performance throughout

### Scenario 4: Spike Test
- Sudden increase from 10 to 100 concurrent users
- Duration: 5 minutes spike
- Expected: System handles spike, recovers gracefully

---

## Regression Testing

### When to Run Benchmarks

1. **Before major releases** - Ensure no performance degradation
2. **After infrastructure changes** - Validate performance impact
3. **Monthly** - Track performance trends over time
4. **After database schema changes** - Verify query performance

### Performance Regression Criteria

**Fail if:**
- P95 increases by > 20% compared to baseline
- P99 increases by > 30% compared to baseline
- Error rate > 0.5%
- Any endpoint exceeds absolute thresholds

**Warning if:**
- P95 increases by > 10% compared to baseline
- Mean response time increases by > 15%

---

## Troubleshooting Performance Issues

### High Response Times

1. **Check database query performance:**
   ```sql
   -- Enable slow query log
   SET log_min_duration_statement = 500; -- Log queries > 500ms

   -- Check query statistics
   SELECT * FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. **Check connection pool:**
   ```typescript
   // Monitor Prisma metrics
   const metrics = await prisma.$metrics.json();
   console.log(metrics);
   ```

3. **Check for N+1 queries:**
   - Enable Prisma query logging
   - Look for repeated similar queries
   - Use `include` to fetch relations in one query

### High CPU Usage

1. Check for CPU-intensive operations in request handlers
2. Profile with Node.js built-in profiler
3. Consider moving heavy operations to background jobs

### High Memory Usage

1. Check for memory leaks with heap snapshots
2. Ensure proper cleanup in `finally` blocks
3. Limit pagination sizes
4. Use streams for large data exports

---

## Conclusion

This performance baseline establishes expected response times for critical endpoints under normal and concurrent load. Regular benchmarking ensures the system maintains acceptable performance as features are added and data grows.

**Next Steps:**
1. Run initial benchmarks and record baseline metrics
2. Set up continuous performance monitoring
3. Implement caching for dashboard queries
4. Schedule monthly performance regression tests

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Benchmark Suite:** test/benchmark.e2e-spec.ts
**Status:** ✅ Ready for initial baseline measurement
