/**
 * TransactionFilters - Presentational Component
 * Filter panel for transactions with collapsible functionality
 *
 * Features:
 * - Type, category, payment method, branch, date range filters
 * - Branch selector for admins
 * - Reset filters button
 * - Collapsible panel
 * - RTL support
 * - No business logic - all handlers passed as props
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { DateInput } from '@/components/form';
import { TransactionType, PaymentMethod } from '@/types/enum';
import type { TransactionFilters as TransactionFiltersType } from '#/entity';
import type { Branch } from '#/entity';
import { useAuth } from '@/hooks/useAuth';
import { ALL_CATEGORIES } from '@/constants/transactionCategories';

// ============================================
// TYPES
// ============================================

export interface TransactionFiltersProps {
  filters: TransactionFiltersType;
  onChange: (filters: TransactionFiltersType) => void;
  branches: Branch[];
}

// ============================================
// COMPONENT
// ============================================

export function TransactionFilters({ filters, onChange, branches }: TransactionFiltersProps) {
  const { isAdmin } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleFilterChange = (key: keyof TransactionFiltersType, value: string | undefined) => {
    onChange({ ...filters, [key]: value, page: 1 }); // Reset to page 1 when filters change
  };

  const handleResetFilters = () => {
    onChange({ page: 1, limit: filters.limit }); // Keep only pagination params
  };

  // Count active filters (excluding pagination)
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value !== undefined && value !== '' && key !== 'page' && key !== 'limit'
  ).length;

  return (
    <div
      className="bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden"
      dir="rtl"
    >
      {/* Filter Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--bg-tertiary)] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-[var(--text-secondary)]" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">الفلاتر والبحث</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          type="button"
          className="p-1 hover:bg-[var(--bg-secondary)] rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
        </button>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4 border-t border-[var(--border-color)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Transaction Type Filter */}
            <div>
              <label
                htmlFor="filter-type"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                نوع العملية
              </label>
              <select
                id="filter-type"
                value={filters.type || ''}
                onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
                dir="rtl"
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">الكل</option>
                <option value={TransactionType.INCOME}>إيراد</option>
                <option value={TransactionType.EXPENSE}>مصروف</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label
                htmlFor="filter-category"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                الفئة
              </label>
              <select
                id="filter-category"
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                dir="rtl"
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">الكل</option>
                {ALL_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label
                htmlFor="filter-payment-method"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                طريقة الدفع
              </label>
              <select
                id="filter-payment-method"
                value={filters.paymentMethod || ''}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value || undefined)}
                dir="rtl"
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">الكل</option>
                <option value={PaymentMethod.CASH}>نقدي</option>
                <option value={PaymentMethod.MASTER}>ماستر كارد</option>
              </select>
            </div>

            {/* Branch Filter - Admin Only */}
            {isAdmin && branches.length > 0 && (
              <div>
                <label
                  htmlFor="filter-branch"
                  className="block text-sm font-medium text-[var(--text-primary)] mb-2"
                >
                  الفرع
                </label>
                <select
                  id="filter-branch"
                  value={filters.branchId || ''}
                  onChange={(e) => handleFilterChange('branchId', e.target.value || undefined)}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">جميع الفروع</option>
                  {branches
                    .filter((branch) => !branch.deletedAt)
                    .map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Start Date */}
            <DateInput
              label="من تاريخ"
              value={filters.startDate || null}
              onChange={(value) => handleFilterChange('startDate', value || undefined)}
              showLabel={true}
            />

            {/* End Date */}
            <DateInput
              label="إلى تاريخ"
              value={filters.endDate || null}
              onChange={(value) => handleFilterChange('endDate', value || undefined)}
              showLabel={true}
            />

            {/* Search */}
            <div>
              <label
                htmlFor="filter-search"
                className="block text-sm font-medium text-[var(--text-primary)] mb-2"
              >
                البحث
              </label>
              <input
                id="filter-search"
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                placeholder="بحث في الملاحظات..."
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={activeFilterCount === 0}
                className="w-full px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-4 h-4" />
                مسح جميع الفلاتر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionFilters;
