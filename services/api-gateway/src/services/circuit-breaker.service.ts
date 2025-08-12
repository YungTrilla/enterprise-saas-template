/**
 * Circuit Breaker Service
 * Implements circuit breaker pattern for service resilience
 */

import { CorrelationId } from '@template/shared-types';
import { createLogger } from '../utils/logger';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface ICircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod?: number;
  requestTimeout?: number;
}

export interface ICircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private readonly logger = createLogger('circuit-breaker');

  constructor(
    private readonly name: string,
    private readonly options: ICircuitBreakerOptions
  ) {}

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    correlationId?: CorrelationId
  ): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttemptTime!) {
        this.logger.warn('Circuit breaker is OPEN', {
          service: this.name,
          nextAttemptTime: new Date(this.nextAttemptTime!).toISOString(),
          correlationId
        });
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
      
      // Try half-open state
      this.state = CircuitState.HALF_OPEN;
      this.logger.info('Circuit breaker entering HALF_OPEN state', {
        service: this.name,
        correlationId
      });
    }

    try {
      const result = await this.executeWithTimeout(fn, this.options.requestTimeout);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): ICircuitBreakerState {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    
    this.logger.info('Circuit breaker reset', {
      service: this.name
    });
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failures = 0;
      this.logger.info('Circuit breaker recovered to CLOSED state', {
        service: this.name
      });
    }
    
    if (this.state === CircuitState.CLOSED) {
      this.successes++;
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.options.resetTimeout;
      
      this.logger.error('Circuit breaker tripped to OPEN state from HALF_OPEN', {
        service: this.name,
        failures: this.failures,
        nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
      });
    } else if (this.failures >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.options.resetTimeout;
      
      this.logger.error('Circuit breaker tripped to OPEN state', {
        service: this.name,
        failures: this.failures,
        threshold: this.options.failureThreshold,
        nextAttemptTime: new Date(this.nextAttemptTime).toISOString()
      });
    }
  }

  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeout?: number
  ): Promise<T> {
    if (!timeout) {
      return fn();
    }

    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  }
}

export class CircuitBreakerRegistry {
  private readonly circuits = new Map<string, CircuitBreaker>();
  private readonly logger = createLogger('circuit-breaker-registry');

  /**
   * Get or create circuit breaker for service
   */
  getCircuitBreaker(
    serviceName: string,
    options: ICircuitBreakerOptions
  ): CircuitBreaker {
    if (!this.circuits.has(serviceName)) {
      const circuit = new CircuitBreaker(serviceName, options);
      this.circuits.set(serviceName, circuit);
      
      this.logger.info('Created new circuit breaker', {
        service: serviceName,
        options
      });
    }

    return this.circuits.get(serviceName)!;
  }

  /**
   * Get all circuit breaker states
   */
  getAllStates(): Record<string, ICircuitBreakerState> {
    const states: Record<string, ICircuitBreakerState> = {};
    
    this.circuits.forEach((circuit, name) => {
      states[name] = circuit.getState();
    });

    return states;
  }

  /**
   * Reset specific circuit breaker
   */
  resetCircuit(serviceName: string): void {
    const circuit = this.circuits.get(serviceName);
    if (circuit) {
      circuit.reset();
      this.logger.info('Circuit breaker reset', { service: serviceName });
    }
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.circuits.forEach((circuit, name) => {
      circuit.reset();
    });
    this.logger.info('All circuit breakers reset');
  }
}

// Export singleton instance
export const circuitBreakerRegistry = new CircuitBreakerRegistry();