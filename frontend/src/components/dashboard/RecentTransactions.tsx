import { Card } from '@/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Transaction } from '@/types/dashboard';
import { formatCurrency, formatDateShort, cn } from '@/lib/utils';
import { getCategoryLabel } from '@/constants/transactionCategories';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card className="p-6">
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">آخر العمليات</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          آخر {transactions.length} عملية مالية
        </p>
      </div>

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
              <th className="text-right text-sm font-medium text-[var(--text-primary)] pb-3">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="border-b border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
              >
                <td className="py-3 text-sm text-[var(--text-secondary)]">
                  {formatDateShort(transaction.date)}
                </td>
                <td className="py-3">
                  <Badge variant={transaction.type === 'INCOME' ? 'success' : 'danger'}>
                    {transaction.type === 'INCOME' ? 'إيراد' : 'مصروف'}
                  </Badge>
                </td>
                <td className="py-3 text-sm text-[var(--text-primary)]">{getCategoryLabel(transaction.category)}</td>
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
                <td className="py-3">
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

      {transactions.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--text-secondary)]">لا توجد عمليات حتى الآن</p>
        </div>
      )}
    </Card>
  );
}
