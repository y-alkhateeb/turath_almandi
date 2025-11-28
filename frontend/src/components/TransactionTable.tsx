import { useState, useMemo } from 'react';
import type {
  Transaction,
  TransactionType,
  PaymentMethod,
  TransactionFilters,
  PaginationMeta,
} from '../types/transactions.types';
import { useAuth } from '../hooks/useAuth';
import { useBranches } from '../hooks/useBranches';
import {
  ALL_CATEGORIES,
  getCategoriesByType,
  getCategoryLabel,
} from '../constants/transactionCategories';
import { formatDateTable } from '../utils/format';
import { CurrencyAmountCompact } from '@/components/currency';

interface TransactionTableProps {
  transactions: Transaction[];
  pagination: PaginationMeta;
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onView: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  isLoading?: boolean;
}

export default function TransactionTable({
  transactions,
  pagination,
  filters,
  onFiltersChange,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
}: TransactionTableProps) {
  const { isAdmin } = useAuth();
  // Only fetch branches for admins (accountants don't see branch filter)
  const { data: branches = [] } = useBranches({ enabled: isAdmin });
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Get categories based on selected transaction type
  const categoryOptions = useMemo(() => {
    if (!filters.type) {
      // If no type selected, show all categories
      return ALL_CATEGORIES;
    }
    // Show only categories for selected type
    return getCategoriesByType(filters.type as TransactionType);
  }, [filters.type]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFiltersChange({ ...filters, search: searchInput, page: 1 });
  };

  const handleFilterChange = (key: keyof TransactionFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    onFiltersChange({ ...filters, page: newPage });
  };

  const getTypeLabel = (type: TransactionType) => {
    return type === 'INCOME' ? 'واردات صندوق' : 'صرفيات الصندوق';
  };

  const getTypeColor = (type: TransactionType) => {
    return type === 'INCOME'
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400';
  };

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    if (!method) return '-';
    return method === 'CASH' ? 'نقدي' : 'ماستر کارد';
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-lg shadow-sm border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold mb-4">الفلاتر والبحث</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2">
            <label className="block text-sm font-medium mb-1">البحث</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="البحث في الاسم، الفئة، أو الملاحظات..."
                className="flex-1 px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
              >
                بحث
              </button>
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    onFiltersChange({ ...filters, search: undefined, page: 1 });
                  }}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  مسح
                </button>
              )}
            </div>
          </form>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">نوع الفاتورة</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value || undefined)}
              dir="rtl"
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">الكل</option>
              <option value="INCOME">واردات صندوق</option>
              <option value="EXPENSE">صرفيات الصندوق</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">طريقة الدفع</label>
            <select
              value={filters.paymentMethod || ''}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value || undefined)}
              dir="rtl"
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">الكل</option>
              <option value="CASH">نقدي</option>
              <option value="MASTER">ماستر کارد</option>
            </select>
          </div>

          {/* Branch Filter - Admin Only */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium mb-1">الفرع</label>
              <select
                value={filters.branchId || ''}
                onChange={(e) => handleFilterChange('branchId', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                dir="rtl"
              >
                <option value="">جميع الفروع</option>
                {branches
                  .filter((b) => b.isActive)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium mb-1">من تاريخ</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>

          {/* Category Filter - Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1">الفئة</label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              dir="rtl"
            >
              <option value="">جميع الفئات</option>
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                onFiltersChange({ page: 1, limit: filters.limit });
              }}
              className="w-full px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              مسح جميع الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  نوع الفاتورة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  الفئة
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                    الفرع
                  </th>
                )}
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-color)]">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-6 py-12 text-center text-[var(--text-secondary)]"
                  >
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <span className="mr-3">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 7 : 6}
                    className="px-6 py-12 text-center text-[var(--text-secondary)]"
                  >
                    لا توجد عمليات
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {formatDateTable(transaction.date)}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTypeColor(transaction.type)}`}
                    >
                      {getTypeLabel(transaction.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)] font-semibold">
                      <CurrencyAmountCompact amount={transaction.amount} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {getPaymentMethodLabel(transaction.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      {getCategoryLabel(transaction.category)}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                        {transaction.branch?.name || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onView(transaction)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                          title="عرض التفاصيل"
                        >
                          عرض
                        </button>
                        <button
                          onClick={() => onEdit(transaction)}
                          className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 font-medium transition-colors"
                          title="تعديل"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => onDelete(transaction)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium transition-colors"
                          title="حذف"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && transactions.length > 0 && (
          <div className="px-6 py-4 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] flex items-center justify-between">
            <div className="text-sm text-[var(--text-primary)]">
              عرض {(pagination.page - 1) * pagination.limit + 1} إلى{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}{' '}
              عملية
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNumber;
                  if (pagination.totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNumber = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNumber = pagination.totalPages - 4 + i;
                  } else {
                    pageNumber = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pagination.page === pageNumber
                          ? 'bg-primary-600 text-white'
                          : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
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
