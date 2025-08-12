import { Application } from 'express';
import { Server } from 'http';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { Logger } from 'winston';

export interface ServiceBootstrapConfig {
  // Service metadata
  name: string;
  version: string;
  environment?: string;
  port: number;
  host?: string;
  apiPrefix?: string; // defaults to /api/v1

  // Middleware options
  cors?: {
    enabled?: boolean;
    origins?: string[];
    credentials?: boolean;
  };

  rateLimit?: {
    enabled?: boolean;
    windowMs?: number;
    maxRequests?: number;
    message?: string;
  };

  bodyParser?: {
    jsonLimit?: string;
    urlEncodedLimit?: string;
  };

  // Database options
  database?: {
    enabled: boolean;
    connectionString?: string;
    poolMin?: number;
    poolMax?: number;
    healthCheckQuery?: string;
  };

  // Redis options
  redis?: {
    enabled: boolean;
    url?: string;
    optional?: boolean; // if true, don't fail if Redis unavailable
  };

  // Health check options
  healthCheck?: {
    path?: string; // defaults to /health
    detailed?: boolean;
    custom?: () => Promise<any>;
  };

  // Logging options
  logging?: {
    service?: string;
    level?: string;
  };

  // Graceful shutdown options
  shutdown?: {
    timeout?: number; // defaults to 30000ms
    handlers?: Array<() => Promise<void>>;
  };

  // Security options
  security?: {
    trustProxy?: boolean;
    helmet?: boolean;
  };
}

export interface ServiceDependencies {
  logger: Logger;
  db?: Pool;
  redis?: Redis;
  config: ServiceBootstrapConfig;
}

export interface ServiceBootstrapResult {
  app: Application;
  server?: Server;
  logger: Logger;
  db?: Pool;
  redis?: Redis;
  shutdown: () => Promise<void>;
  start: () => Promise<void>;
}

export type RouteSetupFunction = (app: Application, deps: ServiceDependencies) => void;

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  service: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  checks?: {
    database?: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    redis?: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    custom?: any;
  };
}
