# Enterprise SaaS Template - System Architecture

This document provides a comprehensive overview of the Enterprise SaaS Template
architecture, design decisions, and implementation patterns.

## 🎯 Table of Contents

- [System Overview](#-system-overview)
- [Architecture Principles](#-architecture-principles)
- [Microservices Architecture](#-microservices-architecture)
- [Technology Stack](#-technology-stack)
- [Database Architecture](#-database-architecture)
- [Security Architecture](#-security-architecture)
- [Frontend Architecture](#-frontend-architecture)
- [API Design](#-api-design)
- [Data Flow](#-data-flow)
- [Infrastructure Architecture](#-infrastructure-architecture)
- [Development Architecture](#-development-architecture)
- [Quality Assurance](#-quality-assurance)
- [Scalability & Performance](#-scalability--performance)
- [Monitoring & Observability](#-monitoring--observability)
- [Deployment Strategy](#-deployment-strategy)

## 🏗️ System Overview

The Enterprise SaaS Template is designed as a modern, scalable, multi-tenant
SaaS platform built with a microservices architecture. It provides a
comprehensive foundation for building enterprise-grade applications with
security, scalability, and maintainability as core principles.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / CDN                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Load Balancer                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                   API Gateway                                   │
│  - Rate Limiting     - Authentication    - Request Routing     │
│  - Load Balancing    - Caching          - Monitoring           │
└─────────┬─────────────┬─────────────┬─────────────┬─────────────┘
          │             │             │             │
    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │   Auth    │ │Notification│ │ Analytics │ │  Admin    │
    │ Service   │ │  Service   │ │ Service   │ │ Service   │
    └─────┬─────┘ └─────┬─────┘ └─────┬─────┘ └─────┬─────┘
          │             │             │             │
    ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐
    │PostgreSQL │ │PostgreSQL │ │PostgreSQL │ │PostgreSQL │
    │   Auth    │ │  Notify   │ │ Analytics │ │  Admin    │
    └───────────┘ └───────────┘ └───────────┘ └───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     Shared Infrastructure                       │
│  - Redis Cache      - Message Queue     - File Storage         │
│  - Monitoring       - Logging           - Backup Systems       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Frontend Applications                      │
│  - Web App (React)  - Admin Dashboard   - Mobile App (Future)  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Characteristics

- **Microservices Architecture**: Loosely coupled, independently deployable
  services
- **Multi-Tenant**: Supports multiple customers with data isolation
- **Event-Driven**: Asynchronous communication between services
- **API-First**: All functionality exposed through well-documented APIs
- **Security-First**: Defense in depth with multiple security layers
- **Cloud-Native**: Designed for containerized deployment
- **Developer-Friendly**: Comprehensive tooling and documentation

## 🎯 Architecture Principles

### 1. Domain-Driven Design (DDD)

- Services organized around business domains
- Clear service boundaries based on business capabilities
- Ubiquitous language across teams

### 2. Single Responsibility

- Each service has one clear responsibility
- Microservices own their data and business logic
- Separation of concerns at all levels

### 3. Loose Coupling

- Services communicate via APIs and events
- No direct database access between services
- Independent deployment and scaling

### 4. High Cohesion

- Related functionality grouped together
- Strong internal consistency within services
- Minimal external dependencies

### 5. Fail-Safe Design

- Graceful degradation during failures
- Circuit breakers and retry mechanisms
- Comprehensive error handling

### 6. Security by Design

- Security considerations in every design decision
- Zero-trust architecture principles
- Defense in depth strategy

## 🏢 Microservices Architecture

### Service Catalog

#### Core Services

##### 1. Authentication Service (`auth-service`)

**Purpose**: User authentication, authorization, and session management

**Responsibilities**:

- User registration and login
- JWT token generation and validation
- Password management and reset
- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- OAuth2/OIDC integration

**Database**: PostgreSQL (users, roles, permissions, sessions) **API
Endpoints**: `/api/v1/auth/*` **Dependencies**: None (foundational service)

##### 2. API Gateway (`api-gateway`)

**Purpose**: Central entry point for all client requests

**Responsibilities**:

- Request routing to appropriate services
- Rate limiting and throttling
- Request/response transformation
- Caching layer
- Load balancing
- Authentication validation
- Monitoring and analytics

**Database**: Redis (for caching and rate limiting) **Dependencies**: All
services (routes to them)

##### 3. Notification Service (`notification-service`)

**Purpose**: Multi-channel notification delivery

**Responsibilities**:

- Email notifications (transactional and marketing)
- SMS notifications
- Push notifications
- In-app notifications
- Notification templates and personalization
- Delivery tracking and analytics

**Database**: PostgreSQL (notifications, templates, delivery logs) **API
Endpoints**: `/api/v1/notifications/*` **Dependencies**: Auth Service (for user
data)

##### 4. Analytics Service (`analytics-service`)

**Purpose**: Data collection, processing, and reporting

**Responsibilities**:

- Event tracking and collection
- Usage analytics and metrics
- Performance monitoring
- Business intelligence reports
- Data aggregation and visualization
- Custom dashboard creation

**Database**: PostgreSQL + Time-series DB for metrics **API Endpoints**:
`/api/v1/analytics/*` **Dependencies**: Auth Service (for user context)

##### 5. Admin Service (`admin-service`)

**Purpose**: Administrative operations and tenant management

**Responsibilities**:

- Tenant configuration and management
- User and role administration
- System configuration
- Audit logging
- Billing and subscription management
- Feature flag management

**Database**: PostgreSQL (tenants, configurations, audit logs) **API
Endpoints**: `/api/v1/admin/*` **Dependencies**: Auth Service, Analytics Service

#### Shared Libraries

##### 1. Service Bootstrap (`@template/service-bootstrap`)

**Purpose**: Common service initialization and configuration

**Features**:

- Express.js server setup with security middleware
- Database connection management
- Health check endpoints
- Graceful shutdown handling
- Logging and monitoring setup
- Error handling middleware

##### 2. Shared Types (`@template/shared-types`)

**Purpose**: TypeScript type definitions shared across services

**Contents**:

- Common entity interfaces
- API request/response types
- Event schemas
- Configuration types
- Utility types

##### 3. API Client (`@template/api-client`)

**Purpose**: Type-safe HTTP client for inter-service communication

**Features**:

- Auto-generated from OpenAPI specifications
- Request/response validation
- Retry logic and circuit breakers
- Authentication token management
- Error handling and logging

### Service Communication

#### Synchronous Communication

- **HTTP/REST APIs**: Primary communication method
- **GraphQL**: For complex data fetching requirements
- **gRPC**: For high-performance internal communication

#### Asynchronous Communication

- **Event Bus**: Redis Pub/Sub for real-time events
- **Message Queue**: For reliable task processing
- **Webhooks**: For external system integration

#### Data Consistency

- **Eventual Consistency**: Accepted for most operations
- **Saga Pattern**: For distributed transactions
- **Event Sourcing**: For audit trails and data recovery

## 🛠️ Technology Stack

### Backend Technologies

#### Core Runtime

- **Node.js 18+**: JavaScript runtime with modern features
- **TypeScript 5+**: Type-safe JavaScript with latest features
- **Express.js**: Web framework with extensive middleware ecosystem

#### Databases

- **PostgreSQL 15+**: Primary relational database
  - JSONB support for flexible schema
  - Full-text search capabilities
  - Advanced indexing and performance optimization
- **Redis 7+**: Caching and session storage
  - Pub/Sub for real-time messaging
  - Rate limiting and throttling
- **InfluxDB**: Time-series data for analytics (optional)

#### Security

- **JSON Web Tokens (JWT)**: Stateless authentication
- **bcrypt**: Password hashing with configurable cost
- **Helmet.js**: Security headers middleware
- **CORS**: Cross-origin resource sharing configuration
- **Rate Limiting**: Express-rate-limit with Redis backend

#### Validation & Serialization

- **Joi**: Schema validation for requests and configuration
- **Class-validator**: Decorator-based validation
- **JSON Schema**: API documentation and validation

### Frontend Technologies

#### Core Framework

- **React 18+**: Component-based UI library with Concurrent Mode
- **TypeScript**: Type-safe React development
- **Vite**: Fast build tool and development server

#### State Management

- **React Query (TanStack Query)**: Server state management
- **Zustand**: Lightweight client state management
- **React Context**: Component-level state sharing

#### Styling & UI

- **Tailwind CSS**: Utility-first CSS framework
- **Headless UI**: Accessible UI components
- **Radix UI**: Low-level UI primitives
- **Lucide React**: Modern icon library

#### Development Tools

- **Storybook**: Component development and documentation
- **React Testing Library**: Component testing
- **MSW**: API mocking for testing and development

### DevOps & Infrastructure

#### Development

- **pnpm**: Fast, disk space efficient package manager
- **Turborepo**: High-performance build system for monorepos
- **Docker**: Containerization for consistent environments
- **Docker Compose**: Local development orchestration

#### Quality Assurance

- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Husky**: Git hooks for quality enforcement
- **CommitLint**: Conventional commit validation
- **Jest**: Unit and integration testing

#### CI/CD

- **GitHub Actions**: Continuous integration and deployment
- **Semantic Release**: Automated versioning and changelog
- **Dependabot**: Automated dependency updates

#### Monitoring & Observability

- **OpenTelemetry**: Distributed tracing and metrics
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Metrics visualization and dashboards
- **Structured Logging**: JSON-based logging with correlation IDs

## 🗄️ Database Architecture

### Database-per-Service Pattern

Each microservice owns its database, ensuring:

- **Data Isolation**: No cross-service database access
- **Independent Scaling**: Scale databases based on service needs
- **Technology Diversity**: Choose optimal database per service
- **Fault Isolation**: Database failures don't cascade

### Database Design Patterns

#### 1. Authentication Database Schema

```sql
-- Users table with comprehensive user data
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status user_status_enum DEFAULT 'active',
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Roles and permissions for RBAC
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]'
);

-- User role assignments
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 2. Multi-Tenant Data Isolation

```sql
-- Tenant-aware table design
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    status tenant_status_enum DEFAULT 'active'
);

-- Resource tables with tenant isolation
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    user_id UUID NOT NULL,
    profile_data JSONB DEFAULT '{}',
    -- Composite index for tenant + user queries
    UNIQUE(tenant_id, user_id)
);
```

### Data Consistency Strategies

#### 1. Eventual Consistency

- **Event-driven updates**: Services publish events for data changes
- **Event sourcing**: Maintain event log for data reconstruction
- **Compensation actions**: Handle failed distributed operations

#### 2. Saga Pattern Implementation

```typescript
// Order processing saga example
class OrderProcessingSaga {
  async execute(order: Order) {
    try {
      // Step 1: Reserve inventory
      await this.inventoryService.reserve(order.items);

      // Step 2: Process payment
      await this.paymentService.charge(order.payment);

      // Step 3: Create shipment
      await this.shippingService.createShipment(order);

      // Step 4: Confirm order
      await this.orderService.confirm(order.id);
    } catch (error) {
      // Compensate in reverse order
      await this.compensate(order, error);
    }
  }
}
```

### Performance Optimization

#### Indexing Strategy

```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_users_tenant_status ON users(tenant_id, status);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read)
  WHERE read = false;

-- Partial indexes for performance
CREATE INDEX idx_active_sessions ON user_sessions(user_id)
  WHERE expires_at > now();
```

#### Connection Pooling

```typescript
// Database connection pool configuration
const poolConfig = {
  max: 20, // Maximum connections
  min: 5, // Minimum connections
  idle: 10000, // Close idle connections after 10s
  acquire: 60000, // Maximum time to get connection
  evict: 1000, // Check for idle connections every 1s
};
```

## 🔒 Security Architecture

### Defense in Depth Strategy

#### Layer 1: Network Security

- **Load Balancer**: SSL termination and DDoS protection
- **API Gateway**: First line of defense with rate limiting
- **Private Networks**: Services communicate within private subnets
- **Firewall Rules**: Restrict access to necessary ports only

#### Layer 2: Authentication & Authorization

- **JWT Tokens**: Short-lived access tokens (15 minutes)
- **Refresh Tokens**: Longer-lived tokens for renewal (7 days)
- **Role-Based Access Control (RBAC)**: Granular permissions
- **Multi-Factor Authentication**: Optional MFA for enhanced security

#### Layer 3: Application Security

- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries only
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: CSRF tokens for state-changing operations

#### Layer 4: Data Security

- **Encryption at Rest**: Database-level encryption
- **Encryption in Transit**: TLS 1.3 for all communications
- **Data Masking**: Sensitive data masked in logs
- **Backup Encryption**: Encrypted database backups

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant AuthService
    participant Database

    Client->>Gateway: POST /auth/login
    Gateway->>AuthService: Forward request
    AuthService->>Database: Validate credentials
    Database-->>AuthService: User data
    AuthService->>AuthService: Generate JWT tokens
    AuthService-->>Gateway: Access + Refresh tokens
    Gateway-->>Client: Tokens + User info

    Note over Client: Subsequent requests
    Client->>Gateway: API request + Access token
    Gateway->>Gateway: Validate JWT signature
    Gateway->>AuthService: Verify token (if needed)
    AuthService-->>Gateway: Token valid
    Gateway->>ServiceX: Forward authenticated request
```

### Authorization Model

#### RBAC Implementation

```typescript
// Role definition
interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

// Permission structure
interface Permission {
  resource: string; // e.g., 'users', 'orders'
  action: string; // e.g., 'read', 'write', 'delete'
  conditions?: {
    // Optional conditions
    own?: boolean; // Can only access own resources
    tenant?: string; // Tenant-specific access
  };
}

// Usage in middleware
const authorize = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user.roles;
    const hasPermission = checkPermission(userRoles, permission);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### Security Monitoring

#### Threat Detection

- **Failed Login Attempts**: Account lockout after threshold
- **Suspicious Activity**: Rate limiting and IP blocking
- **SQL Injection Attempts**: Pattern detection and alerting
- **Privilege Escalation**: Monitor role changes and permissions

#### Audit Logging

```typescript
// Audit log entry structure
interface AuditLogEntry {
  id: string;
  userId: string;
  tenantId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}
```

## 🎨 Frontend Architecture

### Component Architecture

#### Atomic Design Principles

```
src/
├── components/
│   ├── atoms/           # Basic building blocks
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Icon/
│   ├── molecules/       # Simple combinations
│   │   ├── SearchBox/
│   │   ├── FormField/
│   │   └── CardHeader/
│   ├── organisms/       # Complex components
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   └── DataTable/
│   ├── templates/       # Page layouts
│   │   ├── DashboardLayout/
│   │   └── AuthLayout/
│   └── pages/          # Complete pages
│       ├── Dashboard/
│       └── Login/
```

#### Component Development Standards

```typescript
// Standard component structure
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
}) => {
  const baseClasses = 'font-medium rounded-md transition-colors';
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <LoadingSpinner /> : children}
    </button>
  );
};
```

### State Management Strategy

#### 1. Server State (React Query)

```typescript
// API query with caching and error handling
export const useUsers = (params: UsersQueryParams) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiClient.users.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Mutation with optimistic updates
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: apiClient.users.create,
    onMutate: async newUser => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['users'] });
      const previousUsers = queryClient.getQueryData(['users']);

      queryClient.setQueryData(['users'], (old: any) => ({
        ...old,
        data: [...old.data, { ...newUser, id: 'temp-id' }],
      }));

      return { previousUsers };
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['users'], context?.previousUsers);
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
```

#### 2. Client State (Zustand)

```typescript
// Global application state
interface AppState {
  // User preferences
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Notification[];

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  theme: 'light',
  sidebarCollapsed: false,
  notifications: [],

  setTheme: theme => set({ theme }),
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
  addNotification: notification =>
    set({ notifications: [...get().notifications, notification] }),
  removeNotification: id =>
    set({ notifications: get().notifications.filter(n => n.id !== id) }),
}));
```

### Routing & Navigation

#### Route Structure

```typescript
// Route configuration with role-based access
export const routes = [
  {
    path: '/',
    component: DashboardLayout,
    requireAuth: true,
    children: [
      { path: '/dashboard', component: Dashboard, roles: ['user', 'admin'] },
      { path: '/users', component: Users, roles: ['admin'] },
      { path: '/settings', component: Settings, roles: ['user', 'admin'] },
    ],
  },
  {
    path: '/auth',
    component: AuthLayout,
    requireAuth: false,
    children: [
      { path: '/auth/login', component: Login },
      { path: '/auth/register', component: Register },
      { path: '/auth/forgot-password', component: ForgotPassword },
    ],
  },
];

// Route guard implementation
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({
  children,
  roles,
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (roles && !hasRequiredRole(user.roles, roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

## 🔗 API Design

### RESTful API Standards

#### Resource Naming Conventions

```
GET    /api/v1/users              # List users
POST   /api/v1/users              # Create user
GET    /api/v1/users/{id}         # Get user by ID
PUT    /api/v1/users/{id}         # Update user (full)
PATCH  /api/v1/users/{id}         # Update user (partial)
DELETE /api/v1/users/{id}         # Delete user

# Nested resources
GET    /api/v1/users/{id}/orders  # Get user's orders
POST   /api/v1/users/{id}/orders  # Create order for user

# Collection operations
POST   /api/v1/users/bulk         # Bulk create users
DELETE /api/v1/users/bulk         # Bulk delete users
```

#### Response Format Standardization

```typescript
// Standard API response envelope
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

// Pagination metadata
interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Example successful response
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_abc123"
  }
}

// Example error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Email format is invalid",
      "password": "Password must be at least 8 characters"
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_def456"
  }
}
```

### OpenAPI Specification

#### API Documentation Standards

```yaml
# OpenAPI 3.0 specification example
openapi: 3.0.3
info:
  title: Enterprise SaaS Template API
  version: 1.0.0
  description: Comprehensive API for the Enterprise SaaS Template
  contact:
    name: API Support
    email: api-support@example.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server

paths:
  /users:
    get:
      summary: List users
      description: Retrieve a paginated list of users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            minimum: 1
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UsersResponse'
```

### Error Handling Strategy

#### Error Classification

```typescript
// Error types with specific handling
export enum ErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors (5xx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.headers['x-correlation-id'] as string;

  // Log error with context
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    correlationId,
    path: req.path,
    method: req.method,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  // Determine error response
  if (error instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Invalid input data',
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: correlationId,
      },
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: correlationId,
    },
  });
};
```

## 🌊 Data Flow

### Request Flow Architecture

```mermaid
graph TD
    A[Client Application] -->|HTTPS Request| B[Load Balancer]
    B --> C[API Gateway]
    C -->|Authentication| D[Auth Service]
    D -->|JWT Validation| C
    C -->|Route Request| E[Target Service]
    E -->|Query Data| F[Service Database]
    F -->|Return Data| E
    E -->|API Response| C
    C -->|Forward Response| B
    B -->|HTTPS Response| A

    C -->|Cache Check| G[Redis Cache]
    G -->|Cache Hit/Miss| C

    E -->|Publish Event| H[Event Bus]
    H -->|Event Notification| I[Other Services]

    E -->|Log Request| J[Logging System]
    E -->|Metrics| K[Monitoring System]
```

### Event-Driven Architecture

#### Event Types and Flow

```typescript
// Domain event structure
interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  eventVersion: number;
  occurredAt: string;
  payload: any;
  metadata: {
    correlationId: string;
    causationId?: string;
    userId?: string;
    tenantId?: string;
  };
}

// Event publishing
class EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    // Persist event to event store
    await this.eventStore.save(event);

    // Publish to message bus
    await this.messageBus.publish(event.eventType, event);

    // Log event for monitoring
    logger.info('Event published', {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
    });
  }
}

// Event handling
class EventHandler {
  @EventListener('UserCreated')
  async handleUserCreated(event: DomainEvent<UserCreatedPayload>) {
    // Send welcome email
    await this.notificationService.sendWelcomeEmail(event.payload.userId);

    // Create user profile
    await this.profileService.createDefaultProfile(event.payload);

    // Update analytics
    await this.analyticsService.trackUserRegistration(event.payload);
  }
}
```

### Caching Strategy

#### Multi-Level Caching

```typescript
// Cache hierarchy
interface CacheStrategy {
  // L1: Application-level cache (in-memory)
  applicationCache: Map<string, any>;

  // L2: Distributed cache (Redis)
  distributedCache: RedisClient;

  // L3: CDN cache (for static content)
  cdnCache: CloudflareClient;
}

// Cache implementation
class CacheService {
  async get<T>(key: string): Promise<T | null> {
    // Check L1 cache first
    let value = this.applicationCache.get(key);
    if (value) {
      return value;
    }

    // Check L2 cache
    value = await this.distributedCache.get(key);
    if (value) {
      // Store in L1 for faster access
      this.applicationCache.set(key, value);
      return JSON.parse(value);
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    // Store in both L1 and L2
    this.applicationCache.set(key, value);
    await this.distributedCache.setex(key, ttl, JSON.stringify(value));
  }
}
```

## 🏗️ Infrastructure Architecture

### Container Architecture

#### Docker Configuration

```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy dependencies and built application
COPY --from=base /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Change ownership to non-root user
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### Docker Compose for Development

```yaml
version: '3.8'

services:
  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - auth-service
    networks:
      - backend

  # Authentication Service
  auth-service:
    build: ./services/auth-service
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:pass@postgres:5432/auth_db
    depends_on:
      - postgres
    networks:
      - backend

  # Shared Infrastructure
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=auth_db
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
    driver: bridge
```

### Cloud Architecture (AWS Example)

#### Infrastructure as Code (Terraform)

```hcl
# VPC and networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "enterprise-saas-vpc"
  }
}

# ECS Cluster for container orchestration
resource "aws_ecs_cluster" "main" {
  name = "enterprise-saas-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "enterprise-saas-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = true
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier = "enterprise-saas-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100

  db_name  = "enterprise_saas"
  username = var.db_username
  password = var.db_password

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "enterprise-saas-final-snapshot"
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "main" {
  cluster_id           = "enterprise-saas-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
}
```

### Kubernetes Deployment (Alternative)

#### Service Deployment

```yaml
# Auth Service Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  labels:
    app: auth-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: enterprise-saas/auth-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: 'production'
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: auth-secrets
                  key: database-url
            - name: JWT_SECRET
              valueFrom:
                secretKeyRef:
                  name: auth-secrets
                  key: jwt-secret
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

---
# Auth Service Service
apiVersion: v1
kind: Service
metadata:
  name: auth-service
spec:
  selector:
    app: auth-service
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
```

## 👨‍💻 Development Architecture

### Monorepo Structure

```
enterprise-saas-template/
├── apps/                          # Frontend applications
│   ├── web/                       # Main web application
│   ├── admin/                     # Admin dashboard
│   └── mobile/                    # Mobile app (future)
├── services/                      # Backend microservices
│   ├── auth-service/
│   ├── api-gateway/
│   ├── notification-service/
│   ├── analytics-service/
│   └── admin-service/
├── libs/                          # Shared libraries
│   ├── shared-types/              # TypeScript definitions
│   ├── shared-config/             # Configuration utilities
│   ├── shared-utils/              # Common utilities
│   ├── api-client/                # HTTP client library
│   ├── ui-components/             # React components
│   ├── service-bootstrap/         # Service initialization
│   ├── multi-tenancy/             # Multi-tenant utilities
│   └── plugin-system/             # Plugin architecture
├── tools/                         # Development tools
│   ├── generators/                # Code generators
│   ├── scripts/                   # Build and deployment scripts
│   └── linting/                   # Linting configurations
├── docs/                          # Documentation
├── .github/                       # GitHub workflows and templates
└── infrastructure/                # Infrastructure as Code
```

### Build System (Turborepo)

#### Pipeline Configuration

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"],
      "env": ["NODE_ENV", "DATABASE_URL"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "test/**/*"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  },
  "globalEnv": ["NODE_ENV", "CI"],
  "globalDependencies": [
    "package.json",
    "tsconfig.json",
    ".eslintrc.json",
    "turbo.json"
  ]
}
```

### Code Generation

#### Service Generator

```typescript
// Generator for creating new microservices
export class ServiceGenerator {
  async generate(serviceName: string, options: GeneratorOptions) {
    const templates = await this.loadTemplates();
    const context = this.createContext(serviceName, options);

    // Generate service structure
    await this.generateFiles(
      [
        'src/index.ts',
        'src/routes/',
        'src/controllers/',
        'src/services/',
        'src/models/',
        'package.json',
        'Dockerfile',
        'README.md',
      ],
      context
    );

    // Update workspace configuration
    await this.updateWorkspace(serviceName);

    // Generate OpenAPI specification
    await this.generateOpenApiSpec(serviceName, context);

    console.log(`✅ Service '${serviceName}' generated successfully!`);
  }
}
```

### Development Workflow

#### Git Workflow

```mermaid
gitGraph
    commit id: "Initial commit"
    branch develop
    checkout develop
    commit id: "Setup development branch"

    branch feature/auth-service
    checkout feature/auth-service
    commit id: "Add auth endpoints"
    commit id: "Add tests"
    commit id: "Add documentation"

    checkout develop
    merge feature/auth-service
    commit id: "Merge auth feature"

    branch release/v1.0.0
    checkout release/v1.0.0
    commit id: "Prepare release"
    commit id: "Update version"

    checkout main
    merge release/v1.0.0
    commit id: "Release v1.0.0"

    checkout develop
    merge main
    commit id: "Merge release back"
```

#### Development Environment Setup

```bash
# Initial setup
git clone <repository-url>
cd enterprise-saas-template
pnpm install

# Start development environment
docker-compose up -d postgres redis
pnpm run dev

# Run tests
pnpm run test

# Build for production
pnpm run build

# Generate new service
pnpm run generate:service user-management
```

## 🧪 Quality Assurance

### Testing Strategy

#### Testing Pyramid

```
                     /\
                    /  \
                   / E2E \           (Few, High-level, UI-focused)
                  /______\
                 /        \
                /Integration\        (Some, API-focused)
               /____________\
              /              \
             /      Unit       \     (Many, Fast, Isolated)
            /__________________\
```

#### Unit Testing

```typescript
// Service unit test example
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    userService = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const expectedUser = {
        id: 'user-id',
        ...userData,
        password: 'hashed-password',
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValue(expectedUser);

      const result = await userService.createUser(userData);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: expect.stringMatching(/^\$2[aby]\$10\$/), // bcrypt hash pattern
      });
      expect(result).toEqual(expectedUser);
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockRepository.create.mockRejectedValue(
        new Error('User with email already exists')
      );

      await expect(userService.createUser(userData)).rejects.toThrow(
        'User with email already exists'
      );
    });
  });
});
```

#### Integration Testing

```typescript
// API integration test
describe('Auth API Integration', () => {
  let app: Application;
  let testDatabase: TestDatabase;

  beforeAll(async () => {
    testDatabase = await TestDatabase.create();
    app = createApp({ database: testDatabase });
  });

  afterAll(async () => {
    await testDatabase.cleanup();
  });

  beforeEach(async () => {
    await testDatabase.reset();
  });

  describe('POST /auth/login', () => {
    it('should return JWT tokens for valid credentials', async () => {
      // Arrange
      const user = await testDatabase.createUser({
        email: 'test@example.com',
        password: 'password123',
      });

      // Act
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      // Assert
      expect(response.body).toMatchObject({
        success: true,
        data: {
          accessToken: expect.stringMatching(/^eyJ/),
          refreshToken: expect.stringMatching(/^eyJ/),
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
      });
    });

    it('should return error for invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Invalid credentials',
        },
      });
    });
  });
});
```

#### End-to-End Testing

```typescript
// E2E test with Playwright
import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
  test('should allow user to login and access dashboard', async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');

    // Fill login form
    await page.fill('[data-testid=email-input]', 'test@example.com');
    await page.fill('[data-testid=password-input]', 'password123');

    // Submit form
    await page.click('[data-testid=login-button]');

    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');

    // Verify user is logged in
    await expect(page.locator('[data-testid=user-menu]')).toBeVisible();
    await expect(page.locator('[data-testid=welcome-message]')).toContainText(
      'Welcome back'
    );
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    await page.fill('[data-testid=email-input]', 'invalid@example.com');
    await page.fill('[data-testid=password-input]', 'wrongpassword');
    await page.click('[data-testid=login-button]');

    // Verify error message
    await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    await expect(page.locator('[data-testid=error-message]')).toContainText(
      'Invalid credentials'
    );
  });
});
```

### Code Quality Gates

#### Quality Metrics

```typescript
// Quality metrics configuration
export const qualityGates = {
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  complexity: {
    max: 10, // Maximum cyclomatic complexity
  },
  duplication: {
    max: 3, // Maximum duplicated blocks
  },
  maintainability: {
    min: 70, // Minimum maintainability index
  },
  security: {
    vulnerabilities: 0, // No security vulnerabilities
    hotspots: 5, // Maximum security hotspots
  },
};

// SonarQube configuration
const sonarConfig = {
  'sonar.projectKey': 'enterprise-saas-template',
  'sonar.sources': 'src',
  'sonar.tests': 'test',
  'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
  'sonar.typescript.tsconfigPath': 'tsconfig.json',
  'sonar.qualitygate.wait': true,
};
```

## 🚀 Scalability & Performance

### Horizontal Scaling Strategy

#### Service Scaling

```yaml
# Kubernetes Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

#### Database Scaling

```typescript
// Database connection pooling and read replicas
export class DatabaseManager {
  private writePool: Pool;
  private readPools: Pool[];

  constructor() {
    // Write connection (primary)
    this.writePool = new Pool({
      host: process.env.DB_WRITE_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      max: 20, // Maximum connections
      min: 5, // Minimum connections
      idleTimeoutMillis: 30000, // Close idle connections
      connectionTimeoutMillis: 2000,
    });

    // Read connections (replicas)
    this.readPools = [
      new Pool({
        host: process.env.DB_READ_HOST_1,
        // ... same config as write pool
      }),
      new Pool({
        host: process.env.DB_READ_HOST_2,
        // ... same config as write pool
      }),
    ];
  }

  async query(sql: string, params: any[], readOnly = false) {
    const pool = readOnly ? this.getReadPool() : this.writePool;

    return pool.query(sql, params);
  }

  private getReadPool(): Pool {
    // Round-robin load balancing
    const index = Math.floor(Math.random() * this.readPools.length);
    return this.readPools[index];
  }
}
```

### Performance Optimization

#### Caching Strategies

```typescript
// Multi-level caching implementation
export class PerformanceOptimizer {
  // Application-level cache with TTL
  private memoryCache = new Map<string, CacheEntry>();

  // Redis distributed cache
  private redisCache: RedisClient;

  // CDN cache for static content
  private cdnCache: CDNClient;

  async get<T>(key: string, fetchFunction: () => Promise<T>): Promise<T> {
    // L1: Check memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.value;
    }

    // L2: Check Redis cache
    const redisValue = await this.redisCache.get(key);
    if (redisValue) {
      const value = JSON.parse(redisValue);
      this.setMemoryCache(key, value, 300); // 5 minute TTL
      return value;
    }

    // L3: Fetch from source
    const value = await fetchFunction();

    // Store in all cache levels
    await this.setAllCaches(key, value);

    return value;
  }

  private async setAllCaches<T>(key: string, value: T): Promise<void> {
    // Memory cache (5 minutes)
    this.setMemoryCache(key, value, 300);

    // Redis cache (1 hour)
    await this.redisCache.setex(key, 3600, JSON.stringify(value));

    // CDN cache for static content (24 hours)
    if (this.isStaticContent(key)) {
      await this.cdnCache.set(key, value, 86400);
    }
  }
}
```

#### Database Query Optimization

```sql
-- Performance-optimized queries with proper indexing

-- Index for user authentication
CREATE INDEX CONCURRENTLY idx_users_email_active
ON users(email)
WHERE status = 'active';

-- Composite index for tenant-aware queries
CREATE INDEX CONCURRENTLY idx_orders_tenant_created
ON orders(tenant_id, created_at DESC);

-- Partial index for unprocessed notifications
CREATE INDEX CONCURRENTLY idx_notifications_unprocessed
ON notifications(created_at)
WHERE processed = false;

-- Example optimized query with explain plan
EXPLAIN (ANALYZE, BUFFERS)
SELECT u.id, u.email, u.first_name, u.last_name,
       COUNT(o.id) as order_count,
       MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.tenant_id = $1
  AND u.status = 'active'
  AND u.created_at >= $2
GROUP BY u.id, u.email, u.first_name, u.last_name
ORDER BY u.created_at DESC
LIMIT 50;
```

### Load Testing Strategy

#### Performance Testing with k6

```javascript
// Load test script for authentication service
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests under 2s
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'], // Custom error rate under 10%
  },
};

const BASE_URL = 'https://api.example.com';

export default function () {
  // Test user login
  const loginResponse = http.post(`${BASE_URL}/auth/login`, {
    email: `user${Math.floor(Math.random() * 1000)}@example.com`,
    password: 'password123',
  });

  const loginSuccess = check(loginResponse, {
    'login status is 200': r => r.status === 200,
    'login response time < 1000ms': r => r.timings.duration < 1000,
    'access token received': r => r.json('data.accessToken') !== undefined,
  });

  errorRate.add(!loginSuccess);

  if (loginSuccess) {
    const token = loginResponse.json('data.accessToken');

    // Test authenticated API call
    const profileResponse = http.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(profileResponse, {
      'profile status is 200': r => r.status === 200,
      'profile response time < 500ms': r => r.timings.duration < 500,
    });
  }

  sleep(1);
}
```

## 📊 Monitoring & Observability

### Distributed Tracing

#### OpenTelemetry Implementation

```typescript
// Tracing setup
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Custom tracing in services
export class TracedUserService {
  @Trace('UserService.createUser')
  async createUser(userData: CreateUserRequest): Promise<User> {
    const span = trace.getActiveSpan();
    span?.setAttributes({
      'user.email': userData.email,
      'user.tenant_id': userData.tenantId,
    });

    try {
      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);
      span?.addEvent('Password hashed');

      // Create user
      const user = await this.userRepository.create({
        ...userData,
        password: hashedPassword,
      });
      span?.addEvent('User created', { 'user.id': user.id });

      // Publish event
      await this.eventPublisher.publish({
        eventType: 'UserCreated',
        aggregateId: user.id,
        payload: user,
      });
      span?.addEvent('Event published');

      return user;
    } catch (error) {
      span?.recordException(error as Error);
      span?.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    }
  }
}
```

### Metrics Collection

#### Prometheus Metrics

```typescript
// Custom metrics collection
import promClient from 'prom-client';

// HTTP request metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Business metrics
const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['tenant_id'],
});

const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of currently active users',
  labelNames: ['tenant_id'],
});

// Middleware for HTTP metrics
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);

    httpRequestsTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
  });

  next();
};
```

### Logging Strategy

#### Structured Logging

```typescript
// Centralized logging configuration
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.SERVICE_NAME,
    version: process.env.SERVICE_VERSION,
  },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Correlation ID middleware
export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();

  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);

  // Add correlation ID to logger context
  req.logger = logger.child({ correlationId });

  next();
};

// Usage in services
export class UserService {
  async createUser(userData: CreateUserRequest, logger: Logger): Promise<User> {
    logger.info('Creating user', {
      email: userData.email,
      tenantId: userData.tenantId,
    });

    try {
      const user = await this.userRepository.create(userData);

      logger.info('User created successfully', {
        userId: user.id,
        email: user.email,
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user', {
        error: error.message,
        stack: error.stack,
        email: userData.email,
      });

      throw error;
    }
  }
}
```

### Health Checks

#### Comprehensive Health Monitoring

```typescript
// Health check implementation
export class HealthCheckService {
  private checks: Map<string, HealthCheck> = new Map();

  constructor(
    private database: DatabaseManager,
    private redis: RedisClient,
    private externalServices: ExternalServiceClient[]
  ) {
    this.registerChecks();
  }

  private registerChecks() {
    // Database health check
    this.checks.set('database', {
      name: 'PostgreSQL Database',
      check: async () => {
        const start = Date.now();
        await this.database.query('SELECT 1', []);
        const duration = Date.now() - start;

        return {
          status: duration < 1000 ? 'healthy' : 'degraded',
          responseTime: duration,
          details: { query: 'SELECT 1' },
        };
      },
    });

    // Redis health check
    this.checks.set('redis', {
      name: 'Redis Cache',
      check: async () => {
        const start = Date.now();
        await this.redis.ping();
        const duration = Date.now() - start;

        return {
          status: duration < 500 ? 'healthy' : 'degraded',
          responseTime: duration,
        };
      },
    });

    // External service health checks
    this.externalServices.forEach((service, index) => {
      this.checks.set(`external_${index}`, {
        name: service.name,
        check: async () => service.healthCheck(),
      });
    });
  }

  async getHealth(): Promise<HealthStatus> {
    const results = new Map<string, HealthCheckResult>();
    const startTime = Date.now();

    // Run all health checks in parallel
    await Promise.all(
      Array.from(this.checks.entries()).map(async ([name, check]) => {
        try {
          const result = await Promise.race([
            check.check(),
            this.timeout(5000), // 5 second timeout
          ]);
          results.set(name, result);
        } catch (error) {
          results.set(name, {
            status: 'unhealthy',
            error: error.message,
          });
        }
      })
    );

    // Determine overall status
    const overallStatus = this.determineOverallStatus(results);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      version: process.env.SERVICE_VERSION,
      checks: Object.fromEntries(results),
    };
  }

  private determineOverallStatus(
    results: Map<string, HealthCheckResult>
  ): string {
    const statuses = Array.from(results.values()).map(r => r.status);

    if (statuses.includes('unhealthy')) return 'unhealthy';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }
}
```

## 🚀 Deployment Strategy

### CI/CD Pipeline

#### GitHub Actions Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: enterprise-saas

jobs:
  # Quality Gates
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run quality checks
        run: |
          pnpm run lint
          pnpm run typecheck
          pnpm run test:coverage
          pnpm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  # Security Scanning
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'repo'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # Build and Push Images
  build:
    needs: [quality, security]
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: [auth-service, api-gateway, notification-service]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./services/${{ matrix.service }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}:latest
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Deploy to Staging
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          # Update Kubernetes manifests
          kubectl set image deployment/auth-service \
            auth-service=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/auth-service:${{ github.sha }}

          # Wait for rollout
          kubectl rollout status deployment/auth-service

  # Deploy to Production
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          # Blue-green deployment
          ./scripts/blue-green-deploy.sh ${{ github.sha }}
```

### Deployment Patterns

#### Blue-Green Deployment

```bash
#!/bin/bash
# Blue-green deployment script

set -e

NEW_VERSION=$1
NAMESPACE="production"
SERVICE_NAME="auth-service"

echo "Starting blue-green deployment for ${SERVICE_NAME}:${NEW_VERSION}"

# Create green deployment
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${SERVICE_NAME}-green
  namespace: ${NAMESPACE}
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${SERVICE_NAME}
      version: green
  template:
    metadata:
      labels:
        app: ${SERVICE_NAME}
        version: green
    spec:
      containers:
      - name: ${SERVICE_NAME}
        image: ghcr.io/enterprise-saas/${SERVICE_NAME}:${NEW_VERSION}
        ports:
        - containerPort: 3000
EOF

# Wait for green deployment to be ready
echo "Waiting for green deployment to be ready..."
kubectl rollout status deployment/${SERVICE_NAME}-green -n ${NAMESPACE}

# Run health checks on green deployment
echo "Running health checks on green deployment..."
GREEN_POD=$(kubectl get pods -n ${NAMESPACE} -l app=${SERVICE_NAME},version=green -o jsonpath="{.items[0].metadata.name}")
kubectl exec -n ${NAMESPACE} ${GREEN_POD} -- curl -f http://localhost:3000/health

# Switch traffic to green
echo "Switching traffic to green deployment..."
kubectl patch service ${SERVICE_NAME} -n ${NAMESPACE} -p '{"spec":{"selector":{"version":"green"}}}'

# Wait and verify
sleep 30
echo "Verifying green deployment..."
curl -f https://api.example.com/health

# Clean up blue deployment
echo "Cleaning up blue deployment..."
kubectl delete deployment ${SERVICE_NAME}-blue -n ${NAMESPACE} --ignore-not-found=true

# Rename green to blue for next deployment
kubectl patch deployment ${SERVICE_NAME}-green -n ${NAMESPACE} -p '{"metadata":{"name":"'${SERVICE_NAME}'-blue"}}'

echo "Blue-green deployment completed successfully!"
```

#### Canary Deployment with Istio

```yaml
# Canary deployment configuration
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: auth-service-rollout
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 10 # 10% traffic to new version
        - pause: { duration: 300s }
        - setWeight: 25 # 25% traffic to new version
        - pause: { duration: 300s }
        - setWeight: 50 # 50% traffic to new version
        - pause: { duration: 300s }
        - setWeight: 75 # 75% traffic to new version
        - pause: { duration: 300s }
      # Full rollout
      canaryService: auth-service-canary
      stableService: auth-service-stable
      trafficRouting:
        istio:
          virtualService:
            name: auth-service-vs
            routes:
              - primary
      analysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: auth-service
          - name: canary-hash
            valueFrom:
              podTemplateHashValue: Latest
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
        - name: auth-service
          image: ghcr.io/enterprise-saas/auth-service:latest
          ports:
            - containerPort: 3000
```

### Environment Management

#### Configuration Management

```typescript
// Environment-specific configuration
export const config = {
  development: {
    database: {
      host: 'localhost',
      port: 5432,
      ssl: false,
    },
    redis: {
      host: 'localhost',
      port: 6379,
    },
    jwt: {
      expirationTime: '24h', // Longer for development
    },
    logging: {
      level: 'debug',
    },
  },
  staging: {
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: true,
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    jwt: {
      expirationTime: '1h',
    },
    logging: {
      level: 'info',
    },
  },
  production: {
    database: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      ssl: true,
      pool: {
        min: 10,
        max: 30,
      },
    },
    redis: {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      cluster: true,
    },
    jwt: {
      expirationTime: '15m', // Short-lived in production
    },
    logging: {
      level: 'warn',
    },
  },
};
```

---

## 📚 Additional Resources

### Documentation Standards

- **API Documentation**: OpenAPI 3.0 specifications for all services
- **Architecture Decision Records (ADRs)**: Document important architectural
  decisions
- **Runbooks**: Operational procedures for common scenarios
- **Troubleshooting Guides**: Common issues and solutions

### Development Tools

- **Code Generators**: Scaffolding for new services and components
- **Development Environment**: Docker Compose for local development
- **Testing Tools**: Comprehensive testing framework and utilities
- **Monitoring**: Local monitoring stack for development

### Security Resources

- **Security Playbook**: Response procedures for security incidents
- **Compliance Guidelines**: GDPR, SOC2, and other compliance requirements
- **Security Training**: Resources for security best practices
- **Penetration Testing**: Regular security assessments

### Performance Resources

- **Performance Benchmarks**: Baseline performance metrics
- **Optimization Guides**: Performance tuning recommendations
- **Capacity Planning**: Guidelines for scaling decisions
- **Load Testing**: Tools and procedures for performance testing

---

This architecture document serves as the comprehensive guide for understanding,
developing, and maintaining the Enterprise SaaS Template. It should be updated
regularly as the system evolves and new patterns are adopted.

**Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: March 2025
