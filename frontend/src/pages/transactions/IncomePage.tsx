import { useNavigate } from 'react-router-dom';
import { useTransactions } from '../../hooks/useTransactions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import { TransactionType } from '../../types/transactions.types';

/**
 * Income Page - Example usage of IncomeForm
 *
 * Features:
 * - List of income transactions
 * - Add income button with modal
 * - Integration with useTransactions hook
 * - Loading and empty states
 */
export const IncomePage = () => {
  const navigate = useNavigate();
  const { data: transactions, isLoading, error } = useTransactions({
    type: TransactionType.INCOME,
  });

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return '-';
    return method === 'CASH' ? 'نقدي' : 'ماستر كارد';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">الإيرادات</h1>
            <p className="mt-2 text-[var(--text-secondary)]">إدارة جميع الإيرادات والدخل</p>
          </div>
          <button
            onClick={() => navigate('/income/create')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            إضافة إيراد
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="جاري التحميل..." />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="danger" title="خطأ">
          حدث خطأ أثناء تحميل البيانات
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && transactions && transactions.length === 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow p-12">
          <EmptyState
            icon={
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="لا توجد إيرادات"
            description="ابدأ بإضافة أول إيراد"
            action={{
              label: 'إضافة إيراد جديد',
              onClick: () => navigate('/income/create'),
            }}
          />
        </div>
      )}

      {/* Transactions Table */}
      {!isLoading && !error && transactions && transactions.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-tertiary)] border-b">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  الفئة
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  الفرع
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wider">
                  ملاحظات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {new Date(transaction.date).toLocaleDateString('ar-IQ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600" dir="ltr">
                    {transaction.amount.toLocaleString('ar-IQ')} {transaction.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        transaction.paymentMethod === 'CASH'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {formatPaymentMethod(transaction.paymentMethod)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {transaction.category || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    {transaction.branch?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)] max-w-xs truncate">
                    {transaction.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Card */}
      {!isLoading && !error && transactions && transactions.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-green-50 to-green-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">إجمالي الإيرادات</p>
              <p className="text-3xl font-bold text-green-900 mt-2" dir="ltr">
                {transactions
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('ar-IQ')}{' '}
                IQD
              </p>
            </div>
            <div className="bg-green-200 p-4 rounded-full">
              <svg
                className="w-8 h-8 text-green-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncomePage;
