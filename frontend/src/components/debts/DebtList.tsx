/**
 * DebtList - Presentational Component
 * Table displaying debts with status badges and payment actions
 *
 * Features:
 * - Table with creditor, amounts, dates, status, branch, actions
 * - Status badge with color coding (active=yellow, partial=blue, paid=green)
 * - Overdue indicator (red) for active debts past due date
 * - Payment button for active/partial debts
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Calendar, AlertCircle } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { formatCurrency, formatDate } from '@/utils/format';
import { DebtStatus } from '@/types/enum';
import type { Debt } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface DebtListProps {
  debts: Debt[];
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
const getStatusBadge = (status: DebtStatus): React.ReactNode => {
  const badgeClasses: Record<DebtStatus, string> = {
    [DebtStatus.ACTIVE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [DebtStatus.PARTIAL]: 'bg-blue-100 text-blue-800 border-blue-300',
    [DebtStatus.PAID]: 'bg-green-100 text-green-800 border-green-300',
  };

  const badgeLabels: Record<DebtStatus, string> = {
    [DebtStatus.ACTIVE]: 'نشط',
    [DebtStatus.PARTIAL]: 'دفع جزئي',
    [DebtStatus.PAID]: 'مدفوع',
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
 * Check if debt is overdue
 */
const isOverdue = (debt: Debt): boolean => {
  if (!debt.dueDate) return false;
  if (debt.status === DebtStatus.PAID) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(debt.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

/**
 * Get overdue indicator
 */
const getOverdueIndicator = (debt: Debt): React.ReactNode => {
  if (!isOverdue(debt)) return null;

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
const getDaysOverdue = (dueDate: string | null): number => {
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

export function DebtList({ debts, isLoading, onPay, onView }: DebtListProps) {
  // Define table columns
  const columns: Column<Debt>[] = [
    {
      key: 'creditorName',
      header: 'اسم الدائن',
      width: '180px',
      render: (debt) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">{debt.creditorName}</div>
          {isOverdue(debt) && getOverdueIndicator(debt)}
        </div>
      ),
    },
    {
      key: 'originalAmount',
      header: 'المبلغ الأصلي',
      width: '140px',
      align: 'right',
      render: (debt) => (
        <span className="font-semibold">{formatCurrency(debt.originalAmount)}</span>
      ),
    },
    {
      key: 'remainingAmount',
      header: 'المبلغ المتبقي',
      width: '140px',
      align: 'right',
      render: (debt) => (
        <span
          className={`font-semibold ${
            debt.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {formatCurrency(debt.remainingAmount)}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'تاريخ الدين',
      width: '130px',
      render: (debt) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
          {formatDate(debt.date)}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'تاريخ الاستحقاق',
      width: '150px',
      render: (debt) => {
        if (!debt.dueDate) return '-';

        const overdueClass = isOverdue(debt) ? 'text-red-600 font-semibold' : '';
        const daysOverdue = getDaysOverdue(debt.dueDate);

        return (
          <div>
            <div className={`flex items-center gap-1 text-sm ${overdueClass}`}>
              <Calendar className="w-4 h-4" />
              {formatDate(debt.dueDate)}
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
      render: (debt) => getStatusBadge(debt.status),
    },
    {
      key: 'branch',
      header: 'الفرع',
      width: '120px',
      render: (debt) => debt.branch?.name || '-',
    },
  ];

  // Add actions column if handlers provided
  if (onPay || onView) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      width: '150px',
      align: 'center',
      render: (debt) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(debt.id);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="عرض التفاصيل"
            >
              عرض
            </button>
          )}
          {onPay && (debt.status === DebtStatus.ACTIVE || debt.status === DebtStatus.PARTIAL) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPay(debt.id);
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
      <Table<Debt>
        data={debts}
        columns={columns}
        keyExtractor={(debt) => debt.id}
        isLoading={isLoading}
        emptyMessage="لا توجد ديون"
        striped
        hoverable
      />
    </div>
  );
}

export default DebtList;
