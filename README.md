# Turath Almandi Restaurant Accounting System - Backend

A comprehensive restaurant accounting system backend built with NestJS, TypeScript, PostgreSQL, and Prisma.

## Tech Stack

- **NestJS** v11.1.9 - Progressive Node.js framework
- **TypeScript** v5.9.3 - Typed JavaScript
- **PostgreSQL** 18 - Relational database
- **Prisma** v6.19.0 - Modern ORM
- **JWT** - Authentication & authorization
- **Bcrypt** - Password hashing
- **Class Validator** - DTO validation

## Features

- JWT-based authentication
- Role-based access control (RBAC)
- Global validation pipes
- CORS configuration for frontend
- Comprehensive database schema for restaurant operations
- User management
- Menu management
- Order processing
- Payment tracking
- Invoice generation
- Transaction management
- Inventory tracking

## Project Structure

```
turath_almandi/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── dto/              # Data transfer objects
│   │   │   ├── register.dto.ts
│   │   │   └── login.dto.ts
│   │   ├── guards/           # Auth guards
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── local-auth.guard.ts
│   │   ├── strategies/       # Passport strategies
│   │   │   ├── jwt.strategy.ts
│   │   │   └── local.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── common/               # Shared resources
│   │   ├── decorators/      # Custom decorators
│   │   │   ├── roles.decorator.ts
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/          # Common guards
│   │   │   └── roles.guard.ts
│   │   ├── filters/         # Exception filters
│   │   └── interceptors/    # Interceptors
│   ├── prisma/              # Prisma module
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── app.module.ts
│   └── main.ts              # Application entry point
├── .env.example             # Environment variables template
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
└── package.json
```

## Database Schema

The system includes the following models:

### User Management
- **User** - System users with role-based access

### Menu Management
- **Category** - Menu categories
- **MenuItem** - Menu items with pricing

### Order Management
- **Order** - Customer orders
- **OrderItem** - Individual items in orders

### Payment & Invoicing
- **Payment** - Payment records
- **Invoice** - Invoice generation

### Accounting
- **Transaction** - Income and expense tracking
- **Inventory** - Basic inventory management

### User Roles
- `ADMIN` - Full system access
- `MANAGER` - Management operations
- `ACCOUNTANT` - Financial operations
- `CASHIER` - Payment processing
- `WAITER` - Order management

## Prerequisites

- Node.js v18 or higher
- PostgreSQL 18
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd turath_almandi
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/turath_almandi?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:5173
BCRYPT_SALT_ROUNDS=10
```

5. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

## Running the Application

### Development mode
```bash
npm run start:dev
```

### Production mode
```bash
npm run build
npm run start:prod
```

### Debug mode
```bash
npm run start:debug
```

The API will be available at `http://localhost:3000/api/v1`

## API Endpoints

### Health Check
- `GET /api/v1` - Welcome message
- `GET /api/v1/health` - Health check

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user (requires JWT)

### Example Requests

#### Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "securepassword123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "securepassword123"
  }'
```

#### Get Current User
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Code Quality

```bash
# Linting
npm run lint

# Formatting
npm run format
```

## Prisma Commands

```bash
# Generate Prisma client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# Open Prisma Studio
npm run prisma:studio

# Run seed data (if configured)
npm run prisma:seed
```

## Using Role-Based Access Control

Example controller with role protection:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { CurrentUser } from './common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles('ADMIN', 'MANAGER')
  getDashboard(@CurrentUser() user) {
    return { message: 'Admin dashboard', user };
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT | - |
| `JWT_EXPIRATION` | JWT token expiration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
| `BCRYPT_SALT_ROUNDS` | Bcrypt salt rounds | `10` |

## Security Best Practices

1. Never commit `.env` files
2. Use strong JWT secrets in production
3. Keep dependencies updated
4. Use HTTPS in production
5. Implement rate limiting
6. Enable helmet for security headers
7. Validate all user inputs
8. Use parameterized queries (Prisma handles this)

## Next Steps

1. Add business logic modules (orders, menu, transactions, etc.)
2. Implement comprehensive error handling
3. Add logging (Winston/Pino)
4. Set up API documentation (Swagger)
5. Configure rate limiting
6. Add caching (Redis)
7. Implement file upload
8. Add email notifications
9. Set up CI/CD pipeline
10. Write comprehensive tests

## License

UNLICENSED - Private project

## Support

For issues or questions, please contact the development team.
