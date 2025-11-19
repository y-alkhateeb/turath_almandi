/**
 * DashboardRecentTransactions - Presentational Component
 *
 * Table displaying the most recent transactions.
 * Pure component with no business logic.
 */

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { cn } from '@/utils';
import { formatCurrency, formatDateShort } from '@/utils/formatters';
import type { DashboardStats } from '#/entity';

export interface DashboardRecentTransactionsProps {
  /** Recent transactions data */
  transactions: DashboardStats['recentTransactions'];
  /** Optional: Max number to display (default: 5) */
  maxItems?: number;
}

export function DashboardRecentTransactions({
  transactions,
  maxItems = 5,
}: DashboardRecentTransactionsProps) {
  // Empty state
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>آخر العمليات</CardTitle>
          <CardDescription>أحدث {maxItems} عمليات مالية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-[var(--text-secondary)]">لا توجد عمليات حتى الآن</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedTransactions = transactions.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>آخر العمليات</CardTitle>
        <CardDescription>أحدث {displayedTransactions.length} عمليات مالية</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full" dir="rtl">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-right text-sm font-medium text-[var(--text-primary)] pb-3 pr-2">
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
                <th className="text-right text-sm font-medium text-[var(--text-primary)] pb-3 pl-2">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedTransactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
                >
                  <td className="py-3 text-sm text-[var(--text-secondary)] pr-2">
                    {formatDateShort(transaction.date)}
                  </td>
                  <td className="py-3">
                    <Badge variant={transaction.type === 'INCOME' ? 'success' : 'destructive'}>
                      {transaction.type === 'INCOME' ? 'إيراد' : 'مصروف'}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-[var(--text-primary)]">
                    {transaction.category}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                      )}
                    >
                      {transaction.type === 'INCOME' ? '+ ' : '- '}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-[var(--text-secondary)]">مكتمل</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
