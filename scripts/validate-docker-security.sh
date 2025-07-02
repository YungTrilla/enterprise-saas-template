#!/bin/bash
# Docker security validation script
# Checks Docker files for common security issues

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Validating Docker security configurations...${NC}"

ISSUES_FOUND=0

# Find all Docker files
DOCKER_FILES=$(find . -name "Dockerfile*" -o -name "docker-compose*.yml" -o -name "docker-compose*.yaml" | grep -v node_modules | grep -v .git)

if [ -z "$DOCKER_FILES" ]; then
    echo -e "${GREEN}✅ No Docker files found${NC}"
    exit 0
fi

for file in $DOCKER_FILES; do
    echo -e "${YELLOW}Checking: $file${NC}"
    
    # Check for running as root
    if grep -q "USER root" "$file" || ! grep -q "USER " "$file"; then
        if [[ "$file" == *"Dockerfile"* ]]; then
            echo -e "${RED}❌ $file: Running as root user${NC}"
            echo -e "${RED}   Add 'USER' instruction to run as non-root${NC}"
            ISSUES_FOUND=1
        fi
    fi
    
    # Check for hardcoded secrets
    if grep -E "(password|secret|key|token).*=" "$file" | grep -v -E "(example|test|demo|sample)"; then
        echo -e "${RED}❌ $file: Potential hardcoded secrets${NC}"
        echo -e "${RED}   Use environment variables or secrets management${NC}"
        ISSUES_FOUND=1
    fi
    
    # Check for latest tag usage
    if grep -q "FROM.*:latest" "$file"; then
        echo -e "${YELLOW}⚠️  $file: Using 'latest' tag${NC}"
        echo -e "${YELLOW}   Consider pinning to specific versions for security${NC}"
    fi
    
    # Check for ADD vs COPY
    if grep -q "^ADD " "$file"; then
        echo -e "${YELLOW}⚠️  $file: Using ADD instruction${NC}"
        echo -e "${YELLOW}   Consider using COPY instead of ADD for security${NC}"
    fi
    
    # Check for privileged mode
    if grep -q "privileged.*true" "$file"; then
        echo -e "${RED}❌ $file: Running in privileged mode${NC}"
        echo -e "${RED}   Avoid privileged mode unless absolutely necessary${NC}"
        ISSUES_FOUND=1
    fi
    
    # Check for host network mode
    if grep -q "network_mode.*host" "$file"; then
        echo -e "${YELLOW}⚠️  $file: Using host network mode${NC}"
        echo -e "${YELLOW}   Consider using bridge network for better isolation${NC}"
    fi
    
    # Check for volume mounts that might be risky
    if grep -E "(volumes?|mount).*:" "$file" | grep -E "(/etc|/var|/usr|/sys|/proc|/dev)"; then
        echo -e "${YELLOW}⚠️  $file: Mounting sensitive host directories${NC}"
        echo -e "${YELLOW}   Review volume mounts for security implications${NC}"
    fi
    
    # Check for package manager cache cleanup
    if [[ "$file" == *"Dockerfile"* ]]; then
        if grep -q "apt-get install" "$file" && ! grep -q "rm -rf /var/lib/apt/lists" "$file"; then
            echo -e "${YELLOW}⚠️  $file: apt cache not cleaned${NC}"
            echo -e "${YELLOW}   Add 'rm -rf /var/lib/apt/lists/*' to reduce image size${NC}"
        fi
        
        if grep -q "apk add" "$file" && ! grep -q "rm -rf /var/cache/apk" "$file"; then
            echo -e "${YELLOW}⚠️  $file: apk cache not cleaned${NC}"
            echo -e "${YELLOW}   Add 'rm -rf /var/cache/apk/*' to reduce image size${NC}"
        fi
    fi
    
    # Check for environment variables with sensitive names
    if grep -E "ENV.*(PASSWORD|SECRET|KEY|TOKEN)" "$file"; then
        echo -e "${RED}❌ $file: Sensitive environment variables${NC}"
        echo -e "${RED}   Use build-time arguments or runtime secrets instead ${NC}"
        ISSUES_FOUND=1
    fi
done

if [ $ISSUES_FOUND -eq 1 ]; then
    echo -e "${RED}❌ Docker security issues found${NC}"
    echo -e "${RED}   Please review and fix the issues above${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All Docker files pass security validation${NC}"
exit 0