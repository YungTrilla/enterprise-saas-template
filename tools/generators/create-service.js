#!/usr/bin/env node

/**
 * Service Generator CLI
 * Creates a new microservice with standard structure and configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const TEMPLATE_NAME = '@template';
const SERVICES_DIR = 'services';

// Helper functions
function toPascalCase(str) {
  return str.replace(/(^\w|[\s-_]\w)/g, match => match.replace(/[\s-_]/, '').toUpperCase());
}

function toCamelCase(str) {
  return str.replace(/([\s-_]\w)/g, match => match.replace(/[\s-_]/, '').toUpperCase());
}

function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
    .replace(/[\s_]/g, '-');
}

function createDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`📁 Created directory: ${dirPath}`);
  }
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  console.log(`📄 Created file: ${filePath}`);
}

function generatePackageJson(serviceName) {
  const kebabName = toKebabCase(serviceName);
  return `{
  "name": "${TEMPLATE_NAME}/${kebabName}-service",
  "version": "1.0.0",
  "description": "${toPascalCase(serviceName)} service for Enterprise SaaS Template",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist",
    "docker:build": "docker build -t enterprise-${kebabName}-service .",
    "docker:run": "docker run -p 8005:8005 enterprise-${kebabName}-service"
  },
  "dependencies": {
    "${TEMPLATE_NAME}/shared-types": "*",
    "${TEMPLATE_NAME}/shared-config": "*",
    "${TEMPLATE_NAME}/shared-utils": "*",
    "${TEMPLATE_NAME}/service-bootstrap": "*",
    "express": "^4.18.2",
    "joi": "^17.11.0",
    "uuid": "^9.0.1",
    "pg": "^8.11.3",
    "ioredis": "^5.3.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/uuid": "^9.0.7",
    "@types/pg": "^8.10.9",
    "@types/jest": "^29.5.8",
    "@types/supertest": "^2.0.16",
    "typescript": "^5.3.2",
    "tsx": "^4.6.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "eslint": "^8.55.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}`;
}

function generateIndex(serviceName) {
  const pascalName = toPascalCase(serviceName);
  const kebabName = toKebabCase(serviceName);

  return `/**
 * ${pascalName} Service Entry Point
 * Handles ${serviceName} operations for the platform
 */

import { bootstrapService } from '${TEMPLATE_NAME}/service-bootstrap';
import { ${serviceName}Routes } from './routes/${serviceName}.routes';
import { healthRoutes } from './routes/health.routes';

async function start${pascalName}Service() {
  const service = await bootstrapService({
    serviceName: '${kebabName}-service',
    port: 8005, // TODO: Update port number
    routes: [
      { path: '/health', router: healthRoutes },
      { path: '/api/v1/${kebabName}', router: ${serviceName}Routes },
    ],
    enableCors: true,
    enableCompression: true,
    enableRateLimit: true,
    rateLimitConfig: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  });

  console.log('🚀 ${pascalName} Service started successfully');
  return service;
}

// Start the service
start${pascalName}Service().catch((error) => {
  console.error('Failed to start ${serviceName} service:', error);
  process.exit(1);
});`;
}

function generateHealthRoutes() {
  return `import { Router } from 'express';

const router = Router();

// Basic health check
router.get('/', async (req, res) => {
  res.json({
    status: 'healthy',
    service: process.env.npm_package_name || 'unknown-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    service: process.env.npm_package_name || 'unknown-service',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'healthy',
      redis: 'healthy',
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  // TODO: Add actual health checks for external dependencies
  // - Database connectivity
  // - Redis connectivity  
  // - External APIs

  res.json(health);
});

export { router as healthRoutes };`;
}

function generateServiceRoutes(serviceName) {
  const pascalName = toPascalCase(serviceName);
  const camelName = toCamelCase(serviceName);

  return `import { Router } from 'express';
import { ${pascalName}Controller } from '../controllers/${serviceName}.controller';
import { validateRequest } from '${TEMPLATE_NAME}/shared-utils';
import Joi from 'joi';

const router = Router();
const ${camelName}Controller = new ${pascalName}Controller();

// Validation schemas
const create${pascalName}Schema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional(),
  // TODO: Add specific validation rules for your entity
});

const update${pascalName}Schema = Joi.object({
  name: Joi.string().optional(),
  description: Joi.string().optional(),
  // TODO: Add specific validation rules for your entity
});

// CRUD Routes
router.post(
  '/',
  validateRequest({ body: create${pascalName}Schema }),
  ${camelName}Controller.create
);

router.get('/', ${camelName}Controller.getAll);
router.get('/:id', ${camelName}Controller.getById);

router.put(
  '/:id',
  validateRequest({ body: update${pascalName}Schema }),
  ${camelName}Controller.update
);

router.delete('/:id', ${camelName}Controller.delete);

// Additional routes
router.get('/:id/details', ${camelName}Controller.getDetails);

export { router as ${serviceName}Routes };`;
}

function generateController(serviceName) {
  const pascalName = toPascalCase(serviceName);
  const camelName = toCamelCase(serviceName);

  return `import { Request, Response } from 'express';
import { ${pascalName}Service } from '../services/${serviceName}.service';
import { ApiResponse } from '${TEMPLATE_NAME}/shared-utils';

export class ${pascalName}Controller {
  private ${camelName}Service: ${pascalName}Service;

  constructor() {
    this.${camelName}Service = new ${pascalName}Service();
  }

  /**
   * Create a new ${serviceName}
   */
  create = async (req: Request, res: Response) => {
    try {
      const ${serviceName}Data = req.body;
      const ${serviceName} = await this.${camelName}Service.create(${serviceName}Data);
      
      const response: ApiResponse<typeof ${serviceName}> = {
        success: true,
        data: ${serviceName},
        message: '${pascalName} created successfully',
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: '${serviceName.toUpperCase()}_CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create ${serviceName}',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  };

  /**
   * Get all ${serviceName}s
   */
  getAll = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await this.${camelName}Service.getAll(Number(page), Number(limit));
      
      const response: ApiResponse<typeof result> = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: '${serviceName.toUpperCase()}_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch ${serviceName}s',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  /**
   * Get ${serviceName} by ID
   */
  getById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const ${serviceName} = await this.${camelName}Service.getById(id);
      
      if (!${serviceName}) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: '${serviceName.toUpperCase()}_NOT_FOUND',
            message: '${pascalName} not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<typeof ${serviceName}> = {
        success: true,
        data: ${serviceName},
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: '${serviceName.toUpperCase()}_FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch ${serviceName}',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  /**
   * Update ${serviceName}
   */
  update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const ${serviceName} = await this.${camelName}Service.update(id, updates);
      
      if (!${serviceName}) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: '${serviceName.toUpperCase()}_NOT_FOUND',
            message: '${pascalName} not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<typeof ${serviceName}> = {
        success: true,
        data: ${serviceName},
        message: '${pascalName} updated successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: '${serviceName.toUpperCase()}_UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update ${serviceName}',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(400).json(response);
    }
  };

  /**
   * Delete ${serviceName}
   */
  delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.${camelName}Service.delete(id);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: '${serviceName.toUpperCase()}_NOT_FOUND',
            message: '${pascalName} not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: '${pascalName} deleted successfully',
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: '${serviceName.toUpperCase()}_DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete ${serviceName}',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };

  /**
   * Get ${serviceName} details
   */
  getDetails = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const details = await this.${camelName}Service.getDetails(id);
      
      if (!details) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          error: {
            code: '${serviceName.toUpperCase()}_NOT_FOUND',
            message: '${pascalName} not found',
          },
          timestamp: new Date().toISOString(),
        };
        return res.status(404).json(response);
      }

      const response: ApiResponse<typeof details> = {
        success: true,
        data: details,
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: '${serviceName.toUpperCase()}_DETAILS_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch ${serviceName} details',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(500).json(response);
    }
  };
}`;
}

function generateService(serviceName) {
  const pascalName = toPascalCase(serviceName);

  return `import { v4 as uuidv4 } from 'uuid';

// TODO: Define your entity interface
interface I${pascalName} {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// Mock in-memory storage (replace with actual database in production)
const ${serviceName}s = new Map<string, I${pascalName}>();

export class ${pascalName}Service {
  
  /**
   * Create a new ${serviceName}
   */
  async create(${serviceName}Data: Omit<I${pascalName}, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<I${pascalName}> {
    const ${serviceName}: I${pascalName} = {
      id: uuidv4(),
      ...${serviceName}Data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'system', // TODO: Get from auth context
    };

    ${serviceName}s.set(${serviceName}.id, ${serviceName});
    return ${serviceName};
  }

  /**
   * Get all ${serviceName}s with pagination
   */
  async getAll(page: number = 1, limit: number = 20): Promise<{
    data: I${pascalName}[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const allItems = Array.from(${serviceName}s.values());
    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = allItems.slice(offset, offset + limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Get ${serviceName} by ID
   */
  async getById(id: string): Promise<I${pascalName} | null> {
    return ${serviceName}s.get(id) || null;
  }

  /**
   * Update ${serviceName}
   */
  async update(id: string, updates: Partial<I${pascalName}>): Promise<I${pascalName} | null> {
    const existing = ${serviceName}s.get(id);
    if (!existing) {
      return null;
    }

    const updated: I${pascalName} = {
      ...existing,
      ...updates,
      id: existing.id, // Preserve ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString(),
      updatedBy: 'system', // TODO: Get from auth context
    };

    ${serviceName}s.set(id, updated);
    return updated;
  }

  /**
   * Delete ${serviceName}
   */
  async delete(id: string): Promise<boolean> {
    return ${serviceName}s.delete(id);
  }

  /**
   * Get ${serviceName} details (with related data)
   */
  async getDetails(id: string): Promise<any | null> {
    const ${serviceName} = ${serviceName}s.get(id);
    if (!${serviceName}) {
      return null;
    }

    // TODO: Add related data, statistics, etc.
    return {
      ...${serviceName},
      // Add additional details here
      stats: {
        // TODO: Add relevant statistics
      },
    };
  }

  /**
   * Search ${serviceName}s
   */
  async search(query: string, filters: Record<string, any> = {}): Promise<I${pascalName}[]> {
    let results = Array.from(${serviceName}s.values());

    // Apply text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(item => 
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.description && item.description.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    // TODO: Add specific filter logic based on your entity

    return results;
  }

  /**
   * Get ${serviceName} statistics
   */
  async getStats(): Promise<any> {
    const total = ${serviceName}s.size;
    
    // TODO: Add meaningful statistics
    return {
      total,
      // Add more statistics based on your entity
    };
  }
}`;
}

function generateTsConfig() {
  return `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}`;
}

function generateDockerfile(serviceName) {
  const kebabName = toKebabCase(serviceName);

  return `# Multi-stage build for ${serviceName} service
FROM node:18-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ${kebabName}

# Copy dependencies and built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

# Change ownership to non-root user
RUN chown -R ${kebabName}:nodejs /app
USER ${kebabName}

EXPOSE 8005

CMD ["node", "dist/index.js"]`;
}

function generateReadme(serviceName) {
  const pascalName = toPascalCase(serviceName);
  const kebabName = toKebabCase(serviceName);

  return `# ${pascalName} Service

${pascalName} service for the Enterprise SaaS Template platform.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL (optional)
- Redis (optional)

### Installation

\`\`\`bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
\`\`\`

### Environment Variables

Create a \`.env\` file based on \`.env.example\`:

\`\`\`env
# Service Configuration
PORT=8005
NODE_ENV=development

# Database (if needed)
DATABASE_URL=postgresql://username:password@localhost:5432/${kebabName}_db

# Redis (if needed)
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-jwt-secret
\`\`\`

## 📋 API Endpoints

### ${pascalName} Management

- \`POST /api/v1/${kebabName}\` - Create ${serviceName}
- \`GET /api/v1/${kebabName}\` - List ${serviceName}s
- \`GET /api/v1/${kebabName}/:id\` - Get ${serviceName} by ID
- \`PUT /api/v1/${kebabName}/:id\` - Update ${serviceName}
- \`DELETE /api/v1/${kebabName}/:id\` - Delete ${serviceName}
- \`GET /api/v1/${kebabName}/:id/details\` - Get ${serviceName} details

### Health Check

- \`GET /health\` - Basic health check
- \`GET /health/detailed\` - Detailed health check

## 🧪 Testing

\`\`\`bash
# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Run tests in watch mode
pnpm run test:watch
\`\`\`

## 🐳 Docker

\`\`\`bash
# Build Docker image
pnpm run docker:build

# Run Docker container
pnpm run docker:run
\`\`\`

## 📚 Development

### Project Structure

\`\`\`
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── routes/         # Route definitions
├── types/          # TypeScript types
├── middleware/     # Custom middleware
├── utils/          # Utility functions
└── index.ts        # Entry point
\`\`\`

### Adding New Features

1. Define types in \`src/types/\`
2. Implement business logic in \`src/services/\`
3. Create controllers in \`src/controllers/\`
4. Define routes in \`src/routes/\`
5. Add validation schemas
6. Write tests

## 🔧 Configuration

The service uses the shared configuration system. Override settings in your environment file or through environment variables.

## 📖 Documentation

- [API Documentation](./docs/api.md)
- [Architecture](./docs/architecture.md)
- [Deployment](./docs/deployment.md)
`;
}

// Main function
function createService() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('❌ Error: Service name is required');
    console.log('Usage: node create-service.js <service-name>');
    console.log('Example: node create-service.js user-management');
    process.exit(1);
  }

  const serviceName = args[0];
  const kebabName = toKebabCase(serviceName);
  const pascalName = toPascalCase(serviceName);

  console.log(`🚀 Creating ${pascalName} Service...`);

  // Create directory structure
  const serviceDir = path.join(SERVICES_DIR, kebabName);
  const srcDir = path.join(serviceDir, 'src');

  createDirectory(serviceDir);
  createDirectory(srcDir);
  createDirectory(path.join(srcDir, 'controllers'));
  createDirectory(path.join(srcDir, 'services'));
  createDirectory(path.join(srcDir, 'routes'));
  createDirectory(path.join(srcDir, 'types'));
  createDirectory(path.join(srcDir, 'middleware'));
  createDirectory(path.join(srcDir, 'utils'));

  // Generate files
  writeFile(path.join(serviceDir, 'package.json'), generatePackageJson(serviceName));
  writeFile(path.join(serviceDir, 'tsconfig.json'), generateTsConfig());
  writeFile(path.join(serviceDir, 'Dockerfile'), generateDockerfile(serviceName));
  writeFile(path.join(serviceDir, 'README.md'), generateReadme(serviceName));

  writeFile(path.join(srcDir, 'index.ts'), generateIndex(serviceName));
  writeFile(path.join(srcDir, 'routes', 'health.routes.ts'), generateHealthRoutes());
  writeFile(
    path.join(srcDir, 'routes', `${serviceName}.routes.ts`),
    generateServiceRoutes(serviceName)
  );
  writeFile(
    path.join(srcDir, 'controllers', `${serviceName}.controller.ts`),
    generateController(serviceName)
  );
  writeFile(
    path.join(srcDir, 'services', `${serviceName}.service.ts`),
    generateService(serviceName)
  );

  console.log(`\n✅ ${pascalName} Service created successfully!`);
  console.log(`📁 Location: ${serviceDir}`);
  console.log(`\n🔧 Next steps:`);
  console.log(`1. cd ${serviceDir}`);
  console.log(`2. pnpm install`);
  console.log(`3. Update the TODO comments in the generated files`);
  console.log(`4. Configure environment variables`);
  console.log(`5. pnpm run dev`);
  console.log(`\n📚 Don't forget to update the API Gateway routing to include your new service!`);
}

// Run the generator
createService();
