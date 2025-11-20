/**
 * DashboardRecentTransactions - Presentational Component
 * Table showing recent transactions matching main transactions page style
 *
 * Features:
 * - Full table layout matching TransactionTable design
 * - Type badge with colors (income=green, expense=red)
 * - Columns: date, type, amount, payment method, category, branch (admin only)
 * - Link to full transactions page
 * - Loading skeleton
 * - Empty state
 * - RTL support
 * - No business logic
 */

import { ArrowRight } from 'lucide-react';
import { formatDateTable, formatAmount } from '@/utils/format';
import { getCategoryLabel } from '@/constants/transactionCategories';
import { TransactionType, PaymentMethod } from '@/types/enum';
import type { Transaction } from '#/entity';
import { useAuth } from '@/hooks/useAuth';

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

const getTypeLabel = (type: TransactionType) => {
  return type === TransactionType.INCOME ? 'إيراد' : 'مصروف';
};

const getTypeColor = (type: TransactionType) => {
  return type === TransactionType.INCOME
    ? 'text-green-600 dark:text-green-400'
    : 'text-red-600 dark:text-red-400';
};

const getPaymentMethodLabel = (method: PaymentMethod | null) => {
  if (!method) return '-';
  return method === PaymentMethod.CASH ? 'نقدي' : 'ماستر کارد';
};

// ============================================
// LOADING SKELETON
// ============================================

function TableRowSkeleton({ isAdmin }: { isAdmin: boolean }) {
  return (
    <tr className="border-b border-[var(--border-color)]">
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-16 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-20 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </td>
      {isAdmin && (
        <td className="px-6 py-4">
          <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </td>
      )}
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
  const { isAdmin } = useAuth();

  return (
    <div
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-sm overflow-hidden"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
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
          <thead className="bg-[var(--bg-tertiary)] border-b border-[var(--border-color)]">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                التاريخ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                النوع
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
            </tr>
          </thead>
          <tbody className="bg-[var(--bg-secondary)] divide-y divide-[var(--border-color)]">
            {/* Loading State */}
            {isLoading && (
              <>
                <TableRowSkeleton isAdmin={isAdmin} />
                <TableRowSkeleton isAdmin={isAdmin} />
                <TableRowSkeleton isAdmin={isAdmin} />
                <TableRowSkeleton isAdmin={isAdmin} />
                <TableRowSkeleton isAdmin={isAdmin} />
              </>
            )}

            {/* Empty State */}
            {!isLoading && transactions.length === 0 && (
              <tr>
                <td
                  colSpan={isAdmin ? 6 : 5}
                  className="px-6 py-12 text-center text-[var(--text-secondary)]"
                >
                  <p className="text-sm">لا توجد عمليات حتى الآن</p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    سيتم عرض آخر العمليات المالية هنا
                  </p>
                </td>
              </tr>
            )}

            {/* Data Rows */}
            {!isLoading &&
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
                    {formatAmount(transaction.amount)} {transaction.currency}
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
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardRecentTransactions;
