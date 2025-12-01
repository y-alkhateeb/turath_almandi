/**
 * ReceivableList - Presentational Component
 * Table displaying receivables with status badges and collection actions
 *
 * Features:
 * - Table with customer, amounts, dates, status, branch, actions
 * - Status badge with color coding (active=yellow, partial=blue, paid=green)
 * - Overdue indicator (red) for active receivables past due date
 * - Collection button for active/partial receivables
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Calendar, AlertCircle } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { formatDate } from '@/utils/format';
import { CurrencyAmountCompact } from '@/components/currency';
import { ReceivableStatus } from '@/types/enum';
import type { AccountReceivable } from '@/types/receivables.types';

// ============================================
// TYPES
// ============================================

export interface ReceivableListProps {
  receivables: AccountReceivable[];
  isLoading: boolean;
  onCollect?: (id: string) => void;
  onView?: (id: string) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status badge styling
 */
const getStatusBadge = (status: ReceivableStatus): React.ReactNode => {
  const badgeClasses: Record<ReceivableStatus, string> = {
    [ReceivableStatus.ACTIVE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    [ReceivableStatus.PARTIAL]: 'bg-blue-100 text-blue-800 border-blue-300',
    [ReceivableStatus.PAID]: 'bg-green-100 text-green-800 border-green-300',
  };

  const badgeLabels: Record<ReceivableStatus, string> = {
    [ReceivableStatus.ACTIVE]: 'نشط',
    [ReceivableStatus.PARTIAL]: 'تحصيل جزئي',
    [ReceivableStatus.PAID]: 'محصل',
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
 * Check if receivable is overdue
 */
const isOverdue = (receivable: AccountReceivable): boolean => {
  if (!receivable.dueDate) return false;
  if (receivable.status === ReceivableStatus.PAID) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(receivable.dueDate);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

/**
 * Get overdue indicator
 */
const getOverdueIndicator = (receivable: AccountReceivable): React.ReactNode => {
  if (!isOverdue(receivable)) return null;

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

export function ReceivableList({ receivables, isLoading, onCollect, onView }: ReceivableListProps) {
  // Define table columns
  const columns: Column<AccountReceivable>[] = [
    {
      key: 'contact',
      header: 'اسم العميل',
      width: '180px',
      render: (receivable) => (
        <div>
          <div className="font-medium text-[var(--text-primary)]">
            {receivable.contact?.name || '-'}
          </div>
          {isOverdue(receivable) && getOverdueIndicator(receivable)}
        </div>
      ),
    },
    {
      key: 'invoiceNumber',
      header: 'رقم الفاتورة',
      width: '120px',
      render: (receivable) => receivable.invoiceNumber || '-',
    },
    {
      key: 'originalAmount',
      header: 'المبلغ الأصلي',
      width: '140px',
      align: 'right',
      render: (receivable) => (
        <span className="font-semibold">
          <CurrencyAmountCompact amount={receivable.originalAmount} />
        </span>
      ),
    },
    {
      key: 'remainingAmount',
      header: 'المبلغ المتبقي',
      width: '140px',
      align: 'right',
      render: (receivable) => (
        <CurrencyAmountCompact
          amount={receivable.remainingAmount}
          className={`font-semibold ${
            receivable.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'
          }`}
        />
      ),
    },
    {
      key: 'date',
      header: 'تاريخ الفاتورة',
      width: '130px',
      render: (receivable) => (
        <div className="flex items-center gap-1 text-sm">
          <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
          {formatDate(receivable.date)}
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'تاريخ الاستحقاق',
      width: '150px',
      render: (receivable) => {
        if (!receivable.dueDate) return '-';

        const overdueClass = isOverdue(receivable) ? 'text-red-600 font-semibold' : '';
        const daysOverdue = getDaysOverdue(receivable.dueDate);

        return (
          <div>
            <div className={`flex items-center gap-1 text-sm ${overdueClass}`}>
              <Calendar className="w-4 h-4" />
              {formatDate(receivable.dueDate)}
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
      render: (receivable) => getStatusBadge(receivable.status),
    },
    {
      key: 'branch',
      header: 'الفرع',
      width: '120px',
      render: (receivable) => receivable.branch?.name || '-',
    },
  ];

  // Add actions column if handlers provided
  if (onCollect || onView) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      width: '150px',
      align: 'center',
      render: (receivable) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {onView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView(receivable.id);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="عرض التفاصيل"
            >
              عرض
            </button>
          )}
          {onCollect &&
            (receivable.status === ReceivableStatus.ACTIVE ||
              receivable.status === ReceivableStatus.PARTIAL) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCollect(receivable.id);
                }}
                className="px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors font-semibold"
                title="تحصيل"
              >
                تحصيل
              </button>
            )}
        </div>
      ),
    });
  }

  return (
    <div className="w-full" dir="rtl">
      <Table<AccountReceivable>
        data={receivables}
        columns={columns}
        keyExtractor={(receivable) => receivable.id}
        isLoading={isLoading}
        emptyMessage="لا توجد حسابات مدينة"
        striped
        hoverable
      />
    </div>
  );
}

export default ReceivableList;
