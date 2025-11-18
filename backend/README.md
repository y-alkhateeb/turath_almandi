# Turath Almandi Restaurant Accounting System - Backend

**نظام الخادم الخلفي لمحاسبة مطاعم تراث المندي**  
Backend server for Turath Al-Mandi Restaurant Accounting System

A comprehensive, production-ready restaurant accounting system backend built with enterprise-grade security and modern best practices.

---

## 🚀 Tech Stack

- **NestJS** v11.1.9 - Progressive Node.js framework
- **TypeScript** v5.9.3 - Type-safe JavaScript
- **PostgreSQL** 18 - Relational database
- **Prisma** v6.19.0 - Modern type-safe ORM
- **Redis** v4.7.1 - Token blacklist and caching
- **JWT** - Stateless authentication
- **Bcrypt** - Secure password hashing
- **Helmet** - Security headers
- **Joi** - Environment variable validation
- **WebSockets** - Real-time notifications
- **Docker** - Containerization

---

## ✨ Features

### Security
- ✅ JWT authentication with access & refresh tokens
- ✅ Token blacklist with Redis/in-memory storage
- ✅ Role-based access control (ADMIN, ACCOUNTANT)
- ✅ Login throttling (IP-based rate limiting)
- ✅ Account lockout after failed login attempts
- ✅ Helmet security headers (CSP, HSTS, XSS protection)
- ✅ Input validation and sanitization (XSS prevention)
- ✅ SQL injection protection (Prisma parameterized queries)
- ✅ Environment variable validation on startup

### Functionality
- ✅ User management with branch assignment
- ✅ Branch management
- ✅ Transaction tracking (income/expenses)
- ✅ Debt management with overdue notifications
- ✅ Inventory management
- ✅ Real-time notifications via WebSockets
- ✅ Comprehensive audit logging
- ✅ Dashboard analytics
- ✅ PDF/Excel report generation
- ✅ Scheduled tasks (CRON jobs)
- ✅ Graceful shutdown handling

### Operational
- ✅ Database health checks
- ✅ Automatic backup reminders
- ✅ Request logging with unique IDs
- ✅ Response time tracking
- ✅ Comprehensive error handling
- ✅ Production-ready Docker setup

---

## 📋 Prerequisites

### Local Development
- **Node.js** v22 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 18 ([Download](https://www.postgresql.org/download/) or use Docker)
- **Redis** (optional, for production features - [Download](https://redis.io/download) or use Docker)
- **npm** or **yarn**

### Docker Deployment
- **Docker** v20+ ([Download](https://www.docker.com/get-started))
- **Docker Compose** v2+ (included with Docker Desktop)

---

## 🚀 Installation

### Option 1: Local Development Setup

#### 1. Clone the repository
```bash
git clone <repository-url>
cd turath_almandi/backend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Set up environment variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and configure the following REQUIRED variables:
# - DATABASE_URL: PostgreSQL connection string
# - JWT_SECRET: Min 32 characters (generate: openssl rand -hex 32)
# - JWT_REFRESH_SECRET: Min 32 characters (different from JWT_SECRET)
# - FRONTEND_URL: Your frontend application URL
```

**Generate secure JWT secrets:**
```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 4. Start PostgreSQL (using Docker)
```bash
docker-compose up -d postgres
```

Or install PostgreSQL locally and create a database:
```sql
CREATE DATABASE turath_almandi;
```

#### 5. Generate Prisma Client and run migrations
```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Optional: Seed the database with initial data
npm run prisma:seed
```

#### 6. Start the development server
```bash
npm run start:dev
```

#### 7. Verify the installation
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-01T00:00:00.000Z",
#   "service": "Turath Almandi Restaurant Accounting System",
#   "uptime": {...},
#   "memory": {...},
#   "database": { "status": "healthy", "latency": "5ms" }
# }
```

---

### Option 2: Docker Deployment (Production-Ready)

#### 1. Clone the repository
```bash
git clone <repository-url>
cd turath_almandi/backend
```

#### 2. Set up environment variables for Docker
```bash
# Copy the Docker environment example
cp .env.docker.example .env

# Edit .env and set REQUIRED variables:
# - JWT_SECRET (min 32 chars)
# - JWT_REFRESH_SECRET (min 32 chars)
# - POSTGRES_PASSWORD (secure password)
# - REDIS_PASSWORD (secure password)
```

#### 3. Start all services
```bash
# Start PostgreSQL, Redis, and Backend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Check service status
docker-compose ps
```

#### 4. Initial database setup (first time only)
```bash
# Run migrations and seed the database
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npm run prisma:seed
```

#### 5. Verify the deployment
```bash
curl http://localhost:3000/api/v1/health
```

#### 6. Optional: Start PgAdmin for database management
```bash
# Start with admin profile
docker-compose --profile admin up -d pgadmin

# Access PgAdmin at: http://localhost:5050
# Email: admin@restaurant.com (or value from .env)
# Password: admin (or value from .env)
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` | Required |
| `JWT_SECRET` | Access token secret key | `<32+ character random string>` | Min 32 chars |
| `JWT_REFRESH_SECRET` | Refresh token secret key | `<32+ character random string>` | Min 32 chars |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` | For CORS |

### Optional Variables (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `JWT_ACCESS_TOKEN_EXPIRATION` | `7d` | Access token lifespan |
| `JWT_REFRESH_TOKEN_EXPIRATION` | `7` | Refresh token days |
| `JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME` | `30` | Extended refresh days |
| `BCRYPT_SALT_ROUNDS` | `10` | Password hashing rounds |
| `REDIS_URL` | - | Redis connection (optional) |
| `OVERDUE_DEBT_CHECK_CRON` | `0 9 * * *` | Daily debt check time |

See `.env.example` for complete documentation.

---

## 🗄️ Database

### Migrations

```bash
# Development: Create a new migration
npm run prisma:migrate
# This prompts for a migration name and applies it

# Production: Deploy migrations
npm run prisma:migrate:deploy
# This applies all pending migrations without prompts

# View migration status
npx prisma migrate status

# Reset database (WARNING: Deletes all data!)
npx prisma migrate reset
```

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
# Opens at http://localhost:5555
```

### Seeding

```bash
# Seed the database with initial data
npm run prisma:seed

# What it creates:
# - Admin user (username: admin, password: admin123)
# - Sample branches
# - Sample transactions
# - Sample users
```

### Backup & Restore

```bash
# Backup (PostgreSQL)
pg_dump -U postgres -d turath_almandi > backup.sql

# Restore
psql -U postgres -d turath_almandi < backup.sql

# Docker backup
docker-compose exec postgres pg_dump -U postgres turath_almandi > backup.sql

# Docker restore
docker-compose exec -T postgres psql -U postgres turath_almandi < backup.sql
```

---

## 🏃 Running the Application

### Development Mode

```bash
# Start with hot-reload
npm run start:dev

# Start with debugging
npm run start:debug
# Then attach your debugger to port 9229
```

### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm run start:prod

# Or use PM2 for process management
pm2 start dist/main.js --name turath-backend
```

### Docker

```bash
# Start all services
docker-compose up -d

# Start only specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f backend

# Restart services
docker-compose restart backend

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes data!)
docker-compose down -v
```

---

## 🔌 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Health Check
- `GET /health` - System health and status

### Authentication
- `POST /auth/register` - Register new user (Admin only)
- `POST /auth/login` - Login (with throttling & lockout protection)
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (blacklists tokens)
- `GET /auth/me` - Get current user info

### Users
- `GET /users` - List all users (Admin only)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user (Admin only)
- `PATCH /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)

### Branches
- `GET /branches` - List branches
- `GET /branches/:id` - Get branch details
- `POST /branches` - Create branch (Admin only)
- `PUT /branches/:id` - Update branch (Admin only)
- `DELETE /branches/:id` - Delete branch (Admin only)

### Transactions
- `GET /transactions` - List transactions (with filters)
- `GET /transactions/:id` - Get transaction details
- `POST /transactions` - Create transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction (Admin only)
- `GET /transactions/daily-summary` - Daily summary by branch
- `GET /transactions/salary-expenses` - Salary expenses report
- `GET /transactions/purchase-expenses` - Purchase expenses report

### Debts
- `GET /debts` - List debts (with filters)
- `GET /debts/:id` - Get debt details
- `POST /debts` - Create debt
- `PUT /debts/:id` - Update debt
- `DELETE /debts/:id` - Delete debt (Admin only)
- `POST /debts/:id/pay` - Record debt payment
- `GET /debts/summary` - Debts summary

### Inventory
- `GET /inventory` - List inventory items
- `GET /inventory/:id` - Get item details
- `POST /inventory` - Create item
- `PUT /inventory/:id` - Update item
- `DELETE /inventory/:id` - Delete item
- `GET /inventory/low-stock` - Low stock items

### Notifications
- `GET /notifications` - List user notifications
- `GET /notifications/unread` - Unread notifications
- `PATCH /notifications/:id/read` - Mark as read
- `PATCH /notifications/mark-all-read` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Dashboard
- `GET /dashboard/overview` - Dashboard overview stats
- `GET /dashboard/revenue-trend` - Revenue trend analysis

### Reports
- `GET /reports/transactions` - Generate transaction report (PDF/Excel)
- `GET /reports/debts` - Generate debt report (PDF/Excel)
- `GET /reports/inventory` - Generate inventory report (PDF/Excel)

### Audit Logs (Admin only)
- `GET /audit` - Query audit logs with filters

See [API Documentation](./docs/API.md) for detailed request/response schemas.

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm run test

# Run unit tests only
npm run test:unit

# Run e2e tests only
npm run test:e2e

# Run all tests with coverage
npm run test:all:cov

# Watch mode (re-run on file changes)
npm run test:watch

# CI mode (for continuous integration)
npm run test:ci
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:cov

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Current thresholds (enforced):
- **Branches:** 80%
- **Functions:** 80%
- **Lines:** 80%
- **Statements:** 80%

---

## 📊 Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check
npx tsc --noEmit
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (min 32 characters)
- [ ] Configure production `DATABASE_URL`
- [ ] Set up Redis for token blacklist
- [ ] Configure CORS `FRONTEND_URL`
- [ ] Enable HTTPS/TLS
- [ ] Set up database backups
- [ ] Configure monitoring & logging
- [ ] Set up process manager (PM2 or Docker)
- [ ] Run database migrations
- [ ] Test health endpoint

### Docker Production Deployment

```bash
# 1. Set up environment
cp .env.docker.example .env
# Edit .env with production values

# 2. Build and start services
docker-compose up -d --build

# 3. Run migrations
docker-compose exec backend npx prisma migrate deploy

# 4. Optional: Seed database (only for first deployment)
docker-compose exec backend npm run prisma:seed

# 5. Verify health
curl http://your-domain.com/api/v1/health

# 6. View logs
docker-compose logs -f backend

# 7. Set up backups (cron job example)
0 2 * * * docker-compose exec postgres pg_dump -U postgres turath_almandi > /backups/backup-$(date +\%Y\%m\%d).sql
```

### Environment-Specific Builds

```bash
# Production build
npm run build

# Production start
npm run start:prod

# Using PM2
pm2 start ecosystem.config.js --env production
```

---

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── migrations/         # Database migrations
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Database seeding
├── src/
│   ├── auth/              # Authentication module
│   ├── branches/          # Branch management
│   ├── common/            # Shared utilities
│   │   ├── audit-log/    # Audit logging
│   │   ├── config/       # Configuration (env validation)
│   │   ├── decorators/   # Custom decorators
│   │   ├── filters/      # Exception filters
│   │   ├── guards/       # Auth guards
│   │   └── middleware/   # Request middleware
│   ├── dashboard/         # Dashboard analytics
│   ├── debts/            # Debt management
│   ├── inventory/        # Inventory management
│   ├── notifications/    # Notification system
│   ├── prisma/           # Prisma service
│   ├── reports/          # Report generation
│   ├── tasks/            # Scheduled tasks (CRON)
│   ├── transactions/     # Transaction management
│   ├── users/            # User management
│   ├── websocket/        # WebSocket gateway
│   ├── app.module.ts     # Root module
│   └── main.ts           # Application entry point
├── test/                  # E2E tests
├── docs/                  # Documentation
├── scripts/              # Utility scripts
├── .env.example          # Local env example
├── .env.docker.example   # Docker env example
├── Dockerfile            # Production Docker image
├── docker-compose.yml    # Multi-service orchestration
└── README.md             # This file
```

---

## 🔒 Security Features

### Implemented Protections

1. **SQL Injection Prevention**
   - Prisma ORM with parameterized queries
   - Zero raw SQL with user input
   - Comprehensive security audit (see [SECURITY.md](./SECURITY.md))

2. **XSS Prevention**
   - class-sanitizer for input sanitization
   - Helmet CSP headers
   - Output encoding

3. **Authentication Security**
   - Bcrypt password hashing (10 rounds)
   - JWT with refresh token rotation
   - Token blacklist for logout
   - Login throttling (5 attempts / 15 min per IP)
   - Account lockout (5 attempts / 30 min per account)

4. **Authorization**
   - Role-based access control (RBAC)
   - Branch-level data isolation
   - Route guards for protected endpoints

5. **Headers & CORS**
   - Helmet security headers
   - HSTS (1 year, includeSubDomains, preload)
   - CSP, X-Frame-Options, X-Content-Type-Options
   - Strict CORS configuration

6. **Audit & Monitoring**
   - Comprehensive audit logging
   - Request ID tracking
   - Response time monitoring
   - Health checks

---

## 📖 Additional Documentation

- [Security Audit Report](./SECURITY.md)
- [Token Blacklist Documentation](./docs/TOKEN_BLACKLIST.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./prisma/schema.prisma)
- [Contributing Guidelines](../CONTRIBUTING.md)

---

## 🐛 Troubleshooting

### Common Issues

**Issue: Prisma Client not generated**
```bash
# Solution
npm run prisma:generate
```

**Issue: Database connection failed**
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Verify DATABASE_URL in .env
# Ensure PostgreSQL port is not blocked
```

**Issue: Port 3000 already in use**
```bash
# Change PORT in .env or kill the process
lsof -ti:3000 | xargs kill -9
```

**Issue: Docker build fails on Prisma generation**
```bash
# Clear Docker cache and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Issue: Environment validation errors on startup**
```bash
# Check all required variables in .env
# Generate new JWT secrets if needed:
openssl rand -hex 32
```

---

## 📞 Support

For issues and questions:
- Check [Troubleshooting](#-troubleshooting)
- Review [Documentation](./docs/)
- Open an issue on GitHub

---

## 📜 License

**UNLICENSED** - Private project for Turath Al-Mandi Restaurant

---

**Built with ❤️ for Turath Al-Mandi Restaurant**
