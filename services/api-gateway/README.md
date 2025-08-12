# API Gateway Service

Central API Gateway for the Abyss Central microservices architecture.

## Overview

The API Gateway serves as the single entry point for all client requests to the
Abyss Central ecosystem. It provides:

- **Request Routing**: Routes requests to appropriate microservices
- **Authentication**: Validates JWT tokens via the auth service
- **Authorization**: Enforces role and permission-based access control
- **Rate Limiting**: Protects services from abuse
- **Circuit Breaking**: Provides resilience and prevents cascading failures
- **Health Monitoring**: Tracks health of all registered services
- **Request/Response Transformation**: Handles data transformation between
  clients and services
- **Correlation ID Tracking**: Enables distributed tracing across services

## Architecture

```
Client Request
     ↓
[API Gateway]
     ├── Authentication (JWT Validation)
     ├── Rate Limiting
     ├── Request Validation
     ├── Circuit Breaker
     └── Proxy to Service
              ↓
        [Microservice]
```

## Key Features

### 1. Service Registry

- Dynamic service discovery
- Health check monitoring
- Circuit breaker per service
- Configurable timeouts and retries

### 2. Security

- JWT token validation
- Role-based access control (RBAC)
- Permission-based authorization
- Request sanitization
- CORS configuration
- Helmet.js security headers

### 3. Resilience Patterns

- Circuit breaker with configurable thresholds
- Retry logic with exponential backoff
- Request timeouts
- Graceful degradation

### 4. Observability

- Structured logging with Winston
- Correlation ID tracking
- Request/response logging
- Health check endpoints
- Circuit breaker state monitoring

## API Routes

### Public Endpoints

- `POST /api/v1/auth/login` - User authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /health` - Gateway health check
- `GET /health/services` - All services health

### Protected Endpoints

All other endpoints require authentication:

- `/api/v1/auth/*` - Authentication service routes
- `/api/v1/inventory/*` - Inventory service routes
- `/api/v1/orders/*` - Orders service routes
- `/api/v1/analytics/*` - Analytics service routes (requires analytics:read
  permission)
- `/api/v1/admin/*` - Admin routes (requires admin role)

## Configuration

### Environment Variables

```bash
# Service Configuration
GATEWAY_PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Service URLs
AUTH_SERVICE_URL=http://localhost:3010
INVENTORY_SERVICE_URL=http://localhost:3020
# ... etc
```

See `.env.example` for full configuration options.

## Development

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start in development mode
npm run dev
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Health Checks

### Basic Health

```bash
curl http://localhost:3000/health
```

### Detailed Health (includes all services)

```bash
curl http://localhost:3000/health/detailed
```

### Service-Specific Health

```bash
curl http://localhost:3000/health/services/auth
```

## Circuit Breaker

The gateway implements circuit breakers for each service to prevent cascading
failures:

- **Closed State**: Normal operation, requests pass through
- **Open State**: Service is failing, requests are blocked
- **Half-Open State**: Testing if service has recovered

### Reset Circuit Breaker

```bash
curl -X POST http://localhost:3000/health/circuit-breakers/auth/reset
```

## Security Considerations

1. **Authentication**: All requests (except public endpoints) require valid JWT
   tokens
2. **Rate Limiting**: Prevents abuse and DDoS attacks
3. **Input Validation**: All inputs are validated and sanitized
4. **CORS**: Configured for allowed origins only
5. **Security Headers**: Helmet.js provides security headers

## Monitoring

The gateway provides several monitoring endpoints:

- `/health` - Basic health check
- `/health/ready` - Kubernetes readiness probe
- `/health/live` - Kubernetes liveness probe
- `/health/detailed` - Comprehensive health status
- `/health/services` - Individual service health

## Error Handling

The gateway provides consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "correlationId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common error codes:

- `AUTHENTICATION_REQUIRED` - Missing or invalid token
- `AUTHORIZATION_FAILED` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVICE_UNAVAILABLE` - Target service is down
- `GATEWAY_TIMEOUT` - Request timed out
- `VALIDATION_ERROR` - Invalid request data

## Performance Optimization

1. **Request Compression**: Gzip compression for responses
2. **Connection Pooling**: Reuses HTTP connections
3. **Caching**: Optional Redis caching for frequently accessed data
4. **Timeouts**: Configurable timeouts prevent hanging requests
5. **Circuit Breakers**: Fail fast when services are down

## Deployment

### Docker

```bash
docker build -t abyss-gateway .
docker run -p 3000:3000 --env-file .env abyss-gateway
```

### Production Considerations

1. Use environment-specific configurations
2. Enable Redis for distributed rate limiting
3. Configure appropriate CORS origins
4. Set up monitoring and alerting
5. Use HTTPS in production
6. Configure load balancing for high availability
