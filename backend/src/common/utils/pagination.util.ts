/**
 * Pagination Utility
 *
 * Centralized pagination parsing with validation and defaults.
 * Used across all controllers that support pagination.
 */

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationDefaults {
  page: number;
  limit: number;
  maxLimit: number;
}

const DEFAULT_PAGINATION: PaginationDefaults = {
  page: 1,
  limit: 20,
  maxLimit: 100,
};

/**
 * Parse and validate pagination parameters from query strings.
 *
 * @param page - Page number string from query
 * @param limit - Limit string from query
 * @param defaults - Optional custom defaults
 * @returns Validated PaginationParams object
 *
 * @example
 * // Basic usage
 * const { page, limit } = parsePagination(query.page, query.limit);
 *
 * // With custom defaults
 * const { page, limit } = parsePagination(query.page, query.limit, { page: 1, limit: 50, maxLimit: 200 });
 */
export const parsePagination = (
  page?: string,
  limit?: string,
  defaults: PaginationDefaults = DEFAULT_PAGINATION,
): PaginationParams => ({
  page: Math.max(1, parseInt(page || String(defaults.page), 10) || defaults.page),
  limit: Math.min(
    defaults.maxLimit,
    Math.max(1, parseInt(limit || String(defaults.limit), 10) || defaults.limit),
  ),
});

/**
 * Calculate skip value for Prisma pagination.
 *
 * @param page - Current page number
 * @param limit - Items per page
 * @returns Skip value for Prisma query
 */
export const calculateSkip = (page: number, limit: number): number => {
  return (page - 1) * limit;
};

/**
 * Calculate total pages from total count and limit.
 *
 * @param total - Total number of items
 * @param limit - Items per page
 * @returns Total number of pages
 */
export const calculateTotalPages = (total: number, limit: number): number => {
  return Math.ceil(total / limit);
};

/**
 * Build pagination meta object for API response.
 *
 * @param total - Total number of items
 * @param page - Current page
 * @param limit - Items per page
 * @returns Pagination meta object
 */
export const buildPaginationMeta = (
  total: number,
  page: number,
  limit: number,
): { total: number; page: number; limit: number; totalPages: number } => ({
  total,
  page,
  limit,
  totalPages: calculateTotalPages(total, limit),
});
