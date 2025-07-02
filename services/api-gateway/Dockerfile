# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy root package files for workspaces
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspace configuration
COPY libs ./libs
COPY services/api-gateway ./services/api-gateway

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Build shared libraries first
WORKDIR /app/libs/shared-types
RUN npm run build

WORKDIR /app/libs/shared-utils
RUN npm run build

WORKDIR /app/libs/shared-config
RUN npm run build

WORKDIR /app/libs/api-client
RUN npm run build

# Build API gateway service
WORKDIR /app/services/api-gateway
RUN npm run build

# Production stage
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --from=builder --chown=nodejs:nodejs /app/services/api-gateway/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/api-gateway/dist ./dist

# Copy only production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built shared libraries
COPY --from=builder --chown=nodejs:nodejs /app/libs/shared-types/dist ./libs/shared-types/dist
COPY --from=builder --chown=nodejs:nodejs /app/libs/shared-utils/dist ./libs/shared-utils/dist
COPY --from=builder --chown=nodejs:nodejs /app/libs/shared-config/dist ./libs/shared-config/dist
COPY --from=builder --chown=nodejs:nodejs /app/libs/api-client/dist ./libs/api-client/dist

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Set environment to production
ENV NODE_ENV=production

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]