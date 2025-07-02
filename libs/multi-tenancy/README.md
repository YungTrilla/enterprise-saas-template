# Enterprise Multi-Tenancy Library

A comprehensive multi-tenancy solution for the Enterprise SaaS Template, providing tenant isolation, resource management, and scalable architecture patterns.

## 🏗️ Architecture Overview

### Core Components

1. **Tenant Resolution** - Identify tenants from requests
2. **Context Management** - Manage tenant context throughout request lifecycle
3. **Limits Enforcement** - Enforce resource quotas and usage limits
4. **Storage Providers** - Flexible storage backends for tenant data
5. **Provisioning Services** - Automated tenant setup and management
6. **Usage Tracking** - Monitor and analyze tenant resource usage

### Multi-Tenancy Strategies

- **Shared Database** - All tenants share the same database with tenant isolation
- **Separate Schema** - Each tenant has its own database schema
- **Separate Database** - Each tenant has its own dedicated database
- **Hybrid** - Combination of strategies based on tenant tier

## 🚀 Quick Start

### Installation

```bash
pnpm add @template/multi-tenancy
```

### Basic Setup

```typescript
import express from 'express';
import { 
  createTenantResolverMiddleware,
  createTenantContextMiddleware,
  TenantResolutionStrategy,
  DatabaseStorageProvider
} from '@template/multi-tenancy';

const app = express();

// Create storage provider
const storageProvider = new DatabaseStorageProvider({
  host: 'localhost',
  port: 5432,
  database: 'tenants',
  username: 'user',
  password: 'password'
});

// Add tenant resolution middleware
app.use(createTenantResolverMiddleware({
  storageProvider,
  strategy: [TenantResolutionStrategy.SUBDOMAIN, TenantResolutionStrategy.HEADER]
}));

// Add tenant context middleware
app.use(createTenantContextMiddleware({
  loadUser: true,
  loadPermissions: true,
  loadUsage: true
}));

// Your application routes
app.get('/api/data', (req, res) => {
  const tenant = req.tenant;
  const context = req.tenantContext;
  
  // Use tenant-specific logic
  res.json({
    tenant: tenant.name,
    usage: context.getUsagePercentage('apiCalls')
  });
});
```

## 📋 Middleware Components

### Tenant Resolver

Identifies tenants from incoming requests using configurable strategies:

```typescript
import { createTenantResolverMiddleware, TenantResolutionStrategy } from '@template/multi-tenancy';

// Multiple resolution strategies
app.use(createTenantResolverMiddleware({
  storageProvider,
  strategy: [
    TenantResolutionStrategy.SUBDOMAIN,    // tenant.example.com
    TenantResolutionStrategy.DOMAIN,       // custom-domain.com
    TenantResolutionStrategy.HEADER,       // X-Tenant-ID header
    TenantResolutionStrategy.PATH,         // /tenant/slug/...
    TenantResolutionStrategy.QUERY_PARAM   // ?tenant=slug
  ],
  required: true,
  cache: { enabled: true, ttl: 300 }
}));
```

### Tenant Context

Creates and manages tenant context with user information and permissions:

```typescript
import { createTenantContextMiddleware } from '@template/multi-tenancy';

app.use(createTenantContextMiddleware({
  loadUser: true,
  loadPermissions: true,
  loadUsage: true,
  getUserFromRequest: async (req) => {
    // Extract user from JWT, session, etc.
    return getUserFromToken(req.headers.authorization);
  },
  getPermissionsForUser: async (user, tenant) => {
    // Load user permissions for this tenant
    return await loadUserPermissions(user.id, tenant.id);
  },
  getUsageForTenant: async (tenant) => {
    // Load current usage statistics
    return await loadTenantUsage(tenant.id);
  }
}));
```

### Limits Enforcement

Enforce resource limits and quotas:

```typescript
import { 
  checkTenantLimit, 
  trackApiUsage, 
  checkUserLimit,
  requireTenantFeature 
} from '@template/multi-tenancy';

// Track API usage
app.use('/api', trackApiUsage());

// Check specific limits before operations
app.post('/api/users', 
  checkUserLimit(),
  async (req, res) => {
    // Create user logic
  }
);

// Require specific features
app.get('/api/advanced-reports',
  requireTenantFeature('advanced_reports'),
  async (req, res) => {
    // Advanced reports logic
  }
);
```

## 🔧 Configuration

### Environment Variables

```env
# Resolution Strategy
MT_RESOLUTION_STRATEGY=subdomain,header
MT_HEADER_NAME=X-Tenant-ID
MT_REQUIRED=true

# Caching
MT_CACHE_ENABLED=true
MT_CACHE_TTL=300
MT_CACHE_PROVIDER=redis

# Storage
MT_STORAGE_PROVIDER=database
MT_DATABASE_HOST=localhost
MT_DATABASE_PORT=5432
MT_DATABASE_NAME=tenants

# Limits
MT_ENFORCE_STRICT_LIMITS=true
MT_GRACE_PERIOD_PERCENTAGE=10

# Isolation
MT_ISOLATION_STRATEGY=shared
MT_AUTO_CREATE_DATABASE=false

# Security
MT_VALIDATE_TENANT_ACCESS=true
MT_ALLOW_CROSS_TENANT_ACCESS=false
MT_AUDIT_TENANT_ACCESS=true
```

### Configuration Object

```typescript
import { loadMultiTenancyConfig } from '@template/multi-tenancy';

const config = loadMultiTenancyConfig();

// Override specific settings
config.limits.enforceStrict = false;
config.cache.ttl = 600;
config.provisioning.autoProvision = true;
```

## 🏢 Tenant Management

### Tenant Service

```typescript
import { TenantService } from '@template/multi-tenancy';

const tenantService = new TenantService(storageProvider);

// Create new tenant
const tenant = await tenantService.createTenant({
  name: 'Acme Corp',
  slug: 'acme-corp',
  plan: TenantPlan.PROFESSIONAL,
  domain: 'acme.com',
  settings: {
    branding: {
      primaryColor: '#ff6b35',
      logo: 'https://acme.com/logo.png'
    }
  }
});

// Update tenant
await tenantService.updateTenant(tenant.id, {
  plan: TenantPlan.ENTERPRISE,
  'limits.users': 500
});

// Get tenant with usage
const tenantWithUsage = await tenantService.getTenantWithUsage(tenant.id);
```

### Provisioning Service

```typescript
import { TenantProvisioningService } from '@template/multi-tenancy';

const provisioningService = new TenantProvisioningService({
  storageProvider,
  autoProvision: true,
  createAdminUser: true,
  sendWelcomeEmail: true
});

// Provision new tenant
const result = await provisioningService.provisionTenant({
  name: 'New Company',
  slug: 'new-company',
  plan: TenantPlan.STARTER,
  adminUser: {
    email: 'admin@newcompany.com',
    firstName: 'John',
    lastName: 'Doe'
  }
});

console.log('Tenant ID:', result.tenant.id);
console.log('Admin User ID:', result.adminUser.id);
console.log('Temporary Password:', result.adminUser.temporaryPassword);
```

## 📊 Usage Tracking

### Usage Service

```typescript
import { TenantUsageService } from '@template/multi-tenancy';

const usageService = new TenantUsageService(storageProvider);

// Update usage
await usageService.updateUsage(tenantId, {
  apiCalls: 1,
  storage: fileSize,
  bandwidth: requestSize + responseSize
});

// Get usage statistics
const usage = await usageService.getUsage(tenantId);
const analytics = await usageService.getAnalytics(tenantId, {
  start: '2024-01-01',
  end: '2024-01-31'
});

// Check if approaching limits
const warnings = await usageService.getUsageWarnings(tenantId);
```

## 🔐 Security & Access Control

### Permission Checks

```typescript
import { 
  requireTenantUser,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
} from '@template/multi-tenancy';

// Require authenticated tenant user
app.use('/api/admin', requireTenantUser());

// Require specific permission
app.delete('/api/users/:id', 
  requirePermission('users:delete'),
  deleteUserHandler
);

// Require any of multiple permissions
app.get('/api/reports',
  requireAnyPermission(['reports:basic', 'reports:advanced']),
  getReportsHandler
);

// Require all permissions
app.post('/api/billing/charges',
  requireAllPermissions(['billing:read', 'billing:write', 'admin:access']),
  createChargeHandler
);
```

### Cross-Tenant Access Prevention

```typescript
// Middleware automatically prevents cross-tenant access
app.get('/api/projects/:id', async (req, res) => {
  const { tenantContext } = req;
  const projectId = req.params.id;
  
  // This query is automatically scoped to the current tenant
  const project = await getProject(projectId, tenantContext.tenant.id);
  
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  
  res.json(project);
});
```

## 🗄️ Storage Providers

### Database Provider

```typescript
import { DatabaseStorageProvider } from '@template/multi-tenancy';

const provider = new DatabaseStorageProvider({
  database: {
    host: 'localhost',
    port: 5432,
    database: 'tenants',
    username: 'user',
    password: 'password',
    ssl: true,
    maxConnections: 10
  },
  cache: {
    enabled: true,
    ttl: 300,
    maxEntries: 1000
  }
});
```

### Redis Provider

```typescript
import { RedisStorageProvider } from '@template/multi-tenancy';

const provider = new RedisStorageProvider({
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'redis-password',
    db: 0,
    keyPrefix: 'tenant:'
  }
});
```

### Custom Provider

```typescript
import { TenantStorageProvider } from '@template/multi-tenancy';

class CustomStorageProvider extends TenantStorageProvider {
  async getTenantById(tenantId: string): Promise<ITenant | null> {
    // Your custom implementation
    return await this.customStorage.find(tenantId);
  }
  
  async createTenant(tenant: Omit<ITenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<ITenant> {
    // Your custom implementation
    return await this.customStorage.create(tenant);
  }
  
  // Implement other required methods...
}
```

## 📈 Monitoring & Analytics

### Usage Analytics

```typescript
app.get('/admin/tenant/:id/analytics', async (req, res) => {
  const { tenantContext } = req;
  const analytics = await usageService.getAnalytics(req.params.id, {
    start: req.query.start,
    end: req.query.end,
    metrics: ['users', 'apiCalls', 'storage', 'bandwidth']
  });
  
  res.json(analytics);
});
```

### Health Monitoring

```typescript
app.get('/health/tenants', async (req, res) => {
  const health = await storageProvider.healthCheck();
  const cacheStats = storageProvider.getCacheStats();
  
  res.json({
    status: health.status,
    cache: cacheStats,
    timestamp: new Date().toISOString()
  });
});
```

## 🔄 Database Isolation Strategies

### Shared Database (Row-Level Security)

```sql
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id'));
```

### Separate Schema per Tenant

```typescript
// Dynamic schema switching
app.use(async (req, res, next) => {
  if (req.tenant) {
    const schema = `tenant_${req.tenant.slug}`;
    await db.raw(`SET search_path TO ${schema}, public`);
  }
  next();
});
```

### Separate Database per Tenant

```typescript
// Dynamic database connections
const getDatabaseConnection = (tenantId: string) => {
  const config = {
    ...baseConfig,
    database: `tenant_${tenantId}`
  };
  return knex(config);
};
```

## 🛠️ Advanced Usage

### Custom Tenant Resolution

```typescript
const resolverMiddleware = createTenantResolverMiddleware({
  storageProvider,
  strategy: TenantResolutionStrategy.CUSTOM,
  onTenantNotFound: async (req, identifier) => {
    // Custom tenant lookup logic
    const tenant = await customTenantLookup(identifier);
    
    if (tenant && tenant.status === 'PENDING') {
      // Auto-activate pending tenants
      await activateTenant(tenant.id);
      return { ...tenant, status: 'ACTIVE' };
    }
    
    return tenant;
  }
});
```

### Dynamic Limit Adjustment

```typescript
app.post('/api/tenant/:id/upgrade', async (req, res) => {
  const tenantId = req.params.id;
  const newPlan = req.body.plan;
  
  // Update tenant plan and limits
  await tenantService.upgradePlan(tenantId, newPlan);
  
  // Clear cache to pick up new limits
  await storageProvider.clearTenantCache(tenantId);
  
  res.json({ success: true });
});
```

### Webhook Integration

```typescript
import { TenantWebhookService } from '@template/multi-tenancy';

const webhookService = new TenantWebhookService();

// Register webhook handlers
webhookService.on('tenant.created', async (tenant) => {
  await sendWelcomeEmail(tenant);
  await setupDefaultData(tenant);
});

webhookService.on('tenant.limit.exceeded', async (tenant, resource) => {
  await notifyTenantAdmin(tenant, `${resource} limit exceeded`);
  await logLimitViolation(tenant.id, resource);
});
```

## 🧪 Testing

### Mock Provider for Testing

```typescript
import { MockStorageProvider } from '@template/multi-tenancy/testing';

describe('Multi-tenant API', () => {
  let mockProvider: MockStorageProvider;
  
  beforeEach(() => {
    mockProvider = new MockStorageProvider();
    mockProvider.addTenant({
      id: 'test-tenant',
      slug: 'test',
      name: 'Test Tenant',
      // ... other properties
    });
  });
  
  it('should resolve tenant from subdomain', async () => {
    const req = createMockRequest({
      headers: { host: 'test.example.com' }
    });
    
    const middleware = createTenantResolverMiddleware({
      storageProvider: mockProvider,
      strategy: TenantResolutionStrategy.SUBDOMAIN
    });
    
    await middleware(req, res, next);
    
    expect(req.tenant).toBeDefined();
    expect(req.tenant.slug).toBe('test');
  });
});
```

## 📚 API Reference

### Core Types

- `ITenant` - Tenant entity interface
- `ITenantContext` - Request context with tenant info
- `ITenantLimits` - Resource limits configuration
- `ITenantUsage` - Current usage statistics
- `TenantResolutionStrategy` - Tenant identification strategies
- `TenantPlan` - Available tenant plans
- `TenantStatus` - Tenant lifecycle states

### Middleware Functions

- `createTenantResolverMiddleware()` - Resolve tenant from request
- `createTenantContextMiddleware()` - Create tenant context
- `requireTenant()` - Ensure tenant is present
- `requireTenantUser()` - Ensure authenticated user
- `requirePermission()` - Check user permissions
- `checkTenantLimit()` - Enforce resource limits

### Service Classes

- `TenantService` - Core tenant management
- `TenantProvisioningService` - Automated tenant setup
- `TenantUsageService` - Usage tracking and analytics
- `TenantWebhookService` - Event handling

### Storage Providers

- `DatabaseStorageProvider` - PostgreSQL/MySQL backend
- `RedisStorageProvider` - Redis backend
- `TenantStorageProvider` - Abstract base class

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Follow security best practices
5. Test with multiple tenancy strategies

## 📄 License

Part of the Enterprise SaaS Template - see main project license.