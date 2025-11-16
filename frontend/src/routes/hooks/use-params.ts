/**
 * Params Hook
 * Get route parameters
 */

import { useParams as useReactRouterParams } from 'react-router-dom';

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useReactRouterParams<T>();
}
