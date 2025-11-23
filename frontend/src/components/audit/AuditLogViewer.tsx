/**
 * AuditLogViewer - Presentational Component
 * Table for viewing audit logs with expandable changes
 *
 * Features:
 * - Table: timestamp, user, action, entityType, entityId, changes, ipAddress
 * - Expandable changes column showing before/after JSON
 * - Color-coded by action (CREATE=green, UPDATE=blue, DELETE=red, VIEW=gray)
 * - Search/filter controls (entityType, userId, date range)
 * - Pagination
 * - Admin only
 * - No business logic
 */

import { useState } from 'react';
import { ChevronDown, ChevronRight, Calendar, User, Search, Filter, Globe } from 'lucide-react';
import { DateInput } from '@/components/form';
import { formatDateTime } from '@/utils/format';
import { AuditAction } from '@/types/enum';
import type { AuditLog } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface AuditLogViewerProps {
  logs: AuditLog[];
  isLoading: boolean;
  // Pagination
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  // Filters
  filters: {
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange: (filters: {
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get action badge styling
 */
const getActionBadge = (action: string): React.ReactNode => {
  const actionColors: Record<string, { bg: string; text: string; border: string }> = {
    [AuditAction.CREATE]: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-300',
    },
    [AuditAction.UPDATE]: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-300',
    },
    [AuditAction.DELETE]: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-300',
    },
    [AuditAction.VIEW]: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-300',
    },
  };

  const actionLabels: Record<string, string> = {
    [AuditAction.CREATE]: 'إنشاء',
    [AuditAction.UPDATE]: 'تحديث',
    [AuditAction.DELETE]: 'حذف',
    [AuditAction.VIEW]: 'عرض',
  };

  const colors = actionColors[action] || actionColors[AuditAction.VIEW];
  const label = actionLabels[action] || action;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {label}
    </span>
  );
};

/**
 * Get entity type label in Arabic
 */
const getEntityTypeLabel = (entityType: string): string => {
  const labels: Record<string, string> = {
    transaction: 'معاملة',
    debt: 'دين',
    inventory: 'مخزون',
    branch: 'فرع',
    user: 'مستخدم',
  };
  return labels[entityType.toLowerCase()] || entityType;
};

// ============================================
// LOADING SKELETON
// ============================================

function TableRowSkeleton() {
  return (
    <tr className="border-b border-[var(--border-color)]">
      <td className="py-3 px-4">
        <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-6 w-16 bg-[var(--bg-tertiary)] rounded-full animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="py-3 px-4">
        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
    </tr>
  );
}

// ============================================
// EXPANDABLE CHANGES COMPONENT
// ============================================

function ExpandableChanges({ changes }: { changes: Record<string, unknown> }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasChanges = Object.keys(changes).length > 0;

  if (!hasChanges) {
    return <span className="text-sm text-[var(--text-tertiary)]">-</span>;
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        {isExpanded ? 'إخفاء' : 'عرض'} التغييرات
      </button>

      {isExpanded && (
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 space-y-3">
          {Object.entries(changes).map(([field, value]) => {
            // Handle before/after structure
            if (
              typeof value === 'object' &&
              value !== null &&
              'before' in value &&
              'after' in value
            ) {
              const changeValue = value as { before: unknown; after: unknown };
              return (
                <div key={field} className="space-y-1">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{field}:</div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-[var(--text-secondary)] mb-1">قبل:</div>
                      <pre className="bg-red-50 border border-red-200 rounded p-2 overflow-x-auto text-red-900">
                        {JSON.stringify(changeValue.before, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[var(--text-secondary)] mb-1">بعد:</div>
                      <pre className="bg-green-50 border border-green-200 rounded p-2 overflow-x-auto text-green-900">
                        {JSON.stringify(changeValue.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              );
            }

            // Regular value
            return (
              <div key={field} className="space-y-1">
                <div className="text-sm font-medium text-[var(--text-primary)]">{field}:</div>
                <pre className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded p-2 overflow-x-auto text-xs text-[var(--text-primary)]">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function AuditLogViewer({
  logs,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  filters,
  onFilterChange,
}: AuditLogViewerProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
    }));
  };

  // Apply filters
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    const emptyFilters = {
      entityType: undefined,
      userId: undefined,
      startDate: undefined,
      endDate: undefined,
    };
    setLocalFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Filters */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">الفلاتر</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              نوع الكيان
            </label>
            <input
              type="text"
              value={localFilters.entityType || ''}
              onChange={(e) => handleFilterChange('entityType', e.target.value)}
              placeholder="مثال: transaction, debt"
              className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* User ID */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              معرف المستخدم
            </label>
            <input
              type="text"
              value={localFilters.userId || ''}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              placeholder="UUID"
              className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Start Date */}
          <DateInput
            label="من تاريخ"
            value={localFilters.startDate || null}
            onChange={(value) => handleFilterChange('startDate', value || '')}
            showLabel={true}
          />

          {/* End Date */}
          <DateInput
            label="إلى تاريخ"
            value={localFilters.endDate || null}
            onChange={(value) => handleFilterChange('endDate', value || '')}
            showLabel={true}
          />
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            إعادة تعيين
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            بحث
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
              <tr>
                <th className="text-right text-sm font-medium text-[var(--text-primary)] py-3 px-4">
                  التاريخ والوقت
                </th>
                <th className="text-right text-sm font-medium text-[var(--text-primary)] py-3 px-4">
                  المستخدم
                </th>
                <th className="text-center text-sm font-medium text-[var(--text-primary)] py-3 px-4">
                  الإجراء
                </th>
                <th className="text-right text-sm font-medium text-[var(--text-primary)] py-3 px-4">
                  نوع الكيان
                </th>
                <th className="text-right text-sm font-medium text-[var(--text-primary)] py-3 px-4">
                  معرف الكيان
                </th>
                <th className="text-right text-sm font-medium text-[var(--text-primary)] py-3 px-4">
                  التغييرات
                </th>
                <th className="text-right text-sm font-medium text-[var(--text-primary)] py-3 px-4">
                  عنوان IP
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Loading State */}
              {isLoading && (
                <>
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                  <TableRowSkeleton />
                </>
              )}

              {/* Data Rows */}
              {!isLoading &&
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(log.createdAt)}
                      </div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 text-sm">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-[var(--text-primary)]">
                          {log.user?.username || log.userId}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-center">{getActionBadge(log.action)}</td>

                    {/* Entity Type */}
                    <td className="py-3 px-4 text-sm text-[var(--text-primary)]">
                      {getEntityTypeLabel(log.entityType)}
                    </td>

                    {/* Entity ID */}
                    <td className="py-3 px-4 text-sm font-mono text-[var(--text-secondary)]">
                      {log.entityId.substring(0, 8)}...
                    </td>

                    {/* Changes */}
                    <td className="py-3 px-4">
                      <ExpandableChanges changes={log.changes} />
                    </td>

                    {/* IP Address */}
                    <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        {log.ipAddress || '-'}
                      </div>
                    </td>
                  </tr>
                ))}

              {/* Empty State */}
              {!isLoading && logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-sm text-[var(--text-secondary)]">لا توجد سجلات تدقيق</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && logs.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)]">
            <div className="text-sm text-[var(--text-secondary)]">
              صفحة {currentPage} من {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                السابق
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLogViewer;
