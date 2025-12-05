/**
 * API Response Type Definitions
 *
 * Strict types for all API responses from the backend.
 * These types match the backend NestJS response structures exactly.
 *
 * IMPORTANT:
 * - No `any` types
 * - No `unknown` without proper type guards
 * - All nullable fields use `| null` to match backend
 */

import type {
  UserRole,
  TransactionType,
  PaymentMethod,
  DebtStatus,
  InventoryUnit,
} from './enum';

// ============================================
// GENERIC API RESPONSE TYPES
// ============================================

/**
 * Generic API response wrapper
 * Used for single entity responses
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * Pagination metadata
 * Matches backend pagination structure from services
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated API response
 * Used for list endpoints with pagination
 * Matches backend return structure: { data: T[], meta: PaginationMeta }
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * NestJS HTTP Exception response structure
 * Matches NestJS default error format
 */
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
}

/**
 * Validation error detail
 * Used when backend returns field-specific validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
  constraints?: Record<string, string>;
}

// ============================================
// AUTH & USER RESPONSES
// ============================================

/**
 * Login response
 * Matches backend LoginResponseDto exactly
 */
export interface LoginResponse {
  user: {
    id: string;
    username: string;
    role: string;
    branchId: string | null;
  };
  access_token: string;
  refresh_token: string;
}

/**
 * Token refresh response
 */
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * User profile response
 * Matches backend auth.controller.getProfile exactly
 */
export interface UserProfileResponse {
  id: string;
  username: string;
  role: UserRole;
  branchId: string | null;
}

// ============================================
// HEALTH CHECK RESPONSE
// ============================================

/**
 * Health check response
 * Matches backend AppController healthCheck endpoint
 */
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  service: string;
  uptime: {
    ms: number;
    seconds: number;
    formatted: string;
  };
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    external: string;
  };
  database: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    latency: string;
  };
}

// ============================================
// QUERY FILTER TYPES
// ============================================

/**
 * Transaction query filters
 * Matches backend QueryTransactionsDto
 */
export interface TransactionQueryFilters {
  type?: TransactionType;
  category?: string;
  paymentMethod?: PaymentMethod;
  branchId?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  search?: string;
  page?: string;
  limit?: string;
}

/**
 * Debt query filters
 * Matches backend debt service filters
 */
export interface DebtQueryFilters {
  status?: DebtStatus;
  branchId?: string;
  startDate?: string; // ISO date string (for dueDate range)
  endDate?: string; // ISO date string (for dueDate range)
  page?: number;
  limit?: number;
}

/**
 * Inventory query filters
 * Matches backend QueryInventoryDto
 */
export interface InventoryQueryFilters {
  unit?: InventoryUnit;
  branchId?: string;
  search?: string;
}

/**
 * Branch query filters
 */
export interface BranchQueryFilters {
  branchId?: string;
  includeInactive?: boolean;
  search?: string;
}

/**
 * Notification query filters
 * Matches backend notification controller query params
 */
export interface NotificationQueryFilters {
  branchId?: string;
  isRead?: 'true' | 'false';
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: string;
  limit?: string;
}

/**
 * Audit log query filters
 * Matches backend QueryAuditLogsDto
 */
export interface AuditLogQueryFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * User query filters
 */
export interface UserQueryFilters {
  role?: UserRole;
  branchId?: string;
  isActive?: boolean;
  search?: string;
}

import type { ContactType } from './enum';

/**
 * Contact query filters
 */
export interface ContactQueryFilters {
  type?: ContactType;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// DASHBOARD & STATISTICS RESPONSES
// ============================================

/**
 * Dashboard summary response
 */
export interface DashboardSummaryResponse {
  date: string;
  branchId: string | null;
  income_cash: number;
  income_master: number;
  total_income: number;
  total_expense: number;
  net: number;
}

/**
 * Transaction statistics/summary response
 * Matches backend transactions.service.ts getSummary() return type
 */
export interface TransactionStatsResponse {
  date: string;
  branchId: string | null;
  income_cash: number;
  income_master: number;
  total_income: number;
  total_expense: number;
  net: number;
}

/**
 * Debt summary response
 */
export interface DebtSummaryResponse {
  totalDebts: number;
  activeDebts: number;
  paidDebts: number;
  partialDebts: number;
  totalOwed: number;
  overdueDebts: number;
}

/**
 * Inventory summary response
 */
export interface InventorySummaryResponse {
  totalItems: number;
  totalValue: number;
  byUnit?: Record<
    string,
    {
      count: number;
      totalQuantity: number;
      totalValue: number;
    }
  >;
  lowStockItems?: number;
}

/**
 * Dashboard statistics response
 * Matches backend DashboardStatsDto
 */
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  todayTransactions: number;
  cashRevenue?: number;
  masterRevenue?: number;
  totalDebts?: number;
  activeDebts?: number;
  inventoryValue?: number;
}

/**
 * Dashboard query filters
 */
export interface DashboardQueryFilters {
  branchId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============================================
// BATCH OPERATION RESPONSES
// ============================================

/**
 * Batch operation result
 * Used when performing bulk operations
 */
export interface BatchOperationResult<T> {
  success: T[];
  failed: Array<{
    item: T;
    error: string;
  }>;
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Bulk delete response
 */
export interface BulkDeleteResponse {
  deletedCount: number;
  deletedIds: string[];
  errors?: Array<{
    id: string;
    error: string;
  }>;
}

// ============================================
// EXPORT RESPONSES
// ============================================

/**
 * Export response (for Excel, PDF, CSV)
 */
export interface ExportResponse {
  url?: string;
  buffer?: ArrayBuffer;
  filename: string;
  contentType: string;
  size?: number;
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard for error responses
 */
export function isErrorResponse(response: unknown): response is ErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'statusCode' in response &&
    'message' in response &&
    'error' in response &&
    typeof (response as ErrorResponse).statusCode === 'number' &&
    (typeof (response as ErrorResponse).message === 'string' ||
      Array.isArray((response as ErrorResponse).message))
  );
}

/**
 * Type guard for paginated responses
 */
export function isPaginatedResponse<T>(response: unknown): response is PaginatedResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'data' in response &&
    'meta' in response &&
    Array.isArray((response as PaginatedResponse<T>).data) &&
    typeof (response as PaginatedResponse<T>).meta === 'object' &&
    (response as PaginatedResponse<T>).meta !== null &&
    'page' in (response as PaginatedResponse<T>).meta &&
    'limit' in (response as PaginatedResponse<T>).meta &&
    'total' in (response as PaginatedResponse<T>).meta &&
    'totalPages' in (response as PaginatedResponse<T>).meta
  );
}

/**
 * Type guard for API responses
 */
export function isApiResponse<T>(response: unknown): response is ApiResponse<T> {
  return typeof response === 'object' && response !== null && 'data' in response;
}

/**
 * Type guard for validation errors
 */
export function isValidationError(error: unknown): error is ErrorResponse & {
  message: string[];
} {
  return isErrorResponse(error) && Array.isArray(error.message) && error.statusCode === 400;
}
