/**
 * API type definitions
 * Request/Response types for API communication
 */

import type { ResultStatus } from './enum';

// Generic API response wrapper
export interface Result<T = any> {
  status: ResultStatus;
  message: string;
  data: T;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
}

// Sort parameters
export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Filter base
export interface FilterParams extends PaginationParams, SortParams {
  search?: string;
}

// API Error
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Form submission states
export interface FormState<T = any> {
  isSubmitting: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: string;
  data?: T;
}
