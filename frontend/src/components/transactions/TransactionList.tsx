/**
 * TransactionList - Presentational Component
 * Pure UI component for displaying transactions in a table format
 *
 * This is a presentational component with no business logic.
 * All data and handlers are passed as props.
 */

import { Table, type Column } from '../ui/Table';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Transaction } from '#/entity';
import { TransactionType, PaymentMethod } from '@/types/enum';

// ============================================
// TYPES
// ============================================

export interface TransactionListProps {
  transactions: Transaction[];
  isLoading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get transaction type label in Arabic
 */
const getTypeLabel = (type: TransactionType): string => {
  const labels: Record<TransactionType, string> = {
    [TransactionType.INCOME]: 'إيراد',
    [TransactionType.EXPENSE]: 'مصروف',
  };
  return labels[type];
};

/**
 * Get payment method label in Arabic
 */
const getPaymentMethodLabel = (method: PaymentMethod | null): string => {
  if (!method) return '-';

  const labels: Record<PaymentMethod, string> = {
    CASH: 'نقدي',
    CARD: 'بطاقة',
    BANK_TRANSFER: 'تحويل بنكي',
    CHECK: 'شيك',
    OTHER: 'أخرى',
  };
  return labels[method] || method;
};

/**
 * Get category label in Arabic
 */
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    SALE: 'بيع',
    PURCHASE: 'شراء',
    EXPENSE: 'مصروف',
    SALARY: 'راتب',
    DEBT_PAYMENT: 'دفع دين',
    OTHER: 'أخرى',
  };
  return labels[category] || category;
};

/**
 * Get type color classes
 */
const getTypeColorClass = (type: TransactionType): string => {
  return type === TransactionType.INCOME
    ? 'text-green-600 font-semibold'
    : 'text-red-600 font-semibold';
};

/**
 * Get amount display with color
 */
const formatAmountWithColor = (amount: number, type: TransactionType): React.ReactNode => {
  const colorClass = getTypeColorClass(type);
  const formattedAmount = formatCurrency(amount);

  return <span className={colorClass}>{formattedAmount}</span>;
};

// ============================================
// COMPONENT
// ============================================

export function TransactionList({
  transactions,
  isLoading,
  onEdit,
  onDelete,
}: TransactionListProps) {
  // Define table columns
  const columns: Column<Transaction>[] = [
    {
      key: 'date',
      header: 'التاريخ',
      width: '140px',
      render: (transaction) => formatDate(transaction.date),
    },
    {
      key: 'type',
      header: 'النوع',
      width: '100px',
      render: (transaction) => (
        <span className={getTypeColorClass(transaction.type)}>
          {getTypeLabel(transaction.type)}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'الفئة',
      width: '120px',
      render: (transaction) => getCategoryLabel(transaction.category),
    },
    {
      key: 'amount',
      header: 'المبلغ',
      width: '140px',
      align: 'right',
      render: (transaction) => formatAmountWithColor(transaction.amount, transaction.type),
    },
    {
      key: 'paymentMethod',
      header: 'طريقة الدفع',
      width: '120px',
      render: (transaction) => getPaymentMethodLabel(transaction.paymentMethod),
    },
    {
      key: 'branch',
      header: 'الفرع',
      width: '120px',
      render: (transaction) => transaction.branch?.name || '-',
    },
    {
      key: 'employeeVendorName',
      header: 'الاسم',
      width: '150px',
      render: (transaction) => transaction.employeeVendorName || '-',
    },
    {
      key: 'notes',
      header: 'ملاحظات',
      render: (transaction) => transaction.notes || '-',
    },
  ];

  // Add actions column if handlers are provided
  if (onEdit || onDelete) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      width: '120px',
      align: 'center',
      render: (transaction) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(transaction.id);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="تعديل"
            >
              تعديل
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(transaction.id);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="حذف"
            >
              حذف
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="w-full" dir="rtl">
      <Table<Transaction>
        data={transactions}
        columns={columns}
        keyExtractor={(transaction) => transaction.id}
        isLoading={isLoading}
        emptyMessage="لا توجد عمليات مالية"
        striped
        hoverable
      />
    </div>
  );
}

export default TransactionList;
