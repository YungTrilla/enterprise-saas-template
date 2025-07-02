# Security Scanning Guide - Abyss Central

Comprehensive guide for using security scanning tools in the Abyss Central Event Rental Management Suite.

## 🛡️ Overview

Abyss Central implements multiple layers of automated security scanning to detect vulnerabilities, secrets, and security misconfigurations before they reach production.

## 🔧 Security Tools Implemented

### 1. Semgrep - Static Application Security Testing (SAST)
**Purpose**: Detects code vulnerabilities and security anti-patterns
**Configuration**: `.semgrep.yml`
**Coverage**: OWASP Top 10, JavaScript/TypeScript, React, Express, PostgreSQL

```bash
# Run Semgrep scan
pnpm run security:sast

# Run with specific rules
semgrep --config=p/owasp-top-ten .
```

### 2. GitLeaks - Secret Detection
**Purpose**: Prevents secrets from being committed to git
**Configuration**: `.gitleaks.toml`
**Coverage**: API keys, passwords, tokens, database URLs, certificates

```bash
# Scan for secrets
pnpm run security:secrets

# Scan specific files
gitleaks detect --config .gitleaks.toml --source /path/to/files
```

### 3. TruffleHog - Advanced Secret Detection
**Purpose**: Deep secret detection with verification
**Configuration**: `.trufflehog.yml`
**Coverage**: 750+ secret types with verification

```bash
# Run TruffleHog scan
trufflehog filesystem . --config .trufflehog.yml
```

### 4. npm audit - Dependency Vulnerability Scanning
**Purpose**: Identifies vulnerable dependencies
**Integration**: Built into package manager
**Coverage**: Known CVEs in npm packages

```bash
# Run dependency scan
pnpm run security:deps

# Check specific severity
pnpm audit --audit-level high
```

### 5. Custom Security Scripts
**Purpose**: Project-specific security checks
**Location**: `scripts/` directory
**Coverage**: Environment files, Docker configs, SQL injection patterns

```bash
# Run all custom checks
./scripts/check-env-security.sh
./scripts/validate-docker-security.sh
./scripts/check-sql-security.sh
```

## 🚀 Quick Start

### 1. Install Security Tools
```bash
# Install all security scanning tools
pnpm run security:install

# Setup pre-commit hooks
pnpm run security:setup
```

### 2. Run Comprehensive Scan
```bash
# Run all security scans
pnpm run security:scan
```

### 3. View Results
Results are saved to `security-scan-results/[timestamp]/`:
- `security-report.md` - Executive summary
- `gitleaks-report.json` - Secret detection results
- `semgrep-report.json` - SAST findings
- `npm-audit-report.json` - Dependency vulnerabilities

## 📊 Security Scan Results

### Understanding Severity Levels

#### 🚨 Critical
- **Exposed secrets/credentials**
- **SQL injection vulnerabilities**
- **Authentication bypasses**
- **Remote code execution**

**Action**: Fix immediately, do not commit

#### ⚠️ High
- **XSS vulnerabilities**
- **Privilege escalation**
- **Insecure direct object references**
- **Known vulnerable dependencies**

**Action**: Fix before merge to main

#### 📋 Medium
- **Information disclosure**
- **CSRF vulnerabilities**
- **Weak cryptography**
- **Security misconfigurations**

**Action**: Fix in current sprint

#### 📝 Low
- **Code quality issues**
- **Missing security headers**
- **Documentation gaps**

**Action**: Document and schedule

### Sample Security Report

```markdown
# Security Scan Report

**Scan Date:** 2024-01-15 10:30:00
**Total Issues Found:** 3
- **Critical Issues:** 0
- **High Severity:** 1
- **Medium Severity:** 1  
- **Low Severity:** 1

## Critical Issues (Fix Immediately)
None detected ✅

## High Severity Issues
1. **Vulnerable Dependency**: `gm@1.16.0` has command injection vulnerability
   - **CVE**: CVE-2023-XXXX
   - **Fix**: Update to `gm@1.21.1` or later
   - **Impact**: Remote code execution possible

## Medium Severity Issues
1. **Environment Configuration**: Potential sensitive data in .env files
   - **Files**: `.env`, `.env.example`
   - **Fix**: Use placeholder values in example files
   - **Impact**: Information disclosure risk
```

## 🔄 CI/CD Integration

### GitHub Actions Workflow
Security scanning runs automatically on:
- **Pull requests** to main/develop branches
- **Pushes** to main/develop branches
- **Daily schedule** at 2 AM UTC
- **Manual triggers**

```yaml
# .github/workflows/security-scan.yml
- name: Run Semgrep
  uses: semgrep/semgrep-action@v1
  with:
    config: p/owasp-top-ten
    generateSarif: "1"

- name: Run GitLeaks
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Pre-commit Hooks
Security checks run before every commit:
```bash
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    hooks:
      - id: gitleaks

  - repo: https://github.com/semgrep/semgrep
    hooks:
      - id: semgrep
```

## 🎯 Custom Security Rules

### Semgrep Custom Rules
Project-specific security patterns in `.semgrep.yml`:

```yaml
rules:
  - id: abyss-hardcoded-secret
    pattern: |
      const JWT_SECRET = "..."
    message: "Hardcoded JWT secret detected"
    severity: ERROR
    languages: [typescript, javascript]
```

### GitLeaks Custom Rules
Project-specific secret patterns in `.gitleaks.toml`:

```toml
[[rules]]
id = "abyss-api-key"
description = "Abyss Central API Key"
regex = '''abyss[_-]?api[_-]?key[_-]?[:=]\s*['"']?([a-zA-Z0-9_-]{32,})['"']?'''
```

## 🛠️ Tool Configuration

### Semgrep Configuration (`.semgrep.yml`)
```yaml
rules:
  - p/owasp-top-ten        # OWASP Top 10 vulnerabilities
  - p/security-audit       # General security audit
  - p/javascript           # JavaScript-specific rules
  - p/typescript           # TypeScript-specific rules
  - p/react                # React security patterns
  - p/express              # Express.js security
  - p/postgres             # PostgreSQL security
  - p/jwt                  # JWT security
  - p/secrets              # Secret detection

paths:
  include: ["apps/", "services/", "libs/"]
  exclude: ["node_modules/", "dist/", "*.test.ts"]
```

### GitLeaks Configuration (`.gitleaks.toml`)
```toml
[extend]
useDefault = true

[[rules]]
id = "postgresql-connection-string"
regex = '''postgresql://[^:]+:([^@]+)@[^/]+/[^?\s]+'''
description = "PostgreSQL Connection String"

[allowlist]
files = ['''.*\.md$''', '''.*\.lock$''']
paths = ['''node_modules/''', '''dist/''']
```

### TruffleHog Configuration (`.trufflehog.yml`)
```yaml
exclude_detectors:
  - "npmtoken"
  - "gitlab"

custom_detectors:
  - name: "abyss-api-key"
    keywords: ["abyss", "api", "key"]
    regex:
      abyss_api: 'abyss[_-]?api[_-]?key[_-]?[:=]\s*[''"]?([A-Za-z0-9_-]{32,64})[''"]?'
```

## 📋 Security Scanning Checklist

### Before Every Commit
- [ ] Run `pnpm run security:scan`
- [ ] Review all findings
- [ ] Fix critical and high severity issues
- [ ] Document medium/low issues for later
- [ ] Verify no secrets detected
- [ ] Check dependency vulnerabilities

### Weekly Security Review
- [ ] Review security scan trends
- [ ] Update security tool configurations
- [ ] Check for new vulnerability databases
- [ ] Review and update security documentation
- [ ] Test incident response procedures

### Monthly Security Assessment
- [ ] Full dependency audit and updates
- [ ] Review and update security rules
- [ ] Penetration testing results review
- [ ] Security training and awareness
- [ ] Compliance audit preparation

## 🚨 Handling Security Findings

### Immediate Actions for Critical/High Issues
1. **Stop development** - Do not merge until fixed
2. **Assess impact** - Determine if production is affected
3. **Create hotfix** - Implement immediate remediation
4. **Test thoroughly** - Verify fix doesn't break functionality
5. **Document incident** - Update security documentation

### Workflow for Medium/Low Issues
1. **Create security ticket** - Track in project management
2. **Assign priority** - Based on business impact
3. **Schedule remediation** - Include in sprint planning
4. **Implement fix** - Follow secure coding practices
5. **Verify resolution** - Re-run security scans

## 📚 Security Resources

### Internal Documentation
- [Security Guide](./SECURITY.md)
- [Authentication Documentation](./AUTH.md)
- [API Security Standards](./API.md)
- [Database Security](./DATABASE.md)

### External Resources
- [Semgrep Rule Registry](https://semgrep.dev/r)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [GitLeaks Documentation](https://github.com/gitleaks/gitleaks)
- [npm Security Best Practices](https://docs.npmjs.com/auditing-package-dependencies-for-security-vulnerabilities)

### Training Materials
- [Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [SANS Security Training](https://www.sans.org/cyber-security-training/)
- [Security Champion Program](./SECURITY-CHAMPION.md)

## 🔧 Troubleshooting

### Common Issues

#### GitLeaks False Positives
```bash
# Add to .gitleaks.toml allowlist
[allowlist]
regexes = [
    '''password.*=.*["']?(test|example)["']?''',
]
```

#### Semgrep Performance Issues
```bash
# Reduce scope in .semgrep.yml
paths:
  exclude: ["test/", "examples/", "docs/"]

# Increase timeout
timeout: 60
```

#### TruffleHog Network Issues
```bash
# Disable verification if needed
no_verification: true

# Reduce timeout
verification:
  timeout: "2s"
```

### Debug Mode
```bash
# Run tools in debug mode
semgrep --verbose --debug .
gitleaks detect --verbose
trufflehog --debug filesystem .
```

## 📞 Support

### Security Team Contacts
- **Email**: security@void-software.com
- **Slack**: #security-scanning
- **Emergency**: security-hotline@void-software.com

### Tool-Specific Support
- **Semgrep**: https://semgrep.dev/docs/
- **GitLeaks**: https://github.com/gitleaks/gitleaks/issues
- **TruffleHog**: https://trufflesecurity.com/support

---

**Remember: Security scanning is only as good as the actions taken on the results. Always review, prioritize, and remediate findings promptly!**