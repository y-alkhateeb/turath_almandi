/**
 * Integration Test Utilities
 * Provides utilities for end-to-end integration testing with mocked APIs
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Create a fresh QueryClient for each test
 * Disables retries and caching for predictable tests
 */
export const createIntegrationTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  });
};

/**
 * Render component with all required providers for integration tests
 * Includes QueryClient, Router, and any other global providers
 */
export function renderIntegration(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & {
    queryClient?: QueryClient;
    initialRoute?: string;
  },
) {
  const queryClient = options?.queryClient || createIntegrationTestQueryClient();

  // Set initial route if provided
  if (options?.initialRoute) {
    window.history.pushState({}, 'Test page', options.initialRoute);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { ...options, wrapper: Wrapper }),
    queryClient,
  };
}

/**
 * Mock localStorage for auth token storage
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    get store() {
      return { ...store };
    },
  };
};

/**
 * Wait for API calls to complete and component to update
 * Useful after triggering mutations or queries
 */
export const waitForLoadingToFinish = async () => {
  // Wait for React Query and React to settle
  await new Promise((resolve) => setTimeout(resolve, 0));
};

/**
 * Mock successful API response
 */
export const mockApiSuccess = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Mock API error response
 */
export const mockApiError = (statusCode: number, message: string, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error(message) as any;
      error.statusCode = statusCode;
      error.response = { status: statusCode };
      reject(error);
    }, delay);
  });
};

/**
 * Create mock user data
 */
export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  username: 'testuser',
  role: 'ADMIN' as const,
  email: 'test@example.com',
  isActive: true,
  branchId: null,
  createdAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock transaction data
 */
export const createMockTransaction = (overrides = {}) => ({
  id: 'txn-1',
  type: 'INCOME' as const,
  amount: 1000,
  currency: 'IQD' as const,
  paymentMethod: 'CASH' as const,
  category: 'SALE',
  date: new Date().toISOString(),
  branchId: 'branch-1',
  createdBy: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock debt data
 */
export const createMockDebt = (overrides = {}) => ({
  id: 'debt-1',
  creditorName: 'John Doe',
  originalAmount: 5000,
  remainingAmount: 3000,
  date: new Date().toISOString(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  status: 'PARTIAL' as const,
  notes: null,
  branchId: 'branch-1',
  createdBy: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/**
 * Create mock branch data
 */
export const createMockBranch = (overrides = {}) => ({
  id: 'branch-1',
  name: 'Main Branch',
  location: 'Baghdad',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
