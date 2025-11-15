# 🚀 Deployment Guide - Turath Almandi Restaurant Accounting System

This guide will help you deploy your fullstack application using **GitHub Pages (Frontend)** and **Render (Backend + Database)**.

## 📋 Prerequisites

- GitHub account
- Render account (sign up at [render.com](https://render.com))
- Git installed locally

---

## 🎯 Deployment Architecture

```
┌─────────────────┐      HTTPS      ┌──────────────────┐
│  GitHub Pages   │ ────────────────▶│  Render Backend  │
│   (Frontend)    │                  │   (NestJS API)   │
└─────────────────┘                  └────────┬─────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  PostgreSQL DB  │
                                     │    (Render)     │
                                     └─────────────────┘
```

---

## 🔧 Part 1: Deploy Backend to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started" and sign up with GitHub
3. Authorize Render to access your repositories

### Step 2: Create PostgreSQL Database
1. From Render Dashboard, click "New +"
2. Select "PostgreSQL"
3. Fill in the details:
   - **Name**: `turath-almandi-db`
   - **Database**: `turath_almandi`
   - **User**: `turath_user`
   - **Region**: Choose closest to you
   - **Plan**: Free
4. Click "Create Database"
5. Once created, go to "Info" tab and copy the **Internal Database URL**

### Step 3: Deploy Backend Service
1. From Render Dashboard, click "New +" → "Web Service"
2. Connect your `turath_almandi` repository
3. Configure the service:

**Basic Settings:**
- **Name**: `turath-almandi-backend`
- **Region**: Same as database
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Docker
- **Plan**: Free

**Build & Deploy:**
- **Dockerfile Path**: `./Dockerfile`
- **Docker Command**: Leave empty (uses Dockerfile CMD)

4. Click "Advanced" to add environment variables

### Step 4: Configure Environment Variables

Click "Add Environment Variable" and add these one by one:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste-internal-database-url-from-step-2>
JWT_SECRET=<generate-random-strong-secret>
JWT_EXPIRATION=7d
CORS_ORIGIN=https://YOUR-GITHUB-USERNAME.github.io
```

**Important:**
- Replace `<paste-internal-database-url-from-step-2>` with the Internal Database URL you copied
- Replace `<generate-random-strong-secret>` with a strong random string (use a password generator)
- Replace `YOUR-GITHUB-USERNAME` with your actual GitHub username

**To generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will start building and deploying (takes 3-5 minutes)
3. Wait for "Live" status
4. Copy your service URL (e.g., `https://turath-almandi-backend.onrender.com`)

### Step 6: Verify Deployment
1. Click on "Logs" tab to monitor deployment
2. Verify Prisma migrations ran successfully
3. Test the API endpoint:
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

---

## 🌐 Part 2: Deploy Frontend to GitHub Pages

### Step 1: Enable GitHub Pages
1. Go to your GitHub repository: `https://github.com/YOUR-USERNAME/turath_almandi`
2. Click "Settings" tab
3. Scroll down to "Pages" in the left sidebar
4. Under "Source", select "GitHub Actions"

### Step 2: Add Backend URL as GitHub Secret
1. In your repository, go to "Settings" → "Secrets and variables" → "Actions"
2. Click "New repository secret"
3. Name: `VITE_API_URL`
4. Value: `https://turath-almandi-backend.onrender.com/api/v1`
   - Replace with your actual Render backend URL from Part 1, Step 5
5. Click "Add secret"

### Step 3: Trigger Deployment
The deployment workflow is already configured! Just push to main:

```bash
git add .
git commit -m "feat: add deployment configuration for Render"
git push origin main
```

### Step 4: Monitor Deployment
1. Go to your repository on GitHub
2. Click "Actions" tab
3. You should see "Deploy Frontend to GitHub Pages" workflow running
4. Wait for it to complete (usually 2-3 minutes)

### Step 5: Access Your Application
Once deployment completes:
- **Frontend URL**: `https://YOUR-GITHUB-USERNAME.github.io/turath_almandi/`
- **Backend URL**: `https://turath-almandi-backend.onrender.com`

---

## 🔐 Part 3: Update CORS Settings

After deploying frontend, verify your Render backend CORS:

1. Go to Render Dashboard → Your Backend Service → Environment
2. Verify `CORS_ORIGIN` is set to:
```
https://YOUR-GITHUB-USERNAME.github.io
```
3. If you changed it, save and it will auto-redeploy

---

## 🧪 Testing Your Deployment

### 1. Test Backend API
```bash
# Health check
curl https://turath-almandi-backend.onrender.com/api/v1/health

# Test API endpoint (should return 401 unauthorized)
curl https://turath-almandi-backend.onrender.com/api/v1/users
```

### 2. Test Frontend
1. Open your GitHub Pages URL
2. Try to login with seeded credentials (if you ran seed script)
3. Open browser DevTools → Network tab
4. Verify API calls are going to your Render backend

### 3. Test CORS
1. Open frontend in browser
2. Open DevTools → Console
3. Look for CORS errors (should be none)

---

## 📊 Monitoring & Logs

### Render Logs
- **Live Logs**: Dashboard → Your Service → Logs
- **Events**: Dashboard → Your Service → Events (deployment history)
- **Metrics**: Dashboard → Your Service → Metrics (CPU, memory, bandwidth)

### GitHub Actions Logs
- Go to Repository → Actions → Select workflow run
- Check build and deployment logs

---

## 💰 Cost Estimation

### GitHub Pages
- **100% FREE** ✅
- 100GB bandwidth/month
- 1GB storage

### Render Free Tier
- **100% FREE** for starters ✅
- 750 hours/month free (enough for one service)
- PostgreSQL: Free tier available
- **Note**: Free services spin down after 15 minutes of inactivity
  - First request after inactivity takes ~30-60 seconds to wake up
  - Upgrade to paid ($7/month) for always-on service

**Total: 100% FREE for both!** 🎉

---

## ⚡ Important: Free Tier Limitations

### Render Free Tier Behavior
Your free backend service will:
- ✅ Run 24/7 for active users
- ⚠️ Spin down after 15 minutes of inactivity
- ⏰ Take 30-60 seconds to wake up on first request
- ♻️ Automatically restart after wake-up request

**How to handle spin-down:**
1. Show loading spinner on frontend
2. Add timeout to API calls (90 seconds)
3. Display "Server waking up..." message
4. Consider upgrading to paid plan ($7/month) for production

---

## 🔄 Automatic Deployments

### Frontend (GitHub Pages)
- ✅ Automatically deploys when you push to `main` branch
- ✅ Only triggers if files in `frontend/` directory change
- ✅ View status in GitHub Actions tab

### Backend (Render)
- ✅ Automatically deploys when you push to `main` branch
- ✅ Render watches your GitHub repository
- ✅ View deployment status in Render Dashboard

**To disable auto-deploy:**
- Render: Service Settings → Build & Deploy → Disable "Auto-Deploy"
- GitHub: Remove or disable the workflow file

---

## 🐛 Troubleshooting

### Frontend Not Loading
1. ✓ Check GitHub Actions logs for build errors
2. ✓ Verify `VITE_API_URL` secret is set correctly
3. ✓ Check browser console (F12) for errors
4. ✓ Verify GitHub Pages is enabled in repo settings

### Backend API Errors (500 Internal Server Error)
1. ✓ Check Render logs for detailed errors
2. ✓ Verify all environment variables are set correctly
3. ✓ Ensure `DATABASE_URL` is the **Internal** URL (not external)
4. ✓ Check database connection in Render logs

### Slow First Load (Cold Start)
- This is normal for Render free tier
- Backend spins down after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- **Solution**: Upgrade to paid plan or implement a ping service

### CORS Errors
1. ✓ Update `CORS_ORIGIN` in Render to match GitHub Pages URL exactly
2. ✓ Ensure no trailing slash in URL
3. ✓ Verify frontend is making requests to correct backend URL
4. ✓ Check browser console for specific CORS error message

### Database Connection Issues
1. ✓ Verify `DATABASE_URL` is the Internal URL (starts with `postgresql://`)
2. ✓ Check PostgreSQL service status in Render Dashboard
3. ✓ Review migration logs in backend service logs
4. ✓ Ensure Prisma migrations ran successfully

### Deployment Failed
1. ✓ Check Render build logs for specific error
2. ✓ Verify Dockerfile syntax is correct
3. ✓ Ensure all dependencies are in package.json
4. ✓ Check that backend/Dockerfile exists

---

## 🔒 Security Checklist

Before going to production:

- [ ] Generate strong `JWT_SECRET` (64+ characters random string)
- [ ] Set `CORS_ORIGIN` to your specific domain (not `*`)
- [ ] Never commit `.env` files to git
- [ ] Use GitHub Secrets for all sensitive frontend variables
- [ ] Enable 2FA on Render account
- [ ] Review database access permissions
- [ ] Set up database backups
- [ ] Implement rate limiting on API endpoints
- [ ] Use environment-specific configuration
- [ ] Review and update all default passwords

---

## 📝 Environment Variables Reference

### Backend (Render)
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-random-string-64-chars-minimum
JWT_EXPIRATION=7d
CORS_ORIGIN=https://your-username.github.io
```

### Frontend (GitHub Secrets)
```env
VITE_API_URL=https://turath-almandi-backend.onrender.com/api/v1
```

---

## 🎓 Next Steps

### 1. Custom Domain (Optional)
**GitHub Pages:**
- Settings → Pages → Custom domain
- Add CNAME record in your DNS provider

**Render:**
- Service → Settings → Custom Domain
- Add CNAME or A record as instructed

### 2. Database Backups
- Render free tier: Manual backups
- Paid tier: Automatic daily backups
- Recommended: Set up manual backup schedule

### 3. Monitoring & Alerts
**Free Options:**
- Render built-in metrics
- UptimeRobot (free uptime monitoring)
- LogRocket (free tier for error tracking)

**Paid Options:**
- Sentry (error tracking)
- Datadog (comprehensive monitoring)
- New Relic (application performance)

### 4. CI/CD Enhancements
- Add automated tests before deployment
- Set up staging environment
- Implement preview deployments for PRs
- Add code quality checks (SonarQube)

### 5. Performance Optimization
- Implement Redis caching
- Add CDN for static assets
- Optimize database queries
- Implement lazy loading on frontend

---

## 🔧 Alternative Deployment Options

If Render doesn't meet your needs:

| Service | Free Tier | Pros | Cons |
|---------|-----------|------|------|
| **Railway** | $5 credit/month | Easy setup, great DX | Credit-based |
| **Fly.io** | 3 VMs free | Global edge network | Complex setup |
| **Vercel** | Generous free tier | Best for frontend | Serverless only |
| **Heroku** | Limited free tier | Simple, mature | Limited free tier |

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization/production-best-practices)

---

## 🆘 Need Help?

### Step-by-Step Debugging

**1. Backend not accessible:**
```bash
# Check if service is up
curl -I https://turath-almandi-backend.onrender.com

# Check health endpoint
curl https://turath-almandi-backend.onrender.com/api/v1/health
```

**2. Frontend can't reach backend:**
- Open browser DevTools → Network tab
- Try to login or make any API call
- Check the request URL (should match your Render URL)
- Check response status code and error message

**3. Database issues:**
- Go to Render → PostgreSQL service → Logs
- Look for connection errors
- Verify DATABASE_URL format is correct

### Getting Support
- [Render Community Forum](https://community.render.com)
- [Render Discord](https://render.com/discord)
- [GitHub Issues](https://github.com/YOUR-USERNAME/turath_almandi/issues)

---

## 🎉 Deployment Complete!

Your application is now live and accessible:
- **Frontend**: https://YOUR-GITHUB-USERNAME.github.io/turath_almandi/
- **Backend**: https://turath-almandi-backend.onrender.com
- **Total Cost**: $0 (100% FREE!)

**Next login will take 30-60 seconds if backend is sleeping. This is normal for free tier.**

Happy deploying! 🚀
