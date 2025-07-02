# Enterprise SaaS Template - Code Generators

This directory contains CLI tools for generating boilerplate code and scaffolding new components within the Enterprise SaaS Template.

## 🚀 Available Generators

### 1. Service Generator (`create-service.js`)

Creates a new microservice with complete structure and configuration.

```bash
# Create a new service
node tools/generators/create-service.js user-management

# This creates:
services/user-management/
├── package.json          # Service configuration
├── tsconfig.json         # TypeScript config
├── Dockerfile           # Container configuration
├── README.md            # Service documentation
└── src/
    ├── index.ts         # Service entry point
    ├── controllers/     # Request handlers
    ├── services/        # Business logic
    ├── routes/          # Route definitions
    ├── types/           # TypeScript types
    ├── middleware/      # Custom middleware
    └── utils/           # Utility functions
```

**Generated Features:**
- Complete CRUD operations with validation
- Health check endpoints (basic and detailed)
- Structured error handling with correlation IDs
- OpenAPI-ready route definitions
- Database and Redis connection support
- Docker configuration with multi-stage builds
- TypeScript strict configuration
- Comprehensive documentation

### 2. Application Generator (`create-app.js`)

Creates a new React application with standard structure and configuration.

```bash
# Create a new application
node tools/generators/create-app.js customer-portal

# This creates:
apps/customer-portal/
├── package.json         # App configuration
├── vite.config.ts       # Vite build configuration
├── tsconfig.json        # TypeScript config
├── tailwind.config.js   # Tailwind CSS config
├── postcss.config.js    # PostCSS config
├── index.html           # HTML entry point
├── Dockerfile          # Container configuration
├── nginx.conf          # Nginx configuration
├── README.md           # App documentation
├── public/             # Static assets
└── src/
    ├── main.tsx        # React entry point
    ├── App.tsx         # Main App component
    ├── index.css       # Global styles
    ├── components/     # Reusable components
    │   ├── layout/     # Layout components
    │   └── ui/         # UI components
    ├── contexts/       # React contexts
    ├── hooks/          # Custom hooks
    ├── pages/          # Page components
    │   ├── auth/       # Authentication pages
    │   └── examples/   # Example pages
    ├── services/       # API services
    ├── types/          # TypeScript types
    ├── utils/          # Utility functions
    └── config/         # Configuration files
```

**Generated Features:**
- React 18 with TypeScript
- Authentication context and protected routes
- Responsive layout with dark mode support
- Tailwind CSS with design system integration
- React Query for server state management
- React Hook Form with Joi validation
- React Hot Toast for notifications
- Comprehensive testing setup (Jest + Playwright)
- Docker deployment with Nginx
- Environment-based configuration

## 📋 Usage Guidelines

### Service Generator

**Best Practices:**
- Use descriptive service names (e.g., `user-management`, `notification-system`)
- Service names should be kebab-case
- Each service should have a single responsibility
- Follow the generated patterns for consistency

**After Generation:**
1. Navigate to the service directory
2. Run `pnpm install` to install dependencies
3. Update TODO comments in generated files
4. Configure environment variables
5. Update API Gateway routing to include the new service
6. Add the service to your deployment configuration

**Customization Points:**
- Update entity interfaces in the service file
- Add specific validation rules in routes
- Implement actual database connections
- Add business-specific logic to controllers
- Configure health checks for external dependencies

### Application Generator

**Best Practices:**
- Use descriptive app names (e.g., `admin-dashboard`, `customer-portal`)
- App names should be kebab-case
- Each app should serve a specific user type or use case
- Leverage shared components from `@template/ui-components`

**After Generation:**
1. Navigate to the app directory
2. Run `pnpm install` to install dependencies
3. Create `.env` file based on the provided template
4. Configure service URLs in environment config
5. Customize branding and navigation
6. Add app-specific pages and components

**Customization Points:**
- Update branding (logo, colors, app name)
- Customize navigation and routes
- Add app-specific pages and features
- Configure authentication flows
- Set up analytics and monitoring
- Customize Docker deployment

## 🔧 Generator Features

### Common Features (Both Generators)

- **TypeScript Strict Mode** - No `any` types allowed
- **ESLint + Prettier** - Code quality and formatting
- **Docker Support** - Production-ready containers
- **Environment Configuration** - Flexible config management
- **Comprehensive Documentation** - README and inline docs
- **Security Best Practices** - Input validation, error handling
- **Testing Ready** - Jest configuration included
- **Template Integration** - Uses shared libraries

### Service-Specific Features

- **Service Bootstrap Integration** - Uses shared service bootstrap
- **Express.js Framework** - RESTful API structure
- **Joi Validation** - Request validation schemas
- **Health Checks** - Kubernetes-compatible endpoints
- **Correlation IDs** - Request tracing support
- **Structured Logging** - JSON logging with context
- **Mock Data Storage** - In-memory storage for development

### Application-Specific Features

- **React 18** - Latest React with concurrent features
- **Vite Build System** - Fast development and builds
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Dark Mode Support** - System preference detection
- **Responsive Design** - Mobile-first approach
- **Accessibility** - WCAG 2.1 compliant components

## 🧪 Testing Generated Code

### Services

```bash
# Navigate to service directory
cd services/your-service

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start development server
pnpm run dev

# Test health endpoint
curl http://localhost:8005/health
```

### Applications

```bash
# Navigate to app directory  
cd apps/your-app

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start development server
pnpm run dev

# Run E2E tests
pnpm run test:e2e
```

## 📚 Integration with Template

### Shared Dependencies

Generated code automatically includes:
- `@template/shared-types` - Common TypeScript types
- `@template/shared-config` - Configuration utilities
- `@template/shared-utils` - Utility functions
- `@template/service-bootstrap` - Service initialization (services only)
- `@template/ui-components` - UI component library (apps only)
- `@template/api-client` - API client library (apps only)

### Template Patterns

Both generators follow established patterns:
- **Naming Conventions** - Consistent kebab-case, PascalCase, camelCase usage
- **Error Handling** - Structured error responses with correlation IDs
- **API Standards** - RESTful endpoints with OpenAPI compatibility
- **Security** - Input validation, authentication, authorization
- **Monitoring** - Health checks, logging, metrics ready

## 🔄 Extending Generators

### Adding New Templates

1. Create template generation function
2. Add command-line argument parsing
3. Include in main generator function
4. Update this documentation

### Template Variables

Available in all generators:
- `${serviceName}` - Original input name
- `${kebabName}` - kebab-case version
- `${pascalName}` - PascalCase version
- `${camelName}` - camelCase version
- `${TEMPLATE_NAME}` - Template namespace (@template)

### Helper Functions

Available helper functions:
- `toPascalCase(str)` - Convert to PascalCase
- `toCamelCase(str)` - Convert to camelCase  
- `toKebabCase(str)` - Convert to kebab-case
- `createDirectory(path)` - Create directory with logging
- `writeFile(path, content)` - Write file with logging

## 📋 Checklist After Generation

### Services
- [ ] Install dependencies (`pnpm install`)
- [ ] Update TODO comments in generated files
- [ ] Configure environment variables
- [ ] Update entity interfaces and validation schemas
- [ ] Add service to API Gateway routing
- [ ] Configure database connections
- [ ] Add to deployment configuration
- [ ] Write service-specific tests
- [ ] Update service documentation

### Applications
- [ ] Install dependencies (`pnpm install`)
- [ ] Create and configure `.env` file
- [ ] Update branding and navigation
- [ ] Add app-specific pages and components
- [ ] Configure authentication flows
- [ ] Set up API service integration
- [ ] Customize styling and themes
- [ ] Add to deployment configuration
- [ ] Write application-specific tests
- [ ] Update application documentation

## 🚨 Important Notes

- **Always review generated code** before deploying to production
- **Update TODO comments** - Generated code includes placeholder comments
- **Follow security practices** - Validate inputs, sanitize outputs
- **Use environment variables** - Never hardcode secrets or URLs
- **Test thoroughly** - Generated code is a starting point
- **Keep documentation updated** - Update README files as you customize

## 🔗 Related Documentation

- [Service Development Guide](../../docs/service-development.md)
- [Application Development Guide](../../docs/app-development.md)
- [Deployment Guide](../../docs/deployment.md)
- [Security Guidelines](../../docs/security.md)
- [Testing Guide](../../docs/testing.md)