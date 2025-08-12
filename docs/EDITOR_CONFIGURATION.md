# Editor Configuration Guide

This document explains the EditorConfig setup and development environment
configuration for the Enterprise SaaS Template.

## 🎯 Overview

EditorConfig helps maintain consistent coding styles between different editors
and IDEs used by team members. Our configuration ensures that regardless of
whether developers use VS Code, WebStorm, Vim, Emacs, or any other editor, the
code formatting remains consistent.

## 🔧 EditorConfig Settings

Our `.editorconfig` file defines consistent settings for:

### Global Defaults

- **Charset**: UTF-8 encoding for all files
- **Line Endings**: LF (Unix-style) for cross-platform compatibility
- **Final Newline**: Always insert final newline
- **Trailing Whitespace**: Automatically trim
- **Indentation**: 2 spaces by default

### File-Specific Rules

#### JavaScript/TypeScript

```ini
[*.{js,jsx,ts,tsx}]
indent_style = space
indent_size = 2
max_line_length = 120
```

#### Styling Files

```ini
[*.{css,scss,sass,less}]
indent_style = space
indent_size = 2
max_line_length = 120
```

#### Configuration Files

```ini
[*.{json,jsonc,yml,yaml}]
indent_style = space
indent_size = 2
```

#### Markdown Documentation

```ini
[*.{md,markdown}]
indent_style = space
indent_size = 2
trim_trailing_whitespace = false  # Preserve intentional spaces
max_line_length = 80
```

#### Shell Scripts

```ini
[*.{sh,bash,zsh}]
indent_style = space
indent_size = 2
end_of_line = lf
```

## 🛠️ Editor Support

### VS Code

EditorConfig support is built-in to VS Code. Our settings are automatically
applied when opening files.

**Recommended Extensions:**

```json
{
  "recommendations": [
    "editorconfig.editorconfig",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### WebStorm/IntelliJ IDEA

EditorConfig is natively supported. Settings are automatically applied based on
our `.editorconfig` file.

**Additional Configuration:**

- File → Settings → Editor → Code Style → Enable EditorConfig support
- File → Settings → Tools → Actions on Save → Run code cleanup

### Vim/Neovim

Install the EditorConfig plugin:

```vim
" Using vim-plug
Plug 'editorconfig/editorconfig-vim'

" Using Vundle
Plugin 'editorconfig/editorconfig-vim'
```

### Emacs

Install EditorConfig for Emacs:

```elisp
;; Using package.el
(use-package editorconfig
  :ensure t
  :config
  (editorconfig-mode 1))
```

### Sublime Text

Install the EditorConfig package through Package Control:

- Ctrl+Shift+P → Package Control: Install Package → EditorConfig

### Atom

Install the editorconfig package:

```bash
apm install editorconfig
```

## 🔄 Integration with Other Tools

### Prettier Integration

EditorConfig settings complement Prettier configuration:

```javascript
// .prettierrc.json
{
  "tabWidth": 2,        // Matches EditorConfig indent_size
  "useTabs": false,     // Matches EditorConfig indent_style = space
  "endOfLine": "lf",    // Matches EditorConfig end_of_line = lf
  "printWidth": 120     // Matches EditorConfig max_line_length
}
```

### ESLint Integration

ESLint respects EditorConfig settings when available:

```javascript
// .eslintrc.json
{
  "extends": ["prettier"],  // Prevents conflicts
  "rules": {
    "max-len": ["error", { "code": 120 }]  // Matches EditorConfig
  }
}
```

### Git Integration

Our Git hooks respect EditorConfig settings:

- Pre-commit hooks apply EditorConfig formatting
- Prettier runs with EditorConfig-compatible settings
- Line ending consistency enforced across platforms

## 📋 File Type Coverage

### Source Code

- ✅ JavaScript/TypeScript (`*.js`, `*.jsx`, `*.ts`, `*.tsx`)
- ✅ Styling (`*.css`, `*.scss`, `*.sass`, `*.less`)
- ✅ HTML/Templates (`*.html`, `*.hbs`, `*.mustache`)
- ✅ Vue.js components (`*.vue`)

### Configuration

- ✅ JSON files (`*.json`, `*.jsonc`)
- ✅ YAML files (`*.yml`, `*.yaml`)
- ✅ Package files (`package.json`, `tsconfig.json`)
- ✅ Docker files (`Dockerfile`, `docker-compose.yml`)

### Documentation

- ✅ Markdown (`*.md`, `*.markdown`)
- ✅ README files
- ✅ Changelog and license files

### Scripts and Tools

- ✅ Shell scripts (`*.sh`, `*.bash`, `*.zsh`)
- ✅ Python files (`*.py`)
- ✅ SQL files (`*.sql`)

### Special Cases

- ✅ Git configuration (`.gitconfig`, `.gitignore`)
- ✅ GitHub workflows (`.github/workflows/*.yml`)
- ✅ Environment files (`.env`, `.env.*`)
- ✅ Lock files (preserve original formatting)

## 🎨 Customization

### Project-Specific Rules

Add rules for specific project needs:

```ini
# Custom API documentation
[docs/api/*.md]
max_line_length = 100
trim_trailing_whitespace = true

# Configuration overrides
[config/production/*.json]
indent_size = 4  # More readable for complex configs
```

### Language-Specific Settings

Adjust for different languages:

```ini
# Python follows PEP 8
[*.py]
indent_style = space
indent_size = 4
max_line_length = 88

# Go uses tabs
[*.go]
indent_style = tab
indent_size = 4

# Rust formatting
[*.rs]
indent_style = space
indent_size = 4
max_line_length = 100
```

## 🔍 Validation and Testing

### Manual Verification

Check EditorConfig is working:

1. **Open a file** in your editor
2. **Check indentation** matches expected settings
3. **Verify line endings** (should be LF)
4. **Test auto-formatting** preserves EditorConfig rules

### Automated Validation

Our quality gates include EditorConfig validation:

```bash
# Check EditorConfig compliance
pnpm run quality:gates

# Manual EditorConfig check
npx editorconfig-checker
```

### Integration Testing

```bash
# Test with different file types
echo "test" > test.js    # Should get 2-space indent
echo "test" > test.py    # Should get 4-space indent
echo "test" > test.md    # Should get 2-space indent, preserve trailing spaces
```

## 🚨 Troubleshooting

### Common Issues

#### EditorConfig Not Working

1. **Check editor support**: Ensure EditorConfig plugin is installed
2. **Verify file location**: `.editorconfig` must be in project root
3. **Check syntax**: Validate `.editorconfig` syntax
4. **Restart editor**: Some editors require restart after installing plugin

#### Conflicts with Prettier/ESLint

```bash
# Check for conflicts
npx prettier --check .
npx eslint --print-config src/index.ts
```

**Resolution:**

- Ensure Prettier extends EditorConfig settings
- Use `eslint-config-prettier` to prevent conflicts
- Configure tools to respect EditorConfig

#### Line Ending Issues

**Problem**: Mixed line endings (CRLF/LF) **Solution:**

```bash
# Fix line endings
git config core.autocrlf false
git config core.eol lf

# Re-normalize existing files
git add --renormalize .
```

#### Indentation Inconsistencies

**Problem**: Mixed tabs and spaces **Solution:**

```bash
# Find mixed indentation
grep -r -P "^\t+ +" src/
grep -r -P "^ +\t+" src/

# Fix with Prettier
pnpm run format
```

### Debug Mode

Check what EditorConfig rules apply to a file:

```bash
# Using editorconfig-core
npx editorconfig src/index.ts

# Expected output:
# indent_style=space
# indent_size=2
# end_of_line=lf
# charset=utf-8
# trim_trailing_whitespace=true
# insert_final_newline=true
```

## 📊 Benefits

### Consistency

- ✅ Same formatting across all editors
- ✅ Reduced formatting diffs in git
- ✅ Consistent code style in reviews

### Productivity

- ✅ No manual formatting configuration
- ✅ Automatic compliance with project standards
- ✅ Less time spent on style discussions

### Quality

- ✅ Enforces best practices
- ✅ Prevents common formatting issues
- ✅ Improves code readability

### Team Collaboration

- ✅ Works regardless of editor choice
- ✅ Reduces onboarding friction
- ✅ Ensures professional code appearance

## 🔄 Maintenance

### Regular Reviews

- **Monthly**: Review EditorConfig rules for new file types
- **Quarterly**: Update settings based on team feedback
- **Annually**: Evaluate against industry standards

### Version Control

```bash
# Track changes to EditorConfig
git log -p .editorconfig

# Compare with standard configurations
diff .editorconfig standard-editorconfig
```

### Team Sync

- Include EditorConfig in onboarding documentation
- Notify team of configuration changes
- Provide migration guides for setting updates

## 📚 Resources

### Official Documentation

- [EditorConfig Specification](https://editorconfig.org/)
- [Supported Properties](https://github.com/editorconfig/editorconfig/wiki/EditorConfig-Properties)
- [Editor Plugins](https://editorconfig.org/#download)

### Tools and Utilities

- [editorconfig-checker](https://github.com/editorconfig-checker/editorconfig-checker) -
  Validate compliance
- [editorconfig-core](https://github.com/editorconfig/editorconfig-core-js) -
  Core JavaScript implementation
- [editorconfig-generate](https://github.com/jedmao/editorconfig-generate) -
  Generate configurations

### Best Practices

- [Google Style Guides](https://google.github.io/styleguide/)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)

## 🎯 Next Steps

1. **Verify editor integration** in your development environment
2. **Test with sample files** to ensure rules apply correctly
3. **Configure team editors** with recommended plugins
4. **Review project-specific needs** for custom rules
5. **Document team standards** based on EditorConfig settings

Remember: EditorConfig is the foundation of consistent code formatting, working
alongside Prettier, ESLint, and our quality gates to maintain professional code
standards across the entire team! 🚀
