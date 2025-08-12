# Conventional Commits Guide

This document outlines the conventional commit standards enforced in the
Enterprise SaaS Template.

## 🎯 Overview

We use [Conventional Commits](https://conventionalcommits.org/) to maintain a
consistent commit history, enable automated changelog generation, and support
semantic versioning.

## 📋 Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Examples

```bash
# Feature addition
feat(auth): add multi-factor authentication support

# Bug fix
fix(ui): resolve mobile responsive layout issue in dashboard

# Documentation update
docs: update API documentation for user endpoints

# Chore/maintenance
chore(deps): update React to version 18.2.0

# Breaking change
feat(api)!: redesign user authentication API

# With body and footer
feat(billing): add subscription management

Implement comprehensive subscription handling including:
- Plan upgrades and downgrades
- Proration calculations
- Invoice generation

Closes #123, #456
```

## 🔧 Commit Types

### Core Types

| Type       | Description      | When to Use                             |
| ---------- | ---------------- | --------------------------------------- |
| `feat`     | New feature      | Adding new functionality                |
| `fix`      | Bug fix          | Fixing existing functionality           |
| `docs`     | Documentation    | README, guides, API docs                |
| `style`    | Code style       | Formatting, semicolons, etc.            |
| `refactor` | Code refactoring | Restructuring without changing behavior |
| `test`     | Tests            | Adding or updating tests                |
| `chore`    | Maintenance      | Build, dependencies, tooling            |

### Extended Types

| Type       | Description      | When to Use                 |
| ---------- | ---------------- | --------------------------- |
| `perf`     | Performance      | Performance improvements    |
| `build`    | Build system     | Build scripts, CI/CD        |
| `ci`       | CI/CD            | GitHub Actions, workflows   |
| `revert`   | Revert           | Reverting previous changes  |
| `security` | Security         | Security fixes/improvements |
| `deps`     | Dependencies     | Dependency updates          |
| `deploy`   | Deployment       | Deployment-related changes  |
| `breaking` | Breaking changes | Alternative to `!` suffix   |

## 🏷️ Scopes

Scopes help identify which part of the codebase is affected:

### Services

- `auth` - Authentication service
- `gateway` - API Gateway
- `notification` - Notification service
- `analytics` - Analytics service
- `billing` - Billing service
- `admin` - Admin service

### Frontend Applications

- `web` - Main web application
- `mobile` - Mobile application
- `admin-ui` - Admin dashboard

### Libraries

- `ui` - UI components library
- `utils` - Utility functions
- `config` - Configuration
- `types` - TypeScript types
- `client` - API client
- `bootstrap` - Service bootstrap
- `multi-tenancy` - Multi-tenancy system
- `plugin-system` - Plugin architecture

### Infrastructure

- `ci` - Continuous Integration
- `docker` - Docker configuration
- `k8s` - Kubernetes
- `terraform` - Infrastructure as Code
- `monitoring` - Monitoring and observability

### Tools and Documentation

- `tools` - Development tools
- `scripts` - Build/utility scripts
- `generators` - Code generators
- `docs` - Documentation
- `readme` - README files
- `api-docs` - API documentation

## ⚡ Breaking Changes

Indicate breaking changes with `!` after the type/scope:

```bash
feat(api)!: redesign authentication endpoints
refactor(ui)!: change component prop interface
```

Or use the `BREAKING CHANGE` footer:

```bash
feat(auth): add OAuth2 support

BREAKING CHANGE: Previous API tokens are no longer valid
```

## 🚀 Automation Benefits

### Automated Changelog

Conventional commits enable automatic changelog generation:

```markdown
## [2.1.0] - 2024-12-11

### Features

- **auth**: add multi-factor authentication support
- **billing**: implement subscription management

### Bug Fixes

- **ui**: resolve mobile responsive layout issues
- **api**: fix rate limiting edge case

### Documentation

- update API documentation for user endpoints
```

### Semantic Versioning

Commit types determine version bumps:

- `fix` → PATCH version (1.0.1)
- `feat` → MINOR version (1.1.0)
- `BREAKING CHANGE` → MAJOR version (2.0.0)

### Release Notes

Automated release notes from commit messages:

```markdown
### 🚀 Features

- Multi-factor authentication support
- Subscription management system

### 🐛 Bug Fixes

- Mobile responsive layout issues
- API rate limiting edge cases
```

## 📏 Validation Rules

Our CommitLint configuration enforces:

### Required Elements

- ✅ Type must be present and valid
- ✅ Subject must be present (min 10 characters)
- ✅ Header maximum 100 characters

### Format Rules

- ✅ Type must be lowercase
- ✅ Subject must be lowercase
- ✅ Subject must not end with period
- ✅ Scope must be lowercase (if present)

### Message Structure

- ✅ Body lines max 100 characters
- ✅ Footer lines max 100 characters
- ✅ Blank line before body
- ✅ Blank line before footer

## 🛠️ Tools and Commands

### Manual Validation

```bash
# Test commit message format
echo "feat(auth): add OAuth support" | pnpm run commitlint

# Validate last commit
pnpm run commitlint:last

# Validate commit message in file
pnpm run commitlint --edit commit-message.txt
```

### Git Hook Integration

CommitLint runs automatically through Husky:

- **commit-msg hook**: Validates every commit message
- **Helpful errors**: Shows format examples on failure

### IDE Integration

#### VS Code Extensions

```json
{
  "recommendations": ["vivaxy.vscode-conventional-commits"]
}
```

#### IntelliJ/WebStorm Plugins

- Git Commit Template
- Conventional Commits

## 🎯 Best Practices

### Writing Effective Commits

1. **Be Descriptive**: Explain what and why, not how

   ```bash
   # Good
   feat(auth): add session timeout for security compliance

   # Avoid
   feat(auth): update code
   ```

2. **Use Imperative Mood**: Write as if giving commands

   ```bash
   # Good
   fix(api): resolve memory leak in user service

   # Avoid
   fix(api): resolved memory leak in user service
   ```

3. **Scope Appropriately**: Use specific scopes

   ```bash
   # Good
   feat(billing): add subscription renewal automation

   # Too broad
   feat: add billing stuff
   ```

4. **Keep Related Changes Together**: Group related changes in one commit

   ```bash
   # Good
   feat(ui): add dark mode theme support

   # Avoid splitting into multiple commits for same feature
   ```

### Multi-line Commits

Use body for additional context:

```bash
feat(cache): implement Redis cluster support

Add support for Redis cluster mode to improve cache
performance and reliability in production environments.

- Configure cluster nodes in environment variables
- Add automatic failover handling
- Update cache client initialization

Closes #456
```

## 🚫 Common Mistakes

### Avoid These Patterns

```bash
# Too vague
fix: bug fix

# Wrong type
docs(api): fix user login bug  # Should be 'fix'

# Uppercase
Feat(auth): Add OAuth  # Should be lowercase

# No description
feat(auth):

# Too long
feat(auth): add comprehensive multi-factor authentication system with SMS, email, and TOTP support including backup codes

# Mixed concerns
feat(auth): add OAuth and fix login bug  # Should be separate commits
```

## 🔧 Configuration

Our CommitLint configuration is in `commitlint.config.js`:

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'test',
        'chore',
        'perf',
        'build',
        'ci',
        'revert',
        'security',
        'deps',
        'deploy',
      ],
    ],
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 100],
  },
};
```

## 📚 Resources

- [Conventional Commits Specification](https://conventionalcommits.org/)
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [CommitLint Documentation](https://commitlint.js.org/)
- [Semantic Versioning](https://semver.org/)

## 💡 Need Help?

If commit validation fails:

1. **Check the error message** - it shows what's wrong
2. **Review examples above** - find similar pattern
3. **Use the format**: `type(scope): description`
4. **Test manually**: `echo "your message" | pnpm run commitlint`

Remember: Good commit messages are documentation for your future self and your
team! 🚀
