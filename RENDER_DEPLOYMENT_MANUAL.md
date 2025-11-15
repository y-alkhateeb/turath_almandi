# 🚀 Manual Render Deployment - Quick Start

Since Blueprint didn't deploy all services, follow these steps to manually deploy backend and database.

## 📦 Step-by-Step Deployment

### **1️⃣ Create PostgreSQL Database First**

```
Dashboard → New + → PostgreSQL
```

**Settings:**
- Name: `turath-almandi-db`
- Database: `turath_almandi`
- User: `turath_user`
- Region: Oregon (US West)
- PostgreSQL Version: 15
- Plan: **Free**

**Important:** Copy the **Internal Database URL** after creation!

---

### **2️⃣ Deploy Backend Service**

```
Dashboard → New + → Web Service
```

**Repository Settings:**
- Connect GitHub: `y-alkhateeb/turath_almandi`
- Branch: `main` (or your current branch)

**Service Settings:**
- Name: `turath-almandi-backend`
- Region: Oregon (US West)
- Runtime: **Docker**
- Dockerfile Path: `./backend/Dockerfile`
- Docker Context: `./backend`

**Environment Variables (Add each one):**

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=[Paste Internal Database URL from Step 1]
JWT_SECRET=[Click "Generate" button]
JWT_EXPIRATION=7d
CORS_ORIGIN=https://turath-almandi-frontend.onrender.com
BCRYPT_SALT_ROUNDS=10
RUN_SEED=true
```

**Advanced:**
- Health Check Path: `/api/v1/health`
- Plan: Free
- Auto-Deploy: Yes

---

### **3️⃣ Monitor Backend Deployment**

Go to: **Backend Service → Logs**

You should see:

```
🚀 Starting تراث المندي Backend...
📦 Generating Prisma Client...
🔄 Running database migrations...
🌱 Seeding database...
✅ Created branches
✅ Created admin user
✅ Created accountant users

📋 LOGIN CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👑 ADMIN:
   Username: admin
   Password: Admin123!@#
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Starting application...
```

---

### **4️⃣ Update Frontend**

Go to: **Frontend Service → Environment**

Add/Update:
```
VITE_API_URL=https://turath-almandi-backend.onrender.com
```

Save → Frontend will auto-redeploy

---

### **5️⃣ Test Login**

1. Visit: `https://turath-almandi-frontend.onrender.com`
2. Login:
   - Username: `admin`
   - Password: `Admin123!@#`
3. ✅ You should see the dashboard!

---

### **6️⃣ Disable Seeding (Important!)**

After successful login:

**Backend Service → Environment**
```
RUN_SEED=false  ← Change from true to false
```

This prevents re-seeding on every deployment.

---

## 🔍 Troubleshooting

### Problem: Backend fails to start
**Solution:** Check logs for specific error. Common issues:
- Missing DATABASE_URL
- Database not ready yet (wait 2 minutes after DB creation)
- Dockerfile path incorrect

### Problem: Migrations fail
**Solution:**
- Verify DATABASE_URL is the **Internal** URL (not External)
- Check database is in "Available" status
- Ensure migrations folder exists in Docker build

### Problem: Seeding shows "already exists" errors
**Solution:** This is normal if data already exists. The seed script uses `upsert` so it won't fail.

### Problem: Frontend can't connect
**Solution:**
- Check CORS_ORIGIN on backend matches frontend URL exactly
- Verify VITE_API_URL on frontend points to backend
- Check backend is running (green status)

---

## 📝 Quick Checklist

- [ ] Database created and ready
- [ ] Backend deployed successfully
- [ ] Seeding completed (check logs)
- [ ] Frontend updated with backend URL
- [ ] Tested login works
- [ ] Changed RUN_SEED to false
- [ ] Changed admin password (recommended)

---

## 🔐 Default Credentials

```
Admin:
  Username: admin
  Password: Admin123!@#

Accountants:
  accountant1 / Accountant123 (الفرع الرئيسي)
  accountant2 / Accountant123 (فرع الكرادة)
```

**⚠️ Change these after first login!**

---

## 📞 Need Help?

If you encounter issues:
1. Check the Logs tab on each service
2. Verify all environment variables are set
3. Ensure DATABASE_URL uses Internal URL
4. Check that RUN_SEED is set to "true" for first deployment

---

**Created:** 2025-11-15
**Services:** Database + Backend + Frontend
