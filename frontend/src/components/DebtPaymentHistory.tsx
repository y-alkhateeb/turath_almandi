import type { DebtPayment } from '../types/debts.types';

interface DebtPaymentHistoryProps {
  payments: DebtPayment[];
}

/**
 * Debt Payment History Component
 *
 * Features:
 * - Display all payment records for a debt
 * - Show payment date, amount, and notes
 * - Chronological order (newest first)
 * - Empty state when no payments
 * - Arabic interface
 */
export const DebtPaymentHistory = ({ payments }: DebtPaymentHistoryProps) => {
  // Sort payments by date (newest first)
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-[var(--text-secondary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-[var(--text-primary)]">لا توجد سجلات دفع</h3>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          لم يتم تسجيل أي دفعات لهذا الدين حتى الآن
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">سجل الدفعات</h3>

      <div className="space-y-2">
        {sortedPayments.map((payment, index) => (
          <div
            key={payment.id}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              {/* Payment Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {/* Payment Number Badge */}
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-700 text-xs font-bold">
                    {sortedPayments.length - index}
                  </span>

                  {/* Payment Amount */}
                  <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                      المبلغ المدفوع
                    </p>
                    <p className="text-lg font-bold text-green-600" dir="ltr">
                      ${payment.amountPaid.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Payment Date */}
                <div className="mr-11">
                  <p className="text-xs text-[var(--text-secondary)]">تاريخ الدفع</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {new Date(payment.paymentDate).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {/* Notes */}
                {payment.notes && (
                  <div className="mr-11 mt-2 pt-2 border-t border-[var(--border-color)]">
                    <p className="text-xs text-[var(--text-secondary)]">ملاحظات</p>
                    <p className="text-sm text-[var(--text-primary)] mt-1">{payment.notes}</p>
                  </div>
                )}

                {/* Created At */}
                <div className="mr-11 mt-2">
                  <p className="text-xs text-[var(--text-secondary)]">
                    تم التسجيل:{' '}
                    {new Date(payment.createdAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Success Icon */}
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">إجمالي الدفعات:</span>
          <span className="font-bold text-[var(--text-primary)]">{payments.length} دفعة</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-[var(--text-secondary)]">إجمالي المبلغ المدفوع:</span>
          <span className="font-bold text-green-600" dir="ltr">
            ${payments.reduce((sum, p) => sum + p.amountPaid, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DebtPaymentHistory;
