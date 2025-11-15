# 🚀 Deployment Guide - تراث المندي Restaurant Accounting System

This guide explains how to deploy the application to Render with automatic database seeding.

## 📋 Table of Contents

- [Quick Deploy with Blueprint](#quick-deploy-with-blueprint)
- [Manual Deployment](#manual-deployment)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Troubleshooting](#troubleshooting)

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
  "deploy:seed": "ts-node prisma/seed.ts",
  "deploy:setup": "prisma generate && prisma migrate deploy && ts-node prisma/seed.ts"
}
```

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

### Seeding Runs on Every Deployment

**Problem:** Database gets re-seeded every time you deploy.

**Solution:** Set `RUN_SEED=false` in environment variables.

### Migration Errors

**Problem:** `Migration failed to apply cleanly`

**Solution:** 
1. Check your DATABASE_URL is correct
2. Ensure the database is accessible
3. Review migration files for conflicts

### Prisma Client Generation Fails

**Problem:** `@prisma/client did not initialize`

**Solution:**
- Ensure `prisma generate` runs before `prisma migrate deploy`
- Check the startup script execution order

### Cannot Connect to Database

**Problem:** Application can't connect to PostgreSQL

**Solution:**
1. Verify `DATABASE_URL` environment variable
2. Check database service is running
3. Ensure firewall rules allow connection

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
