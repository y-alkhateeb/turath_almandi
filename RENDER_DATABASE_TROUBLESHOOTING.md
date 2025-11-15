# 🔧 Render Database Connection Troubleshooting Guide

## Current Issue

**Error:** `Can't reach database server` or `Database failed to become ready after 60 attempts`

This indicates the backend service cannot establish a connection to the PostgreSQL database.

## Step-by-Step Resolution

### 1️⃣ Verify Database Service Exists and is Running

**Go to Render Dashboard:**
1. Navigate to https://dashboard.render.com/
2. Look for service named `turath-almandi-db` (or similar)
3. Check status - should show **"Available"** (green)

**If database doesn't exist:**
- Create a new PostgreSQL database:
  - Click "New +" → "PostgreSQL"
  - Name: `turath-almandi-db`
  - Database: `turath_almandi`
  - User: `turath_user`
  - Region: **Same as your backend service** (important!)
  - Plan: Free
  - Click "Create Database"
  - Wait 2-5 minutes for provisioning

**If database status is not "Available":**
- Wait for it to finish provisioning
- If status shows "Failed" or "Suspended", you may need to delete and recreate it

### 2️⃣ Get the Correct Database Connection String

**In the database service page:**
1. Scroll to "Connections" section
2. Find **"Internal Database URL"** (not External!)
3. Click to copy the full URL

**The URL should look like:**
```
postgresql://turath_user:****@dpg-xxxxx-a.oregon-postgres.render.com/turath_almandi
```

**Important:**
- ✅ Use **Internal Database URL** (includes `.oregon-postgres.render.com` or similar)
- ❌ Don't use External URL (has different hostname)
- ✅ Backend and database must be in the **same region**

### 3️⃣ Update Backend Environment Variable

**In backend service (`turath-almandi-backend`):**
1. Go to "Environment" tab
2. Find or add `DATABASE_URL` variable
3. Paste the **Internal Database URL** from step 2
4. Click "Save Changes"

**The backend will automatically redeploy**

### 4️⃣ Add Connection Pool Parameters (Optional but Recommended)

To improve reliability, append these parameters to your DATABASE_URL:

```
postgresql://user:pass@host/db?connection_limit=5&pool_timeout=10
```

**Full example:**
```
postgresql://turath_user:****@dpg-xxxxx-a.oregon-postgres.render.com/turath_almandi?connection_limit=5&pool_timeout=10
```

### 5️⃣ Monitor Deployment Logs

**Watch the backend logs for:**

✅ **Success:**
```
🚀 Starting تراث المندي Backend...
📊 Environment Information:
   NODE_ENV: production
   PORT: 3000
   DATABASE_URL: postgresql://turath_user:****@dpg-xxxxx-a...
⏳ Waiting for database to be ready...
🔍 Attempt 1/60: Checking database connection...
✅ Database is ready!
📦 Generating Prisma Client...
🔄 Running database migrations...
✅ Migrations completed successfully
🌱 Seeding database...
✅ Starting application...
```

❌ **Failure scenarios:**

**Scenario A: DATABASE_URL NOT SET**
```
⚠️  DATABASE_URL: NOT SET!
❌ ERROR: DATABASE_URL environment variable is required
```
→ **Solution:** Go back to step 3

**Scenario B: Connection timeout after 60 attempts**
```
🔍 Attempt 60/60: Checking database connection...
❌ Database failed to become ready after 60 attempts
```
→ **Solutions:**
1. Verify database is "Available" status
2. Check DATABASE_URL is correct (copy it again)
3. Ensure database and backend are in same region
4. Try deleting and recreating the database

**Scenario C: Connection refused**
```
Error: connect ECONNREFUSED
```
→ **Solution:** Wrong hostname. Use Internal Database URL, not External

### 6️⃣ Region Compatibility Check

**Backend and database MUST be in the same region for Internal URLs to work.**

**To check:**
1. Backend service → Settings → Region (e.g., "Oregon (US West)")
2. Database service → Settings → Region (e.g., "Oregon (US West)")
3. These should **match exactly**

**If they don't match:**
- Recreate the database in the correct region, OR
- Redeploy backend to database's region, OR
- Use External Database URL (costs bandwidth on free tier)

### 7️⃣ Database Configuration Issues

**If database exists but still won't connect:**

1. **Delete the database** (if it's new and empty):
   - Database service → Settings → Delete Database
   - Confirm deletion
   - Wait 1 minute

2. **Recreate with correct settings:**
   - Name: `turath-almandi-db`
   - Database Name: `turath_almandi`
   - User: `turath_user`
   - Region: **Same as backend**
   - Plan: Free

3. **Copy the new Internal Database URL**

4. **Update backend DATABASE_URL** environment variable

5. **Trigger manual deploy** on backend service

## Common Mistakes to Avoid

❌ Using External Database URL instead of Internal
❌ Backend and database in different regions
❌ Typos in DATABASE_URL
❌ Database service not fully provisioned before backend starts
❌ Missing DATABASE_URL environment variable entirely

## Quick Checklist

- [ ] Database service exists and shows "Available" status
- [ ] Backend service exists
- [ ] Both services are in the **same region**
- [ ] DATABASE_URL is set in backend environment variables
- [ ] DATABASE_URL uses the **Internal** database URL
- [ ] DATABASE_URL has been copied correctly (no typos)
- [ ] Backend has been redeployed after setting DATABASE_URL
- [ ] Logs show environment info including masked DATABASE_URL

## Expected Timeline

- Database provisioning: 2-5 minutes
- Backend build: 2-3 minutes
- Database connection check: 5-30 seconds (first connection)
- Migration execution: 5-15 seconds
- Total first deployment: ~10 minutes

## Still Not Working?

If you've followed all steps and it still doesn't work:

1. **Check Render Status Page:** https://status.render.com/
   - Look for any ongoing incidents

2. **Try Render's Database Connection Test:**
   - In your database service, look for connection examples
   - Try connecting with `psql` locally to verify credentials

3. **Contact Render Support:**
   - Dashboard → Help → Contact Support
   - Provide: Service names, region, error logs

4. **Temporary Workaround (not recommended for production):**
   - Use External Database URL
   - Note: This uses billable bandwidth on free tier

## Additional Resources

- [Render PostgreSQL Documentation](https://render.com/docs/databases)
- [Render Internal Networking](https://render.com/docs/private-services)
- [Prisma Connection Troubleshooting](https://www.prisma.io/docs/guides/database/troubleshooting-orm)

---

**Last Updated:** 2025-11-15
**Version:** 1.1.0
