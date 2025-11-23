# ============================================
# Multi-Stage Build for NestJS Application
# Node 22 Alpine, Production-Only Dependencies, Non-Root User
# ============================================

# ============================================
# Stage 1: Builder - Install dependencies and build
# ============================================
FROM node:22-alpine AS builder

# Install build dependencies for native modules (bcrypt, etc.)
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install ALL dependencies (needed for build)
# Prisma will download engines during this step
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma

# Generate Prisma Client with retry logic and error handling
# Set environment variables to handle CDN issues
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    PRISMA_TELEMETRY_DISABLED=1

# Generate with retry logic (3 attempts with 5 second delay)
RUN for i in 1 2 3; do \
      echo "Attempt $i: Generating Prisma Client..."; \
      npx prisma generate && break || \
      if [ $i -lt 3 ]; then \
        echo "Generation failed, retrying in 5 seconds..."; \
        sleep 5; \
      else \
        echo "All attempts failed"; \
        exit 1; \
      fi; \
    done

# Copy application source
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies for smaller final image
RUN npm prune --production

# ============================================
# Stage 2: Production - Minimal runtime image
# ============================================
FROM node:22-alpine AS production

# Install runtime dependencies
# - dumb-init: Proper signal handling for graceful shutdown
# - openssl: Required by Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user and group
# - UID/GID 1001 to avoid conflicts
# - No login shell for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy production node_modules from builder
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copy Prisma generated client
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy Prisma schema (needed for migrations)
COPY --chown=nestjs:nodejs prisma ./prisma

# Copy startup script
COPY --chown=nestjs:nodejs scripts/start.sh ./scripts/start.sh

# Copy package.json (metadata and version info)
COPY --chown=nestjs:nodejs package.json ./

# Create uploads directory structure
RUN mkdir -p uploads/app-assets && \
    chown -R nestjs:nodejs uploads

# Make startup script executable
RUN chmod +x ./scripts/start.sh

# Switch to non-root user
USER nestjs

# Expose application port
EXPOSE 3000

# Environment variables (defaults, can be overridden)
ENV NODE_ENV=production \
    PORT=3000

# Health check - verify application is responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init for proper signal handling (SIGTERM, SIGINT)
ENTRYPOINT ["dumb-init", "--"]

# Start application via startup script
CMD ["./scripts/start.sh"]
