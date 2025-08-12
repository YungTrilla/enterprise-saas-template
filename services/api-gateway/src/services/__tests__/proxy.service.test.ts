/**
 * Proxy Service Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProxyService } from '../proxy.service';
import { CircuitBreakerService } from '../circuit-breaker.service';
import axios from 'axios';
import { Request, Response } from 'express';

vi.mock('axios');
const mockedAxios = axios as any;

describe('ProxyService', () => {
  let proxyService: ProxyService;
  let mockCircuitBreaker: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Mock circuit breaker
    mockCircuitBreaker = {
      execute: vi.fn((service, fn) => fn()),
      getState: vi.fn(),
      getAllStates: vi.fn(),
      reset: vi.fn(),
    };

    // Create proxy service with mocked dependencies
    proxyService = new ProxyService(mockCircuitBreaker);

    // Mock request
    mockRequest = {
      method: 'GET',
      originalUrl: '/api/v1/users',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer token',
        'x-correlation-id': 'test-correlation-id',
      },
      query: { page: '1' },
      body: {},
      ip: '127.0.0.1',
    };

    // Mock response
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('forwardRequest', () => {
    it('should forward GET request successfully', async () => {
      const mockServiceResponse = {
        data: { users: [{ id: 1, name: 'Test User' }] },
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'value',
        },
      };

      mockedAxios.request.mockResolvedValue(mockServiceResponse);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockCircuitBreaker.execute).toHaveBeenCalledWith('users', expect.any(Function));

      expect(mockedAxios.request).toHaveBeenCalledWith({
        method: 'GET',
        url: 'http://users-service:3001/api/v1/users',
        params: { page: '1' },
        data: {},
        headers: expect.objectContaining({
          'content-type': 'application/json',
          authorization: 'Bearer token',
          'x-correlation-id': 'test-correlation-id',
        }),
        timeout: 30000,
        maxRedirects: 0,
        validateStatus: expect.any(Function),
      });

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockServiceResponse.data);
    });

    it('should forward POST request with body', async () => {
      mockRequest.method = 'POST';
      mockRequest.body = { name: 'New User', email: 'user@example.com' };

      const mockServiceResponse = {
        data: { id: 1, name: 'New User', email: 'user@example.com' },
        status: 201,
        statusText: 'Created',
        headers: {},
      };

      mockedAxios.request.mockResolvedValue(mockServiceResponse);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockedAxios.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { name: 'New User', email: 'user@example.com' },
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle service errors gracefully', async () => {
      const serviceError = {
        response: {
          data: { error: 'Bad Request' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
        },
      };

      mockedAxios.request.mockRejectedValue(serviceError);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Bad Request' });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      mockedAxios.request.mockRejectedValue(networkError);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service users is currently unavailable',
          service: 'users',
          correlationId: 'test-correlation-id',
        },
      });
    });

    it('should handle circuit breaker open state', async () => {
      mockCircuitBreaker.execute.mockRejectedValue(
        new Error('Service users is currently unavailable (circuit open)')
      );

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service users is currently unavailable (circuit open)',
          service: 'users',
          correlationId: 'test-correlation-id',
        },
      });
    });

    it('should filter internal headers', async () => {
      mockRequest.headers = {
        'content-type': 'application/json',
        'x-forwarded-for': '10.0.0.1',
        'x-forwarded-proto': 'https',
        'x-forwarded-host': 'api.example.com',
        'x-real-ip': '10.0.0.2',
        authorization: 'Bearer token',
      };

      const mockServiceResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      };

      mockedAxios.request.mockResolvedValue(mockServiceResponse);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      const forwardedHeaders = mockedAxios.request.mock.calls[0][0].headers;
      expect(forwardedHeaders).not.toHaveProperty('x-forwarded-for');
      expect(forwardedHeaders).not.toHaveProperty('x-forwarded-proto');
      expect(forwardedHeaders).not.toHaveProperty('x-forwarded-host');
      expect(forwardedHeaders).not.toHaveProperty('x-real-ip');
      expect(forwardedHeaders).toHaveProperty('authorization', 'Bearer token');
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['PUT', 'PATCH', 'DELETE'];
      const mockServiceResponse = {
        data: { success: true },
        status: 200,
        headers: {},
      };

      for (const method of methods) {
        mockRequest.method = method;
        mockedAxios.request.mockResolvedValue(mockServiceResponse);

        await proxyService.forwardRequest(
          'users',
          'http://users-service:3001',
          mockRequest as Request,
          mockResponse as Response
        );

        expect(mockedAxios.request).toHaveBeenCalledWith(expect.objectContaining({ method }));
      }
    });

    it('should pass through custom response headers', async () => {
      const mockServiceResponse = {
        data: { data: 'test' },
        status: 200,
        headers: {
          'x-total-count': '100',
          'x-page': '1',
          'cache-control': 'no-cache',
        },
      };

      mockedAxios.request.mockResolvedValue(mockServiceResponse);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'x-total-count': '100',
          'x-page': '1',
          'cache-control': 'no-cache',
        })
      );
    });

    it('should handle empty response body', async () => {
      const mockServiceResponse = {
        data: null,
        status: 204,
        statusText: 'No Content',
        headers: {},
      };

      mockedAxios.request.mockResolvedValue(mockServiceResponse);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.json).toHaveBeenCalledWith(null);
    });

    it('should respect timeout configuration', async () => {
      const timeoutError = new Error('timeout of 30000ms exceeded');
      (timeoutError as any).code = 'ECONNABORTED';
      mockedAxios.request.mockRejectedValue(timeoutError);

      await proxyService.forwardRequest(
        'users',
        'http://users-service:3001',
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(504);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: 'GATEWAY_TIMEOUT',
          message: 'Request to service users timed out',
          service: 'users',
          correlationId: 'test-correlation-id',
        },
      });
    });
  });
});
