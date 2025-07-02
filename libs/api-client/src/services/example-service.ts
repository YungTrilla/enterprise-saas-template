import { BaseServiceClient } from './base-service';
import { ApiResponse, ServiceConfig } from '../types';

// Example entity types
export interface CreateExampleRequest {
  title: string;
  description?: string;
  category: string;
  status?: 'draft' | 'active' | 'inactive';
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateExampleRequest {
  title?: string;
  description?: string;
  category?: string;
  status?: 'draft' | 'active' | 'inactive';
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface ExampleSearchFilters {
  category?: string;
  status?: 'draft' | 'active' | 'inactive';
  tags?: string[];
  createdAfter?: string;
  createdBefore?: string;
}

export interface ExampleEntity {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'draft' | 'active' | 'inactive';
  metadata?: Record<string, any>;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface ExampleSummary {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  recentlyCreated: number;
  recentlyUpdated: number;
}

/**
 * Example Service Client
 * Demonstrates basic CRUD operations, search, and business logic patterns
 * for a generic entity management service
 */
export class ExampleServiceClient extends BaseServiceClient {
  constructor(config: ServiceConfig) {
    super('example-service', config);
  }

  // ========================================
  // Basic CRUD Operations
  // ========================================

  /**
   * Create new example entity
   */
  async create(request: CreateExampleRequest): Promise<ApiResponse<ExampleEntity>> {
    return this.post<ExampleEntity>('/examples', request);
  }

  /**
   * Get example entity by ID
   */
  async getById(id: string): Promise<ApiResponse<ExampleEntity>> {
    return this.get<ExampleEntity>(`/examples/${id}`);
  }

  /**
   * Update example entity
   */
  async update(id: string, updates: UpdateExampleRequest): Promise<ApiResponse<ExampleEntity>> {
    return this.patch<ExampleEntity>(`/examples/${id}`, updates);
  }

  /**
   * Delete example entity
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`/examples/${id}`);
  }

  /**
   * Get all examples with pagination
   */
  async getAll(page?: number, limit?: number, filters?: ExampleSearchFilters): Promise<ApiResponse<ExampleEntity[]>> {
    return this.getPaginated<ExampleEntity>('/examples', page, limit, filters);
  }

  /**
   * Search examples
   */
  async search(query: string, filters?: ExampleSearchFilters): Promise<ApiResponse<ExampleEntity[]>> {
    return this.search<ExampleEntity>('/examples', query, filters);
  }

  // ========================================
  // Category and Status Operations
  // ========================================

  /**
   * Get examples by category
   */
  async getByCategory(category: string, page?: number, limit?: number): Promise<ApiResponse<ExampleEntity[]>> {
    return this.getPaginated<ExampleEntity>('/examples', page, limit, { category });
  }

  /**
   * Get examples by status
   */
  async getByStatus(status: 'draft' | 'active' | 'inactive', page?: number, limit?: number): Promise<ApiResponse<ExampleEntity[]>> {
    return this.getPaginated<ExampleEntity>('/examples', page, limit, { status });
  }

  /**
   * Update example status
   */
  async updateStatus(id: string, status: 'draft' | 'active' | 'inactive'): Promise<ApiResponse<ExampleEntity>> {
    return this.patch<ExampleEntity>(`/examples/${id}/status`, { status });
  }

  /**
   * Activate example
   */
  async activate(id: string): Promise<ApiResponse<ExampleEntity>> {
    return this.post<ExampleEntity>(`/examples/${id}/activate`);
  }

  /**
   * Deactivate example
   */
  async deactivate(id: string): Promise<ApiResponse<ExampleEntity>> {
    return this.post<ExampleEntity>(`/examples/${id}/deactivate`);
  }

  // ========================================
  // Bulk Operations
  // ========================================

  /**
   * Bulk create examples
   */
  async bulkCreate(examples: CreateExampleRequest[]): Promise<ApiResponse<ExampleEntity[]>> {
    return this.bulkOperation('/examples', examples, 'create');
  }

  /**
   * Bulk update examples
   */
  async bulkUpdate(updates: Array<{id: string} & UpdateExampleRequest>): Promise<ApiResponse<ExampleEntity[]>> {
    return this.bulkOperation('/examples', updates, 'update');
  }

  /**
   * Bulk delete examples
   */
  async bulkDelete(ids: string[]): Promise<ApiResponse<void>> {
    return this.post<void>('/examples/bulk-delete', { ids });
  }

  /**
   * Import examples from file
   */
  async import(file: File, options?: { skipDuplicates?: boolean }): Promise<ApiResponse<{ imported: number; errors: any[] }>> {
    return this.uploadFile('/examples/import', file, options);
  }

  /**
   * Export examples to file
   */
  async export(filters?: ExampleSearchFilters, format?: 'csv' | 'json' | 'xlsx'): Promise<ApiResponse<Blob>> {
    return this.download('/examples/export', { filters, format: format || 'csv' });
  }

  // ========================================
  // Analytics and Reports
  // ========================================

  /**
   * Get examples summary
   */
  async getSummary(): Promise<ApiResponse<ExampleSummary>> {
    return this.get<ExampleSummary>('/examples/summary');
  }

  /**
   * Get activity report
   */
  async getActivityReport(startDate: string, endDate: string): Promise<ApiResponse<any>> {
    return this.get('/examples/reports/activity', {
      params: { startDate, endDate }
    });
  }

  /**
   * Get trending categories
   */
  async getTrendingCategories(period: 'week' | 'month' | 'quarter'): Promise<ApiResponse<Array<{ category: string; count: number; growth: number }>>> {
    return this.get('/examples/reports/trending-categories', {
      params: { period }
    });
  }

  // ========================================
  // Tags and Metadata
  // ========================================

  /**
   * Get all available categories
   */
  async getCategories(): Promise<ApiResponse<string[]>> {
    return this.get<string[]>('/examples/categories');
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<ApiResponse<string[]>> {
    return this.get<string[]>('/examples/tags');
  }

  /**
   * Get popular tags
   */
  async getPopularTags(limit?: number): Promise<ApiResponse<Array<{ tag: string; count: number }>>> {
    return this.get('/examples/tags/popular', {
      params: { limit: limit || 20 }
    });
  }

  /**
   * Add tags to example
   */
  async addTags(id: string, tags: string[]): Promise<ApiResponse<ExampleEntity>> {
    return this.post<ExampleEntity>(`/examples/${id}/tags`, { tags });
  }

  /**
   * Remove tags from example
   */
  async removeTags(id: string, tags: string[]): Promise<ApiResponse<ExampleEntity>> {
    return this.delete<ExampleEntity>(`/examples/${id}/tags`, { data: { tags } });
  }

  // ========================================
  // Advanced Features
  // ========================================

  /**
   * Duplicate example
   */
  async duplicate(id: string, title?: string): Promise<ApiResponse<ExampleEntity>> {
    return this.post<ExampleEntity>(`/examples/${id}/duplicate`, { title });
  }

  /**
   * Get example history/versions
   */
  async getHistory(id: string): Promise<ApiResponse<any[]>> {
    return this.get(`/examples/${id}/history`);
  }

  /**
   * Restore example from version
   */
  async restoreVersion(id: string, versionId: string): Promise<ApiResponse<ExampleEntity>> {
    return this.post<ExampleEntity>(`/examples/${id}/restore`, { versionId });
  }
}