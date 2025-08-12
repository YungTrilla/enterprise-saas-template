# Quality Gates Documentation

This document describes the comprehensive quality gates system implemented in
the Enterprise SaaS Template to ensure code quality, security, and
maintainability.

## 🎯 Overview

Quality gates are automated checks that run at different stages of the
development workflow to catch issues early and maintain code quality standards.
Our system implements a multi-layered approach with different strictness levels
for different contexts.

## 🏗️ Quality Gate Layers

### Layer 1: Pre-commit (Development Focus)

**Trigger**: Before each commit  
**Mode**: Warning-only  
**Purpose**: Fast feedback during development

- ✅ ESLint with auto-fix
- ✅ Prettier formatting
- ✅ Security pattern scanning
- ✅ File size checks
- ✅ TypeScript compilation
- ⚠️ Quality warnings (non-blocking)

### Layer 2: Pre-push (Integration Focus)

**Trigger**: Before pushing to remote  
**Mode**: Strict enforcement  
**Purpose**: Comprehensive validation before sharing

- ✅ All pre-commit checks
- ✅ Full test suite
- ✅ TypeScript strict compilation
- ✅ Dependency vulnerability scan
- ✅ Code complexity analysis
- ❌ Failures block push

### Layer 3: CI/CD (Production Focus)

**Trigger**: Pull requests and merges  
**Mode**: Enterprise-grade validation  
**Purpose**: Production readiness verification

- ✅ All previous checks
- ✅ Security scanning (Trivy, Semgrep, CodeQL)
- ✅ Performance testing
- ✅ Integration testing
- ✅ Deployment validation

## 🔧 Quality Checks

### 1. Code Quality

#### ESLint Rules

```javascript
// Standard rules
"@typescript-eslint/no-explicit-any": "error"
"prefer-const": "error"
"no-var": "error"

// Security rules
"security/detect-eval-with-expression": "error"
"security/detect-unsafe-regex": "error"
"security/detect-possible-timing-attacks": "error"
```

#### Prettier Formatting

- Consistent code style across all files
- 2-space indentation
- Single quotes for strings
- Trailing commas where valid

#### TypeScript Validation

- Strict type checking
- No implicit any types
- Proper module imports/exports

### 2. Security Checks

#### Pattern Detection

- API keys and tokens
- Hardcoded passwords
- Dangerous function usage (`eval`, `innerHTML`)
- Potential XSS vulnerabilities

#### Dependency Scanning

```bash
# Vulnerability levels checked
npm audit --audit-level=moderate
```

#### File Content Scanning

- Secrets in code files
- Unsafe patterns in configuration
- Dangerous HTML/JS injections

### 3. Performance & Maintainability

#### File Size Limits

- JavaScript/TypeScript: 500KB max
- CSS/SCSS: 200KB max
- Documentation: 1MB max

#### Code Complexity

- Function length heuristics
- Cyclomatic complexity warnings
- Large file detection

#### Line Length

- Maximum 120 characters per line
- Automatic detection and reporting
- Prettier integration for auto-fixing

### 4. Development Standards

#### TODO/FIXME Detection

- Production code scanning
- Issue tracking recommendations
- Technical debt visibility

#### Import/Export Validation

- Proper module organization
- Dependency graph analysis
- Circular dependency detection

## 🚀 Usage

### Manual Execution

```bash
# Run quality gates on staged files (development mode)
pnpm run quality:gates

# Run quality gates on staged files (strict mode)
pnpm run quality:gates:strict

# Run quality gates on all files (warning mode)
pnpm run quality:gates:all

# Run quality gates on all files (strict mode)
pnpm run quality:gates:all:strict

# Direct script execution
./scripts/quality-gates.sh --help
```

### Git Hook Integration

#### Pre-commit Hook

```bash
# Automatic execution on git commit
git commit -m "feat: add new feature"

# Manual hook testing
.husky/pre-commit
```

#### Pre-push Hook

```bash
# Automatic execution on git push
git push origin feature-branch

# Manual hook testing
.husky/pre-push
```

### CI/CD Integration

Quality gates are integrated into GitHub Actions workflows:

```yaml
# .github/workflows/ci.yml
- name: Quality Gates
  run: ./scripts/quality-gates.sh --all --strict
```

## ⚙️ Configuration

### Quality Gate Script Options

```bash
./scripts/quality-gates.sh [OPTIONS]

Options:
  --all       Check all files instead of just staged
  --strict    Fail on warnings (default: warnings only)
  --help      Show help message

Examples:
  ./scripts/quality-gates.sh                    # Staged files, warnings
  ./scripts/quality-gates.sh --all             # All files, warnings
  ./scripts/quality-gates.sh --strict          # Staged files, strict
  ./scripts/quality-gates.sh --all --strict    # All files, strict
```

### Lint-staged Configuration

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "eslint --no-eslintrc --config .eslintrc.security.json",
      "prettier --write"
    ],
    "*.{json,yaml,yml,md,css,scss,html}": ["prettier --write"],
    "package.json": [
      "prettier --write",
      "npm audit --audit-level=high || echo \"Security vulnerabilities detected\""
    ]
  }
}
```

### Security ESLint Configuration

Separate security-focused configuration in `.eslintrc.security.json`:

```json
{
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-unsafe-regex": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-possible-timing-attacks": "error"
  }
}
```

## 🔍 Quality Gate Results

### Success Output

```
🏗️  Enterprise SaaS Template - Quality Gates
Mode: staged
Strict: false
==================================
🔍 Checking file sizes (max: 500k)
✅ File size check passed
🔍 Checking for security patterns
✅ Security pattern check passed
🔍 Checking dependencies for vulnerabilities
✅ Dependency security check passed
🔍 Checking basic code complexity
✅ Code complexity check passed
🔍 Checking line length (max: 120 characters)
✅ Line length check passed
🔍 Checking for TODO/FIXME comments
✅ TODO check passed
==================================
✅ All quality gates passed! 🎉
```

### Warning Output

```
🔍 Checking for security patterns
⚠️  Potential secret pattern found: api_key
🔍 Checking basic code complexity
⚠️  Complex files detected:
  - src/utils/processor.ts (524 lines, possible large function)
==================================
⚠️  2 quality gate(s) failed (warnings only)
```

### Error Output (Strict Mode)

```
🔍 Checking dependencies for vulnerabilities
❌ Dependency vulnerabilities detected:
high: lodash arbitrary code execution
critical: node-forge signature verification bypass
==================================
❌ 1 quality gate(s) failed in strict mode
```

## 🛠️ Customization

### Adding New Quality Checks

1. **Edit the quality gates script**:

```bash
# Add new function to scripts/quality-gates.sh
check_custom_rule() {
    local mode=${1:-"staged"}
    print_step "Running custom check"

    # Your check logic here

    if [ $issues -gt 0 ]; then
        print_warning "Custom check found issues"
        return 1
    fi

    print_success "Custom check passed"
    return 0
}

# Add to main runner
run_quality_gates() {
    # ... existing checks ...
    check_custom_rule "$mode" || failures=$((failures + 1))
}
```

2. **Add ESLint rules**:

```json
// .eslintrc.json or .eslintrc.security.json
{
  "rules": {
    "your-custom-rule": "error"
  }
}
```

3. **Add lint-staged patterns**:

```json
{
  "lint-staged": {
    "*.custom": ["custom-tool --check"]
  }
}
```

### Adjusting Thresholds

Edit configuration in `scripts/quality-gates.sh`:

```bash
# File size limits
MAX_FILE_SIZE="1000k"  # Increase to 1MB

# Line length
MAX_LINE_LENGTH=100    # Decrease to 100 chars

# Security audit level
SECURITY_AUDIT_LEVEL="high"  # Stricter security
```

### Bypassing Quality Gates

#### Development (Not Recommended)

```bash
# Skip pre-commit hooks
git commit --no-verify -m "emergency fix"

# Skip pre-push hooks
git push --no-verify origin branch
```

#### CI/CD Override

```bash
# Temporary override environment variable
SKIP_QUALITY_GATES=true ./scripts/quality-gates.sh
```

**⚠️ Warning**: Bypassing quality gates should only be done in exceptional
circumstances and with proper justification.

## 📊 Quality Metrics

### Tracked Metrics

- Code quality score (ESLint violations)
- Security risk level (pattern matches)
- Technical debt indicators (TODOs, complexity)
- Dependency health (vulnerability count)
- Code coverage percentage
- Performance regression indicators

### Reporting

Quality gate results can be integrated with:

- GitHub Status Checks
- Slack notifications
- Email reports
- Dashboard metrics
- Performance monitoring

## 🎯 Best Practices

### For Developers

1. **Run quality gates locally** before committing
2. **Address warnings** even in non-strict mode
3. **Keep files small** and functions focused
4. **Review security patterns** regularly
5. **Update dependencies** frequently

### for Teams

1. **Customize rules** for your domain
2. **Set appropriate thresholds** for your context
3. **Monitor quality trends** over time
4. **Regular rule reviews** and updates
5. **Developer education** on quality standards

### For Organizations

1. **Enforce strict mode** for production branches
2. **Regular security audits** of rules
3. **Quality gate metrics** in dashboards
4. **Compliance reporting** integration
5. **Performance impact** monitoring

## 🚨 Troubleshooting

### Common Issues

#### Quality Gates Script Not Found

```bash
chmod +x scripts/quality-gates.sh
```

#### ESLint Configuration Errors

```bash
# Check ESLint config
npx eslint --print-config src/index.ts

# Validate security config
npx eslint --no-eslintrc --config .eslintrc.security.json src/
```

#### Hook Permission Issues

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

#### Performance Issues

```bash
# Run on staged files only
./scripts/quality-gates.sh

# Skip expensive checks in development
SKIP_COMPLEXITY_CHECK=true ./scripts/quality-gates.sh
```

### Debug Mode

Enable verbose output:

```bash
DEBUG=true ./scripts/quality-gates.sh --all --strict
```

## 📚 Resources

- [ESLint Rules](https://eslint.org/docs/rules/)
- [ESLint Security Plugin](https://github.com/nodesecurity/eslint-plugin-security)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-staged Configuration](https://github.com/okonet/lint-staged)

## 🔄 Continuous Improvement

Quality gates should evolve with your codebase:

1. **Regular reviews** of quality gate effectiveness
2. **Rule updates** based on common issues
3. **Performance optimization** of checks
4. **Team feedback** integration
5. **Industry best practice** adoption

Remember: Quality gates are tools to help maintain code quality, not obstacles
to development. They should provide value while minimizing friction in the
development workflow. 🚀
