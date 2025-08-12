/**
 * Enterprise SaaS Template - CommitLint Configuration
 *
 * Enforces conventional commit message format for consistent git history
 * and automated changelog generation.
 *
 * Format: <type>[optional scope]: <description>
 *
 * Example: feat(auth): add multi-factor authentication
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Ensure type is always present and valid
    'type-enum': [
      2,
      'always',
      [
        // Features and changes
        'feat', // New feature
        'fix', // Bug fix
        'perf', // Performance improvement
        'refactor', // Code refactoring

        // Documentation
        'docs', // Documentation changes

        // Code quality and maintenance
        'style', // Formatting, missing semicolons, etc.
        'test', // Adding/updating tests

        // Build and deployment
        'build', // Build system or external dependencies
        'ci', // CI/CD configuration changes
        'deploy', // Deployment related changes

        // Maintenance
        'chore', // Maintenance tasks
        'revert', // Reverting previous changes

        // Dependencies
        'deps', // Dependency updates

        // Security
        'security', // Security improvements/fixes

        // Breaking changes (should use ! suffix)
        'breaking', // Breaking changes (alternative to !)
      ],
    ],

    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],

    // Type is required
    'type-empty': [2, 'never'],

    // Subject must be present
    'subject-empty': [2, 'never'],

    // Subject must not end with period
    'subject-full-stop': [2, 'never', '.'],

    // Subject case should be lowercase
    'subject-case': [2, 'always', 'lower-case'],

    // Subject length limits
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 72],

    // Header length limit (for the entire first line)
    'header-max-length': [2, 'always', 100],

    // Body line length
    'body-max-line-length': [2, 'always', 100],

    // Footer line length
    'footer-max-line-length': [2, 'always', 100],

    // Scope validation (optional but if present, must be valid)
    'scope-enum': [
      1, // Warning level (not error)
      'always',
      [
        // Services
        'auth',
        'gateway',
        'notification',
        'analytics',
        'billing',
        'admin',

        // Frontend apps
        'web',
        'mobile',
        'admin-ui',

        // Libraries
        'ui',
        'utils',
        'config',
        'types',
        'client',
        'bootstrap',
        'multi-tenancy',
        'plugin-system',

        // Infrastructure
        'ci',
        'docker',
        'k8s',
        'terraform',
        'monitoring',

        // Tools and scripts
        'tools',
        'scripts',
        'generators',

        // Documentation
        'docs',
        'readme',
        'api-docs',

        // Dependencies and configuration
        'deps',
        'config',
        'lint',
        'format',
        'test',

        // Security
        'security',
        'audit',
        'vulnerability',

        // Database
        'db',
        'migration',
        'seed',

        // Miscellaneous
        'workspace',
        'monorepo',
      ],
    ],

    // Scope case should be lowercase
    'scope-case': [2, 'always', 'lower-case'],

    // No leading blank line
    'body-leading-blank': [2, 'always'],

    // Footer leading blank line
    'footer-leading-blank': [1, 'always'],
  },

  // Custom plugins or parsers can be added here
  plugins: [],

  // Help URL for conventional commit format
  helpUrl: 'https://conventionalcommits.org/',
};
