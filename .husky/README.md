# Husky Git Hooks Configuration

This directory contains Git hooks managed by Husky for the Enterprise SaaS
Template.

## 🎯 Purpose

Husky ensures code quality by running automated checks at key Git lifecycle
events:

- **pre-commit**: Validates code quality on staged files only (fast)
- **commit-msg**: Validates commit message format (conventional commits)
- **pre-push**: Runs comprehensive tests before pushing (thorough)

## 🔧 Hooks Overview

### pre-commit Hook

Runs on every commit attempt and performs:

- ESLint with auto-fix on staged JavaScript/TypeScript files
- Prettier formatting on staged files
- Only processes staged files for fast feedback

### commit-msg Hook

Validates commit messages using CommitLint to ensure:

- Conventional commit format compliance
- Valid commit types (feat, fix, docs, etc.)
- Proper scoping and description requirements
- Minimum/maximum length constraints

### pre-push Hook

Runs comprehensive validation before push:

- Full lint check across entire codebase
- TypeScript compilation check
- Full test suite execution

## 🚀 Usage

Hooks run automatically during Git operations:

```bash
# This will trigger pre-commit hook
git commit -m "feat: add user authentication"

# This will trigger pre-push hook
git push origin main
```

## ⚙️ Configuration

Hook configuration is managed through:

- **lint-staged**: `.package.json` lint-staged section
- **Husky**: Scripts in `.husky/` directory
- **Package scripts**: Referenced from `package.json`

## 🛠️ Customization

To modify hooks:

1. Edit the appropriate file in `.husky/`
2. Update `lint-staged` configuration in `package.json`
3. Add new quality check scripts to `package.json` scripts section

## 🔍 Debugging

If hooks fail:

1. Run the individual commands manually
2. Check the error output
3. Use the suggested quick fixes displayed in hook output

Example manual validation:

```bash
# Test what pre-commit would do
pnpm run pre-commit

# Test full validation
pnpm run validate
```

## 📋 Enterprise Quality Standards

These hooks enforce:

- ✅ Code formatting consistency (Prettier)
- ✅ Code quality standards (ESLint)
- ✅ Type safety (TypeScript)
- ✅ Test coverage maintenance
- ✅ Commit message standards
- ✅ Security best practices

**🚨 Note**: Hooks can be bypassed with `--no-verify` flag, but this is strongly
discouraged in enterprise environments.
