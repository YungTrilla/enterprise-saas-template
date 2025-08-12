# Getting Started with Enterprise SaaS Template

Welcome to the Enterprise SaaS Template! This comprehensive guide will help you
get up and running quickly with a production-ready SaaS application.

## 🎯 What You'll Build

By following this guide, you'll have:

- **Multi-tenant SaaS application** with tenant isolation
- **Microservices architecture** with API Gateway
- **Authentication & authorization** with JWT and RBAC
- **Modern React frontend** with TypeScript
- **Plugin system** for extensibility
- **Comprehensive monitoring** and logging
- **Production-ready deployment** configuration

## 📋 Prerequisites

### Required Software

- **Node.js 18+** - JavaScript runtime
- **pnpm 8+** - Package manager (faster than npm)
- **PostgreSQL 14+** - Primary database
- **Redis 6+** - Caching and sessions
- **Docker** (optional) - For containerized deployment
- **Git** - Version control

### Development Tools (Recommended)

- **VS Code** with TypeScript and ESLint extensions
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **DBeaver** for database management
- **Redis Desktop Manager** for Redis inspection

## 🚀 Quick Start (5 minutes)

### 1. Clone and Setup

```bash
# Clone the template
git clone https://github.com/your-org/enterprise-saas-template.git
cd enterprise-saas-template

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
```

### 2. Configure Environment

Edit `.env` with your settings:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/enterprise_saas
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Services
AUTH_SERVICE_URL=http://localhost:8001
INVENTORY_SERVICE_URL=http://localhost:8002
NOTIFICATION_SERVICE_URL=http://localhost:8003
API_GATEWAY_URL=http://localhost:3001

# Frontend
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK_AUTH=false
```

### 3. Start Development Environment

```bash
# Start all services
pnpm run dev

# Or start individual services
pnpm run dev:auth      # Auth service (port 8001)
pnpm run dev:gateway   # API Gateway (port 3001)
pnpm run dev:web       # React app (port 3000)
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Auth Service**: http://localhost:8001

Default login credentials:

- Email: `admin@example.com`
- Password: `password123`

## 📁 Project Structure

```
enterprise-saas-template/
├── apps/                          # Applications
│   └── web/                       # React frontend
├── services/                      # Microservices
│   ├── auth/                      # Authentication service
│   ├── inventory/                 # Inventory management
│   ├── notification/              # Notification service
│   └── api-gateway/               # API Gateway
├── libs/                          # Shared libraries
│   ├── shared-types/              # TypeScript types
│   ├── shared-config/             # Configuration utilities
│   ├── shared-utils/              # Utility functions
│   ├── ui-components/             # React components
│   ├── service-bootstrap/         # Service initialization
│   ├── multi-tenancy/             # Multi-tenant middleware
│   └── plugin-system/             # Plugin architecture
├── tools/                         # Development tools
│   └── generators/                # Code generators
├── docs/                          # Documentation
└── examples/                      # Example applications
```

## 🏗️ Architecture Overview

### Microservices Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   API Gateway   │    │  Auth Service   │
│   (Port 3000)   │───▶│   (Port 3001)   │───▶│   (Port 8001)   │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Routing       │    │ • JWT Tokens    │
│ • User Management │   │ • Rate Limiting │    │ • User Auth     │
│ • Settings      │    │ • CORS          │    │ • RBAC          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │ Inventory Service│    │Notification Svc │
                       │   (Port 8002)   │    │   (Port 8003)   │
                       │                 │    │                 │
                       │ • Equipment     │    │ • Email         │
                       │ • Categories    │    │ • SMS           │
                       │ • Tracking      │    │ • Push          │
                       └─────────────────┘    └─────────────────┘
```

### Technology Stack

**Frontend:**

- React 18 with TypeScript
- Tailwind CSS for styling
- React Query for server state
- React Router for navigation
- React Hook Form for forms

**Backend:**

- Node.js with Express
- TypeScript throughout
- PostgreSQL database
- Redis for caching
- JWT authentication

**Infrastructure:**

- Docker for containerization
- GitHub Actions for CI/CD
- OpenTelemetry for monitoring
- Structured logging

## 🛠️ Development Workflow

### 1. Creating a New Service

Use the service generator:

```bash
# Generate a new service
node tools/generators/create-service.js user-management

# Navigate and install
cd services/user-management
pnpm install

# Configure and start
pnpm run dev
```

### 2. Creating a New Application

Use the app generator:

```bash
# Generate a new app
node tools/generators/create-app.js admin-dashboard

# Navigate and install
cd apps/admin-dashboard
pnpm install

# Start development
pnpm run dev
```

### 3. Code Quality

```bash
# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint:fix

# Type checking
pnpm run typecheck

# Format code
pnpm run format

# Run all tests
pnpm test

# Run tests with coverage
pnpm run test:coverage
```

### 4. Building for Production

```bash
# Build all packages
pnpm run build

# Build specific service
pnpm run build --filter=auth-service

# Build frontend
pnpm run build --filter=web
```

## 🔐 Authentication & Authorization

### JWT Authentication

The template uses JWT-based authentication with:

- **Access tokens** (15 minutes expiration)
- **Refresh tokens** (7 days expiration)
- **Automatic token refresh**
- **Role-based access control (RBAC)**

### Setting Up Authentication

```typescript
// In your service
import { authenticateToken, requirePermission } from '@template/shared-utils';

app.get(
  '/api/admin/users',
  authenticateToken,
  requirePermission('users:read'),
  getUsersHandler
);
```

### Frontend Authentication

```typescript
// Using the auth context
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm onLogin={login} />;
  }

  return <Dashboard user={user} onLogout={logout} />;
}
```

## 🏢 Multi-Tenancy

### Tenant Resolution

The template supports multiple tenant resolution strategies:

```typescript
import {
  createTenantResolverMiddleware,
  TenantResolutionStrategy,
} from '@template/multi-tenancy';

// Multiple strategies
app.use(
  createTenantResolverMiddleware({
    strategy: [
      TenantResolutionStrategy.SUBDOMAIN, // tenant.yourdomain.com
      TenantResolutionStrategy.HEADER, // X-Tenant-ID header
      TenantResolutionStrategy.PATH, // /tenant/slug/...
    ],
  })
);
```

### Tenant Context

```typescript
// Access tenant in your handlers
app.get('/api/data', (req, res) => {
  const { tenant, user, canAccess } = req.tenantContext;

  if (!canAccess('advanced_reports')) {
    return res.status(403).json({ error: 'Feature not available' });
  }

  // Tenant-scoped data query
  const data = await getData(tenant.id);
  res.json(data);
});
```

## 🔌 Plugin System

### Installing Plugins

```typescript
import { PluginManager } from '@template/plugin-system';

// Install from marketplace
await pluginManager.installPlugin({
  source: 'MARKETPLACE',
  identifier: 'analytics-plugin',
  version: '1.0.0',
  autoActivate: true,
});

// Install from file
await pluginManager.installPlugin({
  source: 'FILE_UPLOAD',
  identifier: '/path/to/plugin.zip',
});
```

### Creating Plugins

```javascript
// my-plugin/index.js
class MyPlugin {
  async initialize(context) {
    this.logger = context.logger;
    this.api = context.api;
    this.logger.info('Plugin initialized');
  }

  async beforeRequest(req, res, next) {
    // Hook into request lifecycle
    this.logger.info('Processing request:', req.url);
    next();
  }
}

module.exports = MyPlugin;
```

## 📊 Monitoring & Observability

### Structured Logging

```typescript
import { createLogger } from '@template/shared-utils';

const logger = createLogger('user-service');

logger.info('User created', {
  userId: user.id,
  email: user.email,
  tenantId: tenant.id,
  correlationId: req.correlationId,
});
```

### Health Checks

```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      dependencies: await checkDependencies(),
    },
  };

  res.json(health);
});
```

### Metrics

```typescript
// Using OpenTelemetry
import { trace, metrics } from '@opentelemetry/api';

const tracer = trace.getTracer('user-service');
const meter = metrics.getMeter('user-service');

const userCounter = meter.createCounter('users_created_total');

// In your handler
const span = tracer.startSpan('create_user');
try {
  const user = await createUser(userData);
  userCounter.add(1, { tenantId: tenant.id });
  return user;
} finally {
  span.end();
}
```

## 🧪 Testing

### Unit Tests

```typescript
// user.service.test.ts
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    service = new UserService();
  });

  it('should create user', async () => {
    const userData = { email: 'test@example.com' };
    const user = await service.createUser(userData);

    expect(user).toBeDefined();
    expect(user.email).toBe(userData.email);
  });
});
```

### Integration Tests

```typescript
// user.routes.test.ts
import request from 'supertest';
import { app } from './app';

describe('User Routes', () => {
  it('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ email: 'test@example.com' })
      .expect(201);

    expect(response.body.data).toHaveProperty('id');
  });
});
```

### E2E Tests

```typescript
// Playwright tests
import { test, expect } from '@playwright/test';

test('user can login and access dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid=email]', 'admin@example.com');
  await page.fill('[data-testid=password]', 'password123');
  await page.click('[data-testid=submit]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps
```

### Environment-Specific Configs

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  web:
    environment:
      - NODE_ENV=production
      - VITE_API_URL=https://api.yourdomain.com

  auth-service:
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
```

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm run build
      - run: pnpm test

      - name: Deploy to production
        run: ./scripts/deploy.sh
```

## 📚 Next Steps

### Immediate Tasks

1. **Configure your environment** variables
2. **Set up your database** with proper users and permissions
3. **Customize the branding** in the frontend
4. **Configure SMTP** for email notifications
5. **Set up monitoring** with your preferred tools

### Customization

1. **Add your business logic** to the generated services
2. **Create custom UI components** for your domain
3. **Configure tenant plans** and limits
4. **Set up payment processing** if needed
5. **Add custom plugins** for integrations

### Production Readiness

1. **Security audit** - Review authentication and authorization
2. **Performance testing** - Load test your APIs
3. **Monitoring setup** - Configure alerts and dashboards
4. **Backup strategy** - Database and file backups
5. **Disaster recovery** - Plan for outages and data loss

## 🆘 Getting Help

### Documentation

- [API Reference](./API.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Security Guide](./SECURITY.md)

### Community

- [GitHub Issues](https://github.com/your-org/enterprise-saas-template/issues)
- [Discussions](https://github.com/your-org/enterprise-saas-template/discussions)
- [Discord Community](https://discord.gg/your-server)

### Support

- [Enterprise Support](mailto:support@yourcompany.com)
- [Documentation](https://docs.yourcompany.com)
- [Status Page](https://status.yourcompany.com)

## 🎉 Welcome to Enterprise SaaS!

You're now ready to build amazing SaaS applications with the Enterprise SaaS
Template. The template provides a solid foundation, but the real magic happens
when you customize it for your specific use case.

Happy coding! 🚀
