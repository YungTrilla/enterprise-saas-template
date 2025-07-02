/**
 * Example Entity Types
 * Generic types for demonstrating the template patterns
 */

// Example entity interface
export interface IExample {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: ExampleStatus;
  priority: ExamplePriority;
  tags: string[];
  metadata: Record<string, any>;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// Example category interface
export interface IExampleCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  exampleCount: number;
  createdAt: string;
  updatedAt: string;
}

// Example comment interface
export interface IExampleComment {
  id: string;
  exampleId: string;
  parentId?: string;
  content: string;
  authorId: string;
  authorName: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
}

// Example attachment interface
export interface IExampleAttachment {
  id: string;
  exampleId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

// Example activity interface
export interface IExampleActivity {
  id: string;
  exampleId: string;
  activityType: ExampleActivityType;
  description: string;
  performedBy: string;
  performedByName: string;
  metadata?: Record<string, any>;
  occurredAt: string;
}

// Enums
export enum ExampleStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED'
}

export enum ExamplePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL', 
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ExampleActivityType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  ATTACHMENT_ADDED = 'ATTACHMENT_ADDED',
  ATTACHMENT_REMOVED = 'ATTACHMENT_REMOVED',
  SHARED = 'SHARED',
  UNSHARED = 'UNSHARED'
}

// Search and filter types
export interface IExampleSearchParams {
  query?: string;
  category?: string;
  status?: ExampleStatus;
  priority?: ExamplePriority;
  tags?: string[];
  isPublic?: boolean;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

// Create/Update request types
export type CreateExampleRequest = Omit<IExample, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>;
export type UpdateExampleRequest = Partial<Omit<IExample, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>>;

export type CreateExampleCategoryRequest = Omit<IExampleCategory, 'id' | 'exampleCount' | 'createdAt' | 'updatedAt'>;
export type UpdateExampleCategoryRequest = Partial<Omit<IExampleCategory, 'id' | 'exampleCount' | 'createdAt' | 'updatedAt'>>;

export type CreateExampleCommentRequest = Omit<IExampleComment, 'id' | 'authorName' | 'isEdited' | 'createdAt' | 'updatedAt'>;
export type UpdateExampleCommentRequest = Pick<IExampleComment, 'content'>;

// Statistics types
export interface IExampleStats {
  total: number;
  byStatus: Record<ExampleStatus, number>;
  byPriority: Record<ExamplePriority, number>;
  byCategory: Record<string, number>;
  totalViews: number;
  totalComments: number;
  totalAttachments: number;
  averageCommentsPerExample: number;
  mostActiveCategories: Array<{
    categoryId: string;
    categoryName: string;
    count: number;
  }>;
  recentActivity: IExampleActivity[];
}

// Batch operation types
export interface IBatchExampleOperation {
  action: 'update' | 'delete' | 'change_status' | 'add_tags' | 'remove_tags';
  exampleIds: string[];
  data?: Record<string, any>;
}

export interface IBatchExampleResult {
  successful: string[];
  failed: Array<{
    exampleId: string;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}