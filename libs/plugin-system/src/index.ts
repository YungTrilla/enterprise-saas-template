/**
 * Plugin System Library
 * 
 * Provides a comprehensive plugin architecture for extending the Enterprise SaaS Template
 * with custom functionality, integrations, and third-party extensions.
 * 
 * Features:
 * - Dynamic plugin loading and unloading
 * - Secure plugin execution environment
 * - Plugin lifecycle management
 * - Hook-based extension system
 * - Plugin marketplace integration
 * - Version management and dependencies
 * - Security scanning and validation
 * - API surface area control
 */

// Core exports
export * from './core/PluginManager';
export * from './core/PluginLoader';
export * from './core/PluginExecutor';
export * from './core/HookSystem';

// Registry and marketplace
export * from './registry/PluginRegistry';
export * from './registry/PluginMarketplace';
export * from './registry/PluginValidator';

// Security
export * from './security/SandboxExecutor';
export * from './security/SecurityScanner';
export * from './security/PermissionManager';

// Storage
export * from './storage/PluginStorage';
export * from './storage/FileSystemStorage';
export * from './storage/DatabaseStorage';

// Types and interfaces
export * from './types/plugin';
export * from './types/hook';
export * from './types/marketplace';
export * from './types/security';

// Utilities
export * from './utils/pluginValidator';
export * from './utils/dependencyResolver';
export * from './utils/versionManager';

// Configuration
export * from './config/pluginConfig';