/**
 * Proxy Service
 * Handles request proxying to microservices with resilience patterns
 */

import { Request, Response, NextFunction } from 'express';
import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { CorrelationId } from '@template/shared-types';
import { getServiceRegistry, IServiceRegistry } from '../config';
import { circuitBreakerRegistry } from './circuit-breaker.service';
import { createLogger } from '../utils/logger';

export interface IProxyOptions {
  preserveHeaders?: string[];
  transformRequest?: (req: Request) => any;
  transformResponse?: (data: any) => any;
  retries?: number;
  timeout?: number;
}

export class ProxyService {
  private serviceRegistry: IServiceRegistry | null = null;
  private logger = createLogger('proxy-service');

  constructor() {
    // Delay initialization until first use
  }

  private getRegistry(): IServiceRegistry {
    if (!this.serviceRegistry) {
      this.serviceRegistry = getServiceRegistry();
    }
    return this.serviceRegistry;
  }

  /**
   * Create proxy middleware for a specific service
   */
  createServiceProxy(
    serviceName: string,
    options: IProxyOptions = {}
  ) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const correlationId = req.correlationId;
      
      try {
        const serviceConfig = this.getRegistry()[serviceName];
        if (!serviceConfig) {
          throw new Error(`Service ${serviceName} not found in registry`);
        }

        // Get circuit breaker for this service
        const circuitBreaker = circuitBreakerRegistry.getCircuitBreaker(
          serviceName,
          {
            failureThreshold: serviceConfig.circuitBreakerThreshold,
            resetTimeout: serviceConfig.circuitBreakerTimeout,
            requestTimeout: serviceConfig.timeout
          }
        );

        // Execute request through circuit breaker
        const response = await circuitBreaker.execute(
          () => this.proxyRequest(req, serviceName, options, correlationId),
          correlationId
        );

        // Send response
        res.status(response.status).json(response.data);

      } catch (error) {
        this.handleProxyError(error as Error, serviceName, req, res, next);
      }
    };
  }

  /**
   * Proxy request to service
   */
  private async proxyRequest(
    req: Request,
    serviceName: string,
    options: IProxyOptions,
    correlationId: CorrelationId
  ): Promise<any> {
    const serviceConfig = this.getRegistry()[serviceName];
    const startTime = Date.now();

    // Build target URL
    const targetUrl = this.buildTargetUrl(serviceConfig.url, req);

    // Prepare request config
    const axiosConfig: AxiosRequestConfig = {
      method: req.method as any,
      url: targetUrl,
      headers: this.buildProxyHeaders(req, options.preserveHeaders),
      timeout: options.timeout || serviceConfig.timeout,
      maxRedirects: 0,
      validateStatus: () => true // We'll handle all status codes
    };

    // Add request body if present
    if (req.body && Object.keys(req.body).length > 0) {
      axiosConfig.data = options.transformRequest ? 
        options.transformRequest(req) : req.body;
    }

    // Add query parameters
    if (req.query) {
      axiosConfig.params = req.query;
    }

    this.logger.info('Proxying request', {
      service: serviceName,
      method: req.method,
      path: req.path,
      targetUrl,
      correlationId
    });

    try {
      const response = await this.executeWithRetry(
        () => axios(axiosConfig),
        options.retries || serviceConfig.retries
      );

      const duration = Date.now() - startTime;

      this.logger.info('Proxy request successful', {
        service: serviceName,
        status: response.status,
        duration,
        correlationId
      });

      // Transform response if needed
      if (options.transformResponse && response.data) {
        response.data = options.transformResponse(response.data);
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logger.error('Proxy request failed', {
        service: serviceName,
        error: (error as Error).message,
        duration,
        correlationId
      });

      throw error;
    }
  }

  /**
   * Build target URL for proxy request
   */
  private buildTargetUrl(serviceUrl: string, req: Request): string {
    // Remove the API prefix and service name from the path
    const pathParts = req.path.split('/').filter(Boolean);
    
    // Expected format: /api/v1/{serviceName}/{resource}
    // Remove: api, v1, serviceName
    if (pathParts[0] === 'api' && pathParts[1] === 'v1') {
      pathParts.splice(0, 3);
    }

    const targetPath = '/' + pathParts.join('/');
    return `${serviceUrl}${targetPath}`;
  }

  /**
   * Build headers for proxy request
   */
  private buildProxyHeaders(
    req: Request,
    preserveHeaders: string[] = []
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'x-correlation-id': req.correlationId,
      'x-forwarded-for': req.ip || req.connection.remoteAddress || '',
      'x-forwarded-host': req.hostname,
      'x-forwarded-proto': req.protocol,
      'x-original-uri': req.originalUrl
    };

    // Preserve authorization header
    if (req.headers.authorization) {
      headers.authorization = req.headers.authorization;
    }

    // Preserve content-type
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'];
    }

    // Preserve additional headers if specified
    preserveHeaders.forEach(headerName => {
      const value = req.headers[headerName.toLowerCase()];
      if (value && typeof value === 'string') {
        headers[headerName.toLowerCase()] = value;
      }
    });

    return headers;
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on client errors (4xx)
        if (axios.isAxiosError(error) && error.response?.status && error.response.status < 500) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          this.logger.warn('Retrying request', {
            attempt,
            maxRetries,
            delay,
            error: lastError.message
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Handle proxy errors
   */
  private handleProxyError(
    error: Error,
    serviceName: string,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Forward error response from service
        res.status(axiosError.response.status).json(axiosError.response.data);
      } else if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
        res.status(504).json({
          success: false,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: `Request to ${serviceName} service timed out`
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(503).json({
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: `${serviceName} service is currently unavailable`
          },
          correlationId: req.correlationId,
          timestamp: new Date().toISOString()
        });
      }
    } else if (error.message.includes('Circuit breaker is OPEN')) {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: `${serviceName} service is temporarily unavailable due to repeated failures`
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    } else {
      // Generic error
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred'
        },
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    }
  }
}

// Export singleton instance
export const proxyService = new ProxyService();