# Getting Started with Enterprise SaaS Template

Welcome to the Enterprise SaaS Template! This guide will help you set up your development environment and create your first application.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download Node.js](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`
- **PostgreSQL 14+** - [Download PostgreSQL](https://www.postgresql.org/download/)
- **Redis 6+** - [Download Redis](https://redis.io/download/)
- **Git** - [Download Git](https://git-scm.com/)

### 1. Create Your Project

```bash
# Option 1: Clone the template repository
git clone https://github.com/void-software/enterprise-saas-template.git my-saas-app
cd my-saas-app

# Option 2: Use the CLI (coming soon)
npx create-enterprise-app my-saas-app
cd my-saas-app
```

### 2. Install Dependencies

```bash
# Install all dependencies across the monorepo
pnpm install

# Setup development environment
pnpm run setup
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env.development

# Edit the environment file with your configuration
nano .env.development
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string  
- `JWT_SECRET` - Secret key for JWT tokens
- `ENCRYPTION_KEY` - 32-character key for data encryption

### 4. Database Setup

```bash
# Start PostgreSQL and Redis (if using Docker)
docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:14
docker run -d --name redis -p 6379:6379 redis:6-alpine

# Run database migrations
pnpm run migrate:up

# Seed with example data
pnpm run fixtures:seed
```

### 5. Start Development

```bash
# Start all services and applications
pnpm run dev

# The following will be available:
# - Web App: http://localhost:3000
# - API Gateway: http://localhost:8000
# - Auth Service: http://localhost:8001
# - API Documentation: http://localhost:8000/docs
```

### 6. Verify Installation

Open your browser and navigate to:
- **Web App**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs

You should see the login page. Use these default credentials:
- **Email**: admin@example.com
- **Password**: Admin123!

## 📱 What's Running

After starting development, you'll have these services running:

| Service | Port | Description |
|---------|------|-------------|
| Web App | 3000 | React frontend application |
| API Gateway | 8000 | Main API endpoint and documentation |
| Auth Service | 8001 | Authentication and user management |
| Notification Service | 8002 | Email, SMS, and push notifications |

## 🛠️ Development Commands

### Common Commands
```bash
# Start development (all services)
pnpm run dev

# Start specific service
pnpm run dev --filter=auth-service
pnpm run dev --filter=web-app

# Build all applications
pnpm run build

# Run tests
pnpm run test

# Run specific tests
pnpm run test --filter=auth-service

# Lint and format code
pnpm run lint
pnpm run format

# Type checking
pnpm run typecheck
```

### Database Commands
```bash
# Create new migration
pnpm run migrate:create add_users_table

# Run migrations
pnpm run migrate:up

# Rollback migrations
pnpm run migrate:down

# Check migration status
pnpm run migrate:status

# Seed database with test data
pnpm run fixtures:seed

# Reset database
pnpm run fixtures:reset
```

### Security Commands
```bash
# Run security scan
pnpm run security:scan

# Install security tools
pnpm run security:install

# Setup pre-commit hooks
pnpm run security:setup

# Check for secrets
pnpm run security:secrets

# Audit dependencies
pnpm run security:deps
```

## 🏗️ Project Structure

```
my-saas-app/
├── apps/
│   ├── web/                    # React frontend application
│   └── docs/                   # Documentation site (coming soon)
├── services/
│   ├── auth/                   # Authentication service
│   ├── api-gateway/            # API gateway and routing
│   └── notification/           # Notification service
├── libs/
│   ├── shared-utils/           # Common utilities
│   ├── ui-components/          # React component library
│   ├── api-client/             # API client library
│   ├── service-bootstrap/      # Service initialization
│   └── database-migration/     # Database migration tools
├── tools/
│   ├── generators/             # Code generation tools
│   └── database-fixtures/      # Test data and seeding
├── docs/                       # Documentation
├── scripts/                    # Development scripts
└── examples/                   # Example applications
```

## 🎨 Customization

### Branding and Theme

1. **Update Application Name**:
   ```bash
   # Update package.json
   sed -i 's/"enterprise-saas-template"/"my-saas-app"/g' package.json
   
   # Update environment variables
   sed -i 's/APP_NAME="My Enterprise SaaS"/APP_NAME="My App"/g' .env.development
   ```

2. **Customize UI Theme**:
   ```typescript
   // apps/web/src/styles/theme.ts
   export const theme = {
     colors: {
       primary: '#your-primary-color',
       secondary: '#your-secondary-color',
       // ... customize colors
     }
   };
   ```

3. **Update Logo and Favicon**:
   ```bash
   # Replace logo files
   cp your-logo.svg apps/web/src/assets/logo.svg
   cp your-favicon.ico apps/web/public/favicon.ico
   ```

### Adding New Services

```bash
# Generate new service
pnpm run create:service my-service

# This creates:
# - services/my-service/
# - Database configuration
# - API endpoints
# - Tests
# - Documentation
```

### Adding New Pages

```bash
# Generate new page
pnpm run create:page orders

# This creates:
# - Page component
# - Route configuration
# - API integration
# - Tests
```

## 🔐 Security Setup

### 1. Environment Security

```bash
# Generate secure secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Update .env.development with generated secrets
JWT_SECRET=your-generated-secret
ENCRYPTION_KEY=your-generated-32-char-key
```

### 2. Database Security

```bash
# Create application-specific database user
createuser --interactive my_app_user

# Grant limited permissions
psql -c "GRANT CONNECT ON DATABASE my_app_db TO my_app_user;"
psql -c "GRANT USAGE ON SCHEMA public TO my_app_user;"
psql -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO my_app_user;"
```

### 3. Enable Security Scanning

```bash
# Install security tools
pnpm run security:install

# Setup pre-commit hooks
pnpm run security:setup

# Run initial security scan
pnpm run security:scan
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pnpm run test

# Run tests with coverage
pnpm run test:coverage

# Run E2E tests
pnpm run test:e2e

# Run specific test suite
pnpm run test --filter=auth-service
```

### Writing Tests

Create test files alongside your source code:
```
src/
├── services/
│   ├── user.service.ts
│   └── user.service.test.ts
├── controllers/
│   ├── user.controller.ts
│   └── user.controller.test.ts
```

Example test:
```typescript
import { describe, it, expect } from 'vitest';
import { UserService } from './user.service';

describe('UserService', () => {
  it('should create a user', async () => {
    const userService = new UserService();
    const user = await userService.create({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(user.email).toBe('test@example.com');
    expect(user.password).not.toBe('password123'); // Should be hashed
  });
});
```

## 🚀 Deployment

### Production Build

```bash
# Build all applications for production
pnpm run build

# The built applications will be in:
# - apps/web/dist/        (Frontend)
# - services/*/dist/      (Backend services)
```

### Environment Configuration

```bash
# Create production environment file
cp .env.example .env.production

# Configure production values
# - Use strong, unique secrets
# - Configure production database
# - Set up external services
# - Enable security features
```

### Docker Deployment

```bash
# Build Docker images
docker build -t my-app/web apps/web/
docker build -t my-app/auth services/auth/
docker build -t my-app/api-gateway services/api-gateway/

# Run with Docker Compose
docker-compose up -d
```

## 📚 Next Steps

### Learning Resources

1. **Architecture Guide** - [docs/ARCHITECTURE.md](./ARCHITECTURE.md)
2. **API Documentation** - [docs/API.md](./API.md)
3. **Security Guide** - [docs/SECURITY.md](./SECURITY.md)
4. **Testing Guide** - [docs/TESTING.md](./TESTING.md)
5. **Deployment Guide** - [docs/DEPLOYMENT.md](./DEPLOYMENT.md)

### Tutorials

- [Building Your First Feature](./tutorials/first-feature.md)
- [Adding Authentication](./tutorials/authentication.md)
- [Creating API Endpoints](./tutorials/api-endpoints.md)
- [Setting Up Multi-Tenancy](./tutorials/multi-tenancy.md)

### Example Applications

Explore complete example applications:
- [E-commerce SaaS](../examples/ecommerce-saas/)
- [Project Management Tool](../examples/project-management/)
- [CRM System](../examples/crm-system/)

## 🆘 Troubleshooting

### Common Issues

**"Cannot connect to database"**
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Check connection string format
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

**"Redis connection failed"**
```bash
# Check if Redis is running
redis-cli ping

# Should return PONG
```

**"Port already in use"**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

**"Permission denied" errors**
```bash
# Fix file permissions
chmod +x scripts/*.sh
```

### Getting Help

- **Documentation**: Check the [docs](./docs/) directory
- **Issues**: Create an issue on GitHub
- **Discord**: Join our community Discord
- **Email**: support@void-software.com

## 🎯 Quick Tips

1. **Use TypeScript**: The template is fully typed - leverage this for better DX
2. **Follow Conventions**: Stick to the established patterns for consistency
3. **Write Tests**: Test your code as you go - the framework makes it easy
4. **Security First**: Use the built-in security tools and follow guidelines
5. **Stay Updated**: Regularly update dependencies and security tools

---

**Happy coding! 🚀**

Now you're ready to build amazing enterprise SaaS applications with the Enterprise SaaS Template!