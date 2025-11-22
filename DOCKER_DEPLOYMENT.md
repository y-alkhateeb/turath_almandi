# Docker Deployment Guide

This application is fully containerized and can be deployed using Docker without any platform-specific configuration files.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

## Environment Variables

### Required Build Arguments

**Frontend:**
- `VITE_BACKEND_URL` - Backend server URL (without /api/v1 suffix)

### Required Runtime Environment Variables

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `JWT_REFRESH_SECRET` - Refresh token secret (min 32 characters)
- `FRONTEND_URL` - Frontend URL for CORS
- `CORS_ORIGIN` - CORS allowed origin

**Optional Environment Variables:**
See `.env.docker.example` for all available options with defaults.

## Local Development with Docker Compose

### 1. Setup Environment

```bash
# Copy example environment file
cp .env.docker.example .env

# Edit .env with your values (optional, has sensible defaults)
nano .env
```

### 2. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### 3. Access Application

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000/api/v1
- **API Health Check**: http://localhost:3000/api/v1/health

### Default Login Credentials

After seeding (first run):
- **Admin**: `admin` / `Admin123!@#`
- **Accountant 1**: `accountant1` / `Accountant123`
- **Accountant 2**: `accountant2` / `Accountant123`

## Production Deployment

### Manual Docker Deployment

#### 1. Build Images

```bash
# Build backend
docker build \
  -t turath-backend:latest \
  ./backend

# Build frontend (must provide backend URL)
docker build \
  --build-arg VITE_BACKEND_URL=https://your-backend-domain.com \
  -t turath-frontend:latest \
  ./frontend
```

#### 2. Run Containers

```bash
# Create network
docker network create turath-network

# Run PostgreSQL
docker run -d \
  --name turath-db \
  --network turath-network \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_secure_password \
  -e POSTGRES_DB=turath_almandi \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Run Redis
docker run -d \
  --name turath-redis \
  --network turath-network \
  -v redis_data:/data \
  redis:7-alpine

# Run Backend
docker run -d \
  --name turath-backend \
  --network turath-network \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://postgres:your_secure_password@turath-db:5432/turath_almandi \
  -e REDIS_URL=redis://turath-redis:6379 \
  -e JWT_SECRET=your-super-secret-jwt-key-min-32-characters \
  -e JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32 \
  -e FRONTEND_URL=https://your-frontend-domain.com \
  -e CORS_ORIGIN=https://your-frontend-domain.com \
  turath-backend:latest

# Run Frontend
docker run -d \
  --name turath-frontend \
  --network turath-network \
  -p 80:80 \
  turath-frontend:latest
```

### Deploy to Any Platform

This application can be deployed to any platform that supports Docker:

#### Render.com

1. Create PostgreSQL database
2. Create Redis instance
3. Create Web Service for backend:
   - Docker runtime
   - Point to `./backend/Dockerfile`
   - Add environment variables
4. Create Web Service for frontend:
   - Docker runtime
   - Point to `./frontend/Dockerfile`
   - Add build arg: `VITE_BACKEND_URL`

#### Railway.app

1. Add PostgreSQL plugin
2. Add Redis plugin
3. Add backend service (auto-detects Dockerfile)
4. Add frontend service with build args
5. Set environment variables

#### DigitalOcean App Platform

1. Create app from GitHub repo
2. Configure backend component:
   - Dockerfile path: `backend/Dockerfile`
   - Add environment variables
3. Configure frontend component:
   - Dockerfile path: `frontend/Dockerfile`
   - Build args: `VITE_BACKEND_URL`
4. Add PostgreSQL and Redis addons

#### AWS ECS/Fargate

1. Build and push images to ECR
2. Create task definitions
3. Configure environment variables
4. Deploy services

#### Google Cloud Run

```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/turath-backend ./backend
gcloud builds submit \
  --substitutions=_VITE_BACKEND_URL=https://backend-url.run.app \
  --tag gcr.io/PROJECT-ID/turath-frontend ./frontend

# Deploy
gcloud run deploy turath-backend --image gcr.io/PROJECT-ID/turath-backend
gcloud run deploy turath-frontend --image gcr.io/PROJECT-ID/turath-frontend
```

## Health Checks

Both services include health checks:

**Backend**: `GET /api/v1/health`
**Frontend**: `GET /` (served by nginx)

## Troubleshooting

### Frontend Build Fails

**Error**: `VITE_BACKEND_URL build argument is required`

**Solution**: Provide the build argument:
```bash
docker build --build-arg VITE_BACKEND_URL=https://your-backend.com ./frontend
```

### Backend Database Connection Fails

**Error**: `Can't reach database server`

**Solution**: Ensure DATABASE_URL is correct and database is accessible:
```bash
docker-compose logs db
```

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: Ensure FRONTEND_URL and CORS_ORIGIN match your frontend domain:
```bash
# Backend environment
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGIN=https://your-frontend-domain.com
```

## Scaling

### Horizontal Scaling

Both frontend and backend are stateless and can be scaled horizontally:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Use a load balancer (nginx, HAProxy, etc.)
```

### Database Scaling

- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Enable connection pooling (already configured in DATABASE_URL)
- Consider read replicas for read-heavy workloads

### Redis Scaling

- Use managed Redis (AWS ElastiCache, Redis Cloud, etc.)
- Enable persistence for important data
- Consider Redis Cluster for high availability

## Security Considerations

1. **Secrets Management**:
   - Never commit `.env` files
   - Use secrets managers (AWS Secrets Manager, HashiCorp Vault)
   - Rotate JWT secrets regularly

2. **Network Security**:
   - Use HTTPS in production (configure reverse proxy)
   - Restrict database/Redis access to backend only
   - Use private networks when possible

3. **Container Security**:
   - Run as non-root user (already configured)
   - Keep base images updated
   - Scan images for vulnerabilities

## Monitoring

### Application Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Metrics

Use health check endpoints for monitoring:
- Backend: `http://your-backend:3000/api/v1/health`
- Frontend: `http://your-frontend/`

## Backup and Recovery

### Database Backup

```bash
# Backup
docker-compose exec db pg_dump -U postgres turath_almandi > backup.sql

# Restore
docker-compose exec -T db psql -U postgres turath_almandi < backup.sql
```

### Redis Backup

```bash
# Trigger save
docker-compose exec redis redis-cli SAVE

# Copy RDB file
docker cp turath-redis:/data/dump.rdb ./redis-backup.rdb
```
