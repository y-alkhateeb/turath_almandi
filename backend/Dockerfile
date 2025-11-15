# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install required packages for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install production dependencies + devDependencies (needed for ts-node in seed)
RUN npm ci

# Copy Prisma generated files from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy startup script
COPY scripts/start.sh ./scripts/start.sh

# Make startup script executable
RUN chmod +x ./scripts/start.sh

# Expose the application port
EXPOSE 3000

# Use startup script to run migrations and start
CMD ["./scripts/start.sh"]
