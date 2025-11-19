/**
 * API Client Mock Utilities
 * Provides helper functions for mocking apiClient in tests
 */

import { vi } from 'vitest';
import type { AxiosRequestConfig } from 'axios';

/**
 * Create a mock apiClient with all methods
 */
export const createMockApiClient = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  request: vi.fn(),
});

/**
 * Mock successful response
 */
export const mockSuccess = <T>(data: T) => Promise.resolve(data);

/**
 * Mock error response
 */
export const mockError = (statusCode: number, message: string) => {
  const error = new Error(message);
  (error as any).statusCode = statusCode;
  (error as any).error = getErrorType(statusCode);
  return Promise.reject(error);
};

/**
 * Get error type based on status code
 */
const getErrorType = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Not Found';
    case 409:
      return 'Conflict';
    case 422:
      return 'Unprocessable Entity';
    case 500:
      return 'Internal Server Error';
    default:
      return 'Error';
  }
};

/**
 * Mock apiClient module
 */
export const mockApiClient = createMockApiClient();

/**
 * Reset all mocks
 */
export const resetApiClientMocks = () => {
  Object.values(mockApiClient).forEach((mock) => {
    if (vi.isMockFunction(mock)) {
      mock.mockReset();
    }
  });
};

/**
 * Extract request config from mock call
 */
export const getRequestConfig = (
  mock: ReturnType<typeof vi.fn>,
  callIndex = 0,
): AxiosRequestConfig => {
  return mock.mock.calls[callIndex]?.[0] as AxiosRequestConfig;
};

/**
 * Verify request was made with expected config
 */
export const verifyRequest = (
  mock: ReturnType<typeof vi.fn>,
  expectedConfig: Partial<AxiosRequestConfig>,
  callIndex = 0,
) => {
  const actualConfig = getRequestConfig(mock, callIndex);

  if (expectedConfig.url) {
    expect(actualConfig.url).toBe(expectedConfig.url);
  }

  if (expectedConfig.data) {
    expect(actualConfig.data).toEqual(expectedConfig.data);
  }

  if (expectedConfig.params) {
    expect(actualConfig.params).toEqual(expectedConfig.params);
  }
};
