/**
 * Plugin Manager
 *
 * Central management system for plugins including installation,
 * activation, deactivation, updates, and lifecycle management.
 */

import { EventEmitter } from 'events';
import {
  IPlugin,
  IPluginInstallRequest,
  IPluginUpdateRequest,
  IPluginContext,
  IPluginExecutionResult,
  PluginStatus,
  PluginSource,
} from '../types/plugin';
import { IPluginStorage } from '../storage/PluginStorage';
import { PluginLoader } from './PluginLoader';
import { PluginExecutor } from './PluginExecutor';
import { HookSystem } from './HookSystem';
import { PluginValidator } from '../registry/PluginValidator';
import { SecurityScanner } from '../security/SecurityScanner';
import { PermissionManager } from '../security/PermissionManager';
import { DependencyResolver } from '../utils/dependencyResolver';
import { ApiError } from '@template/shared-utils';

export interface PluginManagerOptions {
  storage: IPluginStorage;
  pluginLoader: PluginLoader;
  pluginExecutor: PluginExecutor;
  hookSystem: HookSystem;
  validator: PluginValidator;
  securityScanner: SecurityScanner;
  permissionManager: PermissionManager;
  dependencyResolver: DependencyResolver;
  maxConcurrentPlugins?: number;
  enableSandbox?: boolean;
  autoUpdate?: boolean;
  validateSignatures?: boolean;
}

export class PluginManager extends EventEmitter {
  private storage: IPluginStorage;
  private loader: PluginLoader;
  private executor: PluginExecutor;
  private hooks: HookSystem;
  private validator: PluginValidator;
  private securityScanner: SecurityScanner;
  private permissionManager: PermissionManager;
  private dependencyResolver: DependencyResolver;

  private activePlugins = new Map<string, IPlugin>();
  private pluginInstances = new Map<string, any>();
  private executionQueue = new Map<string, Promise<any>>();

  private readonly maxConcurrentPlugins: number;
  private readonly enableSandbox: boolean;
  private readonly autoUpdate: boolean;
  private readonly validateSignatures: boolean;

  constructor(options: PluginManagerOptions) {
    super();

    this.storage = options.storage;
    this.loader = options.pluginLoader;
    this.executor = options.pluginExecutor;
    this.hooks = options.hookSystem;
    this.validator = options.validator;
    this.securityScanner = options.securityScanner;
    this.permissionManager = options.permissionManager;
    this.dependencyResolver = options.dependencyResolver;

    this.maxConcurrentPlugins = options.maxConcurrentPlugins || 50;
    this.enableSandbox = options.enableSandbox ?? true;
    this.autoUpdate = options.autoUpdate ?? false;
    this.validateSignatures = options.validateSignatures ?? true;

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Initialize the plugin manager
   */
  async initialize(): Promise<void> {
    try {
      // Load all installed plugins
      const plugins = await this.storage.getAllPlugins();

      // Validate dependencies
      const resolved = await this.dependencyResolver.resolveDependencies(plugins);

      // Auto-activate plugins that were previously active
      for (const plugin of resolved) {
        if (plugin.status === PluginStatus.ACTIVE) {
          try {
            await this.activatePlugin(plugin.id, { skipDependencyCheck: true });
          } catch (error) {
            console.error(`Failed to auto-activate plugin ${plugin.id}:`, error);
            await this.updatePluginStatus(plugin.id, PluginStatus.ERROR);
          }
        }
      }

      this.emit('initialized', { pluginCount: plugins.length });
    } catch (error) {
      this.emit('error', { phase: 'initialization', error });
      throw error;
    }
  }

  /**
   * Install a plugin from various sources
   */
  async installPlugin(request: IPluginInstallRequest): Promise<IPlugin> {
    try {
      // Validate request
      this.validateInstallRequest(request);

      // Load plugin from source
      const pluginData = await this.loader.loadFromSource(
        request.source,
        request.identifier,
        request.version
      );

      // Validate plugin manifest and code
      await this.validator.validatePlugin(pluginData);

      // Security scan if enabled
      if (this.enableSandbox) {
        const scanResult = await this.securityScanner.scanPlugin(pluginData);
        if (!scanResult.safe) {
          throw new ApiError('PLUGIN_SECURITY_VIOLATION', 'Plugin failed security scan', 400, {
            violations: scanResult.violations,
          });
        }
      }

      // Check for existing plugin
      const existingPlugin = await this.storage.getPlugin(pluginData.id);
      if (existingPlugin) {
        throw new ApiError('PLUGIN_ALREADY_EXISTS', 'Plugin is already installed', 409, {
          pluginId: pluginData.id,
          existingVersion: existingPlugin.version,
        });
      }

      // Install plugin files
      const installPath = await this.loader.installPlugin(pluginData);

      // Create plugin record
      const plugin: IPlugin = {
        ...pluginData,
        status: PluginStatus.INSTALLED,
        installPath,
        installedAt: new Date().toISOString(),
        verified: this.validateSignatures
          ? await this.validator.verifySignature(pluginData)
          : false,
        usage: {
          activations: 0,
          totalRuntime: 0,
          apiCalls: 0,
          errors: 0,
          performance: {
            averageExecutionTime: 0,
            slowestExecution: 0,
            fastestExecution: 0,
          },
        },
      };

      // Store plugin
      await this.storage.savePlugin(plugin);

      // Run install hook if present
      if (plugin.hooks?.install) {
        await this.executePluginHook(plugin, 'install');
      }

      // Auto-activate if requested
      if (request.autoActivate) {
        await this.activatePlugin(plugin.id);
      }

      this.emit('pluginInstalled', plugin);
      return plugin;
    } catch (error) {
      this.emit('installError', { request, error });
      throw error;
    }
  }

  /**
   * Uninstall a plugin
   */
  async uninstallPlugin(pluginId: string, options: { preserveData?: boolean } = {}): Promise<void> {
    try {
      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        throw new ApiError('PLUGIN_NOT_FOUND', 'Plugin not found', 404, { pluginId });
      }

      // Deactivate if active
      if (plugin.status === PluginStatus.ACTIVE) {
        await this.deactivatePlugin(pluginId);
      }

      // Update status
      await this.updatePluginStatus(pluginId, PluginStatus.UNINSTALLING);

      // Run uninstall hook if present
      if (plugin.hooks?.uninstall) {
        await this.executePluginHook(plugin, 'uninstall');
      }

      // Remove plugin files
      if (plugin.installPath) {
        await this.loader.uninstallPlugin(plugin.installPath);
      }

      // Remove from storage
      if (!options.preserveData) {
        await this.storage.deletePlugin(pluginId);
      }

      // Clean up runtime state
      this.activePlugins.delete(pluginId);
      this.pluginInstances.delete(pluginId);
      this.executionQueue.delete(pluginId);

      this.emit('pluginUninstalled', { pluginId, preserveData: options.preserveData });
    } catch (error) {
      this.emit('uninstallError', { pluginId, error });
      throw error;
    }
  }

  /**
   * Activate a plugin
   */
  async activatePlugin(
    pluginId: string,
    options: { skipDependencyCheck?: boolean } = {}
  ): Promise<void> {
    try {
      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        throw new ApiError('PLUGIN_NOT_FOUND', 'Plugin not found', 404, { pluginId });
      }

      if (plugin.status === PluginStatus.ACTIVE) {
        return; // Already active
      }

      // Check dependencies unless skipped
      if (!options.skipDependencyCheck) {
        await this.checkDependencies(plugin);
      }

      // Check concurrent plugin limit
      if (this.activePlugins.size >= this.maxConcurrentPlugins) {
        throw new ApiError('TOO_MANY_ACTIVE_PLUGINS', 'Maximum concurrent plugins exceeded', 429, {
          limit: this.maxConcurrentPlugins,
          active: this.activePlugins.size,
        });
      }

      // Load and instantiate plugin
      const instance = await this.loader.loadPlugin(plugin);

      // Create execution context
      const context = this.createPluginContext(plugin);

      // Initialize plugin
      if (typeof instance.initialize === 'function') {
        await this.executor.execute(instance.initialize, context);
      }

      // Run activate hook if present
      if (plugin.hooks?.activate) {
        await this.executePluginHook(plugin, 'activate', context);
      }

      // Register plugin hooks
      this.registerPluginHooks(plugin, instance);

      // Update status and tracking
      await this.updatePluginStatus(pluginId, PluginStatus.ACTIVE);
      this.activePlugins.set(pluginId, plugin);
      this.pluginInstances.set(pluginId, instance);

      // Update usage stats
      await this.updateUsageStats(pluginId, { activations: 1 });

      this.emit('pluginActivated', plugin);
    } catch (error) {
      await this.updatePluginStatus(pluginId, PluginStatus.ERROR);
      this.emit('activationError', { pluginId, error });
      throw error;
    }
  }

  /**
   * Deactivate a plugin
   */
  async deactivatePlugin(pluginId: string): Promise<void> {
    try {
      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        throw new ApiError('PLUGIN_NOT_FOUND', 'Plugin not found', 404, { pluginId });
      }

      if (plugin.status !== PluginStatus.ACTIVE) {
        return; // Not active
      }

      const instance = this.pluginInstances.get(pluginId);

      // Run deactivate hook if present
      if (plugin.hooks?.deactivate) {
        await this.executePluginHook(plugin, 'deactivate');
      }

      // Unregister plugin hooks
      this.unregisterPluginHooks(plugin);

      // Clean up plugin instance
      if (instance && typeof instance.cleanup === 'function') {
        const context = this.createPluginContext(plugin);
        await this.executor.execute(instance.cleanup, context);
      }

      // Update status and tracking
      await this.updatePluginStatus(pluginId, PluginStatus.INACTIVE);
      this.activePlugins.delete(pluginId);
      this.pluginInstances.delete(pluginId);

      this.emit('pluginDeactivated', plugin);
    } catch (error) {
      this.emit('deactivationError', { pluginId, error });
      throw error;
    }
  }

  /**
   * Update a plugin
   */
  async updatePlugin(request: IPluginUpdateRequest): Promise<IPlugin> {
    try {
      const currentPlugin = await this.getPlugin(request.pluginId);
      if (!currentPlugin) {
        throw new ApiError('PLUGIN_NOT_FOUND', 'Plugin not found', 404, {
          pluginId: request.pluginId,
        });
      }

      // Update status
      await this.updatePluginStatus(request.pluginId, PluginStatus.UPDATING);

      const wasActive = currentPlugin.status === PluginStatus.ACTIVE;

      // Deactivate if active
      if (wasActive) {
        await this.deactivatePlugin(request.pluginId);
      }

      // Run update hook if present
      if (currentPlugin.hooks?.update) {
        await this.executePluginHook(currentPlugin, 'update');
      }

      // Load new version
      const newPluginData = await this.loader.loadFromSource(
        PluginSource.MARKETPLACE, // Assume marketplace for updates
        currentPlugin.id,
        request.version
      );

      // Validate new version
      await this.validator.validatePlugin(newPluginData);

      // Install new version
      const installPath = await this.loader.installPlugin(newPluginData, currentPlugin.installPath);

      // Update plugin record
      const updatedPlugin: IPlugin = {
        ...currentPlugin,
        ...newPluginData,
        installPath,
        updatedAt: new Date().toISOString(),
        status: PluginStatus.INSTALLED,
      };

      // Merge configuration if preserving data
      if (request.preserveData && request.config) {
        // Merge configurations intelligently
        updatedPlugin.config = this.mergeConfigurations(currentPlugin.config, request.config);
      }

      // Store updated plugin
      await this.storage.savePlugin(updatedPlugin);

      // Reactivate if it was active before
      if (wasActive) {
        await this.activatePlugin(updatedPlugin.id);
      }

      this.emit('pluginUpdated', { previous: currentPlugin, current: updatedPlugin });
      return updatedPlugin;
    } catch (error) {
      await this.updatePluginStatus(request.pluginId, PluginStatus.ERROR);
      this.emit('updateError', { request, error });
      throw error;
    }
  }

  /**
   * Get plugin by ID
   */
  async getPlugin(pluginId: string): Promise<IPlugin | null> {
    return await this.storage.getPlugin(pluginId);
  }

  /**
   * List all plugins with optional filters
   */
  async listPlugins(
    filters: { status?: PluginStatus; category?: string; active?: boolean } = {}
  ): Promise<IPlugin[]> {
    const plugins = await this.storage.getAllPlugins();

    return plugins.filter(plugin => {
      if (filters.status && plugin.status !== filters.status) return false;
      if (filters.category && plugin.category !== filters.category) return false;
      if (filters.active !== undefined) {
        const isActive = this.activePlugins.has(plugin.id);
        if (filters.active !== isActive) return false;
      }
      return true;
    });
  }

  /**
   * Execute a plugin function
   */
  async executePlugin(
    pluginId: string,
    functionName: string,
    ...args: any[]
  ): Promise<IPluginExecutionResult> {
    const plugin = this.activePlugins.get(pluginId);
    if (!plugin) {
      throw new ApiError('PLUGIN_NOT_ACTIVE', 'Plugin is not active', 400, { pluginId });
    }

    const instance = this.pluginInstances.get(pluginId);
    if (!instance || typeof instance[functionName] !== 'function') {
      throw new ApiError('FUNCTION_NOT_FOUND', 'Plugin function not found', 404, {
        pluginId,
        functionName,
      });
    }

    const context = this.createPluginContext(plugin);
    const result = await this.executor.execute(instance[functionName], context, ...args);

    // Update usage stats
    await this.updateUsageStats(pluginId, {
      apiCalls: 1,
      totalRuntime: result.executionTime,
    });

    return result;
  }

  /**
   * Get plugin usage statistics
   */
  async getPluginStats(pluginId: string): Promise<any> {
    const plugin = await this.getPlugin(pluginId);
    if (!plugin) {
      throw new ApiError('PLUGIN_NOT_FOUND', 'Plugin not found', 404, { pluginId });
    }

    return {
      plugin: {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        status: plugin.status,
      },
      usage: plugin.usage,
      isActive: this.activePlugins.has(pluginId),
      uptime: this.activePlugins.has(pluginId) ? this.getPluginUptime(pluginId) : 0,
    };
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    try {
      // Deactivate all active plugins
      const deactivationPromises = Array.from(this.activePlugins.keys()).map(pluginId =>
        this.deactivatePlugin(pluginId).catch(error =>
          console.error(`Error deactivating plugin ${pluginId}:`, error)
        )
      );

      await Promise.all(deactivationPromises);

      // Clear runtime state
      this.activePlugins.clear();
      this.pluginInstances.clear();
      this.executionQueue.clear();

      this.emit('shutdown');
    } catch (error) {
      this.emit('shutdownError', error);
      throw error;
    }
  }

  // Private helper methods

  private setupEventListeners(): void {
    this.on('error', error => {
      console.error('Plugin Manager Error:', error);
    });
  }

  private validateInstallRequest(request: IPluginInstallRequest): void {
    if (!request.source || !request.identifier) {
      throw new ApiError('INVALID_INSTALL_REQUEST', 'Source and identifier are required', 400);
    }
  }

  private async checkDependencies(plugin: IPlugin): Promise<void> {
    if (plugin.dependencies) {
      for (const [depId, version] of Object.entries(plugin.dependencies)) {
        const dependency = await this.getPlugin(depId);
        if (!dependency || dependency.status !== PluginStatus.ACTIVE) {
          throw new ApiError(
            'DEPENDENCY_NOT_SATISFIED',
            `Dependency ${depId} is not available`,
            400,
            {
              dependency: depId,
              requiredVersion: version,
            }
          );
        }
      }
    }
  }

  private createPluginContext(plugin: IPlugin): IPluginContext {
    return {
      plugin,
      config: plugin.config?.defaults || {},
      logger: this.createPluginLogger(plugin.id),
      api: this.createPluginAPI(plugin),
      storage: this.createPluginStorage(plugin.id),
      permissions: plugin.permissions,
      // tenant and user will be set dynamically during execution
    };
  }

  private createPluginLogger(pluginId: string): any {
    return {
      info: (message: string, ...args: any[]) =>
        console.log(`[Plugin:${pluginId}] ${message}`, ...args),
      warn: (message: string, ...args: any[]) =>
        console.warn(`[Plugin:${pluginId}] ${message}`, ...args),
      error: (message: string, ...args: any[]) =>
        console.error(`[Plugin:${pluginId}] ${message}`, ...args),
      debug: (message: string, ...args: any[]) =>
        console.debug(`[Plugin:${pluginId}] ${message}`, ...args),
    };
  }

  private createPluginAPI(plugin: IPlugin): any {
    // Create restricted API surface based on plugin permissions
    return this.permissionManager.createRestrictedAPI(plugin.permissions);
  }

  private createPluginStorage(pluginId: string): any {
    // Create plugin-specific storage interface
    return {
      get: (key: string) => this.storage.getPluginData(pluginId, key),
      set: (key: string, value: any) => this.storage.setPluginData(pluginId, key, value),
      delete: (key: string) => this.storage.deletePluginData(pluginId, key),
      clear: () => this.storage.clearPluginData(pluginId),
    };
  }

  private async executePluginHook(
    plugin: IPlugin,
    hookName: string,
    context?: IPluginContext
  ): Promise<void> {
    const hookFunction = plugin.hooks?.[hookName as keyof typeof plugin.hooks];
    if (!hookFunction) return;

    const instance = this.pluginInstances.get(plugin.id);
    if (!instance || typeof instance[hookFunction] !== 'function') return;

    const ctx = context || this.createPluginContext(plugin);
    await this.executor.execute(instance[hookFunction], ctx);
  }

  private registerPluginHooks(plugin: IPlugin, instance: any): void {
    // Register plugin hooks with the hook system
    if (plugin.hooks) {
      for (const [hookName, functionName] of Object.entries(plugin.hooks)) {
        if (typeof instance[functionName] === 'function') {
          this.hooks.register(hookName, plugin.id, instance[functionName]);
        }
      }
    }
  }

  private unregisterPluginHooks(plugin: IPlugin): void {
    // Unregister plugin hooks
    if (plugin.hooks) {
      for (const hookName of Object.keys(plugin.hooks)) {
        this.hooks.unregister(hookName, plugin.id);
      }
    }
  }

  private async updatePluginStatus(pluginId: string, status: PluginStatus): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (plugin) {
      plugin.status = status;
      await this.storage.savePlugin(plugin);
    }
  }

  private async updateUsageStats(
    pluginId: string,
    stats: Partial<IPlugin['usage']>
  ): Promise<void> {
    const plugin = await this.getPlugin(pluginId);
    if (plugin && plugin.usage) {
      Object.assign(plugin.usage, stats);
      await this.storage.savePlugin(plugin);
    }
  }

  private getPluginUptime(pluginId: string): number {
    // Implementation would track plugin activation time
    return 0;
  }

  private mergeConfigurations(current: any, updates: any): any {
    // Intelligent configuration merging
    return { ...current, ...updates };
  }
}
