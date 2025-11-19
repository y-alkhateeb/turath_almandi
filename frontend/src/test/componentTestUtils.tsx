/**
 * Component Test Utilities
 * Helper functions for testing React components with React Query and Auth context
 */

import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

/**
 * Create a test QueryClient
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
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
 * Test wrapper with QueryClient provider
 */
interface WrapperProps {
  children: ReactNode;
  queryClient?: QueryClient;
}

export function createWrapper({ queryClient }: { queryClient?: QueryClient } = {}) {
  const client = queryClient || createTestQueryClient();

  return function Wrapper({ children }: WrapperProps) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

/**
 * Render component with QueryClient wrapper
 */
export function renderWithClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { queryClient?: QueryClient },
) {
  const queryClient = options?.queryClient || createTestQueryClient();
  const wrapper = createWrapper({ queryClient });

  return {
    ...render(ui, { ...options, wrapper }),
    queryClient,
  };
}

/**
 * Mock useAuth hook for testing
 */
export function mockUseAuth(overrides: Partial<any> = {}) {
  return {
    user: {
      id: 'user-123',
      username: 'testuser',
      role: 'ADMIN',
      isActive: true,
    },
    isAuthenticated: true,
    isAdmin: true,
    isAccountant: false,
    userBranchId: null,
    login: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  };
}
