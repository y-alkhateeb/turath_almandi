import { cn } from '@/utils';

/**
 * Skeleton Component
 * A simple skeleton loader for showing loading states
 *
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-24" />
 * ```
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200 dark:bg-gray-700', className)}
      {...props}
    />
  );
}
