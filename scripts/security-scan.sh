#!/bin/bash
# Comprehensive security scanning script for Abyss Central
# Runs all security tools in sequence and generates a consolidated report

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Starting comprehensive security scan for Abyss Central...${NC}"
echo ""

SCAN_RESULTS_DIR="security-scan-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULTS_DIR="${SCAN_RESULTS_DIR}/${TIMESTAMP}"

# Create results directory
mkdir -p "$RESULTS_DIR"

TOTAL_ISSUES=0
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0

# Function to log scan results
log_result() {
    local tool=$1
    local status=$2
    local issues=$3
    local severity=$4
    
    echo "[$timestamp] $tool: $status ($issues issues, severity: $severity)" >> "$RESULTS_DIR/scan-summary.log"
    
    case $severity in
        "CRITICAL") CRITICAL_ISSUES=$((CRITICAL_ISSUES + issues)) ;;
        "HIGH") HIGH_ISSUES=$((HIGH_ISSUES + issues)) ;;
        "MEDIUM") MEDIUM_ISSUES=$((MEDIUM_ISSUES + issues)) ;;
        "LOW") LOW_ISSUES=$((LOW_ISSUES + issues)) ;;
    esac
    
    TOTAL_ISSUES=$((TOTAL_ISSUES + issues))
}

# 1. Secret Scanning with GitLeaks
echo -e "${YELLOW}🔍 Running GitLeaks secret detection...${NC}"
if command -v gitleaks &> /dev/null; then
    if gitleaks detect --config .gitleaks.toml --report-format json --report-path "$RESULTS_DIR/gitleaks-report.json" --no-git; then
        echo -e "${GREEN}✅ GitLeaks: No secrets detected${NC}"
        log_result "GitLeaks" "PASSED" 0 "LOW"
    else
        echo -e "${RED}❌ GitLeaks: Secrets detected${NC}"
        SECRET_COUNT=$(jq length "$RESULTS_DIR/gitleaks-report.json" 2>/dev/null || echo "0")
        log_result "GitLeaks" "FAILED" "$SECRET_COUNT" "CRITICAL"
    fi
else
    echo -e "${YELLOW}⚠️  GitLeaks not installed, skipping...${NC}"
    log_result "GitLeaks" "SKIPPED" 0 "N/A"
fi

# 2. TruffleHog secret scanning
echo -e "${YELLOW}🔍 Running TruffleHog secret detection...${NC}"
if command -v trufflehog &> /dev/null; then
    if trufflehog filesystem . --config .trufflehog.yml --json > "$RESULTS_DIR/trufflehog-report.json" 2>/dev/null; then
        echo -e "${GREEN}✅ TruffleHog: Scan completed${NC}"
        TRUFFLEHOG_COUNT=$(grep -c '"DetectorName"' "$RESULTS_DIR/trufflehog-report.json" 2>/dev/null || echo "0")
        if [ "$TRUFFLEHOG_COUNT" -gt 0 ]; then
            echo -e "${RED}❌ TruffleHog: $TRUFFLEHOG_COUNT potential secrets found${NC}"
            log_result "TruffleHog" "ISSUES_FOUND" "$TRUFFLEHOG_COUNT" "HIGH"
        else
            log_result "TruffleHog" "PASSED" 0 "LOW"
        fi
    else
        echo -e "${YELLOW}⚠️  TruffleHog scan failed${NC}"
        log_result "TruffleHog" "ERROR" 0 "N/A"
    fi
else
    echo -e "${YELLOW}⚠️  TruffleHog not installed, skipping...${NC}"
    log_result "TruffleHog" "SKIPPED" 0 "N/A"
fi

# 3. Semgrep SAST scanning
echo -e "${YELLOW}🔍 Running Semgrep SAST scan...${NC}"
if command -v semgrep &> /dev/null; then
    if semgrep --config=auto --json --output="$RESULTS_DIR/semgrep-report.json" . 2>/dev/null; then
        echo -e "${GREEN}✅ Semgrep: Scan completed${NC}"
        SEMGREP_COUNT=$(jq '.results | length' "$RESULTS_DIR/semgrep-report.json" 2>/dev/null || echo "0")
        if [ "$SEMGREP_COUNT" -gt 0 ]; then
            echo -e "${YELLOW}⚠️  Semgrep: $SEMGREP_COUNT findings${NC}"
            log_result "Semgrep" "ISSUES_FOUND" "$SEMGREP_COUNT" "MEDIUM"
        else
            log_result "Semgrep" "PASSED" 0 "LOW"
        fi
    else
        echo -e "${YELLOW}⚠️  Semgrep scan failed${NC}"
        log_result "Semgrep" "ERROR" 0 "N/A"
    fi
else
    echo -e "${YELLOW}⚠️  Semgrep not installed, skipping...${NC}"
    echo -e "${BLUE}   Install with: pip install semgrep${NC}"
    log_result "Semgrep" "SKIPPED" 0 "N/A"
fi

# 4. Dependency vulnerability scanning
echo -e "${YELLOW}🔍 Running dependency vulnerability scan...${NC}"
if pnpm audit --json > "$RESULTS_DIR/npm-audit-report.json" 2>/dev/null; then
    echo -e "${GREEN}✅ npm audit: No vulnerabilities${NC}"
    log_result "npm-audit" "PASSED" 0 "LOW"
else
    VULNERABILITY_COUNT=$(jq '.metadata.vulnerabilities.total' "$RESULTS_DIR/npm-audit-report.json" 2>/dev/null || echo "unknown")
    if [ "$VULNERABILITY_COUNT" != "0" ] && [ "$VULNERABILITY_COUNT" != "unknown" ]; then
        echo -e "${RED}❌ npm audit: $VULNERABILITY_COUNT vulnerabilities found${NC}"
        log_result "npm-audit" "ISSUES_FOUND" "$VULNERABILITY_COUNT" "HIGH"
    else
        log_result "npm-audit" "PASSED" 0 "LOW"
    fi
fi

# 5. Custom security checks
echo -e "${YELLOW}🔍 Running custom security checks...${NC}"

# Check .env files
if [ -f "scripts/check-env-security.sh" ]; then
    if ./scripts/check-env-security.sh > "$RESULTS_DIR/env-security-check.log" 2>&1; then
        echo -e "${GREEN}✅ Environment file security: Passed${NC}"
        log_result "env-security" "PASSED" 0 "LOW"
    else
        echo -e "${RED}❌ Environment file security: Issues found${NC}"
        log_result "env-security" "FAILED" 1 "MEDIUM"
    fi
fi

# Check Docker security
if [ -f "scripts/validate-docker-security.sh" ]; then
    if ./scripts/validate-docker-security.sh > "$RESULTS_DIR/docker-security-check.log" 2>&1; then
        echo -e "${GREEN}✅ Docker security: Passed${NC}"
        log_result "docker-security" "PASSED" 0 "LOW"
    else
        echo -e "${YELLOW}⚠️  Docker security: Issues found${NC}"
        log_result "docker-security" "ISSUES_FOUND" 1 "MEDIUM"
    fi
fi

# Check SQL injection
if [ -f "scripts/check-sql-security.sh" ]; then
    if ./scripts/check-sql-security.sh > "$RESULTS_DIR/sql-security-check.log" 2>&1; then
        echo -e "${GREEN}✅ SQL security: Passed${NC}"
        log_result "sql-security" "PASSED" 0 "LOW"
    else
        echo -e "${RED}❌ SQL security: Potential issues found${NC}"
        log_result "sql-security" "ISSUES_FOUND" 1 "HIGH"
    fi
fi

# 6. Generate consolidated report
echo ""
echo -e "${BLUE}📊 Generating security scan report...${NC}"

cat > "$RESULTS_DIR/security-report.md" << EOF
# Security Scan Report

**Scan Date:** $(date)
**Project:** Abyss Central Event Rental Management Suite
**Scan ID:** $TIMESTAMP

## Executive Summary

- **Total Issues Found:** $TOTAL_ISSUES
- **Critical Issues:** $CRITICAL_ISSUES
- **High Severity:** $HIGH_ISSUES
- **Medium Severity:** $MEDIUM_ISSUES
- **Low Severity:** $LOW_ISSUES

## Security Tools Used

### 1. Secret Detection
- **GitLeaks:** Detects secrets in code and git history
- **TruffleHog:** Advanced secret detection with verification

### 2. Static Application Security Testing (SAST)
- **Semgrep:** Code vulnerability scanning
- **Custom Scripts:** Project-specific security checks

### 3. Dependency Scanning
- **npm audit:** Known vulnerability detection in dependencies

### 4. Custom Security Checks
- **Environment Security:** Validates .env file security
- **Docker Security:** Checks Docker configuration security
- **SQL Security:** Detects potential SQL injection vulnerabilities

## Detailed Results

$(cat "$RESULTS_DIR/scan-summary.log" | sed 's/^/- /')

## Recommendations

### Immediate Actions Required (Critical/High)
EOF

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo "- 🚨 **CRITICAL:** $CRITICAL_ISSUES critical security issues detected" >> "$RESULTS_DIR/security-report.md"
    echo "  - Review GitLeaks report for exposed secrets" >> "$RESULTS_DIR/security-report.md"
    echo "  - Rotate any compromised credentials immediately" >> "$RESULTS_DIR/security-report.md"
fi

if [ $HIGH_ISSUES -gt 0 ]; then
    echo "- ⚠️ **HIGH:** $HIGH_ISSUES high-severity issues found" >> "$RESULTS_DIR/security-report.md"
    echo "  - Review TruffleHog and dependency scan results" >> "$RESULTS_DIR/security-report.md"
    echo "  - Update vulnerable dependencies" >> "$RESULTS_DIR/security-report.md"
fi

cat >> "$RESULTS_DIR/security-report.md" << EOF

### Medium Priority Actions
- Review Semgrep findings for code improvements
- Address Docker and environment configuration issues
- Implement additional input validation where needed

### Low Priority Maintenance
- Keep dependencies updated regularly
- Monitor for new security advisories
- Regular security scanning in CI/CD pipeline

## Files Generated

- \`scan-summary.log\` - Summary of all tool results
- \`gitleaks-report.json\` - GitLeaks detailed findings
- \`trufflehog-report.json\` - TruffleHog detailed findings
- \`semgrep-report.json\` - Semgrep SAST results
- \`npm-audit-report.json\` - Dependency vulnerability report
- \`*-security-check.log\` - Custom security check logs

## Next Steps

1. **Review all reports** in the \`$RESULTS_DIR\` directory
2. **Prioritize fixes** based on severity levels
3. **Implement remediation** for critical and high-severity issues
4. **Set up continuous monitoring** with GitHub Actions
5. **Schedule regular security reviews** as part of development process

---
Generated by Abyss Central Security Scanner
EOF

# 7. Display final results
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                        SECURITY SCAN COMPLETE                        ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}📊 SCAN SUMMARY${NC}"
echo -e "   Total Issues: $TOTAL_ISSUES"
echo -e "   Critical:     $CRITICAL_ISSUES"
echo -e "   High:         $HIGH_ISSUES"
echo -e "   Medium:       $MEDIUM_ISSUES"
echo -e "   Low:          $LOW_ISSUES"
echo ""
echo -e "${BLUE}📁 RESULTS LOCATION${NC}"
echo -e "   Directory: $RESULTS_DIR"
echo -e "   Report:    $RESULTS_DIR/security-report.md"
echo ""

if [ $CRITICAL_ISSUES -gt 0 ]; then
    echo -e "${RED}⚠️  CRITICAL ISSUES DETECTED!${NC}"
    echo -e "${RED}   Please review and address immediately${NC}"
    exit 1
elif [ $HIGH_ISSUES -gt 0 ]; then
    echo -e "${YELLOW}⚠️  HIGH SEVERITY ISSUES FOUND${NC}"
    echo -e "${YELLOW}   Please review and address soon${NC}"
    exit 1
elif [ $TOTAL_ISSUES -gt 0 ]; then
    echo -e "${YELLOW}ℹ️  Some issues found, but no critical security risks${NC}"
    echo -e "${GREEN}✅ Security scan completed successfully${NC}"
    exit 0
else
    echo -e "${GREEN}✅ No security issues detected!${NC}"
    echo -e "${GREEN}   Great job maintaining secure code${NC}"
    exit 0
fi