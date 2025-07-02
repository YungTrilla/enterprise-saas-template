#!/bin/bash
# SQL security check script
# Detects potential SQL injection vulnerabilities

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔍 Checking for SQL injection vulnerabilities...${NC}"

ISSUES_FOUND=0

# Find all relevant source files
SOURCE_FILES=$(find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | grep -v node_modules | grep -v .git | grep -v dist | grep -v build | grep -v coverage)

if [ -z "$SOURCE_FILES" ]; then
    echo -e "${GREEN}✅ No source files found${NC}"
    exit 0
fi

# Patterns that might indicate SQL injection vulnerabilities
SQL_INJECTION_PATTERNS=(
    # String concatenation in SQL queries
    "SELECT.*\+.*"
    "INSERT.*\+.*"
    "UPDATE.*\+.*"
    "DELETE.*\+.*"
    "WHERE.*\+.*"
    
    # Template literals with variables
    "SELECT.*\$\{.*\}"
    "INSERT.*\$\{.*\}"
    "UPDATE.*\$\{.*\}"
    "DELETE.*\$\{.*\}"
    "WHERE.*\$\{.*\}"
    
    # Direct variable interpolation
    "query.*=.*['\"].*\+.*['\"]"
    "sql.*=.*['\"].*\+.*['\"]"
    
    # Dangerous database methods
    "\.query\(.*\+.*\)"
    "\.exec\(.*\+.*\)"
    "\.run\(.*\+.*\)"
)

# Safe patterns to exclude
SAFE_PATTERNS=(
    # Using parameterized queries
    "\.query\(.*,.*\[.*\]"
    "\.query\(.*,.*\$1"
    "\.query\(.*,.*\$2"
    "\.prepare\("
    "\.bind\("
    
    # Using query builders
    "knex\("
    "\.select\("
    "\.where\("
    "\.insert\("
    "\.update\("
    
    # Using ORMs
    "\.findOne\("
    "\.findMany\("
    "\.create\("
    "\.updateMany\("
    "\.deleteMany\("
)

for file in $SOURCE_FILES; do
    # Check for SQL injection patterns
    for pattern in "${SQL_INJECTION_PATTERNS[@]}"; do
        if grep -n -i "$pattern" "$file" > /dev/null 2>&1; then
            # Check if it's a safe pattern
            IS_SAFE=0
            for safe_pattern in "${SAFE_PATTERNS[@]}"; do
                if grep -n -i "$safe_pattern" "$file" > /dev/null 2>&1; then
                    IS_SAFE=1
                    break
                fi
            done
            
            if [ $IS_SAFE -eq 0 ]; then
                echo -e "${RED}❌ Potential SQL injection in $file${NC}"
                echo -e "${RED}   Pattern: $pattern${NC}"
                grep -n -i "$pattern" "$file" | head -3 | while read line; do
                    echo -e "${YELLOW}   Line: $line${NC}"
                done
                ISSUES_FOUND=1
            fi
        fi
    done
    
    # Check for raw SQL queries without parameterization
    if grep -n -E "(query|exec|run)\s*\(\s*['\"].*['\"][^,]*\)" "$file" > /dev/null 2>&1; then
        # Make sure it's not a simple static query
        if grep -n -E "(query|exec|run)\s*\(\s*['\"].*\$\{.*\}.*['\"][^,]*\)" "$file" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Possible dynamic SQL query in $file${NC}"
            echo -e "${YELLOW}   Consider using parameterized queries${NC}"
            grep -n -E "(query|exec|run)\s*\(\s*['\"].*\$\{.*\}.*['\"][^,]*\)" "$file" | head -2 | while read line; do
                echo -e "${YELLOW}   Line: $line${NC}"
            done
        fi
    fi
    
    # Check for common SQL injection keywords in user input handling
    if grep -n -i -E "(req\.(body|query|params).*SELECT|req\.(body|query|params).*INSERT|req\.(body|query|params).*UPDATE|req\.(body|query|params).*DELETE)" "$file" > /dev/null 2>&1; then
        echo -e "${RED}❌ Direct user input in SQL query in $file${NC}"
        echo -e "${RED}   Never use user input directly in SQL queries${NC}"
        grep -n -i -E "(req\.(body|query|params).*SELECT|req\.(body|query|params).*INSERT|req\.(body|query|params).*UPDATE|req\.(body|query|params).*DELETE)" "$file" | head -2 | while read line; do
            echo -e "${YELLOW}   Line: $line${NC}"
        done
        ISSUES_FOUND=1
    fi
done

# Check for proper input validation
echo -e "${YELLOW}📋 Checking for input validation patterns...${NC}"

INPUT_VALIDATION_FOUND=0
for file in $SOURCE_FILES; do
    if grep -q -E "(validator\.|joi\.|yup\.|zod\.|express-validator)" "$file"; then
        INPUT_VALIDATION_FOUND=1
        break
    fi
done

if [ $INPUT_VALIDATION_FOUND -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No input validation libraries detected${NC}"
    echo -e "${YELLOW}   Consider using validation libraries like Joi, Yup, or Zod${NC}"
fi

if [ $ISSUES_FOUND -eq 1 ]; then
    echo -e "${RED}❌ Potential SQL injection vulnerabilities found${NC}"
    echo -e "${RED}   Please review and fix the issues above${NC}"
    echo -e "${RED}   Use parameterized queries and input validation${NC}"
    exit 1
fi

echo -e "${GREEN}✅ No obvious SQL injection vulnerabilities found${NC}"
echo -e "${GREEN}   Remember to always use parameterized queries!${NC}"
exit 0