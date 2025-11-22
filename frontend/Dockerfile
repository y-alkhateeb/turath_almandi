# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG VITE_BACKEND_URL

# Validate required build argument
RUN if [ -z "$VITE_BACKEND_URL" ]; then \
      echo "ERROR: VITE_BACKEND_URL build argument is required"; \
      echo "Usage: docker build --build-arg VITE_BACKEND_URL=https://your-backend-url.com ."; \
      exit 1; \
    fi

# Construct full API URL with /api/v1 suffix
ENV VITE_API_URL=${VITE_BACKEND_URL}/api/v1

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production - Serve with nginx
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
