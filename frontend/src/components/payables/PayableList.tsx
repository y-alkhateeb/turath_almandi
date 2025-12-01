/**
 * PayableList - Presentational Component
 * Table displaying payables with status badges and payment actions
 *
 * Features:
 * - Table with supplier, amounts, dates, status, branch, actions
 * - Status badge with color coding (active=yellow, partial=blue, paid=green)
 * - Overdue indicator (red) for active payables past due date
 * - Payment button for active/partial payables
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Calendar, AlertCircle } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { formatDate } from '@/utils/format';
import { CurrencyAmountCompact } from '@/components/currency';
import { PayableStatus } from '@/types/enum';
import type { AccountPayable } from '@/types/payables.types';

// ============================================
// TYPES
// ============================================

export interface PayableListProps {
  payables: AccountPayable[];
  isLoading: boolean;
  onPay?: (id: string) => void;
  onView?: (id: string) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status badge styling
 */
const getStatusBadge = (status: PayableStatus): React.ReactNode => {
  const badgeClasses: Record<PayableStatus, string> = {
    [PayableStatus.ACTIVE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [PayableStatus.PARTIAL]: 'bg-blue-100 text-blue-800 border-blue-300',
    [PayableStatus.PAID]: 'bg-green-100 text-green-800 border-green-300',
  };

  const badgeLabels: Record<PayableStatus, string> = {
    [PayableStatus.ACTIVE]: 'نشط',
    [PayableStatus.PARTIAL]: 'دفع جزئي',
    [PayableStatus.PAID]: 'مدفوع',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClasses[status]}`}
    >
      {badgeLabels[status]}
    </span>
  );
};

/**
 * Check if payable is overdue
 */
const isOverdue = (payable: AccountPayable): boolean => {
  if (!payable.dueDate) return false;
  if (payable.status === PayableStatus.PAID) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(payable.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

/**
 * Get overdue indicator
 */
const getOverdueIndicator = (payable: AccountPayable): React.ReactNode => {
  if (!isOverdue(payable)) return null;

  return (
    <div className="flex items-center gap-1 text-red-600 text-xs font-semibold">
      <AlertCircle className="w-4 h-4" />
      <span>متأخر</span>
    </div>
  );
};

/**
 * Calculate days overdue
 */
const getDaysOverdue = (dueDate: string | undefined): number => {
  if (!dueDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
};

// ============================================
// COMPONENT
// ============================================

export function PayableList({ payables, isLoading, onPay, onView }: PayableListProps) {
  // Define table columns
  const columns: Column<AccountPayable>[] = [
    {
      key: 'contact',
      header: 'اسم المورد',
      width: '180px',
      render: (payable) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">
            {payable.contact?.name || '-'}
          </div>
          {isOverdue(payable) && getOverdueIndicator(payable)}
        </div>
      ),
    },
    {
      key: 'invoiceNumber',
      header: 'رقم الفاتورة',
      width: '120px',
      render: (payable) => payable.invoiceNumber || '-',
    },
    {
      key: 'originalAmount',
      header: 'المبلغ الأصلي',
      width: '140px',
      align: 'right',
      render: (payable) => (
        <span className="font-semibold">
          <CurrencyAmountCompact amount={payable.originalAmount} />
        </span>
      ),
    },
    {
      key: 'remainingAmount',
      header: 'المبلغ المتبقي',
      width: '140px',
      align: 'right',
      render: (payable) => (
        <CurrencyAmountCompact
          amount={payable.remainingAmount}
          className={`font-semibold ${
            payable.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
          }`}
        />
      ),
    },
    {
      key: 'date',
      header: 'تاريخ الفاتورة',
      width: '130px',
      render: (payable) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
          {formatDate(payable.date)}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'تاريخ الاستحقاق',
      width: '150px',
      render: (payable) => {
        if (!payable.dueDate) return '-';

        const overdueClass = isOverdue(payable) ? 'text-red-600 font-semibold' : '';
        const daysOverdue = getDaysOverdue(payable.dueDate);

        return (
          <div>
            <div className={`flex items-center gap-1 text-sm ${overdueClass}`}>
              <Calendar className="w-4 h-4" />
              {formatDate(payable.dueDate)}
            </div>
            {daysOverdue > 0 && (
              <div className="text-xs text-red-600 mt-1">متأخر {daysOverdue} يوم</div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'الحالة',
      width: '110px',
      align: 'center',
      render: (payable) => getStatusBadge(payable.status),
    },
    {
      key: 'branch',
      header: 'الفرع',
      width: '120px',
      render: (payable) => payable.branch?.name || '-',
    },
  ];

  // Add actions column if handlers provided
  if (onPay || onView) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      width: '150px',
      align: 'center',
      render: (payable) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(payable.id);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="عرض التفاصيل"
            >
              عرض
            </button>
          )}
          {onPay &&
            (payable.status === PayableStatus.ACTIVE || payable.status === PayableStatus.PARTIAL) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPay(payable.id);
                }}
                className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors font-semibold"
                title="دفع"
              >
                دفع
              </button>
            )}
        </div>
      ),
    });
  }

  return (
    <div className="w-full" dir="rtl">
      <Table<AccountPayable>
        data={payables}
        columns={columns}
        keyExtractor={(payable) => payable.id}
        isLoading={isLoading}
        emptyMessage="لا توجد حسابات دائنة"
        striped
        hoverable
      />
    </div>
  );
}

export default PayableList;
