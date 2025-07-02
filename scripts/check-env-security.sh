#!/bin/bash
# Security check for .env files
# Prevents committing sensitive data in environment files

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Checking .env files for security issues...${NC}"

# List of patterns that should not be in .env files
SENSITIVE_PATTERNS=(
    "password=.*[^(test|example|demo|sample)]"
    "secret=.*[^(test|example|demo|sample)]"
    "key=.*[^(test|example|demo|sample)]"
    "token=.*[^(test|example|demo|sample)]"
    "api_key=.*[^(test|example|demo|sample)]"
    "private_key="
    "cert="
    "ssl_cert="
    "database_url=.*://.*:.*@"
    "redis_url=.*://.*:.*@"
    "mongodb_uri=.*://.*:.*@"
)

# Find all .env files
ENV_FILES=$(find . -name ".env*" -not -path "./node_modules/*" -not -path "./.git/*" -type f)

if [ -z "$ENV_FILES" ]; then
    echo -e "${GREEN}✅ No .env files found${NC}"
    exit 0
fi

ISSUES_FOUND=0

for file in $ENV_FILES; do
    echo -e "${YELLOW}Checking: $file${NC}"
    
    # Check for common sensitive patterns
    for pattern in "${SENSITIVE_PATTERNS[@]}"; do
        if grep -qi "$pattern" "$file"; then
            echo -e "${RED}❌ Potential sensitive data found in $file${NC}"
            echo -e "${RED}   Pattern: $pattern${NC}"
            ISSUES_FOUND=1
        fi
    done
    
    # Check for actual values (not just placeholders)
    if grep -E "^[A-Z_]+=.+" "$file" | grep -v -E "(test|example|demo|sample|placeholder|change_me|your_.*_here)" | grep -q .; then
        echo -e "${YELLOW}⚠️  Warning: $file contains actual values (not placeholders)${NC}"
        echo -e "${YELLOW}   Make sure these are not sensitive production values${NC}"
    fi
    
    # Check file permissions
    if [ -r "$file" ] && [ -w "$file" ] && [ -x "$file" ]; then
        echo -e "${YELLOW}⚠️  Warning: $file has execute permissions${NC}"
        echo -e "${YELLOW}   Consider removing execute permissions: chmod 600 $file${NC}"
    fi
done

if [ $ISSUES_FOUND -eq 1 ]; then
    echo -e "${RED}❌ Security issues found in .env files${NC}"
    echo -e "${RED}   Please review and fix the issues above${NC}"
    echo -e "${RED}   Use placeholder values for sensitive data${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All .env files pass security checks${NC}"
exit 0