#!/bin/bash

# Template Repository Update Script
# This script helps update a template repository with improvements from Abyss Central

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEMPLATE_REPO_PATH="${1:-../template-repo}"
SOURCE_REPO_PATH="."

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if template repo path exists
if [ ! -d "$TEMPLATE_REPO_PATH" ]; then
    print_error "Template repository not found at: $TEMPLATE_REPO_PATH"
    echo "Usage: $0 [path-to-template-repo]"
    exit 1
fi

echo "🚀 Updating template repository with Abyss Central improvements"
echo "Source: $SOURCE_REPO_PATH"
echo "Target: $TEMPLATE_REPO_PATH"
echo ""

# Backup existing template
BACKUP_DIR="$TEMPLATE_REPO_PATH.backup.$(date +%Y%m%d_%H%M%S)"
print_step "Creating backup at $BACKUP_DIR"
cp -r "$TEMPLATE_REPO_PATH" "$BACKUP_DIR"
print_success "Backup created"

# Copy configuration files
print_step "Copying configuration files..."
cp -f "$SOURCE_REPO_PATH/.npmrc" "$TEMPLATE_REPO_PATH/" 2>/dev/null || print_warning ".npmrc not found"
cp -f "$SOURCE_REPO_PATH/.env.example" "$TEMPLATE_REPO_PATH/" 2>/dev/null || print_warning ".env.example not found"
cp -f "$SOURCE_REPO_PATH/.gitignore" "$TEMPLATE_REPO_PATH/" 2>/dev/null || print_warning ".gitignore not found"
print_success "Configuration files copied"

# Copy development standards
print_step "Copying development standards..."
cp -f "$SOURCE_REPO_PATH/.claude-rules" "$TEMPLATE_REPO_PATH/" 2>/dev/null || print_warning ".claude-rules not found"
cp -f "$SOURCE_REPO_PATH/.modularity-checklist" "$TEMPLATE_REPO_PATH/" 2>/dev/null || print_warning ".modularity-checklist not found"
print_success "Development standards copied"

# Copy GitHub workflows
print_step "Copying GitHub workflows..."
mkdir -p "$TEMPLATE_REPO_PATH/.github/workflows"
cp -r "$SOURCE_REPO_PATH/.github/workflows/"* "$TEMPLATE_REPO_PATH/.github/workflows/" 2>/dev/null || print_warning "No workflows found"
cp -f "$SOURCE_REPO_PATH/.github/dependabot.yml" "$TEMPLATE_REPO_PATH/.github/" 2>/dev/null || print_warning "dependabot.yml not found"
print_success "GitHub workflows copied"

# Copy Docker configuration
print_step "Copying Docker configuration..."
cp -f "$SOURCE_REPO_PATH/docker-compose.yml" "$TEMPLATE_REPO_PATH/" 2>/dev/null || print_warning "docker-compose.yml not found"
mkdir -p "$TEMPLATE_REPO_PATH/scripts"
cp -f "$SOURCE_REPO_PATH/scripts/init-db.sql" "$TEMPLATE_REPO_PATH/scripts/" 2>/dev/null || print_warning "init-db.sql not found"
cp -f "$SOURCE_REPO_PATH/scripts/docker-build.sh" "$TEMPLATE_REPO_PATH/scripts/" 2>/dev/null || print_warning "docker-build.sh not found"
chmod +x "$TEMPLATE_REPO_PATH/scripts/"*.sh 2>/dev/null || true
print_success "Docker configuration copied"

# Create directory structure
print_step "Creating directory structure..."
mkdir -p "$TEMPLATE_REPO_PATH"/{apps,services,libs,tools,docs}
mkdir -p "$TEMPLATE_REPO_PATH/libs"/{shared-types,shared-config,shared-utils,api-client,database-migration}/src
print_success "Directory structure created"

# Copy shared library templates
print_step "Creating shared library templates..."

# shared-types template
cat > "$TEMPLATE_REPO_PATH/libs/shared-types/package.json" << 'EOF'
{
  "name": "@your-app/shared-types",
  "version": "0.1.0",
  "description": "Shared TypeScript type definitions",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src/**/*.ts"
  },
  "files": [
    "dist/**/*"
  ],
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.3.2"
  }
}
EOF

# shared-config template
cat > "$TEMPLATE_REPO_PATH/libs/shared-config/package.json" << 'EOF'
{
  "name": "@your-app/shared-config",
  "version": "0.1.0",
  "description": "Shared configuration utilities",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "dotenv": "^16.3.1",
    "joi": "^17.11.0",
    "@your-app/shared-types": "*",
    "@your-app/shared-utils": "*"
  },
  "devDependencies": {
    "typescript": "^5.3.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8"
  }
}
EOF

# shared-utils template
cat > "$TEMPLATE_REPO_PATH/libs/shared-utils/package.json" << 'EOF'
{
  "name": "@your-app/shared-utils",
  "version": "0.1.0",
  "description": "Shared utility functions",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "@your-app/shared-types": "*"
  },
  "devDependencies": {
    "typescript": "^5.3.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8"
  }
}
EOF

print_success "Shared library templates created"

# Create service template
print_step "Creating service template..."
mkdir -p "$TEMPLATE_REPO_PATH/services/example-service"/{src,openapi}
mkdir -p "$TEMPLATE_REPO_PATH/services/example-service/src"/{config,controllers,middleware,routes,services,types,utils,__tests__}

# Service package.json
cat > "$TEMPLATE_REPO_PATH/services/example-service/package.json" << 'EOF'
{
  "name": "@your-app/example-service",
  "version": "1.0.0",
  "description": "Example microservice",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@your-app/shared-types": "*",
    "@your-app/shared-config": "*",
    "@your-app/shared-utils": "*",
    "express": "^4.18.2",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "compression": "^1.7.4",
    "express-rate-limit": "^7.1.5",
    "joi": "^17.11.0",
    "winston": "^3.11.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/compression": "^1.7.5",
    "@types/uuid": "^9.0.7",
    "@types/jest": "^29.5.10",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "tsx": "^4.6.2",
    "typescript": "^5.3.2",
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.16"
  }
}
EOF

# Service Dockerfile
cat > "$TEMPLATE_REPO_PATH/services/example-service/Dockerfile" << 'EOF'
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files for workspaces
COPY package*.json ./
COPY tsconfig.json ./

# Copy workspace configuration
COPY libs ./libs
COPY services/example-service ./services/example-service

# Install all dependencies
RUN npm ci

# Build shared libraries first
WORKDIR /app/libs/shared-types
RUN npm run build

WORKDIR /app/libs/shared-utils
RUN npm run build

WORKDIR /app/libs/shared-config
RUN npm run build

# Build service
WORKDIR /app/services/example-service
RUN npm run build

# Production stage
FROM node:18-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files and built code
COPY --from=builder --chown=nodejs:nodejs /app/services/example-service/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/services/example-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built shared libraries
COPY --from=builder --chown=nodejs:nodejs /app/libs/shared-types/dist ./libs/shared-types/dist
COPY --from=builder --chown=nodejs:nodejs /app/libs/shared-utils/dist ./libs/shared-utils/dist
COPY --from=builder --chown=nodejs:nodejs /app/libs/shared-config/dist ./libs/shared-config/dist

RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); });"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
EOF

print_success "Service template created"

# Copy testing patterns
print_step "Copying testing patterns..."
mkdir -p "$TEMPLATE_REPO_PATH/services/example-service/src/__tests__/utils"
cp "$SOURCE_REPO_PATH/services/auth-service/jest.config.js" "$TEMPLATE_REPO_PATH/services/example-service/" 2>/dev/null || print_warning "jest.config.js not found"
print_success "Testing patterns copied"

# Update root package.json
print_step "Updating root package.json..."
if [ -f "$TEMPLATE_REPO_PATH/package.json" ]; then
    # Backup existing package.json
    cp "$TEMPLATE_REPO_PATH/package.json" "$TEMPLATE_REPO_PATH/package.json.backup"
    print_warning "Existing package.json backed up to package.json.backup"
fi

# Create updated package.json
cat > "$TEMPLATE_REPO_PATH/package.json" << 'EOF'
{
  "name": "your-app-name",
  "version": "0.1.0",
  "description": "Your application description",
  "private": true,
  "workspaces": [
    "apps/*",
    "services/*",
    "libs/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.1",
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.0",
    "turbo": "^1.11.2",
    "typescript": "^5.3.2"
  },
  "packageManager": "npm@10.2.3",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
EOF
print_success "Root package.json updated"

# Copy documentation templates
print_step "Copying documentation..."
cp "$SOURCE_REPO_PATH/UPDATE_TEMPLATE_GUIDE.md" "$TEMPLATE_REPO_PATH/docs/" 2>/dev/null || print_warning "UPDATE_TEMPLATE_GUIDE.md not found"
print_success "Documentation copied"

# Create a summary of changes
cat > "$TEMPLATE_REPO_PATH/TEMPLATE_UPDATE_SUMMARY.md" << EOF
# Template Update Summary

This template has been updated with improvements from the Abyss Central project on $(date).

## Key Updates:
- ✅ Development standards (.claude-rules, .modularity-checklist)
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Docker configuration
- ✅ Monorepo structure with npm workspaces
- ✅ Shared libraries structure
- ✅ Service template with best practices
- ✅ Testing infrastructure
- ✅ Security patterns

## Next Steps:
1. Update package names from @your-app to your namespace
2. Update the root package.json with your project details
3. Customize the example service for your needs
4. Review and adapt GitHub workflows
5. Update documentation with your project specifics

## Breaking Changes:
- Dependencies now use "*" instead of "workspace:*"
- Services must be split if over 500 lines
- All endpoints require authentication and rate limiting
- OpenAPI documentation is required

Backup created at: $BACKUP_DIR
EOF

print_success "Update summary created"

echo ""
echo "✅ Template repository updated successfully!"
echo ""
echo "📋 Summary:"
echo "- Backup created at: $BACKUP_DIR"
echo "- Standards and configuration files copied"
echo "- Directory structure created"
echo "- Service and library templates added"
echo "- Documentation updated"
echo ""
echo "📝 Next steps:"
echo "1. Review TEMPLATE_UPDATE_SUMMARY.md in the template repository"
echo "2. Update package names and project-specific details"
echo "3. Test the template by creating a new project"
echo "4. Commit the changes to your template repository"
echo ""
print_warning "Remember to update @your-app namespace to your actual namespace!"