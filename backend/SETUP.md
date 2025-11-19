# Quick Setup Guide

This guide will help you get the Turath Almandi Restaurant Accounting System up and running quickly.

## Quick Start (Using Docker)

1. **Start PostgreSQL with Docker:**
   ```bash
   docker-compose up -d postgres
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   The default `.env` values work with the Docker setup.

4. **Generate Prisma client and run migrations:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. **Start the development server:**
   ```bash
   npm run start:dev
   ```

6. **Test the API:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

## Access Points

- **API:** http://localhost:3000/api/v1
- **PgAdmin:** http://localhost:5050 (email: admin@restaurant.com, password: admin)
- **Prisma Studio:** Run `npm run prisma:studio` (opens at http://localhost:5555)

## Alternative: Local PostgreSQL

If you prefer to use a local PostgreSQL installation:

1. Install PostgreSQL 18 on your system
2. Create a database:
   ```sql
   CREATE DATABASE turath_almandi;
   ```
3. Update the `DATABASE_URL` in `.env` to match your local setup
4. Follow steps 2-6 from the Docker setup above

## First User Creation

Create your first admin user:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "Admin123!@#",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

Save the returned JWT token for authenticated requests.

## Testing Authentication

1. **Login:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@restaurant.com",
       "password": "Admin123!@#"
     }'
   ```

2. **Get current user (replace YOUR_TOKEN):**
   ```bash
   curl -X GET http://localhost:3000/api/v1/auth/profile \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

## Common Commands

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

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `docker-compose ps`
- Check the `DATABASE_URL` in your `.env` file
- Verify database exists: Connect with PgAdmin

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill the process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### Prisma Issues
- Regenerate client: `npm run prisma:generate`
- Reset database: `npx prisma migrate reset`

## Next Steps

1. Explore the API endpoints in the README
2. Read the database schema in `prisma/schema.prisma`
3. Start building your business logic modules
4. Add Swagger documentation for API
5. Implement additional features as needed

## Need Help?

- Check the main README.md for detailed documentation
- Review the code structure in `src/`
- Examine the Prisma schema for data models
