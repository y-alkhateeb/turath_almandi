/**
 * TransactionCardList Component
 * Card grid container for transaction list with pagination
 *
 * Features:
 * - Responsive card grid (1-2-3 columns based on screen size)
 * - Loading skeleton
 * - Empty state with illustration
 * - Pagination controls
 * - Smooth animations
 */

import { Card, CardContent } from '@/ui/card';
import { Button } from '@/ui/button';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';
import TransactionCard from './TransactionCard';
import type { Transaction } from '#/entity';
import type { PaginationMeta } from '#/api';

// ============================================
// TYPES
// ============================================

interface TransactionCardListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  emptyMessage?: string;
  emptyIcon?: string;
}

// ============================================
// COMPONENT
// ============================================

export default function TransactionCardList({
  transactions,
  isLoading = false,
  pagination,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  emptyMessage = 'لا توجد معاملات',
  emptyIcon = 'solar:bill-list-bold-duotone',
}: TransactionCardListProps) {
  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Amount skeleton */}
                  <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-gray-200 rounded"></div>
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                  </div>
                  {/* Category badge skeleton */}
                  <div className="h-6 w-28 bg-gray-200 rounded-full"></div>
                  {/* Details skeleton */}
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-6 relative">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
            <Icon icon={emptyIcon} className="w-16 h-16 text-gray-300" />
          </div>
          {/* Decorative circles */}
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary-100 rounded-full opacity-50"></div>
          <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-primary-100 rounded-full opacity-50"></div>
        </div>

        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          {emptyMessage}
        </h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md">
          لم يتم العثور على أي معاملات. يمكنك إضافة معاملة جديدة من خلال الأزرار أعلاه.
        </p>
      </div>
    );
  }

  // ============================================
  // CARD GRID
  // ============================================

  return (
    <div className="space-y-6">
      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
        {transactions.map((transaction) => (
          <TransactionCard
            key={transaction.id}
            transaction={transaction}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            showActions={showActions}
          />
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t">
          {/* Page Info */}
          <div className="text-sm text-[var(--text-secondary)]">
            عرض {pagination.page * pagination.limit - pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} من أصل{' '}
            {pagination.total} معاملة
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="h-9"
            >
              <Icon icon="solar:alt-arrow-right-linear" className="w-4 h-4" />
              السابق
            </Button>

            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {generatePageNumbers(pagination.page, pagination.totalPages).map((pageNum, idx) =>
                pageNum === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-[var(--text-secondary)]">
                    ...
                  </span>
                ) : (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange?.(pageNum as number)}
                    className={cn(
                      'h-9 w-9 p-0',
                      pageNum === pagination.page && 'pointer-events-none'
                    )}
                  >
                    {pageNum}
                  </Button>
                )
              )}
            </div>

            {/* Mobile: Current page indicator */}
            <div className="sm:hidden px-3 py-1.5 bg-gray-100 rounded text-sm font-medium">
              {pagination.page} / {pagination.totalPages}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="h-9"
            >
              التالي
              <Icon icon="solar:alt-arrow-left-linear" className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate page numbers with ellipsis for pagination
 * Example: [1, 2, 3, '...', 10] or [1, '...', 5, 6, 7, '...', 20]
 */
function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  const pages: (number | string)[] = [];
  const showPages = 5; // Number of page buttons to show

  if (totalPages <= showPages + 2) {
    // Show all pages if total is small
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage <= 3) {
      // Near the start
      for (let i = 2; i <= Math.min(showPages, totalPages - 1); i++) {
        pages.push(i);
      }
      if (totalPages > showPages) {
        pages.push('...');
      }
    } else if (currentPage >= totalPages - 2) {
      // Near the end
      pages.push('...');
      for (let i = Math.max(2, totalPages - showPages + 1); i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // In the middle
      pages.push('...');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('...');
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
  }

  return pages;
}
