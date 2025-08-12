/**
 * Circuit Breaker Service Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CircuitBreakerService } from '../circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let circuitBreaker: CircuitBreakerService;
  let mockSuccessFunction: ReturnType<typeof vi.fn>;
  let mockFailingFunction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService({
      failureThreshold: 3,
      resetTimeout: 1000,
      monitoringPeriod: 10000,
    });

    mockSuccessFunction = vi.fn().mockResolvedValue('success');
    mockFailingFunction = vi.fn().mockRejectedValue(new Error('failure'));
  });

  afterEach(() => {
    // Clear all circuit states
    (circuitBreaker as any).circuits.clear();
  });

  describe('execute', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const result = await circuitBreaker.execute('test-service', mockSuccessFunction);

      expect(result).toBe('success');
      expect(mockSuccessFunction).toHaveBeenCalledTimes(1);
    });

    it('should track failures and open circuit after threshold', async () => {
      const serviceName = 'failing-service';

      // Fail 3 times to reach threshold
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow(
          'failure'
        );
      }

      expect(mockFailingFunction).toHaveBeenCalledTimes(3);

      // Circuit should now be open
      await expect(circuitBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow(
        'Service failing-service is currently unavailable (circuit open)'
      );

      // Function should not be called when circuit is open
      expect(mockFailingFunction).toHaveBeenCalledTimes(3);
    });

    it('should enter half-open state after reset timeout', async () => {
      const serviceName = 'timeout-service';

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow();
      }

      // Circuit is now open
      const state1 = circuitBreaker.getState(serviceName);
      expect(state1.state).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Try to execute - should enter half-open state
      await expect(circuitBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow(
        'failure'
      );

      const state2 = circuitBreaker.getState(serviceName);
      expect(state2.state).toBe('open'); // Back to open after failure in half-open
    });

    it('should close circuit after successful execution in half-open state', async () => {
      const serviceName = 'recovery-service';
      let shouldFail = true;
      const conditionalFunction = vi.fn().mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('failure'));
        }
        return Promise.resolve('success');
      });

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(serviceName, conditionalFunction)).rejects.toThrow();
      }

      // Circuit is open
      expect(circuitBreaker.getState(serviceName).state).toBe('open');

      // Wait for reset timeout
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Now let it succeed
      shouldFail = false;
      const result = await circuitBreaker.execute(serviceName, conditionalFunction);

      expect(result).toBe('success');
      expect(circuitBreaker.getState(serviceName).state).toBe('closed');
    });

    it('should handle multiple services independently', async () => {
      const service1 = 'service1';
      const service2 = 'service2';

      // Make service1 fail
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(service1, mockFailingFunction)).rejects.toThrow();
      }

      // Service1 should be open
      expect(circuitBreaker.getState(service1).state).toBe('open');

      // Service2 should still work
      const result = await circuitBreaker.execute(service2, mockSuccessFunction);
      expect(result).toBe('success');
      expect(circuitBreaker.getState(service2).state).toBe('closed');
    });
  });

  describe('getState', () => {
    it('should return initial closed state for new service', () => {
      const state = circuitBreaker.getState('new-service');

      expect(state).toEqual({
        state: 'closed',
        failures: 0,
        lastFailureTime: null,
        totalRequests: 0,
        failureRate: 0,
      });
    });

    it('should track failure statistics', async () => {
      const serviceName = 'stats-service';

      // Execute some successful and failed requests
      await circuitBreaker.execute(serviceName, mockSuccessFunction);
      await expect(circuitBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow();
      await circuitBreaker.execute(serviceName, mockSuccessFunction);

      const state = circuitBreaker.getState(serviceName);
      expect(state.failures).toBe(1);
      expect(state.totalRequests).toBe(3);
      expect(state.failureRate).toBeCloseTo(0.33, 2);
    });
  });

  describe('getAllStates', () => {
    it('should return states for all tracked services', async () => {
      // Execute on multiple services
      await circuitBreaker.execute('service1', mockSuccessFunction);
      await circuitBreaker.execute('service2', mockSuccessFunction);
      await expect(circuitBreaker.execute('service3', mockFailingFunction)).rejects.toThrow();

      const states = circuitBreaker.getAllStates();

      expect(Object.keys(states)).toHaveLength(3);
      expect(states).toHaveProperty('service1');
      expect(states).toHaveProperty('service2');
      expect(states).toHaveProperty('service3');
      expect(states.service3.failures).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset circuit state for a service', async () => {
      const serviceName = 'reset-service';

      // Make it fail
      for (let i = 0; i < 3; i++) {
        await expect(circuitBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow();
      }

      expect(circuitBreaker.getState(serviceName).state).toBe('open');

      // Reset the circuit
      circuitBreaker.reset(serviceName);

      const state = circuitBreaker.getState(serviceName);
      expect(state.state).toBe('closed');
      expect(state.failures).toBe(0);
      expect(state.totalRequests).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should respect custom configuration', async () => {
      const customBreaker = new CircuitBreakerService({
        failureThreshold: 1, // Open after just 1 failure
        resetTimeout: 500,
        monitoringPeriod: 5000,
      });

      const serviceName = 'custom-service';

      // Should open after just one failure
      await expect(customBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow(
        'failure'
      );

      // Circuit should be open
      await expect(customBreaker.execute(serviceName, mockFailingFunction)).rejects.toThrow(
        'Service custom-service is currently unavailable (circuit open)'
      );
    });
  });

  describe('error handling', () => {
    it('should handle synchronous errors', async () => {
      const syncErrorFunction = vi.fn(() => {
        throw new Error('sync error');
      });

      await expect(circuitBreaker.execute('sync-error-service', syncErrorFunction)).rejects.toThrow(
        'sync error'
      );
    });

    it('should pass through successful values of any type', async () => {
      const objectFunction = vi.fn().mockResolvedValue({ data: 'test' });
      const arrayFunction = vi.fn().mockResolvedValue([1, 2, 3]);
      const nullFunction = vi.fn().mockResolvedValue(null);

      const objectResult = await circuitBreaker.execute('obj-service', objectFunction);
      expect(objectResult).toEqual({ data: 'test' });

      const arrayResult = await circuitBreaker.execute('array-service', arrayFunction);
      expect(arrayResult).toEqual([1, 2, 3]);

      const nullResult = await circuitBreaker.execute('null-service', nullFunction);
      expect(nullResult).toBeNull();
    });
  });
});
