# Quick Start Guide

## ✅ What Changed

- **Removed** platform-specific `render.yaml`
- **Pure Docker** deployment - works anywhere
- **No hardcoded URLs** - all from environment variables
- **Fail-fast validation** - errors shown immediately

## 🚀 Local Development (Easiest)

```bash
# 1. Start everything with docker-compose
docker-compose up -d

# 2. Access the application
# Frontend: http://localhost
# Backend:  http://localhost:3000/api/v1
# Health:   http://localhost:3000/api/v1/health

# 3. Login with default credentials
# Username: admin
# Password: Admin123!@#
```

That's it! The compose file handles:
- PostgreSQL database
- Redis cache
- Backend API
- Frontend web app
- All networking and dependencies

## 🔧 Manual Docker Build

### Frontend

```bash
# Build (MUST provide backend URL)
docker build \
  --build-arg VITE_BACKEND_URL=https://your-backend-url.com \
  -t turath-frontend \
  ./frontend

# Run
docker run -p 80:80 turath-frontend
```

**Important**: Frontend will fail if `VITE_BACKEND_URL` is not provided (fail-fast).

### Backend

```bash
# Build
docker build -t turath-backend ./backend

# Run (provide environment variables)
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET=your-secret-min-32-chars \
  -e FRONTEND_URL=https://your-frontend.com \
  -e CORS_ORIGIN=https://your-frontend.com \
  turath-backend
```

## 🌐 Deploy to Any Platform

### Render.com

1. **Create Services** (no render.yaml needed):
   - Add PostgreSQL database
   - Add Redis instance
   - Add Web Service for backend (Docker)
   - Add Web Service for frontend (Docker)

2. **Configure Frontend**:
   - Docker Build Command: `docker build --build-arg VITE_BACKEND_URL=$BACKEND_URL -t frontend .`
   - Or set in Dashboard: Build Arguments → `VITE_BACKEND_URL=https://your-backend.onrender.com`

3. **Configure Backend**:
   - Add environment variables in Dashboard

### Railway.app

1. Add PostgreSQL plugin
2. Add Redis plugin
3. Deploy backend service
4. Deploy frontend service with build arg: `VITE_BACKEND_URL`

### AWS/GCP/Azure

Build and push images to container registry, then deploy with environment variables.

## 📝 Environment Variables

### Frontend (Build Time)

| Variable | Required | Example |
|----------|----------|---------|
| `VITE_BACKEND_URL` | ✅ Yes | `https://api.example.com` |

**Note**: The Dockerfile automatically appends `/api/v1` to this URL.

### Backend (Runtime)

| Variable | Required | Default |
|----------|----------|---------|
| `DATABASE_URL` | ✅ Yes | - |
| `JWT_SECRET` | ✅ Yes | - |
| `JWT_REFRESH_SECRET` | ✅ Yes | - |
| `FRONTEND_URL` | ✅ Yes | - |
| `CORS_ORIGIN` | ✅ Yes | - |
| `REDIS_URL` | ❌ No | In-memory fallback |
| `PORT` | ❌ No | `3000` |
| `NODE_ENV` | ❌ No | `production` |

See `.env.docker.example` for all options.

## 🔍 Validation

### Frontend Build Validation

If you forget to provide `VITE_BACKEND_URL`:

```
ERROR: VITE_BACKEND_URL build argument is required
Usage: docker build --build-arg VITE_BACKEND_URL=https://your-backend-url.com .
```

Build will **fail immediately** (not at runtime).

### Backend Runtime Validation

The backend validates required environment variables on startup and will exit with error messages if missing.

### Application Runtime Validation

In production, if `VITE_API_URL` is not set, the frontend will throw:
```
Error: VITE_API_URL environment variable is not set.
Please configure the backend URL in your deployment settings.
```

## 📊 Health Checks

Both services include health checks:

```bash
# Backend health check
curl http://localhost:3000/api/v1/health

# Frontend health check (nginx status)
curl http://localhost/
```

## 🎯 Key Benefits

✅ **Platform Agnostic** - Deploy anywhere that supports Docker
✅ **No Hardcoded URLs** - All configuration via environment
✅ **Fail-Fast** - Errors caught at build/startup, not runtime
✅ **Standard Docker** - No proprietary deployment files
✅ **Easy Local Dev** - Single `docker-compose up` command
✅ **Production Ready** - Multi-stage builds, health checks, non-root users

## 📚 Full Documentation

See [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) for:
- Detailed deployment instructions
- All platform examples
- Troubleshooting guide
- Scaling strategies
- Security best practices
- Backup and recovery
