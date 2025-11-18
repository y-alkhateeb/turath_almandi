# Turath Almandi Restaurant Accounting System - Backend

نظام الخادم الخلفي لمحاسبة مطاعم تراث المندي
Backend server for Turath Al-Mandi Restaurant Accounting System

A comprehensive restaurant accounting system backend built with NestJS, TypeScript, PostgreSQL, and Prisma.

---

## 🚀 Tech Stack

- **NestJS** v11.1.9 - Progressive Node.js framework
- **TypeScript** v5.9.3 - Typed JavaScript
- **PostgreSQL** 18 - Relational database
- **Prisma** v6.19.0 - Modern ORM
- **JWT** - Authentication & authorization
- **Bcrypt** - Password hashing
- **Class Validator** - DTO validation
- **Passport** - Authentication middleware

---

## ✨ Features

- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Global validation pipes
- ✅ CORS configuration for frontend
- ✅ Comprehensive database schema
- ✅ User management
- ✅ Password hashing with bcrypt
- 🔄 Menu management (coming soon)
- 🔄 Order processing (coming soon)
- 🔄 Payment tracking (coming soon)

---

## 📋 Prerequisites

- Node.js v18 or higher
- PostgreSQL 18 (or use Docker)
- npm or yarn

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# 1. Start PostgreSQL
docker-compose up -d postgres

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env

# 4. Generate Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# 5. Start development server
npm run start:dev

# 6. Test the API
curl http://localhost:3000/api/v1/health
```

---

## 🔐 Environment Variables

```env
NODE_ENV=development
PORT=3000

# Database with connection pool settings
# connection_limit: Maximum number of connections in the pool (default: 10)
# pool_timeout: Maximum time (in seconds) to wait for a connection (default: 20)
DATABASE_URL="postgresql://postgres:password@localhost:5432/turath_almandi?schema=public&connection_limit=10&pool_timeout=20"

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRATION=7d
JWT_REFRESH_TOKEN_EXPIRATION=7
JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME=30
FRONTEND_URL=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
```

### Database Connection Pool

The `DATABASE_URL` includes connection pool parameters to optimize database performance:

- **`connection_limit=10`**: Limits the maximum number of concurrent database connections to 10. This prevents database overload and ensures efficient resource usage.
- **`pool_timeout=20`**: Sets the maximum wait time (in seconds) for acquiring a connection from the pool before timing out. This prevents indefinite waiting when the pool is exhausted.

These settings help maintain stable database performance under load and prevent connection exhaustion.

---

## 🔌 API Endpoints

Base URL: `http://localhost:3000/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user (requires JWT)

---

## 📝 Common Commands

```bash
# Development
npm run start:dev          # Start in watch mode
npm run start:debug        # Start in debug mode

# Database
npm run prisma:studio      # Open Prisma Studio
npm run prisma:migrate     # Create and run migration
npm run prisma:generate    # Generate Prisma client

# Code Quality
npm run lint               # Run linter
npm run format             # Format code

# Testing
npm run test              # Run tests
npm run test:cov          # Run tests with coverage

# Production
npm run build             # Build for production
npm run start:prod        # Start production server
```

---

## 📖 Additional Documentation

- [Quick Setup Guide](./SETUP.md)
- [Prisma Schema](./prisma/schema.prisma)
- [Main Project README](../README.md)

---

**Built with ❤️ for Turath Al-Mandi Restaurant**
