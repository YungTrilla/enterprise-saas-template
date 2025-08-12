# API Documentation Guidelines

This document outlines the comprehensive API documentation standards and
guidelines for the Enterprise SaaS Template.

## 🎯 Table of Contents

- [Overview](#-overview)
- [Documentation Standards](#-documentation-standards)
- [OpenAPI Specifications](#-openapi-specifications)
- [API Design Guidelines](#-api-design-guidelines)
- [Documentation Structure](#-documentation-structure)
- [Generation & Automation](#-generation--automation)
- [Development Workflow](#-development-workflow)
- [Best Practices](#-best-practices)
- [Tools & Resources](#-tools--resources)

## 🎯 Overview

API documentation is a critical component of our enterprise SaaS platform.
Well-documented APIs enable:

- **Developer Productivity**: Fast onboarding and integration
- **Maintenance**: Clear understanding of system behavior
- **Testing**: Comprehensive test coverage and validation
- **Compliance**: Audit trails and regulatory requirements
- **Collaboration**: Effective communication between teams

### Documentation Principles

1. **API-First Development**: Documentation drives implementation
2. **Living Documentation**: Automatically updated and always current
3. **Comprehensive Coverage**: All endpoints, parameters, and responses
4. **Clear Examples**: Real-world usage scenarios
5. **Consistent Standards**: Uniform format across all services

## 📋 Documentation Standards

### OpenAPI 3.0 Specification

All APIs must be documented using OpenAPI 3.0 format with the following
structure:

```yaml
openapi: 3.0.3
info:
  title: Service Name API
  version: 1.0.0
  description: Comprehensive description of the service
  contact:
    name: API Support Team
    email: api-support@example.com
    url: https://docs.example.com/support
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT
  termsOfService: https://example.com/terms

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
  - url: http://localhost:3000/v1
    description: Local development server

paths:
  # API endpoints defined here

components:
  schemas:
    # Data models defined here
  securitySchemes:
    # Authentication schemes defined here
  responses:
    # Common responses defined here
  parameters:
    # Common parameters defined here

security:
  - bearerAuth: []

tags:
  - name: Authentication
    description: User authentication and authorization
  - name: Users
    description: User management operations
```

### Required Information

Every API specification must include:

#### Service Information

- **Title**: Clear, descriptive service name
- **Version**: Semantic versioning (x.y.z)
- **Description**: Purpose and functionality overview
- **Contact**: Support team information
- **License**: Legal license information

#### Endpoint Documentation

- **Summary**: Brief endpoint description
- **Description**: Detailed functionality explanation
- **Parameters**: All query, path, and header parameters
- **Request Body**: Complete schema with examples
- **Responses**: All possible responses with schemas
- **Security**: Authentication requirements
- **Tags**: Logical grouping of endpoints

#### Data Models

- **Schemas**: Complete data model definitions
- **Examples**: Representative data samples
- **Validation**: Constraints and requirements
- **Relationships**: Inter-model dependencies

## 🔧 OpenAPI Specifications

### Service-Specific Specifications

Each service maintains its own OpenAPI specification:

```
services/
├── auth-service/
│   ├── docs/
│   │   ├── openapi.yaml          # Main API specification
│   │   ├── schemas/              # Schema definitions
│   │   │   ├── user.yaml
│   │   │   ├── role.yaml
│   │   │   └── session.yaml
│   │   └── examples/             # Request/response examples
│   │       ├── login.yaml
│   │       └── register.yaml
│   └── src/
├── notification-service/
│   ├── docs/
│   │   ├── openapi.yaml
│   │   └── schemas/
│   └── src/
```

### Authentication Service API Example

#### Complete OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Authentication Service API
  version: 1.0.0
  description: |
    Comprehensive authentication and authorization service for the Enterprise SaaS platform.

    This service handles:
    - User registration and authentication
    - JWT token management
    - Role-based access control (RBAC)
    - Multi-factor authentication (MFA)
    - Password management
  contact:
    name: Authentication Team
    email: auth-team@example.com
  license:
    name: MIT

servers:
  - url: https://api.example.com/v1
    description: Production server
  - url: https://staging-api.example.com/v1
    description: Staging server
  - url: http://localhost:3001/v1
    description: Local development

paths:
  /auth/register:
    post:
      tags:
        - Authentication
      summary: Register new user
      description: |
        Create a new user account with email verification.

        **Business Rules:**
        - Email must be unique across the system
        - Password must meet complexity requirements
        - User starts with 'pending' status until email verification

        **Security:**
        - Passwords are hashed using bcrypt
        - Rate limited to prevent abuse
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RegisterRequest'
            examples:
              basic_registration:
                summary: Basic user registration
                value:
                  email: 'john.doe@example.com'
                  password: 'SecureP@ssw0rd123'
                  firstName: 'John'
                  lastName: 'Doe'
                  acceptTerms: true
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RegisterResponse'
              examples:
                success:
                  value:
                    success: true
                    data:
                      user:
                        id: '550e8400-e29b-41d4-a716-446655440000'
                        email: 'john.doe@example.com'
                        firstName: 'John'
                        lastName: 'Doe'
                        status: 'pending'
                        emailVerified: false
                        createdAt: '2024-01-01T12:00:00Z'
                      message:
                        'Registration successful. Please check your email for
                        verification.'
                    meta:
                      timestamp: '2024-01-01T12:00:00Z'
                      requestId: 'req_abc123'
        '400':
          $ref: '#/components/responses/ValidationError'
        '409':
          $ref: '#/components/responses/ConflictError'
        '429':
          $ref: '#/components/responses/RateLimitError'
        '500':
          $ref: '#/components/responses/InternalServerError'

  /auth/login:
    post:
      tags:
        - Authentication
      summary: Authenticate user
      description: |
        Authenticate user with email and password, returning JWT tokens.

        **Returns:**
        - Access token (15 minutes expiry)
        - Refresh token (7 days expiry)
        - User profile information

        **Security Features:**
        - Account lockout after failed attempts
        - Audit logging of login attempts
        - Optional MFA verification
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
            examples:
              standard_login:
                summary: Standard email/password login
                value:
                  email: 'john.doe@example.com'
                  password: 'SecureP@ssw0rd123'
              mfa_login:
                summary: Login with MFA token
                value:
                  email: 'john.doe@example.com'
                  password: 'SecureP@ssw0rd123'
                  mfaToken: '123456'
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
        '401':
          $ref: '#/components/responses/AuthenticationError'
        '423':
          $ref: '#/components/responses/AccountLockedError'
        '429':
          $ref: '#/components/responses/RateLimitError'

  /auth/refresh:
    post:
      tags:
        - Authentication
      summary: Refresh access token
      description: Exchange refresh token for new access token
      security:
        - refreshToken: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RefreshRequest'
      responses:
        '200':
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RefreshResponse'
        '401':
          $ref: '#/components/responses/InvalidTokenError'

  /users/profile:
    get:
      tags:
        - Users
      summary: Get user profile
      description: Retrieve authenticated user's profile information
      security:
        - bearerAuth: []
      responses:
        '200':
          description: User profile retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfileResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

    patch:
      tags:
        - Users
      summary: Update user profile
      description: Update user profile information
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateProfileRequest'
      responses:
        '200':
          description: Profile updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserProfileResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

components:
  schemas:
    # Request schemas
    RegisterRequest:
      type: object
      required:
        - email
        - password
        - firstName
        - lastName
        - acceptTerms
      properties:
        email:
          type: string
          format: email
          maxLength: 255
          example: 'john.doe@example.com'
          description: "User's email address (must be unique)"
        password:
          type: string
          minLength: 8
          maxLength: 128
          example: 'SecureP@ssw0rd123'
          description:
            'Password with minimum 8 characters, including uppercase, lowercase,
            number, and special character'
        firstName:
          type: string
          minLength: 1
          maxLength: 100
          example: 'John'
          description: "User's first name"
        lastName:
          type: string
          minLength: 1
          maxLength: 100
          example: 'Doe'
          description: "User's last name"
        acceptTerms:
          type: boolean
          example: true
          description: 'User must accept terms of service'

    LoginRequest:
      type: object
      required:
        - email
        - password
      properties:
        email:
          type: string
          format: email
          example: 'john.doe@example.com'
        password:
          type: string
          example: 'SecureP@ssw0rd123'
        mfaToken:
          type: string
          pattern: '^[0-9]{6}$'
          example: '123456'
          description: '6-digit MFA token (required if MFA is enabled)'

    RefreshRequest:
      type: object
      required:
        - refreshToken
      properties:
        refreshToken:
          type: string
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

    UpdateProfileRequest:
      type: object
      properties:
        firstName:
          type: string
          minLength: 1
          maxLength: 100
        lastName:
          type: string
          minLength: 1
          maxLength: 100
        phoneNumber:
          type: string
          pattern: "^\\+[1-9]\\d{1,14}$"
          example: '+1234567890'

    # Response schemas
    RegisterResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: object
              properties:
                user:
                  $ref: '#/components/schemas/User'
                message:
                  type: string
                  example:
                    'Registration successful. Please check your email for
                    verification.'

    LoginResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: object
              properties:
                accessToken:
                  type: string
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                refreshToken:
                  type: string
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                expiresIn:
                  type: integer
                  example: 900
                  description: 'Access token expiration in seconds'
                user:
                  $ref: '#/components/schemas/User'

    RefreshResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              type: object
              properties:
                accessToken:
                  type: string
                expiresIn:
                  type: integer

    UserProfileResponse:
      allOf:
        - $ref: '#/components/schemas/ApiResponse'
        - type: object
          properties:
            data:
              $ref: '#/components/schemas/UserProfile'

    # Entity schemas
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
          example: '550e8400-e29b-41d4-a716-446655440000'
        email:
          type: string
          format: email
          example: 'john.doe@example.com'
        firstName:
          type: string
          example: 'John'
        lastName:
          type: string
          example: 'Doe'
        status:
          type: string
          enum: [pending, active, suspended, deleted]
          example: 'active'
        emailVerified:
          type: boolean
          example: true
        mfaEnabled:
          type: boolean
          example: false
        lastLoginAt:
          type: string
          format: date-time
          example: '2024-01-01T12:00:00Z'
        createdAt:
          type: string
          format: date-time
          example: '2024-01-01T12:00:00Z'
        updatedAt:
          type: string
          format: date-time
          example: '2024-01-01T12:00:00Z'

    UserProfile:
      allOf:
        - $ref: '#/components/schemas/User'
        - type: object
          properties:
            phoneNumber:
              type: string
              example: '+1234567890'
            timezone:
              type: string
              example: 'America/New_York'
            locale:
              type: string
              example: 'en-US'
            preferences:
              type: object
              properties:
                notifications:
                  type: object
                  properties:
                    email:
                      type: boolean
                    sms:
                      type: boolean
                    push:
                      type: boolean
                theme:
                  type: string
                  enum: [light, dark, auto]

    # Common response structure
    ApiResponse:
      type: object
      required:
        - success
        - meta
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
          description: 'Response data (present on success)'
        error:
          $ref: '#/components/schemas/ApiError'
        meta:
          $ref: '#/components/schemas/ResponseMeta'

    ApiError:
      type: object
      required:
        - code
        - message
      properties:
        code:
          type: string
          example: 'VALIDATION_ERROR'
        message:
          type: string
          example: 'Invalid input data'
        details:
          type: object
          additionalProperties: true
          example:
            email: 'Email format is invalid'
            password: 'Password is too weak'

    ResponseMeta:
      type: object
      required:
        - timestamp
        - requestId
      properties:
        timestamp:
          type: string
          format: date-time
          example: '2024-01-01T12:00:00Z'
        requestId:
          type: string
          example: 'req_abc123'
        pagination:
          $ref: '#/components/schemas/PaginationMeta'

    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
          minimum: 1
          example: 1
        limit:
          type: integer
          minimum: 1
          maximum: 100
          example: 20
        total:
          type: integer
          minimum: 0
          example: 150
        totalPages:
          type: integer
          minimum: 0
          example: 8
        hasNextPage:
          type: boolean
          example: true
        hasPreviousPage:
          type: boolean
          example: false

  responses:
    ValidationError:
      description: Validation error
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'VALIDATION_ERROR'
                      message:
                        example: 'Invalid input data'
                      details:
                        type: object
                        example:
                          email: 'Email format is invalid'
                          password: 'Password must be at least 8 characters'

    AuthenticationError:
      description: Authentication failed
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'AUTHENTICATION_FAILED'
                      message:
                        example: 'Invalid credentials'

    UnauthorizedError:
      description: Unauthorized access
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'UNAUTHORIZED'
                      message:
                        example: 'Access token is required'

    NotFoundError:
      description: Resource not found
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'RESOURCE_NOT_FOUND'
                      message:
                        example: 'The requested resource was not found'

    ConflictError:
      description: Resource conflict
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'RESOURCE_CONFLICT'
                      message:
                        example: 'A user with this email already exists'

    RateLimitError:
      description: Rate limit exceeded
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'RATE_LIMIT_EXCEEDED'
                      message:
                        example: 'Too many requests. Please try again later.'

    AccountLockedError:
      description: Account locked due to failed attempts
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'ACCOUNT_LOCKED'
                      message:
                        example:
                          'Account is temporarily locked due to multiple failed
                          login attempts'

    InvalidTokenError:
      description: Invalid or expired token
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'INVALID_TOKEN'
                      message:
                        example: 'Token is invalid or expired'

    InternalServerError:
      description: Internal server error
      content:
        application/json:
          schema:
            allOf:
              - $ref: '#/components/schemas/ApiResponse'
              - type: object
                properties:
                  success:
                    example: false
                  error:
                    type: object
                    properties:
                      code:
                        example: 'INTERNAL_SERVER_ERROR'
                      message:
                        example: 'An unexpected error occurred'

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT access token for authenticated requests.

        **Format**: `Bearer <token>`
        **Expiry**: 15 minutes
        **Renewal**: Use refresh token to get new access token

    refreshToken:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT refresh token for token renewal.

        **Format**: `Bearer <refresh_token>`
        **Expiry**: 7 days
        **Usage**: Only for token refresh endpoint

  parameters:
    PageParam:
      name: page
      in: query
      description: Page number for pagination
      schema:
        type: integer
        minimum: 1
        default: 1
      example: 1

    LimitParam:
      name: limit
      in: query
      description: Number of items per page
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 20
      example: 20

    SortParam:
      name: sort
      in: query
      description: Sort field and direction
      schema:
        type: string
        pattern: '^[a-zA-Z_][a-zA-Z0-9_]*(:asc|:desc)?$'
      example: 'createdAt:desc'

security:
  - bearerAuth: []

tags:
  - name: Authentication
    description: |
      User authentication and session management endpoints.

      **Features:**
      - Email/password authentication
      - JWT token-based sessions
      - Multi-factor authentication (MFA)
      - Account security and lockout protection

  - name: Users
    description: |
      User profile and account management endpoints.

      **Features:**
      - Profile information management
      - Account settings and preferences
      - Security settings
      - Account deletion and data export

externalDocs:
  description: Complete API Documentation
  url: https://docs.example.com/api
```

## 🎨 API Design Guidelines

### RESTful Design Principles

#### Resource Naming

```
✅ Good Examples:
GET    /users                    # Collection
GET    /users/{id}               # Individual resource
POST   /users                    # Create resource
PUT    /users/{id}               # Replace resource
PATCH  /users/{id}               # Update resource
DELETE /users/{id}               # Delete resource

GET    /users/{id}/orders        # Nested resources
POST   /users/{id}/orders        # Create nested resource

❌ Bad Examples:
GET    /getUsers                 # Verb in URL
POST   /users/create             # Unnecessary action
GET    /user                     # Singular for collection
```

#### HTTP Status Codes

```
✅ Success Codes:
200 OK          # Successful GET, PATCH, DELETE
201 Created     # Successful POST
202 Accepted    # Asynchronous operation started
204 No Content  # Successful DELETE with no response body

✅ Client Error Codes:
400 Bad Request      # Invalid request format
401 Unauthorized     # Authentication required
403 Forbidden        # Insufficient permissions
404 Not Found        # Resource doesn't exist
409 Conflict         # Resource conflict (duplicate)
422 Unprocessable    # Validation failed
429 Too Many Requests # Rate limit exceeded

✅ Server Error Codes:
500 Internal Server Error # Unexpected server error
502 Bad Gateway          # Upstream service error
503 Service Unavailable  # Service temporarily down
504 Gateway Timeout      # Upstream service timeout
```

#### Request/Response Format

**Consistent Response Envelope:**

```json
{
  "success": true,
  "data": {
    // Actual response data
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_abc123",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

**Error Response Format:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "email": "Email format is invalid",
      "password": "Password is too weak"
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_def456"
  }
}
```

### Pagination Standards

#### Query Parameters

```
GET /users?page=2&limit=50&sort=createdAt:desc

Parameters:
- page: Page number (default: 1, min: 1)
- limit: Items per page (default: 20, min: 1, max: 100)
- sort: Sort field and direction (format: field:asc|desc)
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 1250,
      "totalPages": 25,
      "hasNextPage": true,
      "hasPreviousPage": true
    }
  }
}
```

### Filtering and Search

#### Query Parameters

```
GET /users?status=active&role=admin&search=john&created_after=2024-01-01

Supported operators:
- Equality: ?field=value
- Comparison: ?field_gt=value, ?field_gte=value, ?field_lt=value, ?field_lte=value
- Pattern: ?field_like=pattern, ?field_in=value1,value2
- Date: ?field_after=date, ?field_before=date
- Search: ?search=query (full-text search)
```

## 📁 Documentation Structure

### Service Documentation Layout

```
services/auth-service/
├── docs/
│   ├── openapi.yaml              # Main API specification
│   ├── README.md                 # Service overview
│   ├── CHANGELOG.md              # Version history
│   ├── schemas/                  # Schema definitions
│   │   ├── user.yaml
│   │   ├── role.yaml
│   │   ├── session.yaml
│   │   ├── requests/
│   │   │   ├── login.yaml
│   │   │   ├── register.yaml
│   │   │   └── refresh.yaml
│   │   └── responses/
│   │       ├── success.yaml
│   │       └── errors.yaml
│   ├── examples/                 # Request/response examples
│   │   ├── authentication/
│   │   │   ├── login-success.json
│   │   │   ├── login-error.json
│   │   │   └── register-success.json
│   │   └── users/
│   │       ├── profile-get.json
│   │       └── profile-update.json
│   ├── guides/                   # Implementation guides
│   │   ├── authentication.md
│   │   ├── authorization.md
│   │   └── mfa-setup.md
│   └── postman/                  # Postman collections
│       ├── auth-service.json
│       └── environments/
│           ├── development.json
│           ├── staging.json
│           └── production.json
├── src/
└── tests/
```

### Centralized Documentation Hub

```
docs/
├── api/                          # Consolidated API docs
│   ├── README.md                 # API overview
│   ├── getting-started.md        # Quick start guide
│   ├── authentication.md         # Auth documentation
│   ├── error-handling.md         # Error reference
│   ├── rate-limiting.md          # Rate limit guide
│   ├── webhooks.md               # Webhook documentation
│   ├── sdks/                     # SDK documentation
│   │   ├── javascript.md
│   │   ├── python.md
│   │   └── curl.md
│   └── changelog.md              # API changelog
├── guides/                       # Developer guides
│   ├── integration-guide.md
│   ├── best-practices.md
│   └── troubleshooting.md
└── schemas/                      # Shared schemas
    ├── common.yaml
    ├── pagination.yaml
    └── errors.yaml
```

## ⚙️ Generation & Automation

### Documentation Generation Tools

#### OpenAPI Generator Configuration

```json
{
  "generatorName": "html2",
  "inputSpec": "services/auth-service/docs/openapi.yaml",
  "outputDir": "docs/generated/auth-service",
  "additionalProperties": {
    "appName": "Authentication Service API",
    "appDescription": "Enterprise SaaS Authentication Service",
    "infoUrl": "https://docs.example.com/auth",
    "infoEmail": "auth-team@example.com",
    "licenseInfo": "MIT License",
    "licenseUrl": "https://opensource.org/licenses/MIT"
  }
}
```

#### Package.json Scripts

```json
{
  "scripts": {
    "docs:generate": "openapi-generator-cli generate -c openapi-generator.json",
    "docs:validate": "swagger-codegen validate -i docs/openapi.yaml",
    "docs:serve": "http-server docs/generated -p 8080",
    "docs:build": "npm run docs:validate && npm run docs:generate",
    "docs:watch": "nodemon --watch docs/openapi.yaml --exec 'npm run docs:build'"
  }
}
```

### Automated Documentation Updates

#### GitHub Actions for Documentation

```yaml
name: API Documentation

on:
  push:
    paths:
      - 'services/*/docs/openapi.yaml'
      - 'docs/api/**'
  pull_request:
    paths:
      - 'services/*/docs/openapi.yaml'

jobs:
  validate-specs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Validate OpenAPI Specifications
        run: |
          for spec in services/*/docs/openapi.yaml; do
            echo "Validating $spec"
            npx swagger-codegen validate -i "$spec"
          done

  generate-docs:
    needs: validate-specs
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate API Documentation
        run: |
          for service in services/*/; do
            service_name=$(basename "$service")
            if [ -f "$service/docs/openapi.yaml" ]; then
              npx openapi-generator-cli generate \
                -i "$service/docs/openapi.yaml" \
                -g html2 \
                -o "docs/generated/$service_name"
            fi
          done

      - name: Deploy to GitHub Pages
        if: github.ref == 'refs/heads/main'
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs/generated
```

### Code Generation from Specs

#### TypeScript Client Generation

```bash
# Generate TypeScript client from OpenAPI spec
npx openapi-generator-cli generate \
  -i services/auth-service/docs/openapi.yaml \
  -g typescript-axios \
  -o libs/api-client/src/generated/auth \
  --additional-properties=npmName=@template/auth-client
```

#### Test Generation

```bash
# Generate test cases from OpenAPI examples
npx openapi-generator-cli generate \
  -i services/auth-service/docs/openapi.yaml \
  -g test-cases \
  -o services/auth-service/tests/generated
```

## 🔄 Development Workflow

### API-First Development Process

#### 1. Design Phase

```mermaid
graph LR
    A[Requirements] --> B[API Design]
    B --> C[OpenAPI Spec]
    C --> D[Review & Validation]
    D --> E[Generate Mocks]
    E --> F[Frontend Development]
    D --> G[Backend Implementation]
```

#### 2. Implementation Steps

1. **Create OpenAPI Specification**

   ```bash
   # Create service documentation
   mkdir -p services/new-service/docs
   touch services/new-service/docs/openapi.yaml

   # Start with template
   cp docs/templates/openapi-template.yaml services/new-service/docs/openapi.yaml
   ```

2. **Validate Specification**

   ```bash
   # Validate OpenAPI spec
   npm run docs:validate

   # Generate documentation
   npm run docs:generate
   ```

3. **Generate Client Code**

   ```bash
   # Generate TypeScript client
   npm run generate:client

   # Generate test stubs
   npm run generate:tests
   ```

4. **Implement Service**

   ```bash
   # Use generated types and interfaces
   # Implement according to specification
   ```

5. **Validate Implementation**

   ```bash
   # Run tests against specification
   npm run test:contract

   # Validate API responses
   npm run test:api
   ```

### Documentation Review Process

#### Pull Request Requirements

- [ ] OpenAPI specification updated
- [ ] Examples provided for new endpoints
- [ ] Error responses documented
- [ ] Security requirements specified
- [ ] Breaking changes highlighted
- [ ] Changelog updated

#### Review Checklist

```markdown
## API Documentation Review

### Specification Quality

- [ ] All endpoints documented
- [ ] Request/response schemas complete
- [ ] Examples provided and accurate
- [ ] Error responses documented
- [ ] Security requirements clear

### API Design

- [ ] RESTful design principles followed
- [ ] Consistent naming conventions
- [ ] Appropriate HTTP status codes
- [ ] Proper error handling
- [ ] Pagination implemented correctly

### Documentation

- [ ] Clear descriptions and summaries
- [ ] Business rules explained
- [ ] Integration examples provided
- [ ] Backward compatibility maintained
- [ ] Migration guide (if breaking changes)
```

## ✨ Best Practices

### Documentation Quality

#### Writing Guidelines

1. **Clear and Concise**: Use simple, direct language
2. **Complete Information**: Include all necessary details
3. **Practical Examples**: Provide real-world usage scenarios
4. **Error Scenarios**: Document all possible error conditions
5. **Business Context**: Explain the "why" not just the "what"

#### Schema Design

```yaml
# ✅ Good schema design
User:
  type: object
  required:
    - id
    - email
    - firstName
    - lastName
  properties:
    id:
      type: string
      format: uuid
      description: 'Unique identifier for the user'
      example: '550e8400-e29b-41d4-a716-446655440000'
    email:
      type: string
      format: email
      maxLength: 255
      description: "User's email address (must be unique across the system)"
      example: 'john.doe@example.com'
    firstName:
      type: string
      minLength: 1
      maxLength: 100
      description: "User's first name"
      example: 'John'
    lastName:
      type: string
      minLength: 1
      maxLength: 100
      description: "User's last name"
      example: 'Doe'
    status:
      type: string
      enum: [pending, active, suspended, deleted]
      description: 'Current status of the user account'
      example: 'active'
    createdAt:
      type: string
      format: date-time
      description: 'Timestamp when the user was created'
      example: '2024-01-01T12:00:00Z'
      readOnly: true
```

### Version Management

#### API Versioning Strategy

```yaml
# URL versioning (recommended)
servers:
  - url: https://api.example.com/v1
    description: Version 1 (current)
  - url: https://api.example.com/v2
    description: Version 2 (beta)

# Header versioning (alternative)
parameters:
  ApiVersion:
    name: API-Version
    in: header
    schema:
      type: string
      enum: ['1.0', '2.0']
      default: '1.0'
```

#### Breaking Changes Management

```yaml
# Document breaking changes
info:
  version: 2.0.0
  description: |
    **Breaking Changes in v2.0.0:**

    - User registration now requires email verification
    - Password complexity requirements updated
    - Response format changed for error messages
    - Deprecated endpoints removed

    **Migration Guide:**
    See [Migration Guide](https://docs.example.com/migration-v2) for details.
```

### Security Documentation

#### Authentication Documentation

````yaml
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        **Authentication Flow:**

        1. Obtain access token via `/auth/login`
        2. Include token in Authorization header
        3. Refresh token before expiry using `/auth/refresh`

        **Token Format:** `Bearer <access_token>`
        **Expiry:** 15 minutes
        **Refresh:** Use refresh token (7 days validity)

        **Example:**
        ```
        Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
        ```
````

#### Rate Limiting Documentation

```yaml
paths:
  /auth/login:
    post:
      description: |
        **Rate Limiting:**
        - 5 requests per minute per IP
        - 10 requests per hour per user
        - Account lockout after 5 failed attempts

        **Headers:**
        - `X-RateLimit-Limit`: Request limit
        - `X-RateLimit-Remaining`: Remaining requests
        - `X-RateLimit-Reset`: Reset timestamp
```

## 🛠️ Tools & Resources

### Documentation Tools

#### OpenAPI Ecosystem

- **[Swagger Editor](https://editor.swagger.io/)**: Online OpenAPI editor
- **[Swagger UI](https://swagger.io/tools/swagger-ui/)**: Interactive
  documentation
- **[Redoc](https://redocly.github.io/redoc/)**: Beautiful API documentation
- **[OpenAPI Generator](https://openapi-generator.tech/)**: Code generation from
  specs

#### Validation Tools

- **[Swagger Codegen](https://swagger.io/tools/swagger-codegen/)**: Validation
  and generation
- **[Spectral](https://stoplight.io/open-source/spectral)**: OpenAPI linting
- **[Prism](https://stoplight.io/open-source/prism)**: Mock server from specs

#### Testing Tools

- **[Dredd](https://dredd.org/)**: API testing against documentation
- **[Postman](https://www.postman.com/)**: API testing and documentation
- **[Insomnia](https://insomnia.rest/)**: API client and testing

### Package.json Scripts

```json
{
  "scripts": {
    "docs:validate": "spectral lint services/*/docs/openapi.yaml",
    "docs:generate": "redoc-cli build services/auth-service/docs/openapi.yaml --output docs/auth-service.html",
    "docs:serve": "redoc-cli serve services/auth-service/docs/openapi.yaml --watch",
    "docs:mock": "prism mock services/auth-service/docs/openapi.yaml",
    "docs:test": "dredd services/auth-service/docs/openapi.yaml http://localhost:3001",
    "client:generate": "openapi-generator-cli generate -i services/auth-service/docs/openapi.yaml -g typescript-axios -o libs/api-client/src/generated",
    "postman:convert": "openapi2postmanv2 -s services/auth-service/docs/openapi.yaml -o docs/postman/auth-service.json"
  }
}
```

### VS Code Extensions

```json
{
  "recommendations": [
    "42crunch.vscode-openapi",
    "redhat.vscode-yaml",
    "humao.rest-client",
    "rangav.vscode-thunder-client"
  ]
}
```

### Documentation Templates

#### Service README Template

````markdown
# Service Name API

Brief description of the service and its purpose.

## 🚀 Quick Start

### Authentication

```bash
curl -X POST https://api.example.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```
````

### Basic Usage

```bash
curl -X GET https://api.example.com/v1/users/profile \
  -H "Authorization: Bearer <access_token>"
```

## 📚 Documentation

- [Complete API Reference](./openapi.yaml)
- [Interactive Documentation](https://docs.example.com/api/service-name)
- [Integration Guide](../guides/integration.md)
- [Postman Collection](./postman/service-name.json)

## 🔧 Development

### Running Locally

```bash
npm run dev
```

### Testing

```bash
npm run test
npm run test:api
```

### Documentation

```bash
npm run docs:serve
npm run docs:validate
```

```

## 📋 Maintenance Checklist

### Regular Tasks
- [ ] **Weekly**: Validate all OpenAPI specifications
- [ ] **Weekly**: Update examples with latest data
- [ ] **Monthly**: Review and update documentation
- [ ] **Quarterly**: API design review and optimization
- [ ] **Release**: Update version numbers and changelogs

### Quality Assurance
- [ ] All endpoints documented
- [ ] Request/response examples provided
- [ ] Error scenarios covered
- [ ] Security requirements specified
- [ ] Rate limiting documented
- [ ] Integration guides updated

### Automation Health
- [ ] CI/CD documentation pipeline working
- [ ] Generated documentation up to date
- [ ] Mock servers functioning correctly
- [ ] Client libraries generating successfully
- [ ] Test coverage adequate

---

**Remember**: Great API documentation is not just about describing what the API does, but helping developers understand how to use it effectively and safely in their applications. 🚀
```
