# 🚀 Deployment Guide - Turath Almandi Restaurant Accounting System

This guide will help you deploy your fullstack application entirely on **Render** (Frontend + Backend + Database).

## 📋 Prerequisites

- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Git installed locally

---

## 🎯 Deployment Architecture

```
┌─────────────────────┐
│  Render Frontend    │
│  (React/Vite/Nginx) │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌──────────────────────┐
│  Render Backend      │
│  (NestJS API)        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  PostgreSQL Database │
│  (Render)            │
└──────────────────────┘
```

**All on Render - 100% FREE Tier!**

---

## 🚀 Quick Deploy (Recommended)

Render supports deploying from a `render.yaml` blueprint file!

### Option 1: One-Click Deploy (Easiest)

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect your `turath_almandi` GitHub repository
4. Render will automatically detect `render.yaml`
5. Click "Apply" - Render will create all services automatically!
   - ✅ PostgreSQL Database
   - ✅ Backend Service
   - ✅ Frontend Service

**That's it!** Render will deploy everything in about 5-10 minutes.

---

## 🔧 Manual Deploy (Step-by-Step)

If you prefer manual control, follow these steps:

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started" and sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Create PostgreSQL Database
1. From Render Dashboard, click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `turath-almandi-db`
   - **Database**: `turath_almandi`
   - **User**: `turath_user`
   - **Region**: Choose closest to you (e.g., Oregon)
   - **Plan**: Free
3. Click "Create Database"
4. Wait for database to be ready (~1 minute)
5. Go to "Info" tab and copy the **Internal Database URL**

### Step 3: Deploy Backend Service
1. Click "New +" → "Web Service"
2. Connect your `turath_almandi` repository
3. Configure:

**Basic Settings:**
- **Name**: `turath-almandi-backend`
- **Region**: Same as database (important for performance!)
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Docker
- **Plan**: Free

**Docker Settings:**
- **Dockerfile Path**: `./Dockerfile`
- **Docker Command**: Leave empty (uses Dockerfile default)

4. Click "Advanced" and add environment variables:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste-internal-database-url-from-step-2>
JWT_SECRET=<generate-strong-random-secret>
JWT_EXPIRATION=7d
CORS_ORIGIN=https://turath-almandi-frontend.onrender.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

5. Click "Create Web Service"
6. Wait for deployment (~3-5 minutes)
7. Note your backend URL: `https://turath-almandi-backend.onrender.com`

### Step 4: Deploy Frontend Service
1. Click "New +" → "Web Service"
2. Connect your `turath_almandi` repository
3. Configure:

**Basic Settings:**
- **Name**: `turath-almandi-frontend`
- **Region**: Same as backend
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Runtime**: Docker
- **Plan**: Free

**Docker Settings:**
- **Dockerfile Path**: `./Dockerfile`
- **Docker Command**: Leave empty

4. Click "Advanced" and add environment variable:

```env
VITE_API_URL=https://turath-almandi-backend.onrender.com/api/v1
```

⚠️ **Important**: This must be set as a build-time environment variable!

5. Click "Create Web Service"
6. Wait for deployment (~3-5 minutes)
7. Your frontend URL: `https://turath-almandi-frontend.onrender.com`

### Step 5: Verify Deployment

**Test Backend:**
```bash
curl https://turath-almandi-backend.onrender.com/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T..."
}
```

**Test Frontend:**
1. Open `https://turath-almandi-frontend.onrender.com`
2. You should see the login page
3. Open browser DevTools → Network tab
4. Try to login (will fail if no users, but API call should work)
5. Verify requests go to backend URL

---

## 🔐 Important Configuration

### CORS Settings

Make sure your backend `CORS_ORIGIN` matches your frontend URL:
- Backend Environment Variable: `CORS_ORIGIN=https://turath-almandi-frontend.onrender.com`

### Database Migrations

Migrations run automatically on backend startup (configured in Dockerfile):
```bash
npx prisma migrate deploy && node dist/main
```

Check backend logs to verify migrations succeeded.

### Environment Variables Summary

**Database (PostgreSQL):**
- Automatically configured by Render

**Backend:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<internal-database-url>
JWT_SECRET=<64-char-random-string>
JWT_EXPIRATION=7d
CORS_ORIGIN=https://turath-almandi-frontend.onrender.com
```

**Frontend:**
```env
VITE_API_URL=https://turath-almandi-backend.onrender.com/api/v1
```

---

## 💰 Cost Breakdown

### Render Free Tier (All Services)

| Service | Cost | Limits |
|---------|------|--------|
| **PostgreSQL** | FREE | 1GB storage, 97 connection limit |
| **Backend** | FREE | 750 hours/month, 512MB RAM |
| **Frontend** | FREE | 750 hours/month, 512MB RAM |

**Total: $0/month** 🎉

### Important Limitations

⚠️ **Free Tier Spin Down:**
- Services spin down after **15 minutes** of inactivity
- First request takes **30-60 seconds** to wake up
- Both frontend and backend can spin down independently

**Solutions:**
1. **Upgrade to Paid Plan**: $7/month per service for always-on
2. **Use a Ping Service**: Keep services alive (e.g., UptimeRobot)
3. **Accept the delay**: Show "Loading..." message to users

---

## 📊 Monitoring & Logs

### View Logs
1. Go to Render Dashboard
2. Click on service (Frontend/Backend/Database)
3. Click "Logs" tab
4. Monitor real-time logs

### Check Metrics
1. Click on service
2. Click "Metrics" tab
3. View:
   - CPU usage
   - Memory usage
   - Bandwidth
   - Request count

### Set Up Alerts (Optional)
1. Service Settings → Notifications
2. Add email or Slack webhook
3. Get notified of deployment failures or service issues

---

## 🔄 Automatic Deployments

Render automatically deploys when you push to `main` branch!

**How it works:**
1. Push code to GitHub
2. Render detects changes
3. Automatically builds and deploys affected services
4. Zero downtime deployment

**Disable auto-deploy:**
- Service Settings → Build & Deploy → Disable "Auto-Deploy"

**Manual deploy:**
- Service → "Manual Deploy" → "Deploy latest commit"

---

## 🧪 Testing Your Deployment

### 1. Test Database Connection
```bash
# From backend logs, verify:
# ✅ "Database connected successfully"
# ✅ "Prisma migrations completed"
```

### 2. Test Backend API
```bash
# Health check
curl https://turath-almandi-backend.onrender.com/api/v1/health

# Auth endpoint (should return 401)
curl https://turath-almandi-backend.onrender.com/api/v1/auth/profile
```

### 3. Test Frontend
1. Visit: `https://turath-almandi-frontend.onrender.com`
2. Open DevTools → Console (check for errors)
3. Open DevTools → Network tab
4. Try any action (login, etc.)
5. Verify API calls go to backend

### 4. Test CORS
- API calls from frontend should work (no CORS errors)
- Check browser console for CORS-related errors

---

## 🐛 Troubleshooting

### Frontend Shows Blank Page
**Symptoms:** White screen, no content
**Solutions:**
1. Check browser console for errors (F12)
2. Verify build completed successfully in Render logs
3. Check nginx is serving files: `curl -I https://turath-almandi-frontend.onrender.com`
4. Verify `index.html` exists in build output

### Backend API Not Responding
**Symptoms:** 503 Service Unavailable, Connection timeout
**Solutions:**
1. Check if service is "Live" in Render Dashboard
2. First request after spin-down takes 30-60s - be patient!
3. Check backend logs for startup errors
4. Verify DATABASE_URL is correct
5. Ensure Prisma migrations succeeded

### CORS Errors
**Symptoms:** "Access-Control-Allow-Origin" errors in browser console
**Solutions:**
1. Verify `CORS_ORIGIN` in backend matches frontend URL exactly
2. No trailing slash in CORS_ORIGIN
3. Restart backend after changing CORS_ORIGIN
4. Check frontend is making requests to correct backend URL

### Database Connection Failed
**Symptoms:** "Can't reach database server" in backend logs
**Solutions:**
1. Verify `DATABASE_URL` uses **Internal URL** (not External)
2. Check PostgreSQL service is "Available" in Render
3. Ensure backend and database are in same region
4. Review database connection string format

### Build Failed
**Symptoms:** Deployment fails during build
**Solutions:**
1. Check build logs for specific error
2. Verify Dockerfile syntax
3. Ensure all dependencies in package.json
4. Check Node.js version compatibility
5. Try building locally with Docker first

### Slow Performance / Cold Starts
**Symptoms:** First load takes 30-60 seconds
**Solutions:**
- This is **normal** for free tier!
- Services spin down after 15 minutes inactivity
- **Options:**
  1. Upgrade to paid plan ($7/month per service)
  2. Use a ping service (UptimeRobot free tier)
  3. Accept the delay and show loading message

---

## 🔒 Security Best Practices

### Before Production

- [ ] Generate strong `JWT_SECRET` (64+ characters)
- [ ] Set `CORS_ORIGIN` to specific domain (not `*`)
- [ ] Never commit `.env` files to git
- [ ] Enable 2FA on Render account
- [ ] Review database access permissions
- [ ] Set up database backups
- [ ] Implement rate limiting on API
- [ ] Use HTTPS only (Render provides free SSL)
- [ ] Regularly update dependencies
- [ ] Review and audit access logs

### Environment Variable Security
- Use Render's secret management (not in render.yaml for sensitive data)
- Rotate `JWT_SECRET` periodically
- Use different secrets for dev/staging/prod

---

## 🎯 Post-Deployment Checklist

After deployment is complete:

- [ ] Backend health check returns 200 OK
- [ ] Frontend loads without errors
- [ ] API calls from frontend work
- [ ] No CORS errors in browser console
- [ ] Database migrations completed successfully
- [ ] Create first admin user (if seed script didn't run)
- [ ] Test login functionality
- [ ] Test core features (users, branches, transactions)
- [ ] Set up monitoring/alerts
- [ ] Document service URLs for team

---

## 🔧 Advanced Configuration

### Custom Domains

**Add Custom Domain to Frontend:**
1. Service → Settings → Custom Domain
2. Add your domain (e.g., `app.yourdomain.com`)
3. Add CNAME record in your DNS provider:
   - Type: CNAME
   - Name: app
   - Value: turath-almandi-frontend.onrender.com
4. Wait for DNS propagation (~5-30 minutes)

**Add Custom Domain to Backend:**
1. Service → Settings → Custom Domain
2. Add your API domain (e.g., `api.yourdomain.com`)
3. Add CNAME record in DNS provider
4. Update frontend `VITE_API_URL` to use new domain
5. Update backend `CORS_ORIGIN` to frontend custom domain
6. Redeploy both services

### Database Backups

**Manual Backup:**
1. PostgreSQL service → "Backups" tab
2. Click "Create Backup"
3. Download backup file

**Scheduled Backups:**
- Free tier: Manual only
- Paid tier: Automatic daily backups

**Restore from Backup:**
1. Create new PostgreSQL service
2. Upload backup file
3. Update backend `DATABASE_URL`
4. Redeploy backend

### Monitoring & Observability

**Free Tools:**
- **Render Metrics**: Built-in CPU/Memory/Bandwidth
- **UptimeRobot**: Free uptime monitoring (50 monitors)
- **LogRocket**: Free tier for session replay

**Paid Tools:**
- **Sentry**: Error tracking ($26/month)
- **Datadog**: Full observability ($15/month)
- **New Relic**: APM ($25/month)

### Performance Optimization

**Enable Redis Caching:**
1. Add Redis service on Render (paid)
2. Install `@nestjs/cache-manager` in backend
3. Configure caching for expensive queries

**CDN for Static Assets:**
1. Use Cloudflare (free tier)
2. Point CDN to your frontend domain
3. Configure caching rules

**Database Query Optimization:**
1. Add indexes to frequently queried columns
2. Use Prisma query optimization
3. Implement pagination for large datasets
4. Use database connection pooling

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Vite Deployment](https://vitejs.dev/guide/static-deploy.html)
- [NestJS Production](https://docs.nestjs.com/deployment)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/production-best-practices)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Nginx Configuration](https://nginx.org/en/docs/)

---

## 🆘 Getting Help

### Check These First
1. Review this troubleshooting guide
2. Check service logs in Render Dashboard
3. Verify all environment variables are set
4. Ensure services are in same region
5. Wait 60 seconds if service just woke up

### Community Support
- [Render Community Forum](https://community.render.com)
- [Render Discord](https://render.com/discord)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/render.com)

### Contact Support
- Render: [help@render.com](mailto:help@render.com)
- Create ticket: Render Dashboard → Help → Submit Request

---

## 🎉 Deployment Complete!

Your application is now live:

- **Frontend**: `https://turath-almandi-frontend.onrender.com`
- **Backend**: `https://turath-almandi-backend.onrender.com`
- **Database**: Managed PostgreSQL on Render
- **Total Cost**: **$0/month** (Free Tier)

### Your URLs (Update After Deployment)
```
Frontend: https://<your-frontend-service>.onrender.com
Backend:  https://<your-backend-service>.onrender.com
```

**⚠️ First load may take 30-60 seconds (cold start - normal for free tier)**

---

**Happy Deploying! 🚀**

Need updates to this guide? Open an issue on GitHub!
