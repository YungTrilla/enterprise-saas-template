#!/bin/bash

# Enterprise SaaS Template - API Client Generator
# Generates TypeScript clients from OpenAPI specifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLIENTS_OUTPUT_DIR="libs/api-client/src/generated"
SERVICES_DIR="services"

echo "🚀 Enterprise SaaS Template - API Client Generator"
echo "=================================================="

# Create output directory
mkdir -p "$CLIENTS_OUTPUT_DIR"

# Find all OpenAPI specifications
openapi_specs=()
while IFS= read -r -d '' spec; do
    openapi_specs+=("$spec")
done < <(find "$SERVICES_DIR" -name "openapi.yaml" -type f -print0)

if [ ${#openapi_specs[@]} -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No OpenAPI specifications found in $SERVICES_DIR${NC}"
    echo "   Expected location: services/*/docs/openapi.yaml"
    exit 0
fi

echo -e "${BLUE}🔍 Found ${#openapi_specs[@]} OpenAPI specification(s):${NC}"
for spec in "${openapi_specs[@]}"; do
    echo "   - $spec"
done
echo

# Generate clients for each service
failed_services=()
successful_services=()

for spec in "${openapi_specs[@]}"; do
    # Extract service name from path
    service_name=$(echo "$spec" | cut -d'/' -f2)
    output_dir="$CLIENTS_OUTPUT_DIR/$service_name"
    
    echo -e "${BLUE}📝 Generating TypeScript client for ${service_name}...${NC}"
    
    # Validate specification first
    if ! npx swagger-cli validate "$spec" >/dev/null 2>&1; then
        echo -e "${RED}❌ Invalid OpenAPI specification: $spec${NC}"
        failed_services+=("$service_name")
        continue
    fi
    
    # Clean output directory
    rm -rf "$output_dir"
    mkdir -p "$output_dir"
    
    # Generate TypeScript client
    if npx openapi-generator-cli generate \
        -i "$spec" \
        -g typescript-axios \
        -o "$output_dir" \
        --additional-properties=npmName="@template/${service_name}-client",npmVersion="1.0.0",supportsES6=true,withSeparateModelsAndApi=true,modelPackage="models",apiPackage="api" \
        >/dev/null 2>&1; then
        
        # Count generated files
        file_count=$(find "$output_dir" -name "*.ts" | wc -l)
        echo -e "${GREEN}✅ Generated: $output_dir ($file_count TypeScript files)${NC}"
        successful_services+=("$service_name")
        
        # Create service-specific index file
        cat > "$output_dir/index.ts" << EOF
// Auto-generated TypeScript client for $service_name
// Generated on: $(date)

export * from './api';
export * from './models';
export * from './base';
export * from './common';
export * from './configuration';

// Re-export for convenience
export { Configuration } from './configuration';
export { BASE_PATH } from './base';
EOF
        
    else
        echo -e "${RED}❌ Failed to generate client for $service_name${NC}"
        failed_services+=("$service_name")
    fi
done

echo
echo "=================================================="

# Generate consolidated index file
consolidated_index="$CLIENTS_OUTPUT_DIR/index.ts"
echo -e "${BLUE}📋 Generating consolidated client index...${NC}"

cat > "$consolidated_index" << EOF
// Enterprise SaaS Template - API Clients
// Auto-generated TypeScript clients for all services
// Generated on: $(date)

EOF

# Export all successful service clients
for service in "${successful_services[@]}"; do
    service_camel=$(echo "$service" | sed -r 's/(^|-)([a-z])/\U\2/g')
    cat >> "$consolidated_index" << EOF
// $service_camel Service Client
export * as ${service_camel}Client from './$service';

EOF
done

# Add utility exports
cat >> "$consolidated_index" << EOF
// Common types and utilities
export type { AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuration helper
export interface ApiConfiguration {
  basePath?: string;
  accessToken?: string | (() => string);
  username?: string;
  password?: string;
  apiKey?: string | ((name: string) => string);
}

// Default configuration factory
export const createApiConfiguration = (config: ApiConfiguration = {}) => {
  return {
    basePath: config.basePath || 'https://api.example.com/v1',
    accessToken: config.accessToken,
    username: config.username,
    password: config.password,
    apiKey: config.apiKey,
  };
};
EOF

echo -e "${GREEN}✅ Generated consolidated index: $consolidated_index${NC}"

# Generate package.json for the api-client library
package_json="libs/api-client/package.json"
echo -e "${BLUE}📦 Updating api-client package.json...${NC}"

cat > "$package_json" << EOF
{
  "name": "@template/api-client",
  "version": "1.0.0",
  "description": "TypeScript API clients for Enterprise SaaS Template services",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.2",
    "@types/node": "^20.10.0"
  },
  "peerDependencies": {
    "typescript": ">=4.0.0"
  },
  "files": [
    "dist/**/*",
    "src/**/*"
  ],
  "keywords": [
    "api",
    "client",
    "typescript",
    "enterprise",
    "saas"
  ],
  "author": "Enterprise SaaS Template Team",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/enterprise-saas-template.git",
    "directory": "libs/api-client"
  }
}
EOF

echo -e "${GREEN}✅ Updated: $package_json${NC}"

# Generate TypeScript configuration for api-client
tsconfig_json="libs/api-client/tsconfig.json"
cat > "$tsconfig_json" << EOF
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020", "DOM"]
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
}
EOF

echo -e "${GREEN}✅ Generated: $tsconfig_json${NC}"

# Generate README for api-client
readme_file="libs/api-client/README.md"
cat > "$readme_file" << EOF
# Enterprise SaaS Template - API Client

Auto-generated TypeScript clients for all Enterprise SaaS Template services.

## 🚀 Installation

\`\`\`bash
# Install the API client library
pnpm add @template/api-client

# Or install from workspace (during development)
pnpm add @template/api-client@workspace:*
\`\`\`

## 📖 Usage

### Basic Usage

\`\`\`typescript
import { AuthClient, createApiConfiguration } from '@template/api-client';

// Create configuration
const config = createApiConfiguration({
  basePath: 'https://api.example.com/v1',
  accessToken: 'your-jwt-token'
});

// Create client instance
const authApi = new AuthClient.AuthenticationApi(config);

// Use the client
try {
  const response = await authApi.authLoginPost({
    email: 'user@example.com',
    password: 'password123'
  });
  
  console.log('Login successful:', response.data);
} catch (error) {
  console.error('Login failed:', error);
}
\`\`\`

### Available Clients

EOF

# Add documentation for each service client
for service in "${successful_services[@]}"; do
    service_camel=$(echo "$service" | sed -r 's/(^|-)([a-z])/\U\2/g')
    service_title=$(echo "$service" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
    cat >> "$readme_file" << EOF
#### $service_title

\`\`\`typescript
import { ${service_camel}Client } from '@template/api-client';

const ${service}Api = new ${service_camel}Client.DefaultApi(config);
\`\`\`

EOF
done

cat >> "$readme_file" << EOF
### Configuration Options

\`\`\`typescript
interface ApiConfiguration {
  basePath?: string;                          // API base URL
  accessToken?: string | (() => string);     // JWT access token
  username?: string;                          // Basic auth username
  password?: string;                          // Basic auth password
  apiKey?: string | ((name: string) => string); // API key
}
\`\`\`

### Error Handling

\`\`\`typescript
import { AxiosError } from 'axios';

try {
  const response = await api.someEndpoint();
} catch (error) {
  if (error instanceof AxiosError) {
    console.error('HTTP Error:', error.response?.status);
    console.error('Error Data:', error.response?.data);
  } else {
    console.error('Unexpected Error:', error);
  }
}
\`\`\`

## 🔧 Development

### Building

\`\`\`bash
pnpm run build
\`\`\`

### Type Checking

\`\`\`bash
pnpm run typecheck
\`\`\`

### Regenerating Clients

\`\`\`bash
# Regenerate all clients
pnpm run client:generate:all

# Regenerate specific service client
pnpm run client:generate
\`\`\`

## 📋 Generated Services

| Service | Generated | API Count |
|---------|-----------|-----------|
EOF

# Add table rows for each service
for service in "${successful_services[@]}"; do
    api_count=$(find "$CLIENTS_OUTPUT_DIR/$service" -name "*Api.ts" 2>/dev/null | wc -l)
    echo "| $service | ✅ | $api_count |" >> "$readme_file"
done

for service in "${failed_services[@]}"; do
    echo "| $service | ❌ | 0 |" >> "$readme_file"
done

cat >> "$readme_file" << EOF

## 🔄 Auto-Generation

This library is automatically generated from OpenAPI specifications. Do not edit the generated files manually.

**Generation Date:** $(date)
**OpenAPI Generator Version:** $(npx openapi-generator-cli version 2>/dev/null | head -n1 || echo "Unknown")

## 📚 Resources

- [OpenAPI Generator](https://openapi-generator.tech/)
- [Axios Documentation](https://axios-http.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
EOF

echo -e "${GREEN}✅ Generated: $readme_file${NC}"

# Summary
echo
if [ ${#successful_services[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Successfully generated clients for ${#successful_services[@]} service(s):${NC}"
    for service in "${successful_services[@]}"; do
        file_count=$(find "$CLIENTS_OUTPUT_DIR/$service" -name "*.ts" | wc -l)
        echo "   ✓ $service ($file_count files)"
    done
fi

if [ ${#failed_services[@]} -gt 0 ]; then
    echo
    echo -e "${RED}❌ Failed to generate clients for ${#failed_services[@]} service(s):${NC}"
    for service in "${failed_services[@]}"; do
        echo "   ✗ $service"
    done
    echo
    echo -e "${YELLOW}💡 Troubleshooting:${NC}"
    echo "   1. Validate OpenAPI specs: pnpm run docs:validate:all"
    echo "   2. Check specification syntax and required fields"
    echo "   3. Ensure all \$ref references are valid"
fi

echo
echo -e "${BLUE}🔨 Next steps:${NC}"
echo "   1. Build the api-client library: cd libs/api-client && pnpm run build"
echo "   2. Use in other packages: import { AuthClient } from '@template/api-client'"
echo "   3. Update consuming applications with new client methods"

echo
echo -e "${GREEN}🎉 API client generation completed!${NC}"

# Exit with error code if any services failed
if [ ${#failed_services[@]} -gt 0 ]; then
    exit 1
fi