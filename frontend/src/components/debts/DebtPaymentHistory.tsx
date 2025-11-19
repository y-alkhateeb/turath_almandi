/**
 * DebtPaymentHistory - Presentational Component
 * Table displaying payment history for a debt
 *
 * Features:
 * - Payment table: paymentDate, amount, notes, recordedBy
 * - Sorted by date descending (newest first)
 * - Shows total paid amount
 * - Empty state if no payments
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Table, type Column } from '../ui/Table';
import { formatCurrency, formatDate } from '@/utils/format';
import type { DebtPayment } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface DebtPaymentHistoryProps {
  payments: DebtPayment[];
  isLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function DebtPaymentHistory({ payments, isLoading }: DebtPaymentHistoryProps) {
  // Sort payments by date descending (newest first)
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  );

  // Calculate total paid
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  // Define table columns
  const columns: Column<DebtPayment>[] = [
    {
      key: 'paymentDate',
      header: 'تاريخ الدفع',
      width: '150px',
      render: (payment) => <span className="font-medium">{formatDate(payment.paymentDate)}</span>,
    },
    {
      key: 'amountPaid',
      header: 'المبلغ المدفوع',
      width: '150px',
      align: 'right',
      render: (payment) => (
        <span className="font-semibold text-green-600">{formatCurrency(payment.amountPaid)}</span>
      ),
    },
    {
      key: 'notes',
      header: 'ملاحظات',
      render: (payment) => payment.notes || '-',
    },
    {
      key: 'recordedBy',
      header: 'سجلت بواسطة',
      width: '150px',
      render: (payment) => (
        <span className="text-sm text-[var(--text-secondary)]">
          {payment.recorder?.username || payment.recordedBy}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Total Paid Summary */}
      {!isLoading && payments.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-800">إجمالي المبالغ المدفوعة:</span>
            <span className="text-lg font-bold text-green-900">{formatCurrency(totalPaid)}</span>
          </div>
          <p className="text-xs text-green-700 mt-1">عدد الدفعات: {payments.length}</p>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-[var(--bg-secondary)] rounded-lg shadow-sm border border-[var(--border-color)] overflow-hidden">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">سجل الدفعات</h3>
        </div>

        <Table<DebtPayment>
          data={sortedPayments}
          columns={columns}
          keyExtractor={(payment) => payment.id}
          isLoading={isLoading}
          emptyMessage="لا توجد دفعات مسجلة"
          striped
          hoverable={false}
        />
      </div>
    </div>
  );
}

export default DebtPaymentHistory;
