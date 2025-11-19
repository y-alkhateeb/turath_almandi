/**
 * Audit Log Page - Container Component
 * Admin-only page for viewing system audit trail
 *
 * Architecture:
 * - Business logic in useAuditLogs hook
 * - Filter state in useAuditFilters hook
 * - Presentational component (AuditLogViewer)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - Admin-only access guard (redirect accountants)
 * - Paginated audit logs with filters
 * - Filter by: entityType, entityId, userId, dateRange
 * - Pagination controls
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useEffect, useCallback } from 'react';
import { Shield, Filter as FilterIcon } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useAuth } from '@/hooks/useAuth';
import { useAuditLogs, useAuditFilters } from '@/hooks/queries/useAudit';
import { AuditLogViewer } from '@/components/audit/AuditLogViewer';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function AuditLogPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // ADMIN GUARD
  // ============================================

  /**
   * Redirect non-admin users
   * Only admins can view audit logs
   */
  useEffect(() => {
    if (!isAdmin) {
      toast.error('ليس لديك صلاحية للوصول إلى هذه الصفحة');
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // ============================================
  // FILTER STATE MANAGEMENT
  // ============================================

  /**
   * Audit log filters state
   * Manages: entityType, entityId, userId, dateRange, pagination
   */
  const {
    filters,
    setEntityType,
    setEntityId,
    setUserId,
    setDateRange,
    setPage,
    resetFilters,
  } = useAuditFilters({
    page: 1,
    limit: 50, // Show 50 logs per page
  });

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch audit logs with filters and pagination
   */
  const {
    data: auditData,
    isLoading,
    error,
    refetch,
  } = useAuditLogs(filters);

  const logs = auditData?.data || [];
  const pagination = auditData?.meta;
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 0;
  const total = pagination?.total || 0;

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
    },
    [setPage]
  );

  /**
   * Handle filter change
   * Called from AuditLogViewer component
   */
  const handleFilterChange = useCallback(
    (newFilters: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      // Update individual filters
      if (newFilters.entityType !== undefined) {
        setEntityType(newFilters.entityType || undefined);
      }
      if (newFilters.entityId !== undefined) {
        setEntityId(newFilters.entityId || undefined);
      }
      if (newFilters.userId !== undefined) {
        setUserId(newFilters.userId || undefined);
      }
      if (newFilters.startDate !== undefined || newFilters.endDate !== undefined) {
        setDateRange(
          newFilters.startDate || undefined,
          newFilters.endDate || undefined
        );
      }
    },
    [setEntityType, setEntityId, setUserId, setDateRange]
  );

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle reset filters
   */
  const handleResetFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

  // ============================================
  // EARLY RETURN - GUARD NOT MET
  // ============================================

  // Don't render anything if user is not admin
  if (!isAdmin) {
    return null;
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading && logs.length === 0) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* Filters Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
                <tr>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="py-3 px-4">
                      <div className="h-4 w-20 bg-[var(--bg-quaternary)] rounded animate-pulse" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-color)]">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">سجل التدقيق</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              عرض سجل تدقيق النظام والتغييرات
            </p>
          </div>
        </div>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================

  if (logs.length === 0 && !isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">سجل التدقيق</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              عرض سجل تدقيق النظام والتغييرات
            </p>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <FilterIcon className="w-4 h-4" />
            مسح الفلاتر
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Shield className="w-8 h-8 text-primary-600" />}
          title="لا توجد سجلات تدقيق"
          description={
            filters.entityType || filters.userId || filters.startDate
              ? 'لا توجد سجلات تدقيق تطابق الفلاتر المحددة. جرب تغيير الفلاتر أو مسحها.'
              : 'لم يتم تسجيل أي عمليات تدقيق بعد في النظام.'
          }
          action={
            filters.entityType || filters.userId || filters.startDate
              ? {
                  label: 'مسح الفلاتر',
                  onClick: handleResetFilters,
                }
              : undefined
          }
        />
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">سجل التدقيق</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            عرض سجل تدقيق النظام والتغييرات ({total} سجل)
          </p>
        </div>
        <button
          onClick={handleResetFilters}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <FilterIcon className="w-4 h-4" />
          مسح الفلاتر
        </button>
      </div>

      {/* Info Note - Admin Only */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4" dir="rtl">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">سجل التدقيق - للمدراء فقط</p>
            <p className="text-sm text-blue-700 mt-1">
              يتتبع سجل التدقيق جميع العمليات المهمة في النظام بما في ذلك إنشاء وتعديل وحذف البيانات.
              يمكنك استخدام الفلاتر أدناه لتصفية السجلات حسب نوع الكيان، المستخدم، أو التاريخ.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Log Viewer Component */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <AuditLogViewer
          logs={logs}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          filters={{
            entityType: filters.entityType,
            entityId: filters.entityId,
            userId: filters.userId,
            startDate: filters.startDate,
            endDate: filters.endDate,
          }}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* Active Filters Summary */}
      {(filters.entityType || filters.userId || filters.startDate || filters.endDate) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4" dir="rtl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FilterIcon className="w-4 h-4 text-gray-600" />
              <div className="flex flex-wrap gap-2">
                {filters.entityType && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    نوع الكيان: {filters.entityType}
                  </span>
                )}
                {filters.userId && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    معرف المستخدم: {filters.userId}
                  </span>
                )}
                {filters.startDate && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    من: {filters.startDate}
                  </span>
                )}
                {filters.endDate && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    إلى: {filters.endDate}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              مسح الكل
            </button>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-[var(--text-secondary)]" dir="rtl">
          صفحة {currentPage} من {totalPages} ({total} سجل إجمالاً)
        </div>
      )}
    </div>
  );
}
