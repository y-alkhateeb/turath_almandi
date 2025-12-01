/**
 * TransactionCard Component
 * Individual transaction card for list view
 *
 * Features:
 * - Displays transaction summary (amount, category, date, payment method)
 * - Color-coded by type (income green, expense red)
 * - Category badge with icon
 * - Debt indicator if linked to debt
 * - Hover actions: view, edit, delete
 * - Responsive design
 */

import { Card, CardContent } from '@/ui/card';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Icon } from '@/components/icon';
import { cn } from '@/utils';
import type { Transaction } from '#/entity';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// ============================================
// TYPES
// ============================================

interface TransactionCardProps {
  transaction: Transaction;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

// ============================================
// CATEGORY METADATA
// ============================================

const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: string;
    color: string;
  }
> = {
  // Income categories
  INVENTORY_SALES: {
    label: 'مبيعات المخزون',
    icon: 'solar:bag-2-bold-duotone',
    color: 'text-green-600 bg-green-100',
  },
  CAPITAL_ADDITION: {
    label: 'إضافة رأس مال',
    icon: 'solar:wallet-money-bold-duotone',
    color: 'text-green-600 bg-green-100',
  },
  APP_PURCHASES: {
    label: 'مشتريات التطبيق',
    icon: 'solar:cart-large-2-bold-duotone',
    color: 'text-green-600 bg-green-100',
  },
  DEBT_PAYMENT: {
    label: 'سداد دين',
    icon: 'solar:hand-money-bold-duotone',
    color: 'text-green-600 bg-green-100',
  },

  // Expense categories
  EMPLOYEE_SALARIES: {
    label: 'رواتب الموظفين',
    icon: 'solar:users-group-rounded-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  WORKER_DAILY: {
    label: 'أجور عمال يومية',
    icon: 'solar:user-hand-up-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  SUPPLIES: {
    label: 'لوازم',
    icon: 'solar:box-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  MAINTENANCE: {
    label: 'صيانة',
    icon: 'solar:settings-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  INVENTORY: {
    label: 'مخزون',
    icon: 'solar:box-minimalistic-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  DEBT: {
    label: 'دين',
    icon: 'solar:bill-list-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  CASHIER_SHORTAGE: {
    label: 'عجز صندوق',
    icon: 'solar:danger-circle-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  RETURNS: {
    label: 'مرتجعات',
    icon: 'solar:restart-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
  OTHER_EXPENSE: {
    label: 'مصروفات أخرى',
    icon: 'solar:bill-list-bold-duotone',
    color: 'text-red-600 bg-red-100',
  },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: string }> = {
  CASH: { label: 'نقدي', icon: 'solar:wallet-bold' },
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: 'solar:card-transfer-bold' },
  CARD: { label: 'بطاقة', icon: 'solar:card-bold' },
  CHEQUE: { label: 'شيك', icon: 'solar:document-text-bold' },
};

// ============================================
// COMPONENT
// ============================================

export default function TransactionCard({
  transaction,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}: TransactionCardProps) {
  const categoryConfig = CATEGORY_CONFIG[transaction.category] || {
    label: transaction.category,
    icon: 'solar:bill-list-bold-duotone',
    color: 'text-gray-600 bg-gray-100',
  };

  const paymentConfig = PAYMENT_METHOD_CONFIG[transaction.paymentMethod] || {
    label: transaction.paymentMethod,
    icon: 'solar:wallet-bold',
  };

  const isIncome = transaction.type === 'INCOME';
  const hasDebt = !!transaction.debtId;
  const hasMultipleItems = (transaction.transactionInventoryItems?.length || 0) > 0;

  // Format date
  const formattedDate = format(new Date(transaction.date), 'dd MMM yyyy', { locale: ar });

  return (
    <Card
      className={cn(
        'group relative transition-all hover:shadow-lg border-r-4',
        isIncome ? 'border-r-green-500 hover:border-r-green-600' : 'border-r-red-500 hover:border-r-red-600'
      )}
    >
      <CardContent className="p-4">
        {/* Header: Amount & Type Badge */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={cn(
                  'text-2xl font-bold',
                  isIncome ? 'text-green-600' : 'text-red-600'
                )}
              >
                {isIncome ? '+' : '-'}
                {Number(transaction.amount).toFixed(2)}
              </h4>
              <span className="text-sm text-[var(--text-secondary)]">د.ع</span>
            </div>
            <Badge variant={isIncome ? 'success' : 'destructive'} className="text-xs">
              {isIncome ? 'وارد' : 'مصروف'}
            </Badge>
          </div>

          {/* Actions - Always visible */}
          {showActions && (
            <div className="flex items-center gap-1">
              {onView && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onView(transaction.id)}
                  className="h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="عرض"
                >
                  <Icon icon="solar:eye-bold" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </Button>
              )}
              {onEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(transaction.id)}
                  className="h-8 w-8 p-0 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  title="تعديل"
                >
                  <Icon icon="solar:pen-bold" className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </Button>
              )}
              {onDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(transaction.id)}
                  className="h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="حذف"
                >
                  <Icon icon="solar:trash-bin-minimalistic-bold" className="w-4 h-4 text-red-600 dark:text-red-400" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Category Badge */}
        <div className="mb-3">
          <Badge variant="outline" className={cn('text-xs', categoryConfig.color)}>
            <Icon icon={categoryConfig.icon} className="w-3.5 h-3.5 ml-1" />
            {categoryConfig.label}
          </Badge>
        </div>

        {/* Transaction Details */}
        <div className="space-y-2 text-sm">
          {/* Date */}
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Icon icon="solar:calendar-linear" className="w-4 h-4" />
            <span>{formattedDate}</span>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Icon icon={paymentConfig.icon} className="w-4 h-4" />
            <span>{paymentConfig.label}</span>
          </div>

          {/* Branch */}
          {transaction.branch && (
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Icon icon="solar:shop-2-linear" className="w-4 h-4" />
              <span>{transaction.branch.branchName}</span>
            </div>
          )}

          {/* Multi-item indicator */}
          {hasMultipleItems && (
            <div className="flex items-center gap-2 text-blue-600">
              <Icon icon="solar:layers-minimalistic-bold-duotone" className="w-4 h-4" />
              <span className="text-xs">
                {transaction.transactionInventoryItems?.length} صنف
              </span>
            </div>
          )}

          {/* Debt indicator */}
          {hasDebt && (
            <div className="flex items-center gap-2 text-amber-600">
              <Icon icon="solar:bill-list-bold-duotone" className="w-4 h-4" />
              <span className="text-xs">مرتبط بدين</span>
            </div>
          )}

          {/* Notes (truncated) */}
          {transaction.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Discount indicator (income only) */}
        {isIncome && transaction.discountValue && transaction.discountValue > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-amber-600">
              <Icon icon="solar:tag-price-bold-duotone" className="w-4 h-4" />
              <span>
                خصم:{' '}
                {transaction.discountType === 'PERCENTAGE'
                  ? `${transaction.discountValue}%`
                  : `${transaction.discountValue.toFixed(2)} د.ع`}
              </span>
            </div>
          </div>
        )}

        {/* Created by (optional, on hover) */}
        {transaction.createdBy && (
          <div className="mt-3 pt-3 border-t opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Icon icon="solar:user-linear" className="w-3.5 h-3.5" />
              <span>{transaction.createdBy.fullName}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
