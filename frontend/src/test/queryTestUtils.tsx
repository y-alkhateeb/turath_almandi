/**
 * React Query Test Utilities
 * Helper functions for testing React Query hooks
 */

import { ReactElement, ReactNode } from 'react';
import { render, renderHook, RenderHookOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Create a new QueryClient for testing
 * Disables retry, refetch, and cache time for faster tests
 */
export const createTestQueryClient = () => {
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
 * Wrapper component with QueryClientProvider
 */
export const createWrapper = (queryClient?: QueryClient) => {
  const client = queryClient || createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
};

/**
 * Render hook with QueryClient wrapper
 */
export const renderQueryHook = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'> & { queryClient?: QueryClient },
) => {
  const queryClient = options?.queryClient || createTestQueryClient();
  const wrapper = createWrapper(queryClient);

  return {
    ...renderHook(hook, { ...options, wrapper }),
    queryClient,
  };
};

/**
 * Render component with QueryClient wrapper
 */
export const renderWithQueryClient = (
  ui: ReactElement,
  options?: { queryClient?: QueryClient },
) => {
  const queryClient = options?.queryClient || createTestQueryClient();
  const wrapper = createWrapper(queryClient);

  return {
    ...render(ui, { wrapper }),
    queryClient,
  };
};

/**
 * Wait for query to be settled (loading complete)
 */
export const waitForQuery = async (queryClient: QueryClient, queryKey: unknown[]) => {
  await queryClient.getQueryCache().find({ queryKey })?.promise;
};

/**
 * Set query data in cache
 */
export const setQueryData = <T,>(queryClient: QueryClient, queryKey: unknown[], data: T) => {
  queryClient.setQueryData(queryKey, data);
};

/**
 * Get query data from cache
 */
export const getQueryData = <T,>(queryClient: QueryClient, queryKey: unknown[]) => {
  return queryClient.getQueryData<T>(queryKey);
};

/**
 * Invalidate queries
 */
export const invalidateQueries = async (queryClient: QueryClient, queryKey: unknown[]) => {
  await queryClient.invalidateQueries({ queryKey });
};

/**
 * Clear all queries
 */
export const clearQueries = (queryClient: QueryClient) => {
  queryClient.clear();
};
