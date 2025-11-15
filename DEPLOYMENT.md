# 🚀 Deployment Guide - تراث المندي Restaurant Accounting System

This guide explains how to deploy the application to Render with automatic database seeding.

## 📋 Table of Contents

- [Quick Start - Recommended](#quick-start---recommended)
- [Quick Deploy with Blueprint](#quick-deploy-with-blueprint)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Troubleshooting](#troubleshooting)

---

## ⚡ Quick Start - Recommended

**This is the proven deployment method that works:**

### Prerequisites
✅ Code pushed to GitHub (branch: `main`)
✅ All migrations committed
✅ package-lock.json is in sync

### Deployment Steps

1. **Create Database on Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "PostgreSQL"
   - Name: `turath-almandi-db`
   - Region: Choose closest to your users
   - Plan: Free (or paid if needed)
   - Click "Create Database"
   - **Copy the Internal Database URL** (important!)

2. **Create Backend Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Name: `turath-almandi-backend`
   - Runtime: Docker
   - Dockerfile path: `./backend/Dockerfile`
   - Docker build context: `./backend`
   - Add environment variables (see table below)
   - Click "Create Web Service"

3. **Create Frontend Service**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Name: `turath-almandi-frontend`
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/dist`
   - Add environment variable: `VITE_API_URL` = your backend URL
   - Click "Create Static Site"

4. **Monitor Deployment**
   - Watch backend logs for successful migration and seeding
   - Once complete, set `RUN_SEED=false` to prevent re-seeding

### Environment Variables (Backend)

| Variable | Value | Example |
|----------|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `PORT` | `3000` | `3000` |
| `DATABASE_URL` | **Internal Database URL** | `postgresql://turath_user:***@dpg-***-a/turath_almandi_db` |
| `JWT_SECRET` | Generate random | Click "Generate" button |
| `JWT_EXPIRATION` | `7d` | `7d` |
| `CORS_ORIGIN` | Frontend URL | `https://turath-almandi-frontend.onrender.com` |
| `BCRYPT_SALT_ROUNDS` | `10` | `10` |
| `RUN_SEED` | `true` (first deploy) | Change to `false` after |

### Expected Success Output

```
🚀 Starting تراث المندي Backend...
📦 Generating Prisma Client...
✔ Generated Prisma Client (v6.19.0)

🔄 Running database migrations...
Applying migration `20241115000000_init`
✔ All migrations have been successfully applied.

🌱 Seeding database...
✅ Created admin user
✅ Created branch: المركز الرئيسي
✅ Database seeded successfully!

✅ Starting application...
Listening on port 3000
```

### Login Credentials

After successful deployment:
- **Username**: `admin`
- **Password**: `Admin123!@#`

---

## 🎯 Quick Deploy with Blueprint

### Step 1: Push to GitHub

```bash
git add .
git commit -m "feat: Add Render deployment configuration"
git push origin main
```

### Step 2: Deploy to Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Select the repository: `y-alkhateeb/turath_almandi`
5. Render will automatically read `render.yaml` and create:
   - PostgreSQL Database
   - Backend Service
   - Frontend Service

### Step 3: Monitor Deployment

Watch the logs to see:
```
🚀 Starting تراث المندي Backend...
📦 Generating Prisma Client...
🔄 Running database migrations...
🌱 Seeding database...
✅ Created branches
✅ Created admin user
✅ Created accountant users
🎉 Seeding completed successfully!
✅ Starting application...
```

---

## 🔧 Manual Deployment

### Backend Service Configuration

**Service Type:** Web Service  
**Runtime:** Docker  
**Dockerfile Path:** `./backend/Dockerfile`

#### Build & Deploy Settings

The Dockerfile automatically:
1. Builds the NestJS application
2. Generates Prisma Client
3. Runs migrations on startup
4. Seeds the database (if `RUN_SEED=true`)
5. Starts the application

#### Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `3000` | Application port |
| `DATABASE_URL` | From database | Auto-generated |
| `JWT_SECRET` | Auto-generate | Click "Generate Value" |
| `JWT_EXPIRATION` | `7d` | Token expiration |
| `CORS_ORIGIN` | Frontend URL | Update with actual frontend URL |
| `BCRYPT_SALT_ROUNDS` | `10` | Password hashing rounds |
| `RUN_SEED` | `true` | **Set to `false` after first deploy** |

### Frontend Service Configuration

**Service Type:** Static Site  
**Build Command:** `cd frontend && npm install && npm run build`  
**Publish Directory:** `frontend/dist`

#### Environment Variables

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_API_URL` | Backend URL | Update with actual backend URL |

---

## 🌱 Database Seeding

### How It Works

The seeding happens automatically on the first deployment thanks to the startup script (`backend/scripts/start.sh`):

```bash
#!/bin/sh
# 1. Generate Prisma Client
npx prisma generate

# 2. Run migrations
npx prisma migrate deploy

# 3. Seed database (if RUN_SEED=true)
if [ "$RUN_SEED" = "true" ]; then
  npm run deploy:seed
fi

# 4. Start application
exec node dist/main
```

### Default Seed Data

When you first deploy, the database will be seeded with:

#### **Admin Account**
```
Username: admin
Password: Admin123!@#
Access: All branches
```

#### **Branches**
- **الفرع الرئيسي** (Main Branch) - بغداد - المنصور
- **فرع الكرادة** - بغداد - الكرادة

#### **Accountant Accounts**
```
accountant1 / Accountant123 (الفرع الرئيسي)
accountant2 / Accountant123 (فرع الكرادة)
```

### Control Seeding

#### First Deployment (Seed Enabled)
```yaml
- key: RUN_SEED
  value: true
```

#### Subsequent Deployments (Seed Disabled)
After your first successful deployment, update the environment variable:

1. Go to Render Dashboard → Your Backend Service
2. Navigate to **Environment**
3. Find `RUN_SEED` and change value to `false`
4. Click **Save Changes**

This prevents re-seeding on every deployment.

---

## 🛠️ Available NPM Scripts

```json
{
  "deploy:migrate": "prisma migrate deploy",
  "deploy:seed": "tsx prisma/seed.ts",
  "deploy:setup": "prisma generate && prisma migrate deploy && tsx prisma/seed.ts"
}
```

**Note:** We use `tsx` instead of `ts-node` for better ES module compatibility in Node 20.

---

## 🔍 Monitoring & Logs

### View Deployment Logs

1. Go to Render Dashboard
2. Select your Backend Service
3. Click **"Logs"** tab
4. Watch for:
   - Migration status
   - Seeding output
   - Application startup

### Successful Deployment Output

```
📋 LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 ADMIN:
   Username: admin
   Password: Admin123!@#
   Access: All branches

👤 ACCOUNTANT 1 (الفرع الرئيسي):
   Username: accountant1
   Password: Accountant123
   Branch: الفرع الرئيسي

👤 ACCOUNTANT 2 (فرع الكرادة):
   Username: accountant2
   Password: Accountant123
   Branch: فرع الكرادة
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## ⚠️ Troubleshooting

### 1. Migration Error: P3009 - Failed Migration

**Error:**
```
Error: P3009
migrate found failed migrations in the target database
The `20241115000000_add_inventory_transaction_link` migration failed
```

**Root Cause:** Previous migration attempt failed and is marked as failed in `_prisma_migrations` table.

**Solution:**
Delete and recreate the database (cleanest for first deployment):
1. Go to Render Dashboard → Database
2. Settings → Delete Database
3. Create new PostgreSQL database
4. Copy the **Internal Database URL**
5. Update backend service → Environment → `DATABASE_URL`
6. Trigger manual deploy

### 2. Migration Error: P3018 - Table Does Not Exist

**Error:**
```
Error: P3018
Migration failed: relation "transactions" does not exist
```

**Root Cause:** Migration file trying to ALTER a table that was never created (missing initial migration).

**Solution:**
Ensure you have a complete initial migration that creates all tables:
```bash
# Check migrations directory
ls backend/prisma/migrations/

# Should have: 20241115000000_init/migration.sql
# Not just: 20241115000000_add_inventory_transaction_link/
```

### 3. TypeScript Execution Error

**Error:**
```
TypeError: Unknown file extension ".ts" for /app/prisma/seed.ts
```

**Root Cause:** `ts-node` doesn't handle ES modules well in Node 20.

**Solution:**
Use `tsx` instead of `ts-node`:
```json
{
  "deploy:seed": "tsx prisma/seed.ts"
}
```

### 4. npm ci Sync Error

**Error:**
```
npm ci can only install packages when package.json and package-lock.json are in sync
Missing: tsx@4.20.6 from lock file
```

**Root Cause:** `package-lock.json` is out of sync with `package.json`.

**Solution:**
```bash
cd backend
npm install
git add package-lock.json
git commit -m "chore: Update package-lock.json"
git push
```

### 5. Decimal Import Error

**Error:**
```
TS2305: Module '@prisma/client' has no exported member 'Decimal'
```

**Root Cause:** Decimal is not exported from main `@prisma/client` module.

**Solution:**
```typescript
// ❌ Wrong
import { Decimal } from '@prisma/client';

// ✅ Correct
import { Decimal } from '@prisma/client/runtime/library';
```

### 6. Database URL: Internal vs External

**Question:** Should I use Internal or External Database URL?

**Answer:** Always use **Internal Database URL** for backend service:
- ✅ Free (no bandwidth charges between Render services)
- ✅ Faster (lower latency on same network)
- ✅ More secure (private network)

Find it in: Database → Internal Database URL (starts with `postgresql://...@dpg-...`)

### 7. Seeding Runs on Every Deployment

**Problem:** Database gets re-seeded every time you deploy.

**Solution:** Set `RUN_SEED=false` in environment variables after first successful deployment.

### 8. Prisma Deprecation Warning

**Warning:**
```
The configuration property `package.json#prisma` is deprecated
```

**Impact:** Just a warning, doesn't affect functionality.

**Future Fix:** Migrate to `prisma.config.ts` in Prisma 7.

### 9. Cannot Connect to Database

**Problem:** Application can't connect to PostgreSQL

**Solution:**
1. Verify `DATABASE_URL` environment variable is set
2. Ensure using **Internal Database URL** (not external)
3. Check database service is running
4. Verify database and backend are in same region

---

## 📦 Database Backup (Important!)

Before deploying to production:

```bash
# Backup your local database
pg_dump -U postgres turath_almandi > backup_$(date +%Y%m%d).sql

# On Render, use their backup feature
# Dashboard → Database → Backups
```

---

## 🔐 Security Checklist

- [ ] Change default admin password after first login
- [ ] Set `RUN_SEED=false` after first deployment
- [ ] Use strong JWT_SECRET (auto-generated by Render)
- [ ] Update CORS_ORIGIN to actual frontend URL
- [ ] Enable HTTPS (automatic on Render)
- [ ] Review and delete unused accountant accounts
- [ ] Set up database backups

---

## 📝 Post-Deployment Steps

1. **Test Login**
   - Visit your frontend URL
   - Login with admin credentials
   - Verify dashboard loads correctly

2. **Change Passwords**
   - Login as admin
   - Change admin password
   - Update or remove default accountant accounts

3. **Configure Production Settings**
   - Set `RUN_SEED=false`
   - Update CORS_ORIGIN
   - Configure any additional environment variables

4. **Monitor Performance**
   - Check Render metrics
   - Review application logs
   - Set up alerts if needed

---

## 🌐 URLs

After deployment, your services will be available at:

- **Frontend:** `https://turath-almandi-frontend.onrender.com`
- **Backend API:** `https://turath-almandi-backend.onrender.com/api/v1`
- **Database:** Internal Render URL (not publicly accessible)

---

## 📞 Support

For deployment issues:
- Check [Render Documentation](https://render.com/docs)
- Review application logs in Render Dashboard
- Check GitHub Issues for common problems

---

**Last Updated:** 2025-11-15  
**Version:** 1.0.0
