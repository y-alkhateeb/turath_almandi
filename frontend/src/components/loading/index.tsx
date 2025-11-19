/**
 * Loading Component
 * Spinner and loading states with variants
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/utils';

export interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'brand';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantClasses = {
  default: 'text-[var(--text-secondary)]',
  primary: 'text-primary-500',
  brand: 'text-brand-500',
};

/**
 * Loading Spinner
 *
 * @example
 * <LoadingSpinner />
 * <LoadingSpinner size="lg" variant="primary" />
 */
export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'default',
}: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin', sizeClasses[size], variantClasses[variant], className)}
    />
  );
}

/**
 * Full Page Loading
 *
 * @example
 * <PageLoading />
 * <PageLoading message="جاري التحميل..." />
 */
export function PageLoading({ message = 'جاري التحميل...' }: { message?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-primary)]">
      <LoadingSpinner size="xl" variant="primary" />
      {message && <p className="mt-4 text-lg font-medium text-[var(--text-primary)]">{message}</p>}
    </div>
  );
}

/**
 * Centered Loading (for cards/sections)
 *
 * @example
 * <CenteredLoading />
 * <CenteredLoading message="جاري تحميل البيانات..." />
 */
export function CenteredLoading({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingSpinner size="lg" variant="primary" />
      {message && <p className="mt-4 text-sm text-[var(--text-secondary)]">{message}</p>}
    </div>
  );
}

/**
 * Inline Loading (for buttons)
 *
 * @example
 * <Button disabled>
 *   <InlineLoading />
 *   جاري الحفظ...
 * </Button>
 */
export function InlineLoading({ className }: { className?: string }) {
  return <LoadingSpinner size="sm" className={cn('mr-2', className)} />;
}

/**
 * Overlay Loading (covers parent)
 *
 * @example
 * <div className="relative">
 *   <OverlayLoading />
 *   <YourContent />
 * </div>
 */
export function OverlayLoading() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--bg-secondary)]/80 backdrop-blur-sm">
      <LoadingSpinner size="lg" variant="primary" />
    </div>
  );
}

// Re-export spinner as default
export default LoadingSpinner;
