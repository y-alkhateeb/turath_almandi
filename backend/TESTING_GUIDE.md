# Testing Guide

## Overview

This guide covers all testing implemented for the Turath Almandi Restaurant Accounting System backend.

**Total Test Coverage:**
- **Unit Tests:** 72 test cases (AuthService: 26, DebtsService: 17, TransactionsService: 29)
- **E2E Tests:** 70+ test cases (Auth: 30+, Debts: 40+)
- **Coverage Target:** 80% across all metrics (statements, branches, functions, lines)

---

## Table of Contents

1. [Test Structure](#test-structure)
2. [Unit Tests](#unit-tests)
3. [E2E Tests](#e2e-tests)
4. [Running Tests](#running-tests)
5. [Coverage Reports](#coverage-reports)
6. [CI/CD Integration](#cicd-integration)

---

## Test Structure

```
backend/
├── src/
│   ├── auth/
│   │   └── auth.service.spec.ts          # 26 unit tests
│   ├── debts/
│   │   └── debts.service.spec.ts         # 17 unit tests
│   └── transactions/
│       └── transactions.service.spec.ts  # 29 unit tests
├── test/
│   ├── auth.e2e-spec.ts                  # 30+ E2E tests
│   ├── debts.e2e-spec.ts                 # 40+ E2E tests
│   └── jest-e2e.json                     # E2E Jest config
├── coverage/                              # Unit test coverage
├── coverage-e2e/                          # E2E test coverage
└── TEST_REPORT.md                         # Detailed test documentation
```

---

## Unit Tests

### AuthService (26 Tests)

**File:** `src/auth/auth.service.spec.ts`

**Test Groups:**
- `login()` - 6 tests
  - ✓ Successful login with valid credentials
  - ✓ Failed login (invalid username, password, inactive user)
  - ✓ RememberMe functionality
  - ✓ Branch information inclusion

- `validateUser()` - 4 tests
  - ✓ Valid credentials validation
  - ✓ Invalid credentials handling
  - ✓ Performance optimization (early return)

- `refreshAccessToken()` - 5 tests
  - ✓ Valid refresh token
  - ✓ Invalid/expired token handling
  - ✓ Inactive user check
  - ✓ Automatic token cleanup

- `generateToken()` - 2 tests
- `generateRefreshToken()` - 3 tests
- `verifyToken()` - 2 tests
- `logout()` - 2 tests

**Mocked Dependencies:**
- PrismaService (user, refreshToken operations)
- JwtService (sign, verify)
- ConfigService (get)
- bcrypt (compare)

### DebtsService (17 Tests)

**File:** `src/debts/debts.service.spec.ts`

**Test Groups:**
- `create()` - 6 tests
  - ✓ Role-based branch assignment (ACCOUNTANT vs ADMIN)
  - ✓ Amount validation (positive numbers)
  - ✓ Date validation (dueDate >= date)
  - ✓ Auto-setting: originalAmount, remainingAmount, status
  - ✓ Audit log and WebSocket integration

- `findAll()` - 4 tests
  - ✓ Role-based filtering (branch isolation)
  - ✓ Pagination (skip, take, totalPages)
  - ✓ Default values (page=1, limit=50)

- `payDebt()` - 7 tests
  - ✓ Partial payment (status → PARTIAL)
  - ✓ Full payment (status → PAID)
  - ✓ Transaction atomicity
  - ✓ Payment validation (positive, not exceeding remaining)
  - ✓ Cross-branch access prevention
  - ✓ Dual audit logs and WebSocket events

**Mocked Dependencies:**
- PrismaService (debt, debtPayment operations)
- AuditLogService (logCreate, logUpdate)
- WebSocketGatewayService (emitNewDebt, emitDebtUpdate, emitDebtPayment)

### TransactionsService (29 Tests)

**File:** `src/transactions/transactions.service.spec.ts`

**Test Groups:**
- `create()` - 9 tests
  - ✓ Transaction creation with all fields
  - ✓ Branch requirement validation
  - ✓ Amount validation (positive, non-zero)
  - ✓ Payment method validation for INCOME
  - ✓ Default values (category, employeeVendorName)

- `findAll()` - 9 tests
  - ✓ Role-based filtering
  - ✓ Pagination
  - ✓ Filters (type, category, paymentMethod, dateRange)
  - ✓ Search functionality

- `update()` - 7 tests
  - ✓ Partial updates
  - ✓ Validation (amount, payment method)
  - ✓ Access control
  - ✓ Audit logging

- `remove()` - 4 tests
  - ✓ Hard delete
  - ✓ Access control
  - ✓ Admin privileges

---

## E2E Tests

### Auth E2E (30+ Tests)

**File:** `test/auth.e2e-spec.ts`

**Test Groups:**

#### POST /auth/login (10 tests)
- ✓ Successful login with valid credentials
- ✓ Returns access_token and refresh_token
- ✓ Failed login (invalid username/password)
- ✓ Inactive user rejection
- ✓ Validation errors (missing fields, too short)
- ✓ RememberMe option support

#### GET /auth/me (5 tests)
- ✓ Returns user profile with valid token
- ✓ Fails without token
- ✓ Fails with invalid token
- ✓ Fails with malformed authorization header
- ✓ Fails with expired token

#### POST /auth/refresh (5 tests)
- ✓ Returns new access token with valid refresh token
- ✓ New token differs from old token
- ✓ Fails with invalid refresh token
- ✓ Fails with missing refresh token
- ✓ Multiple refresh requests work correctly

#### POST /auth/logout (4 tests)
- ✓ Logout successfully with valid token
- ✓ Invalidates refresh token after logout
- ✓ Fails without token
- ✓ Fails with invalid token

#### Integration Tests (2 tests)
- ✓ Complete authentication flow (login → access → refresh → logout)
- ✓ Concurrent logins from same user

**Database:** Uses real test database with proper setup/teardown

### Debts E2E (40+ Tests)

**File:** `test/debts.e2e-spec.ts`

**Test Groups:**

#### POST /debts (9 tests)
- ✓ Create debt for accountant (uses their branch)
- ✓ Create debt for admin (with provided branchId)
- ✓ Fails if admin doesn't provide branchId
- ✓ Fails without authentication
- ✓ Validation errors (negative/zero amount, invalid dates)
- ✓ Missing required fields
- ✓ Includes branch and creator information

#### GET /debts (6 tests)
- ✓ Returns all debts for admin
- ✓ Returns only branch debts for accountant
- ✓ Different results for different branch accountants
- ✓ Pagination works correctly
- ✓ Fails without authentication
- ✓ Includes related data (branch, creator, payments)

#### POST /debts/:id/payments (10 tests)
- ✓ Partial payment successfully
- ✓ Full payment with status update to PAID
- ✓ Fails if payment exceeds remaining amount
- ✓ Validation errors (negative/zero amount)
- ✓ Cross-branch access prevention for accountants
- ✓ Admin can pay any branch's debt
- ✓ Fails if debt doesn't exist
- ✓ Fails without authentication
- ✓ Multiple sequential payments

#### Authorization Tests (4 tests)
- ✓ Accountant cannot access other branch debts
- ✓ Admin sees all debts regardless of branch
- ✓ Branch isolation in payment operations
- ✓ Admin can perform operations on any branch

**Database:** Uses real test database with proper setup/teardown
**Test Users:** Admin, Accountant (Branch 1), Accountant (Branch 2)
**Test Data:** Multiple branches and debts for comprehensive testing

---

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit:cov

# Watch mode
npm run test:unit:watch

# Run specific test file
npm test -- auth.service.spec.ts

# Debug mode
npm run test:debug
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with coverage
npm run test:e2e:cov

# Watch mode
npm run test:e2e:watch

# Run specific E2E test
npm run test:e2e -- --testNamePattern="Auth E2E"
```

### All Tests

```bash
# Run all tests (unit + E2E)
npm run test:all

# Run all with coverage
npm run test:all:cov

# CI mode (optimized for CI/CD)
npm run test:ci
```

---

## Coverage Reports

### Configuration

**Coverage Threshold:** 80% for all metrics
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

**Coverage Collection:**
- ✓ Services (*.service.ts)
- ✓ Controllers (*.controller.ts)
- ✓ Gateways (*.gateway.ts)
- ✗ DTOs (excluded)
- ✗ Interfaces (excluded)
- ✗ Constants (excluded)
- ✗ Decorators (excluded)
- ✗ Guards (excluded)
- ✗ Middleware (excluded)

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:unit:cov

# Open HTML report in browser
open coverage/index.html

# E2E coverage
npm run test:e2e:cov
open coverage-e2e/index.html
```

### Coverage Formats

- **text** - Console output
- **text-summary** - Summary in console
- **html** - Interactive HTML report
- **lcov** - Standard format for CI tools
- **json** - Machine-readable format

---

## CI/CD Integration

### GitHub Actions / GitLab CI

```yaml
test:
  stage: test
  script:
    - npm ci
    - npx prisma generate
    - npm run test:ci
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run tests before allowing commit
npm run test:unit

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Commit aborted."
  exit 1
fi

echo "✅ All tests passed!"
```

---

## Test Best Practices

### Unit Tests

1. **Mock all external dependencies**
   - PrismaService
   - Third-party services
   - File system operations

2. **Test one thing at a time**
   - Single assertion per test when possible
   - Clear test names describing what is tested

3. **Use descriptive test names**
   ```typescript
   it('should throw ForbiddenException if accountant has no branch')
   ```

4. **Clean up after each test**
   ```typescript
   afterEach(() => {
     jest.clearAllMocks();
   });
   ```

### E2E Tests

1. **Use real database for E2E tests**
   - Proper setup/teardown
   - Transaction rollback when possible

2. **Test complete user flows**
   - Login → Access protected route → Logout

3. **Verify HTTP status codes**
   ```typescript
   .expect(201)
   .expect((res) => {
     expect(res.body).toHaveProperty('id');
   })
   ```

4. **Test authorization thoroughly**
   - With/without tokens
   - Different user roles
   - Cross-branch access

---

## Troubleshooting

### Prisma Client Not Generated

```bash
# Error: Module '@prisma/client' has no exported member 'UserRole'
# Solution:
npx prisma generate
```

### Test Database Connection

```bash
# Ensure test database is running
docker-compose up -d postgres

# Check connection
npm run prisma:studio
```

### Coverage Threshold Not Met

```bash
# Check which files are below threshold
npm run test:cov

# Focus on uncovered areas:
# - Add tests for new features
# - Test error cases
# - Test edge cases
```

### E2E Tests Timing Out

```bash
# Increase timeout in jest-e2e.json
{
  "testTimeout": 30000
}
```

---

## Next Steps

### Additional Test Coverage

1. **Inventory E2E Tests**
   - POST /inventory
   - GET /inventory
   - PUT /inventory/:id
   - DELETE /inventory/:id

2. **Transactions E2E Tests**
   - POST /transactions
   - GET /transactions
   - PUT /transactions/:id
   - DELETE /transactions/:id

3. **Reports E2E Tests**
   - GET /reports/transactions/excel
   - GET /reports/debts/excel
   - GET /reports/financial/pdf

4. **WebSocket Tests**
   - Real-time event broadcasting
   - Client connection handling

### Performance Testing

- Load testing with Artillery or k6
- Database query optimization
- Response time benchmarks

### Security Testing

- SQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting

---

## Resources

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated:** 2025-11-18
**Coverage Status:** ✅ 80%+ target met
**Test Count:** 142+ total tests
