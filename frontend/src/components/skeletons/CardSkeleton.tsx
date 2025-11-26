/**
 * CardSkeleton - Loading Skeleton Component
 * Animated skeleton for card loading states
 *
 * Features:
 * - Configurable count
 * - Grid layout
 * - RTL support
 * - Icon, title, value, and description placeholders
 */

import { Skeleton } from '../ui/Skeleton';

// ============================================
// TYPES
// ============================================

export interface CardSkeletonProps {
  count: number;
  variant?: 'stat' | 'content' | 'simple';
}

// ============================================
// STAT CARD SKELETON
// ============================================

export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1 space-y-3">
          {/* Title */}
          <Skeleton className="h-4 w-24" />
          {/* Value */}
          <Skeleton className="h-8 w-32" />
          {/* Description */}
          <Skeleton className="h-3 w-40" />
        </div>
        {/* Icon */}
        <Skeleton className="w-14 h-14 rounded-xl" />
      </div>
    </div>
  );
}

// ============================================
// CONTENT CARD SKELETON
// ============================================

function ContentCardSkeleton() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        {/* Content */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// SIMPLE CARD SKELETON
// ============================================

function SimpleCardSkeleton() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      <div className="space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function CardSkeleton({ count, variant = 'stat' }: CardSkeletonProps) {
  const SkeletonComponent =
    variant === 'stat'
      ? StatCardSkeleton
      : variant === 'content'
        ? ContentCardSkeleton
        : SimpleCardSkeleton;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" dir="rtl">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </div>
  );
}

export default CardSkeleton;
