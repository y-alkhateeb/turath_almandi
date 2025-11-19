/**
 * ChartSkeleton - Loading Skeleton Component
 * Animated skeleton for chart loading states
 *
 * Features:
 * - Line chart skeleton
 * - Pie chart skeleton
 * - Bar chart skeleton
 * - RTL support
 * - Header and legend placeholders
 */

import { Skeleton } from '../ui/Skeleton';

// ============================================
// TYPES
// ============================================

export interface ChartSkeletonProps {
  variant?: 'line' | 'pie' | 'bar';
  height?: string;
}

// ============================================
// LINE CHART SKELETON
// ============================================

function LineChartSkeleton({ height = 'h-80' }: { height: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Chart Area */}
      <div className={`${height} flex items-end justify-around gap-2 px-4`}>
        {/* Y-axis labels */}
        <div className="flex flex-col justify-between h-full py-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>

        {/* Chart lines */}
        <div className="flex-1 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-px w-full" />
            ))}
          </div>
          {/* Data points placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

// ============================================
// PIE CHART SKELETON
// ============================================

function PieChartSkeleton({ height = 'h-80' }: { height: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Chart Area */}
      <div className={`${height} flex items-center justify-center`}>
        <Skeleton className="w-64 h-64 rounded-full" />
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// BAR CHART SKELETON
// ============================================

function BarChartSkeleton({ height = 'h-80' }: { height: string }) {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      {/* Header */}
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Chart Area */}
      <div className={`${height} flex items-end justify-around gap-4 px-4`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1">
            <Skeleton className={`w-full h-${(i % 3) + 2}/5`} />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function ChartSkeleton({ variant = 'line', height = 'h-80' }: ChartSkeletonProps) {
  if (variant === 'pie') {
    return <PieChartSkeleton height={height} />;
  }

  if (variant === 'bar') {
    return <BarChartSkeleton height={height} />;
  }

  return <LineChartSkeleton height={height} />;
}

export default ChartSkeleton;
