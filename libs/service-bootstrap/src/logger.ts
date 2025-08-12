import winston, { Logger } from 'winston';
import { ServiceBootstrapConfig } from './types';

/**
 * Create a Winston logger instance for the service
 */
export function createServiceLogger(config: ServiceBootstrapConfig): Logger {
  const serviceName = config.logging?.service || config.name;
  const logLevel = config.logging?.level || process.env.LOG_LEVEL || 'info';

  const logger = winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: {
      service: serviceName,
      environment: config.environment || 'development',
      version: config.version,
    },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
      }),
    ],
  });

  // Add file transport in production
  if (config.environment === 'production') {
    logger.add(
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    logger.add(
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return logger;
}
