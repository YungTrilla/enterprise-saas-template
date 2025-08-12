#!/bin/bash

# Enterprise SaaS Template - API Documentation Generator
# Generates HTML documentation from OpenAPI specifications

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCS_OUTPUT_DIR="docs/generated"
SERVICES_DIR="services"

echo "🚀 Enterprise SaaS Template - API Documentation Generator"
echo "========================================================"

# Create output directory
mkdir -p "$DOCS_OUTPUT_DIR"

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

# Generate documentation for each service
failed_services=()
successful_services=()

for spec in "${openapi_specs[@]}"; do
    # Extract service name from path
    service_name=$(echo "$spec" | cut -d'/' -f2)
    output_file="$DOCS_OUTPUT_DIR/${service_name}.html"
    
    echo -e "${BLUE}📝 Generating documentation for ${service_name}...${NC}"
    
    # Validate specification first
    if ! npx swagger-cli validate "$spec" >/dev/null 2>&1; then
        echo -e "${RED}❌ Invalid OpenAPI specification: $spec${NC}"
        failed_services+=("$service_name")
        continue
    fi
    
    # Generate documentation
    if npx redoc-cli build "$spec" --output "$output_file" >/dev/null 2>&1; then
        file_size=$(du -h "$output_file" | cut -f1)
        echo -e "${GREEN}✅ Generated: $output_file ($file_size)${NC}"
        successful_services+=("$service_name")
    else
        echo -e "${RED}❌ Failed to generate documentation for $service_name${NC}"
        failed_services+=("$service_name")
    fi
done

echo
echo "========================================================"

# Generate index page
index_file="$DOCS_OUTPUT_DIR/index.html"
echo -e "${BLUE}📋 Generating API documentation index...${NC}"

cat > "$index_file" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Enterprise SaaS Template - API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #eee;
        }
        .header h1 {
            color: #2563eb;
            margin-bottom: 0.5rem;
        }
        .header p {
            color: #6b7280;
            font-size: 1.1rem;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        .service-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 1.5rem;
            background: #f9fafb;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .service-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .service-card h3 {
            margin-top: 0;
            color: #1f2937;
        }
        .service-card p {
            color: #6b7280;
            margin-bottom: 1rem;
        }
        .service-card a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
        }
        .service-card a:hover {
            text-decoration: underline;
        }
        .status {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            margin-left: 0.5rem;
        }
        .status.success {
            background: #dcfce7;
            color: #166534;
        }
        .status.error {
            background: #fef2f2;
            color: #dc2626;
        }
        .footer {
            text-align: center;
            padding-top: 2rem;
            border-top: 1px solid #eee;
            color: #6b7280;
            font-size: 0.9rem;
        }
        .meta {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 2rem;
        }
        .meta h4 {
            margin-top: 0;
            color: #374151;
        }
        .meta ul {
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Enterprise SaaS Template</h1>
        <p>Comprehensive API Documentation</p>
    </div>

    <div class="meta">
        <h4>📊 Generation Summary</h4>
        <ul>
            <li><strong>Generated:</strong> $(date)</li>
            <li><strong>Total Services:</strong> ${#openapi_specs[@]}</li>
            <li><strong>Successful:</strong> ${#successful_services[@]}</li>
            <li><strong>Failed:</strong> ${#failed_services[@]}</li>
        </ul>
    </div>

    <div class="services-grid">
EOF

# Add service cards
for service in "${successful_services[@]}"; do
    service_title=$(echo "$service" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
    cat >> "$index_file" << EOF
        <div class="service-card">
            <h3>$service_title <span class="status success">Available</span></h3>
            <p>API documentation for the $service service.</p>
            <a href="./${service}.html">View Documentation →</a>
        </div>
EOF
done

# Add failed services
for service in "${failed_services[@]}"; do
    service_title=$(echo "$service" | sed 's/-/ /g' | sed 's/\b\w/\U&/g')
    cat >> "$index_file" << EOF
        <div class="service-card">
            <h3>$service_title <span class="status error">Failed</span></h3>
            <p>Documentation generation failed for this service.</p>
            <a href="#">Check service OpenAPI specification</a>
        </div>
EOF
done

cat >> "$index_file" << EOF
    </div>

    <div class="footer">
        <p>Generated by Enterprise SaaS Template API Documentation Generator</p>
        <p>Last updated: $(date)</p>
    </div>
</body>
</html>
EOF

echo -e "${GREEN}✅ Generated index page: $index_file${NC}"

# Summary
echo
if [ ${#successful_services[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Successfully generated documentation for ${#successful_services[@]} service(s):${NC}"
    for service in "${successful_services[@]}"; do
        echo "   ✓ $service"
    done
fi

if [ ${#failed_services[@]} -gt 0 ]; then
    echo
    echo -e "${RED}❌ Failed to generate documentation for ${#failed_services[@]} service(s):${NC}"
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
echo -e "${BLUE}🌐 To serve documentation locally:${NC}"
echo "   cd $DOCS_OUTPUT_DIR && python -m http.server 8080"
echo "   Then visit: http://localhost:8080"

echo
echo -e "${GREEN}🎉 API documentation generation completed!${NC}"

# Exit with error code if any services failed
if [ ${#failed_services[@]} -gt 0 ]; then
    exit 1
fi