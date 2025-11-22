# Environment Variables Configuration

## 📋 Summary

**Frontend**: 1 runtime environment variable
**Backend**: 1 environment variable for CORS (removed duplication)

---

## 🎨 Frontend Environment Variables

### Runtime (Container Startup)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `VITE_API_URL` | ✅ Yes | `https://api.example.com/api/v1` | Full API URL with `/api/v1` suffix |

**How it works:**
1. Pass `VITE_API_URL` as a runtime environment variable
2. Docker entrypoint script injects it into `env-config.js`
3. Application reads from `window.ENV.VITE_API_URL`

**Local Development:**
```bash
# docker-compose automatically sets this
VITE_API_URL=http://localhost:3000/api/v1
```

**Production (Render.com):**
```bash
# Add in Service → Environment → Environment Variables
VITE_API_URL=https://turath-almandi-server.onrender.com/api/v1
```

**Manual Docker:**
```bash
docker run -p 80:80 \
  -e VITE_API_URL=https://your-backend.com/api/v1 \
  turath-frontend
```

### ❌ Removed Variables

- ~~`VITE_BACKEND_URL`~~ (build arg) - No longer needed
- Configuration is now fully runtime-based

---

## 🖥️ Backend Environment Variables

### Required

| Variable | Example | Notes |
|----------|---------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection string |
| `JWT_SECRET` | `random-32-chars-minimum` | Min 32 characters |
| `JWT_REFRESH_SECRET` | `another-random-32-chars` | Min 32 characters |
| `FRONTEND_URL` | `https://app.example.com` | Used for CORS |

### Optional (with defaults)

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `REDIS_URL` | (optional) | Redis connection string |
| `JWT_ACCESS_TOKEN_EXPIRATION` | `7d` | Access token TTL |
| `JWT_REFRESH_TOKEN_EXPIRATION` | `7` | Refresh token days |
| `JWT_REFRESH_TOKEN_EXPIRATION_REMEMBER_ME` | `30` | Remember me days |
| `BCRYPT_SALT_ROUNDS` | `10` | Password hashing rounds |
| `RATE_LIMIT_TTL` | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `RUN_SEED` | `true` | Seed database on first run |

### ❌ Removed Variables

- ~~`CORS_ORIGIN`~~ - Duplicated `FRONTEND_URL`, removed for simplicity

**Before:**
```bash
FRONTEND_URL=https://app.example.com
CORS_ORIGIN=https://app.example.com  # Duplicate!
```

**After:**
```bash
FRONTEND_URL=https://app.example.com  # Used for CORS automatically
```

---

## 🚀 Platform-Specific Setup

### Render.com

#### Frontend Service

**Environment Variables (Runtime):**
```
VITE_API_URL=https://turath-almandi-server.onrender.com/api/v1
```

#### Backend Service

**Environment Variables (Runtime):**
```
DATABASE_URL=<from PostgreSQL database>
REDIS_URL=<from Redis instance>
JWT_SECRET=<generate 32+ chars>
JWT_REFRESH_SECRET=<generate 32+ chars>
FRONTEND_URL=https://turath-almandi.onrender.com
NODE_ENV=production
```

### Docker Compose (Local)

Create `.env` file:
```bash
# Copy example
cp .env.docker.example .env

# Edit if needed (optional, has good defaults)
nano .env
```

Start services:
```bash
docker-compose up -d
```

Environment is automatically configured from `.env` file.

### Manual Docker

#### Build

```bash
# Frontend - no build args needed
docker build -t frontend ./frontend

# Backend
docker build -t backend ./backend
```

#### Run

```bash
# Frontend
docker run -p 80:80 \
  -e VITE_API_URL=https://api.domain.com/api/v1 \
  frontend

# Backend
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e JWT_SECRET=... \
  -e JWT_REFRESH_SECRET=... \
  -e FRONTEND_URL=https://app.domain.com \
  backend
```

---

## ✅ Validation

### Frontend Validation

The Docker entrypoint script validates `VITE_API_URL` on container startup:

```bash
$ docker run frontend
# Without VITE_API_URL:
ERROR: VITE_API_URL environment variable is required
Example: VITE_API_URL=https://your-backend-url.com/api/v1
```

Container **will not start** if validation fails.

### Backend Validation

NestJS validates required environment variables on startup. Missing variables will cause the application to exit with error messages.

### Runtime Validation

In the browser console:
```javascript
// Check configured API URL
console.log(window.ENV.VITE_API_URL)
// Should show: https://turath-almandi-server.onrender.com/api/v1
```

---

## 📊 Configuration Flow

### Frontend

```
┌─────────────────┐
│ Render.com      │
│ Environment Var │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Docker Container        │
│ VITE_API_URL=https://...│
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ docker-entrypoint.sh    │
│ Injects into            │
│ env-config.js           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ index.html              │
│ <script src=            │
│  "/env-config.js">      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ global-config.ts        │
│ window.ENV.VITE_API_URL │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Application Code        │
│ Uses GLOBAL_CONFIG      │
└─────────────────────────┘
```

### Backend

```
┌─────────────────┐
│ Render.com      │
│ Environment Vars│
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Docker Container        │
│ DATABASE_URL=...        │
│ FRONTEND_URL=...        │
│ JWT_SECRET=...          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ NestJS ConfigService    │
│ Reads process.env       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ main.ts                 │
│ CORS: FRONTEND_URL      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Application Services    │
│ Use ConfigService       │
└─────────────────────────┘
```

---

## 🔧 Migration from Old Configuration

### Old (Build Args)

Frontend required build arguments:
```bash
docker build --build-arg VITE_BACKEND_URL=https://api.com ./frontend
```

**Problem**: Need to rebuild image to change URL

### New (Runtime Env)

Frontend uses runtime environment:
```bash
docker run -e VITE_API_URL=https://api.com/api/v1 frontend
```

**Benefit**: Same image, different configurations - no rebuild needed

### Backend Duplication Removed

**Old:**
```bash
FRONTEND_URL=https://app.com
CORS_ORIGIN=https://app.com  # Same value!
```

**New:**
```bash
FRONTEND_URL=https://app.com  # Single source of truth
```

---

## 💡 Best Practices

1. **Use Full URLs**: Always include protocol (`https://`)
2. **No Trailing Slashes**: URLs should not end with `/`
3. **Environment-Specific**: Use different values for dev/staging/prod
4. **Secrets**: Generate strong random strings for JWT secrets (32+ chars)
5. **Validation**: Let containers fail fast if configuration is wrong

### Generate Secure Secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 48

# Generate JWT_REFRESH_SECRET
openssl rand -base64 48
```

---

## ❓ FAQ

**Q: Why runtime env vars instead of build args?**
A: Build once, deploy many times with different configs. No rebuild needed.

**Q: Why remove CORS_ORIGIN?**
A: It was always the same as FRONTEND_URL. DRY principle - don't repeat yourself.

**Q: How does env-config.js work?**
A: Docker entrypoint creates it at startup with runtime env vars injected.

**Q: Can I still use build-time env vars in dev?**
A: Yes! Vite's `import.meta.env.VITE_API_URL` still works for local dev.

**Q: What if VITE_API_URL is not set?**
A: Container fails to start immediately with clear error message.
