/**
 * Plugin System Type Definitions
 */

export interface IPlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: {
    name: string;
    email: string;
    url?: string;
  };
  repository?: {
    type: string;
    url: string;
  };
  license: string;
  category: PluginCategory;
  tags: string[];
  
  // Plugin configuration
  main: string; // Entry point file
  config?: IPluginConfig;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  
  // Platform requirements
  engines: {
    node: string;
    template: string; // Minimum template version
  };
  
  // Security and permissions
  permissions: IPluginPermissions;
  sandbox: boolean;
  trusted: boolean;
  
  // Lifecycle hooks
  hooks?: IPluginHooks;
  
  // UI extensions
  ui?: IPluginUI;
  
  // API extensions
  api?: IPluginAPI;
  
  // Metadata
  status: PluginStatus;
  installPath?: string;
  installedAt?: string;
  updatedAt?: string;
  lastUsed?: string;
  usage?: IPluginUsage;
  
  // Validation
  checksum?: string;
  signature?: string;
  verified: boolean;
}

export interface IPluginConfig {
  schema: Record<string, any>; // JSON Schema for configuration
  defaults: Record<string, any>;
  required: string[];
  sensitive: string[]; // Fields that contain sensitive data
}

export interface IPluginPermissions {
  // System permissions
  filesystem: {
    read: string[]; // Path patterns
    write: string[];
  };
  network: {
    domains: string[]; // Allowed domains
    ports: number[]; // Allowed ports
  };
  database: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  
  // API permissions
  api: {
    endpoints: string[]; // Allowed API endpoints
    methods: string[]; // HTTP methods
    rateLimit?: {
      requests: number;
      windowMs: number;
    };
  };
  
  // Template-specific permissions
  tenants: {
    access: 'own' | 'all' | 'none';
    manage: boolean;
  };
  users: {
    read: boolean;
    write: boolean;
    admin: boolean;
  };
  
  // Custom permissions
  custom: Record<string, any>;
}

export interface IPluginHooks {
  // Lifecycle hooks
  install?: string; // Function name to call on install
  uninstall?: string; // Function name to call on uninstall
  activate?: string; // Function name to call on activation
  deactivate?: string; // Function name to call on deactivation
  update?: string; // Function name to call on update
  
  // Application hooks
  beforeRequest?: string;
  afterRequest?: string;
  beforeAuthentication?: string;
  afterAuthentication?: string;
  beforeAuthorization?: string;
  afterAuthorization?: string;
  
  // Data hooks
  beforeCreate?: string;
  afterCreate?: string;
  beforeUpdate?: string;
  afterUpdate?: string;
  beforeDelete?: string;
  afterDelete?: string;
  
  // Custom hooks
  custom?: Record<string, string>;
}

export interface IPluginUI {
  // Admin interface extensions
  admin?: {
    menu?: IPluginMenuItem[];
    pages?: IPluginPage[];
    widgets?: IPluginWidget[];
  };
  
  // User interface extensions
  user?: {
    menu?: IPluginMenuItem[];
    pages?: IPluginPage[];
    widgets?: IPluginWidget[];
  };
  
  // Embeddable components
  components?: IPluginComponent[];
}

export interface IPluginMenuItem {
  id: string;
  label: string;
  icon?: string;
  url: string;
  position?: number;
  parent?: string;
  permissions?: string[];
}

export interface IPluginPage {
  id: string;
  title: string;
  path: string;
  component: string;
  layout?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface IPluginWidget {
  id: string;
  name: string;
  component: string;
  size: 'small' | 'medium' | 'large';
  position?: {
    section: string;
    order: number;
  };
  permissions?: string[];
  config?: Record<string, any>;
}

export interface IPluginComponent {
  id: string;
  name: string;
  component: string;
  props?: Record<string, any>;
  slots?: string[];
}

export interface IPluginAPI {
  // REST API endpoints
  endpoints?: IPluginEndpoint[];
  
  // GraphQL extensions
  graphql?: {
    schema?: string;
    resolvers?: string;
  };
  
  // WebSocket handlers
  websockets?: IPluginWebSocket[];
  
  // Middleware
  middleware?: IPluginMiddleware[];
}

export interface IPluginEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string; // Function name
  middleware?: string[];
  permissions?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  validation?: {
    params?: any; // Joi schema
    query?: any;
    body?: any;
  };
}

export interface IPluginWebSocket {
  event: string;
  handler: string; // Function name
  permissions?: string[];
  rateLimit?: {
    messages: number;
    windowMs: number;
  };
}

export interface IPluginMiddleware {
  name: string;
  handler: string; // Function name
  priority?: number;
  paths?: string[]; // Path patterns
}

export interface IPluginUsage {
  activations: number;
  lastActivated?: string;
  totalRuntime: number; // milliseconds
  apiCalls: number;
  errors: number;
  performance: {
    averageExecutionTime: number;
    slowestExecution: number;
    fastestExecution: number;
  };
}

export enum PluginCategory {
  INTEGRATION = 'INTEGRATION',
  ANALYTICS = 'ANALYTICS',
  MARKETING = 'MARKETING',
  PRODUCTIVITY = 'PRODUCTIVITY',
  COMMUNICATION = 'COMMUNICATION',
  SECURITY = 'SECURITY',
  DEVELOPER_TOOLS = 'DEVELOPER_TOOLS',
  CUSTOM = 'CUSTOM'
}

export enum PluginStatus {
  INSTALLED = 'INSTALLED',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
  UPDATING = 'UPDATING',
  UNINSTALLING = 'UNINSTALLING'
}

export enum PluginSource {
  MARKETPLACE = 'MARKETPLACE',
  FILE_UPLOAD = 'FILE_UPLOAD',
  GIT_REPOSITORY = 'GIT_REPOSITORY',
  NPM_PACKAGE = 'NPM_PACKAGE',
  LOCAL_DEVELOPMENT = 'LOCAL_DEVELOPMENT'
}

// Plugin manifest (package.json extension)
export interface IPluginManifest {
  name: string;
  version: string;
  description: string;
  main: string;
  template: {
    category: PluginCategory;
    permissions: IPluginPermissions;
    hooks?: IPluginHooks;
    ui?: IPluginUI;
    api?: IPluginAPI;
    config?: IPluginConfig;
    sandbox?: boolean;
    trusted?: boolean;
  };
  author: {
    name: string;
    email: string;
    url?: string;
  };
  license: string;
  repository?: {
    type: string;
    url: string;
  };
  engines: {
    node: string;
    template: string;
  };
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  keywords?: string[];
}

// Plugin installation request
export interface IPluginInstallRequest {
  source: PluginSource;
  identifier: string; // URL, file path, package name, etc.
  version?: string;
  config?: Record<string, any>;
  autoActivate?: boolean;
  overridePermissions?: boolean;
}

// Plugin update request
export interface IPluginUpdateRequest {
  pluginId: string;
  version?: string;
  config?: Record<string, any>;
  preserveData?: boolean;
}

// Plugin search filters
export interface IPluginSearchFilters {
  category?: PluginCategory;
  tags?: string[];
  author?: string;
  verified?: boolean;
  free?: boolean;
  rating?: number;
  compatibility?: string; // Template version
}

// Plugin execution context
export interface IPluginContext {
  plugin: IPlugin;
  config: Record<string, any>;
  logger: any; // Logger instance
  api: any; // Template API instance
  storage: any; // Plugin storage instance
  permissions: IPluginPermissions;
  tenant?: any; // Current tenant context
  user?: any; // Current user context
}

// Plugin execution result
export interface IPluginExecutionResult {
  success: boolean;
  result?: any;
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
  executionTime: number;
  memoryUsage?: {
    used: number;
    peak: number;
  };
  logs?: string[];
}