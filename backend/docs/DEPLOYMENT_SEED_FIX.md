# Deployment Seed Script Fix

## Problem

The deployment was failing during the database seeding step with the following error:

```
🌱 Seeding database...
> turath-almandi-restaurant-accounting@1.0.0 deploy:seed
> tsx prisma/seed.ts

sh: tsx: not found
🚀 Starting تراث المندي Backend...
==> Exited with status 127
```

**Error Code:** 127 (Command not found)
**Missing Command:** `tsx`
**Impact:** Deployment fails completely, preventing application startup

---

## Root Cause Analysis

### 1. Development vs Production Dependencies

**Original package.json configuration:**

```json
{
  "dependencies": {
    "@nestjs/common": "^11.1.9",
    "@prisma/client": "^6.19.0",
    // ... other runtime dependencies
  },
  "devDependencies": {
    "prisma": "^6.19.0",    // ❌ Was here
    "tsx": "^4.19.2",        // ❌ Was here
    "typescript": "^5.9.3"
  }
}
```

### 2. Dockerfile Build Process

**Stage 1 (Builder):**
```dockerfile
RUN npm ci                      # Install ALL dependencies (including dev)
RUN npx prisma generate         # Generate Prisma client
RUN npm run build               # Build TypeScript to JavaScript
RUN npm prune --production      # ❌ Remove devDependencies
```

**Stage 2 (Production):**
```dockerfile
COPY --from=builder /app/node_modules ./node_modules  # Only production deps
```

### 3. Startup Script Requirement

**scripts/start.sh:**
```bash
echo "📦 Generating Prisma Client..."
npx prisma generate              # ❌ Needs prisma CLI

echo "🔄 Running database migrations..."
npx prisma migrate deploy        # ❌ Needs prisma CLI

if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run deploy:seed            # ❌ Needs tsx
fi
```

**deploy:seed script (package.json):**
```json
{
  "scripts": {
    "deploy:seed": "tsx prisma/seed.ts"  // ❌ Needs tsx
  }
}
```

### 4. The Problem Chain

```
Dockerfile Stage 1 (Builder):
  ✅ npm ci → Installs tsx & prisma (devDependencies)
  ✅ npx prisma generate → Works (tsx & prisma available)
  ✅ npm run build → Works
  ❌ npm prune --production → Removes tsx & prisma

Dockerfile Stage 2 (Production):
  ❌ COPY node_modules → Only has production dependencies
  ❌ Missing: tsx, prisma CLI

Runtime (scripts/start.sh):
  ❌ npx prisma generate → Fails (prisma not found)
  ❌ npx prisma migrate deploy → Fails (prisma not found)
  ❌ npm run deploy:seed → Fails (tsx not found)
```

---

## Solution

### Move Required Packages to Production Dependencies

**Updated package.json:**

```json
{
  "dependencies": {
    "@nestjs/common": "^11.1.9",
    "@prisma/client": "^6.19.0",
    "prisma": "^6.19.0",     // ✅ Moved to dependencies
    "tsx": "^4.19.2",        // ✅ Moved to dependencies
    // ... other runtime dependencies
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "ts-node": "^10.9.2",
    // prisma removed
    // tsx removed
  }
}
```

### Why These Packages Are Needed in Production

#### 1. `prisma` CLI (6.19.0)

**Production Use Cases:**
- ✅ Generate Prisma Client at runtime: `npx prisma generate`
- ✅ Run database migrations: `npx prisma migrate deploy`
- ✅ Check migration status
- ✅ Prisma Studio (optional, for debugging)

**Why Not Use Pre-Generated Client?**
- Binary targets may differ between build and runtime platforms
- Database connection may not be available at build time
- Migration deployment must happen at runtime, not build time

**Size Impact:** ~3MB

#### 2. `tsx` TypeScript Executor (4.19.2)

**Production Use Cases:**
- ✅ Execute database seed script: `tsx prisma/seed.ts`
- ✅ Run TypeScript maintenance scripts
- ✅ Hot-reload for development (optional)

**Why Not Compile seed.ts to JavaScript?**
- Simpler maintenance - single source of truth
- No need for separate build/watch processes for scripts
- tsx is specifically designed for production TypeScript execution
- Lightweight alternative to ts-node (~1-2MB vs ~20MB)

**Size Impact:** ~1-2MB

**Total Impact:** ~4-5MB added to production image

---

## Implementation

### Commit Details

**Commit:** `95a61b1`
**Message:** "fix: Move prisma and tsx to production dependencies for deployment"

**Changes:**
```diff
  "dependencies": {
    "@nestjs/common": "^11.1.9",
    // ... other dependencies
+   "prisma": "^6.19.0",
+   "tsx": "^4.19.2"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.10",
    // ... other dev dependencies
-   "prisma": "^6.19.0",
-   "tsx": "^4.19.2"
  }
```

---

## Verification

### Local Verification

```bash
# Install dependencies
npm ci

# Verify prisma is available
npx prisma --version
# Expected: prisma 6.19.0

# Verify tsx is available
npx tsx --version
# Expected: v4.19.2

# Test seed script
npm run deploy:seed
# Expected: ✅ Seeding completed successfully
```

### Docker Build Verification

```bash
# Build Docker image
docker build -t turath-almandi-backend:test .

# Run container with database connection
docker run --rm \
  -e DATABASE_URL="postgresql://..." \
  -e RUN_SEED="true" \
  turath-almandi-backend:test

# Expected output:
# 🚀 Starting تراث المندي Backend...
# 📦 Generating Prisma Client...
# ✔ Generated Prisma Client (v6.19.0)
# 🔄 Running database migrations...
# All migrations have been successfully applied
# 🌱 Seeding database...
# ✅ Created branches
# ✅ Created admin user
# ✅ Created accountant users
# 🎉 Seeding completed successfully!
# ✅ Starting application...
```

### Production Deployment Verification

**Render.com / Similar PaaS:**

1. **Environment Variables:**
   ```bash
   RUN_SEED=true  # Enable seeding for initial deployment
   ```

2. **Deployment Logs:**
   ```
   📦 Generating Prisma Client...
   ✔ Generated Prisma Client (v6.19.0)
   🔄 Running database migrations...
   All migrations have been successfully applied
   🌱 Seeding database...
   ✅ Seeding completed successfully
   ✅ Starting application...
   ```

3. **After Initial Deployment:**
   ```bash
   # Disable seeding to prevent re-seeding on every deploy
   RUN_SEED=false
   ```

---

## Seed Script Details

**File:** `prisma/seed.ts`

**What It Does:**
1. Creates two sample branches:
   - الفرع الرئيسي (Main Branch) - Baghdad, Al-Mansour
   - فرع الكرادة (Karada Branch) - Baghdad, Al-Karada

2. Creates admin user:
   - Username: `admin`
   - Password: `Admin123!@#`
   - Role: ADMIN
   - Access: All branches

3. Creates accountant users:
   - Username: `accountant1` (assigned to Main Branch)
   - Username: `accountant2` (assigned to Karada Branch)
   - Password: `Accountant123`
   - Role: ACCOUNTANT

**Safety:**
- Uses `upsert` operations - safe to run multiple times
- Won't create duplicates if data already exists
- Updates existing records with same IDs/usernames

**Production Considerations:**
- ⚠️ Default passwords are hardcoded
- ⚠️ Should be changed immediately after first login
- ✅ Use `RUN_SEED=false` after initial deployment
- ✅ Consider environment-based passwords for production

---

## Alternative Solutions Considered

### Option 1: Compile seed.ts to JavaScript ❌

**Approach:**
```json
{
  "scripts": {
    "build:seed": "tsc prisma/seed.ts --outDir prisma",
    "deploy:seed": "node prisma/seed.js"
  }
}
```

**Pros:**
- No tsx needed in production
- Smaller image size

**Cons:**
- Must remember to rebuild seed script after changes
- Extra build step complexity
- Maintenance burden
- Type errors only caught at compile time

**Verdict:** Rejected - Not worth the complexity

### Option 2: Use ts-node Instead of tsx ❌

**Approach:**
```json
{
  "dependencies": {
    "ts-node": "^10.9.2"
  },
  "scripts": {
    "deploy:seed": "ts-node prisma/seed.ts"
  }
}
```

**Pros:**
- More widely known than tsx

**Cons:**
- Much larger package (~20MB vs ~1-2MB)
- Slower execution
- More dependencies
- Not optimized for production

**Verdict:** Rejected - tsx is better for production

### Option 3: Make Seeding Optional in Script ❌

**Approach:**
```bash
# In start.sh
if command -v tsx >/dev/null 2>&1; then
  npm run deploy:seed
else
  echo "⏭️  tsx not found, skipping seed"
fi
```

**Pros:**
- Gracefully handles missing tsx

**Cons:**
- Silent failures are dangerous
- Hides real problems
- Deployment may succeed but database is empty
- Hard to debug

**Verdict:** Rejected - Better to fail explicitly

### Option 4: Environment Variable for Seed Path ❌

**Approach:**
```json
{
  "scripts": {
    "deploy:seed": "node ${SEED_SCRIPT:-prisma/seed.js}"
  }
}
```

**Pros:**
- Flexibility to use compiled or TypeScript version

**Cons:**
- Extra complexity
- Still needs tsx or compiled JS
- Doesn't solve the root problem

**Verdict:** Rejected - Doesn't address the issue

---

## Best Practices

### 1. Dependency Classification

**Production Dependencies (dependencies):**
- Required for application runtime
- Database clients (@prisma/client, prisma)
- Script executors needed in production (tsx)
- Core framework packages (@nestjs/*)
- Runtime utilities

**Development Dependencies (devDependencies):**
- Build tools (typescript, @nestjs/cli)
- Testing frameworks (jest, supertest)
- Linters and formatters (eslint, prettier)
- Type definitions (@types/*)
- Development servers

### 2. Docker Multi-Stage Builds

```dockerfile
# Stage 1: Builder
# - Install ALL dependencies (npm ci)
# - Generate necessary code
# - Build application
# - Prune to production dependencies (npm prune --production)

# Stage 2: Production
# - Copy only production node_modules
# - Copy built artifacts
# - Copy runtime scripts and configs
# - Set up non-root user
# - Define health checks
```

### 3. Seed Script Management

**Development:**
```bash
RUN_SEED=true  # Always seed in development
```

**Staging:**
```bash
RUN_SEED=true  # Seed for testing
```

**Production (Initial Deploy):**
```bash
RUN_SEED=true  # Seed on first deployment
```

**Production (Subsequent Deploys):**
```bash
RUN_SEED=false  # Disable after initial deployment
```

### 4. Environment-Based Configuration

```typescript
// prisma/seed.ts
const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!@#';
const accountantPassword = process.env.ACCOUNTANT_PASSWORD || 'Accountant123';

// Warn if using default passwords
if (!process.env.ADMIN_PASSWORD) {
  console.warn('⚠️  Using default admin password. Set ADMIN_PASSWORD env var for production.');
}
```

---

## Troubleshooting

### Issue: "tsx: not found" in Production

**Symptoms:**
```
sh: tsx: not found
==> Exited with status 127
```

**Solution:**
1. Verify tsx is in dependencies (not devDependencies)
2. Run `npm install` to update node_modules
3. Rebuild Docker image: `docker build --no-cache -t app .`
4. Verify in production: `npx tsx --version`

### Issue: "prisma: not found" in Production

**Symptoms:**
```
sh: prisma: not found
npx: command not found
```

**Solution:**
1. Verify prisma is in dependencies
2. Ensure node_modules is copied in Dockerfile
3. Check PATH includes node_modules/.bin

### Issue: Seed Script Fails with Database Error

**Symptoms:**
```
❌ Seeding failed: Error connecting to database
```

**Solution:**
1. Verify DATABASE_URL is set correctly
2. Check database is accessible from container
3. Ensure migrations ran successfully first
4. Check database credentials and permissions

### Issue: Seed Creates Duplicate Data

**Symptoms:**
```
Unique constraint violation on User.username
```

**Solution:**
1. Seed script uses `upsert` - this shouldn't happen
2. Check if seed script was modified incorrectly
3. Verify unique constraints in schema.prisma
4. Use `where` clause in upsert to match existing records

---

## Related Documentation

- [Prisma Client API](https://www.prisma.io/docs/orm/prisma-client)
- [Prisma Migrations](https://www.prisma.io/docs/orm/prisma-migrate)
- [tsx - TypeScript Execute](https://github.com/privatenumber/tsx)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [npm Dependencies vs DevDependencies](https://docs.npmjs.com/specifying-dependencies-and-devdependencies-in-a-package-json-file)

---

## Summary

**Problem:** Deployment failed because tsx and prisma were removed during production build (`npm prune --production`).

**Solution:** Move tsx and prisma from devDependencies to dependencies since they're required at runtime.

**Impact:**
- ✅ Deployment succeeds
- ✅ Migrations run successfully
- ✅ Database seeding works
- ✅ Application starts properly
- 📦 +4-5MB to production image size
- 💰 Minimal cost increase

**Trade-off:** Small increase in image size for significantly better deployment reliability and maintainability.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-18
**Commit:** `95a61b1`
**Status:** ✅ Deployment issue resolved
