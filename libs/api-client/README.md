# @abyss/api-client

Comprehensive API client library for Abyss Central service communication with built-in authentication, retry logic, circuit breaker, and security features.

## Features

- 🔐 **Authentication Management** - JWT token handling with automatic refresh
- 🔄 **Retry Logic** - Exponential backoff for failed requests
- ⚡ **Circuit Breaker** - Fault tolerance for service failures
- 🔗 **Correlation IDs** - Request tracking across services
- 🛡️ **Security First** - Secure headers, input validation, error handling
- 📊 **Structured Logging** - Request/response logging with metadata
- 🎯 **Type Safety** - Full TypeScript support with IntelliSense
- 🏗️ **Service-Oriented** - Dedicated clients for each service
- 📋 **Pagination** - Built-in pagination support
- 🔍 **Search & Filtering** - Standardized search interfaces

## Installation

This library is part of the Abyss Central monorepo and is used internally by the suite applications.

```bash
# Install dependencies in the monorepo root
npm install
```

## Usage

### Basic Service Client Usage

```typescript
import { createAuthServiceClient, createInventoryServiceClient } from '@abyss/api-client';

// Create service clients
const authClient = createAuthServiceClient('http://localhost:3001');
const inventoryClient = createInventoryServiceClient('http://localhost:3002');

// Login and get user
const loginResponse = await authClient.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get inventory items
const itemsResponse = await inventoryClient.getItems(1, 20);
```

### Using the Service Registry

```typescript
import { 
  ServiceClientRegistry, 
  createAuthServiceClient, 
  createInventoryServiceClient 
} from '@abyss/api-client';

// Create and configure registry
const registry = new ServiceClientRegistry();

// Register services
const authClient = registry.register('auth', createAuthServiceClient('http://localhost:3001'));
const inventoryClient = registry.register('inventory', createInventoryServiceClient('http://localhost:3002'));

// Use registered services
const auth = registry.get('auth');
const inventory = registry.get('inventory');

// Set auth tokens for all services
registry.setAuthTokensForAll(accessToken, refreshToken, expiresAt);

// Health check all services
const healthStatus = await registry.healthCheckAll();
```

### Authentication Flow

```typescript
import { AuthServiceClient } from '@abyss/api-client';

const authClient = new AuthServiceClient({
  baseURL: 'http://localhost:3001',
  timeout: 30000,
  retries: 3
});

// Login
const loginResult = await authClient.login({
  email: 'admin@abyss.com',
  password: 'securePassword123'
});

if (loginResult.success) {
  // Tokens are automatically stored in the client
  console.log('Logged in:', loginResult.data.user);
  
  // Get current user
  const userResult = await authClient.getCurrentUser();
  
  // Check permissions
  const hasPermission = await authClient.checkCurrentUserPermission('inventory:read');
}

// Refresh token when needed
const tokens = authClient.getTokens();
if (authClient.isTokenExpired() && tokens) {
  await authClient.refreshToken({ refreshToken: tokens.refreshToken });
}
```

### Inventory Management

```typescript
import { InventoryServiceClient } from '@abyss/api-client';

const inventoryClient = new InventoryServiceClient({
  baseURL: 'http://localhost:3002'
});

// Create inventory item
const newItem = await inventoryClient.createItem({
  name: 'LED Par Light',
  sku: 'LED-PAR-001',
  category: 'lighting',
  totalQuantity: 50,
  availableQuantity: 45,
  unitPrice: 150.00,
  location: 'Warehouse A',
  description: 'Professional LED Par Light with RGB colors'
});

// Search items
const searchResults = await inventoryClient.searchItems('LED', {
  category: 'lighting',
  inStock: true
});

// Check availability
const availability = await inventoryClient.checkAvailability({
  itemId: 'item-123',
  requestedQuantity: 5,
  startDate: '2024-01-15',
  endDate: '2024-01-20'
});

// Create reservation
if (availability.data.available) {
  const reservation = await inventoryClient.createReservation({
    itemId: 'item-123',
    quantity: 5,
    reservedFor: 'order-456',
    startDate: '2024-01-15',
    endDate: '2024-01-20'
  });
}
```

### Error Handling

```typescript
import { ApiError } from '@abyss/api-client';

try {
  const result = await inventoryClient.getItem('invalid-id');
} catch (error) {
  if (error.success === false) {
    // Structured API error
    const apiError = error as ApiError;
    console.error('API Error:', {
      code: apiError.error.code,
      message: apiError.error.message,
      correlationId: apiError.error.correlationId,
      details: apiError.error.details
    });
  } else {
    // Network or other error
    console.error('Network Error:', error);
  }
}
```

### Custom Service Client

```typescript
import { BaseServiceClient, ApiResponse } from '@abyss/api-client';

interface CustomData {
  id: string;
  name: string;
  value: number;
}

class CustomServiceClient extends BaseServiceClient {
  constructor(config: ServiceConfig) {
    super('custom-service', config);
  }

  async getCustomData(id: string): Promise<ApiResponse<CustomData>> {
    return this.get<CustomData>(`/custom/${id}`);
  }

  async createCustomData(data: Omit<CustomData, 'id'>): Promise<ApiResponse<CustomData>> {
    return this.post<CustomData>('/custom', data);
  }

  async searchCustomData(query: string): Promise<ApiResponse<CustomData[]>> {
    return this.search<CustomData>('/custom', query);
  }
}
```

## Service Clients

### AuthServiceClient

Authentication and user management:

- **Authentication**: login, logout, refresh tokens, verify tokens
- **User Management**: register, get, update, delete users
- **Role-Based Access Control**: roles, permissions, assignments
- **Multi-Factor Authentication**: enable, verify, disable MFA

### InventoryServiceClient

Equipment inventory management:

- **Inventory Items**: CRUD operations for equipment
- **Reservations**: create, update, cancel reservations
- **Availability**: check availability, get calendar
- **Adjustments**: track quantity changes
- **Bulk Operations**: import, bulk create/update
- **Reports**: summary, utilization, turnover reports

### BaseServiceClient

Foundation for all service clients:

- **HTTP Methods**: GET, POST, PUT, PATCH, DELETE
- **Pagination**: built-in pagination support
- **Search**: standardized search functionality
- **File Upload**: multipart form data support
- **Health Checks**: service health monitoring
- **Authentication**: token management
- **Logging**: structured request/response logging

## Configuration

### Environment Variables

```bash
# Service URLs
AUTH_SERVICE_URL=http://localhost:3001
INVENTORY_SERVICE_URL=http://localhost:3002
ORDER_SERVICE_URL=http://localhost:3003
EMPLOYEE_SERVICE_URL=http://localhost:3004
ANALYTICS_SERVICE_URL=http://localhost:3005

# Client Configuration
API_TIMEOUT=30000
API_RETRIES=3
```

### Service Configuration

```typescript
import { ServiceConfig } from '@abyss/api-client';

const config: ServiceConfig = {
  baseURL: 'http://localhost:3001',
  timeout: 30000,           // Request timeout in ms
  retries: 3,               // Number of retry attempts
  correlationIdHeader: 'X-Correlation-ID',
  authHeader: 'Authorization'
};
```

## Security Features

### Authentication

- **JWT Tokens** with automatic refresh
- **Secure Token Storage** in memory
- **Token Expiration Handling** with auto-refresh
- **Permission-Based Access Control**

### Request Security

- **Correlation IDs** for request tracking
- **Secure Headers** (User-Agent, Content-Type)
- **Input Validation** and sanitization
- **HTTPS Enforcement** in production

### Error Handling

- **Structured Error Responses** with correlation IDs
- **No Sensitive Data Leakage** in error messages
- **Circuit Breaker Pattern** for fault tolerance
- **Retry Logic** with exponential backoff

## Circuit Breaker

Automatic fault tolerance for service failures:

```typescript
// Circuit breaker states
enum CircuitBreakerState {
  CLOSED = 'CLOSED',     // Normal operation
  OPEN = 'OPEN',         // Service failing, requests blocked
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

// Configuration
const circuitBreakerConfig = {
  failureThreshold: 5,    // Failures before opening circuit
  resetTimeout: 60000,    // Time to wait before testing recovery
  monitoringPeriod: 10000 // Period for monitoring failures
};
```

## Development

```bash
# Build the library
turbo run build --filter=@abyss/api-client

# Watch mode for development
turbo run dev --filter=@abyss/api-client

# Run tests
turbo run test --filter=@abyss/api-client

# Type checking
turbo run typecheck --filter=@abyss/api-client
```

## Testing

```typescript
import { AuthServiceClient } from '@abyss/api-client';
import MockAdapter from 'axios-mock-adapter';

// Mock service responses for testing
const mockAuth = new MockAdapter(authClient.axiosInstance);

mockAuth.onPost('/auth/login').reply(200, {
  success: true,
  data: {
    user: { id: '1', email: 'test@example.com' },
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh',
    expiresAt: Date.now() + 3600000
  },
  correlationId: 'test-correlation-id',
  timestamp: new Date().toISOString()
});
```

## Best Practices

1. **Use Service Registry** for managing multiple service clients
2. **Handle Errors Gracefully** with proper error checking
3. **Implement Retry Logic** for transient failures
4. **Use Correlation IDs** for request tracking
5. **Monitor Service Health** with health check endpoints
6. **Secure Token Management** with automatic refresh
7. **Structured Logging** for debugging and monitoring

## Architecture

- **Axios** - HTTP client with interceptors and configuration
- **Circuit Breaker Pattern** - Fault tolerance for service failures
- **Retry Pattern** - Exponential backoff for failed requests
- **Service Registry** - Central management of service clients
- **TypeScript** - Full type safety and developer experience

---

Built with ❤️ for reliable service communication in the Abyss Central Suite