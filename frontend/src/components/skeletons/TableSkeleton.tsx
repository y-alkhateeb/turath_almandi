/**
 * TableSkeleton - Loading Skeleton Component
 * Animated skeleton for table loading states
 *
 * Features:
 * - Configurable rows and columns
 * - RTL support
 * - Header skeleton
 * - Striped rows option
 * - Responsive
 */

import { Skeleton } from '../ui/Skeleton';

// ============================================
// TYPES
// ============================================

export interface TableSkeletonProps {
  rows: number;
  columns: number;
  striped?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function TableSkeleton({ rows, columns, striped = true }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-x-auto" dir="rtl">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
            <tr>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <th key={colIndex} className="py-3 px-4">
                  <Skeleton className="h-4 w-full" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={`border-b border-[var(--border-color)] ${
                  striped && rowIndex % 2 === 1 ? 'bg-[var(--bg-tertiary)]' : ''
                }`}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-3 px-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableSkeleton;
