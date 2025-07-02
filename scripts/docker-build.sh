#!/bin/bash

# Docker Build Script for Abyss Central
# This script builds all Docker images for the monorepo

set -e

echo "🚀 Building Abyss Central Docker images..."

# Build shared libraries first
echo "📦 Building shared libraries..."
npm run build --workspace=@abyss/shared-types
npm run build --workspace=@abyss/shared-utils
npm run build --workspace=@abyss/shared-config
npm run build --workspace=@abyss/api-client
npm run build --workspace=@abyss/database-migration

# Build services
echo "🏗️ Building services..."
npm run build --workspace=@abyss/api-gateway
npm run build --workspace=@abyss/auth-service
npm run build --workspace=@abyss/inventory-service

# Build Docker images
echo "🐳 Building Docker images..."
docker-compose build --parallel

echo "✅ Build complete!"
echo ""
echo "To start the services, run:"
echo "  docker-compose up -d"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"