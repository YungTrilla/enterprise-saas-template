# Development Workflow Guide

This guide covers the day-to-day development workflows, best practices, and
common tasks for working with the Enterprise SaaS Template.

## 🚀 Quick Start for Developers

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/your-org/enterprise-saas-template.git
cd enterprise-saas-template

# Install dependencies (this also sets up git hooks)
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the development environment
pnpm run dev

# Verify everything is working
pnpm run validate
```

### Daily Development Workflow

```bash
# Start of day - sync with latest changes
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Start development environment
pnpm run dev

# Make changes, test as you go
pnpm run test:watch  # in another terminal

# Before committing (git hooks will also run these)
pnpm run validate

# Commit with conventional format
git commit -m "feat(component): add new feature description"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🏗️ Project Structure

### Monorepo Organization

```
enterprise-saas-template/
├── apps/                     # Applications
│   └── web/                 # React frontend application
├── services/                # Microservices
│   ├── auth-service/        # Authentication service
│   ├── api-gateway/         # API gateway
│   └── notification-service/ # Notification service
├── libs/                    # Shared libraries
│   ├── auth/               # Authentication utilities
│   ├── database/           # Database utilities
│   ├── ui/                 # Shared UI components
│   └── utils/              # Common utilities
├── tools/                  # Development tools
│   ├── generators/         # Code generators
│   └── scripts/            # Build and utility scripts
├── docs/                   # Documentation
├── .github/                # GitHub workflows and templates
└── scripts/                # DevOps and automation scripts
```

### Service Architecture

Each service follows a consistent structure:

```
services/service-name/
├── src/
│   ├── controllers/        # HTTP request handlers
│   ├── services/          # Business logic
│   ├── models/            # Data models
│   ├── middleware/        # Express middleware
│   ├── routes/            # Route definitions
│   ├── utils/             # Service-specific utilities
│   └── types/             # TypeScript type definitions
├── tests/                 # Test files
├── docs/                  # Service documentation
│   └── openapi.yaml       # API specification
├── Dockerfile             # Container configuration
├── package.json           # Dependencies and scripts
└── README.md              # Service-specific documentation
```

---

## 🔄 Development Workflows

### Feature Development Workflow

1. **Planning Phase**

   ```bash
   # Check if feature exists in issues
   # Review architecture documentation
   # Plan API changes (OpenAPI first)
   # Estimate effort and impact
   ```

2. **Implementation Phase**

   ```bash
   # Create feature branch
   git checkout -b feature/user-management-api

   # Start with API design
   # Update OpenAPI specification
   vim services/user-service/docs/openapi.yaml

   # Generate API documentation
   pnpm run docs:generate:all

   # Implement service layer
   # Add comprehensive tests
   # Update frontend if needed
   ```

3. **Quality Assurance**

   ```bash
   # Run full validation suite
   pnpm run validate

   # Run security checks
   pnpm run security:check

   # Test API endpoints
   pnpm run test:api

   # Generate and test API clients
   pnpm run client:generate:all
   ```

4. **Integration Testing**

   ```bash
   # Start all services
   pnpm run dev

   # Run integration tests
   pnpm run test:integration

   # Test with frontend
   # Verify API documentation
   # Check performance impact
   ```

### Bug Fix Workflow

1. **Investigation**

   ```bash
   # Reproduce the issue locally
   # Check logs and error messages
   # Identify affected components
   # Write failing test case
   ```

2. **Fix Implementation**

   ```bash
   # Create bug fix branch
   git checkout -b fix/authentication-token-refresh

   # Implement minimal fix
   # Ensure tests pass
   # Verify fix doesn't break other functionality
   ```

3. **Validation**
   ```bash
   # Run affected tests
   # Run full test suite
   # Test manually
   # Check for regressions
   ```

### Hotfix Workflow

For critical production issues:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# Implement minimal fix
# Add test to prevent regression
# Fast-track review process

# Deploy to staging first
# Validate fix
# Deploy to production
# Monitor closely
```

---

## 🧪 Testing Strategy

### Test Types and Execution

```bash
# Unit Tests - Fast, isolated tests
pnpm run test:unit
pnpm run test:unit:watch
pnpm run test:unit:coverage

# Integration Tests - Service interactions
pnpm run test:integration
pnpm run test:api

# End-to-End Tests - Full user workflows
pnpm run test:e2e
pnpm run test:e2e:headed  # With browser UI

# Security Tests - Vulnerability scanning
pnpm run test:security
pnpm run security:check

# Performance Tests - Load and stress testing
pnpm run test:performance
pnpm run test:load
```

### Test Development Patterns

```typescript
// Unit Test Example
describe('UserService', () => {
  let userService: UserService;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    userService = new UserService(mockDatabase);
  });

  it('should create user with valid data', async () => {
    // Arrange
    const userData = { email: 'test@example.com', name: 'Test User' };
    mockDatabase.users.create.mockResolvedValue({ id: '123', ...userData });

    // Act
    const result = await userService.createUser(userData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('123');
    expect(mockDatabase.users.create).toHaveBeenCalledWith(userData);
  });
});

// Integration Test Example
describe('Authentication API', () => {
  it('should authenticate user and return JWT', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'validPassword' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.user.email).toBe('user@example.com');
  });
});
```

---

## 🎨 Frontend Development

### Component Development

```bash
# Generate new component
pnpm run generate:component UserProfile

# Start development with hot reload
pnpm run dev:web

# Test component in isolation
pnpm run storybook

# Run component tests
pnpm run test:unit -- UserProfile
```

### UI Component Guidelines

```typescript
// Good Component Structure
import { memo, useState } from 'react';
import { Button, Input, Card } from '@template/ui';
import { useUserProfile } from '../hooks/useUserProfile';
import { validateEmail } from '@template/utils';

interface UserProfileProps {
  userId: string;
  onSave: (profile: UserProfile) => void;
}

export const UserProfile = memo<UserProfileProps>(({ userId, onSave }) => {
  const { profile, isLoading, updateProfile } = useUserProfile(userId);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async (formData: FormData) => {
    // Validation logic
    const validationErrors = validateUserProfile(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Save logic
    try {
      await updateProfile(formData);
      onSave(formData);
    } catch (error) {
      setErrors({ general: 'Failed to save profile' });
    }
  };

  if (isLoading) return <ProfileSkeleton />;

  return (
    <Card>
      {/* Component implementation */}
    </Card>
  );
});

UserProfile.displayName = 'UserProfile';
```

### State Management Patterns

```typescript
// Global State (Zustand)
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async credentials => {
        const response = await authService.login(credentials);
        set({
          user: response.user,
          token: response.accessToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'auth-store' }
  )
);

// Server State (React Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useUserProfile = (userId: string) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => userService.getProfile(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const updateMutation = useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile', userId] });
    },
  });

  return {
    profile,
    isLoading,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
};
```

---

## ⚙️ Backend Development

### Service Development

```bash
# Generate new service
pnpm run generate:service notification-service

# Start service in development
pnpm run dev:notification

# Test service endpoints
pnpm run test:api -- notification-service

# Generate API client
pnpm run client:generate -- notification-service
```

### API Development Best Practices

```typescript
// Controller Example
import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationSchema } from '../schemas/notification.schema';
import { logger } from '@template/utils';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  async createNotification(req: Request, res: Response): Promise<void> {
    try {
      // Input validation
      const validatedData = CreateNotificationSchema.parse(req.body);

      // Business logic
      const notification = await this.notificationService.create({
        ...validatedData,
        userId: req.user.id,
      });

      // Structured response
      res.status(201).json({
        success: true,
        data: notification,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.correlationId,
        },
      });
    } catch (error) {
      logger.error('Failed to create notification', {
        error: error.message,
        userId: req.user?.id,
        requestId: req.correlationId,
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create notification',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.correlationId,
        },
      });
    }
  }
}

// Service Example
export class NotificationService {
  constructor(
    private database: Database,
    private emailService: EmailService,
    private pushService: PushNotificationService
  ) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    // Validate business rules
    await this.validateNotificationLimits(data.userId);

    // Create notification record
    const notification = await this.database.notifications.create({
      id: generateId(),
      ...data,
      status: 'pending',
      createdAt: new Date(),
    });

    // Send notification asynchronously
    this.sendNotification(notification).catch(error => {
      logger.error('Failed to send notification', {
        error,
        notificationId: notification.id,
      });
    });

    return notification;
  }

  private async sendNotification(notification: Notification): Promise<void> {
    // Implementation for sending notifications
  }
}
```

### Database Development

```typescript
// Migration Example
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', table => {
    table.uuid('id').primary();
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('type').notNullable();
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.jsonb('metadata').defaultTo('{}');
    table.string('status').notNullable().defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes
    table.index(['user_id', 'created_at']);
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('notifications');
}

// Model Example
export class NotificationModel {
  static tableName = 'notifications';

  id!: string;
  userId!: string;
  type!: string;
  title!: string;
  message!: string;
  metadata!: Record<string, any>;
  status!: 'pending' | 'sent' | 'failed';
  createdAt!: Date;
  updatedAt!: Date;

  static async findByUserId(userId: string): Promise<NotificationModel[]> {
    return this.query().where('user_id', userId).orderBy('created_at', 'desc');
  }

  static async markAsSent(id: string): Promise<void> {
    await this.query()
      .patch({ status: 'sent', updated_at: new Date() })
      .where('id', id);
  }
}
```

---

## 🐳 Container Development

### Docker Workflow

```bash
# Build all containers
pnpm run docker:build

# Start services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f auth-service

# Run tests in container
docker-compose exec auth-service pnpm test

# Clean up
docker-compose down -v
```

### Docker Best Practices

```dockerfile
# Multi-stage build example
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm

FROM base AS deps
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 app

COPY --from=builder --chown=app:nodejs /app/dist ./dist
COPY --from=builder --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=app:nodejs /app/package.json ./package.json

USER app
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

---

## 🔧 Development Tools

### Code Generation

```bash
# Generate new service
pnpm run generate:service my-service
# Creates: services/my-service with complete structure

# Generate new React component
pnpm run generate:component MyComponent
# Creates: component with stories, tests, and types

# Generate API client from OpenAPI
pnpm run client:generate:all
# Updates: libs/api-client with latest API definitions

# Generate database migration
pnpm run db:migration:create add_user_preferences
# Creates: new migration file with timestamp
```

### Quality Tools

```bash
# Linting and formatting
pnpm run lint                # ESLint with auto-fix
pnpm run format              # Prettier formatting
pnpm run typecheck           # TypeScript compilation

# Security
pnpm run security:check      # Dependency vulnerability scan
pnpm run security:staged     # Security check on staged files

# Quality gates
pnpm run quality:gates       # File size, complexity checks
pnpm run quality:gates:strict # Stricter quality checks

# Documentation
pnpm run docs:validate:all   # Validate OpenAPI specs
pnpm run docs:generate:all   # Generate API documentation
pnpm run docs:serve          # Serve docs locally
```

### Development Environment

```bash
# Environment management
cp .env.example .env.local   # Local environment variables
pnpm run env:validate        # Validate environment setup

# Database management
pnpm run db:migrate:latest   # Run latest migrations
pnpm run db:seed:run         # Seed development data
pnpm run db:reset           # Reset database to clean state

# Monitoring and debugging
pnpm run logs:watch          # Watch application logs
pnpm run metrics:dashboard   # Open metrics dashboard
pnpm run db:studio          # Open database admin interface
```

---

## 🚀 Performance Optimization

### Frontend Performance

```bash
# Bundle analysis
pnpm run build:analyze      # Analyze bundle size
pnpm run lighthouse         # Run Lighthouse audits

# Performance testing
pnpm run test:performance   # Performance regression tests
pnpm run test:visual        # Visual regression tests
```

### Backend Performance

```bash
# Load testing
pnpm run test:load          # Load test APIs
pnpm run test:stress        # Stress test services

# Profiling
pnpm run profile:memory     # Memory usage profiling
pnpm run profile:cpu        # CPU usage profiling
```

### Database Performance

```sql
-- Query optimization
EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1;

-- Index analysis
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'users';
```

---

## 🔍 Debugging

### Local Debugging

```bash
# Debug specific service
DEBUG=app:* pnpm run dev:auth-service

# Debug with Node.js inspector
node --inspect-brk dist/index.js

# Debug tests
pnpm run test:debug
```

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Auth Service",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/services/auth-service/src/index.ts",
      "outFiles": ["${workspaceFolder}/services/auth-service/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      },
      "runtimeArgs": ["--nolazy", "-r", "ts-node/register"],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}/services/auth-service"
    }
  ]
}
```

### Production Debugging

```bash
# View production logs
kubectl logs -f deployment/auth-service

# Database debugging
psql -h prod-db.example.com -U app_user -d app_db

# Performance monitoring
curl -s http://localhost:3000/metrics | grep -E "http_request|memory"
```

---

## 📊 Monitoring and Observability

### Local Development Monitoring

```bash
# Start monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Access dashboards
open http://localhost:3000  # Grafana
open http://localhost:9090  # Prometheus
open http://localhost:16686 # Jaeger tracing
```

### Application Metrics

```typescript
// Metrics collection example
import { createPrometheusMetrics } from '@template/monitoring';

const metrics = createPrometheusMetrics({
  serviceName: 'auth-service',
  version: process.env.APP_VERSION,
});

// Custom metrics
const loginAttempts = metrics.counter(
  'login_attempts_total',
  'Total login attempts',
  ['status']
);
const requestDuration = metrics.histogram(
  'http_request_duration_seconds',
  'HTTP request duration'
);

// Usage in middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    requestDuration.observe(
      { method: req.method, route: req.route?.path },
      duration
    );
  });

  next();
});
```

---

## 🚨 Troubleshooting Common Issues

### Development Environment Issues

```bash
# Node modules issues
rm -rf node_modules package-lock.json
pnpm install

# TypeScript compilation issues
pnpm run typecheck --verbose

# Database connection issues
pnpm run db:ping
pnpm run db:migrate:status

# Port conflicts
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
```

### Testing Issues

```bash
# Test database issues
pnpm run test:db:reset
pnpm run test:db:seed

# Jest cache issues
pnpm run test:clear-cache

# Coverage reporting issues
rm -rf coverage/
pnpm run test:coverage
```

### Build Issues

```bash
# Clean builds
pnpm run clean
pnpm run build

# Docker build issues
docker system prune -f
docker-compose build --no-cache

# Dependency issues
pnpm audit
pnpm update
```

---

## 📚 Additional Resources

### Documentation Links

- [Architecture Overview](./ARCHITECTURE.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Security Guidelines](./SECURITY.md)

### External Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Community

- [GitHub Discussions](https://github.com/your-org/enterprise-saas-template/discussions)
- [Discord Community](https://discord.gg/enterprise-saas-template)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/enterprise-saas-template)

---

_Happy coding! 🚀 For questions or support, reach out through our community
channels or create an issue._
