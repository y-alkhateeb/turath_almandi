/**
 * ListSkeleton - Loading Skeleton Component
 * Animated skeleton for list loading states
 *
 * Features:
 * - Configurable item count
 * - RTL support
 * - Avatar, text, and action placeholders
 * - Multiple variants (default, compact, detailed)
 */

import { Skeleton } from '../ui/Skeleton';

// ============================================
// TYPES
// ============================================

export interface ListSkeletonProps {
  items: number;
  variant?: 'default' | 'compact' | 'detailed';
}

// ============================================
// DEFAULT LIST ITEM SKELETON
// ============================================

function DefaultListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
      {/* Avatar */}
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />

      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
      </div>

      {/* Action */}
      <Skeleton className="w-20 h-8 rounded flex-shrink-0" />
    </div>
  );
}

// ============================================
// COMPACT LIST ITEM SKELETON
// ============================================

function CompactListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
      {/* Icon */}
      <Skeleton className="w-8 h-8 rounded flex-shrink-0" />

      {/* Content */}
      <div className="flex-1">
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Badge */}
      <Skeleton className="w-16 h-6 rounded-full flex-shrink-0" />
    </div>
  );
}

// ============================================
// DETAILED LIST ITEM SKELETON
// ============================================

function DetailedListItemSkeleton() {
  return (
    <div className="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-3">
          {/* Title */}
          <Skeleton className="h-6 w-1/2" />

          {/* Description */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <Skeleton className="w-8 h-8 rounded" />
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function ListSkeleton({ items, variant = 'default' }: ListSkeletonProps) {
  const SkeletonItem =
    variant === 'compact'
      ? CompactListItemSkeleton
      : variant === 'detailed'
      ? DetailedListItemSkeleton
      : DefaultListItemSkeleton;

  return (
    <div className="space-y-3" dir="rtl">
      {Array.from({ length: items }).map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </div>
  );
}

export default ListSkeleton;
