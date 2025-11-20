/**
 * DashboardRecentTransactions - Presentational Component
 * Compact table showing recent transactions
 *
 * Features:
 * - Table showing last 5-10 transactions
 * - Type badge (income=green, expense=red)
 * - Link to full transactions page
 * - Loading skeleton
 * - Empty state
 * - RTL support
 * - No business logic
 */

import { ArrowRight } from 'lucide-react';
import { formatCurrency, formatDateShort } from '@/utils/format';
import { getCategoryLabel } from '@/constants/transactionCategories';
import { TransactionType } from '@/types/enum';
import type { Transaction } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface DashboardRecentTransactionsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get type badge styling
 */
const getTypeBadge = (type: TransactionType): React.ReactNode => {
  const isIncome = type === TransactionType.INCOME;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isIncome
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-red-100 text-red-800 border border-red-300'
      }`}
    >
      {isIncome ? 'إيراد' : 'مصروف'}
    </span>
  );
};

/**
 * Get amount color class
 */
const getAmountColorClass = (type: TransactionType): string => {
  return type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600';
};

// ============================================
// LOADING SKELETON
// ============================================

function TableRowSkeleton() {
  return (
    <tr className="border-b border-[var(--border-color)]">
      <td className="py-3">
        <div className="h-4 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="py-3">
        <div className="h-6 w-16 bg-[var(--bg-tertiary)] rounded-full animate-pulse" />
      </td>
      <td className="py-3">
        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="py-3">
        <div className="h-4 w-28 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
    </tr>
  );
}

// ============================================
// COMPONENT
// ============================================

export function DashboardRecentTransactions({
  transactions,
  isLoading,
}: DashboardRecentTransactionsProps) {
  return (
    <div
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-5 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">آخر العمليات</h3>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            آخر {isLoading ? '...' : transactions.length} عملية مالية
          </p>
        </div>

        {/* Link to full transactions page */}
        {!isLoading && transactions.length > 0 && (
          <a
            href="/transactions"
            className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors group"
          >
            <span>عرض الكل</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-color)]">
              <th className="text-right text-sm font-medium text-[var(--text-primary)] pb-3">
                التاريخ
              </th>
              <th className="text-right text-sm font-medium text-[var(--text-primary)] pb-3">
                النوع
              </th>
              <th className="text-right text-sm font-medium text-[var(--text-primary)] pb-3">
                الفئة
              </th>
              <th className="text-right text-sm font-medium text-[var(--text-primary)] pb-3">
                المبلغ
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
              transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
                >
                  <td className="py-3 text-sm text-[var(--text-secondary)]">
                    {formatDateShort(transaction.date)}
                  </td>
                  <td className="py-3">{getTypeBadge(transaction.type)}</td>
                  <td className="py-3 text-sm text-[var(--text-primary)]">
                    {getCategoryLabel(transaction.category)}
                  </td>
                  <td className="py-3">
                    <span
                      className={`text-sm font-semibold ${getAmountColorClass(transaction.type)}`}
                    >
                      {transaction.type === TransactionType.INCOME ? '+ ' : '- '}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {!isLoading && transactions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-secondary)]">لا توجد عمليات حتى الآن</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            سيتم عرض آخر العمليات المالية هنا
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardRecentTransactions;
