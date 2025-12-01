/**
 * Transaction Table Columns
 * Column definitions for TanStack Table
 *
 * Features:
 * - Type badge (income/expense)
 * - Amount with color coding
 * - Category with icon
 * - Date formatting
 * - Payment method
 * - Branch (for admins)
 * - Multi-item indicator
 * - Action buttons (view, edit, delete)
 */

import { ColumnDef } from '@tanstack/react-table';
import { Transaction } from '#/entity';
import { Badge } from '@/ui/badge';
import { Button } from '@/ui/button';
import { Icon } from '@/components/icon';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/utils';

// ============================================
// CATEGORY METADATA
// ============================================

const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: string;
  }
> = {
  // Income categories
  INVENTORY_SALES: {
    label: 'مبيعات المخزون',
    icon: 'solar:bag-2-bold-duotone',
  },
  CAPITAL_ADDITION: {
    label: 'إضافة رأس مال',
    icon: 'solar:wallet-money-bold-duotone',
  },
  APP_PURCHASES: {
    label: 'مشتريات التطبيق',
    icon: 'solar:cart-large-2-bold-duotone',
  },
  DEBT_PAYMENT: {
    label: 'سداد دين',
    icon: 'solar:hand-money-bold-duotone',
  },

  // Expense categories
  EMPLOYEE_SALARIES: {
    label: 'رواتب الموظفين',
    icon: 'solar:users-group-rounded-bold-duotone',
  },
  WORKER_DAILY: {
    label: 'أجور عمال يومية',
    icon: 'solar:user-hand-up-bold-duotone',
  },
  SUPPLIES: {
    label: 'لوازم',
    icon: 'solar:box-bold-duotone',
  },
  MAINTENANCE: {
    label: 'صيانة',
    icon: 'solar:settings-bold-duotone',
  },
  INVENTORY: {
    label: 'مخزون',
    icon: 'solar:box-minimalistic-bold-duotone',
  },
  DEBT: {
    label: 'دين',
    icon: 'solar:bill-list-bold-duotone',
  },
  CASHIER_SHORTAGE: {
    label: 'عجز صندوق',
    icon: 'solar:danger-circle-bold-duotone',
  },
  RETURNS: {
    label: 'مرتجعات',
    icon: 'solar:restart-bold-duotone',
  },
  OTHER_EXPENSE: {
    label: 'مصروفات أخرى',
    icon: 'solar:bill-list-bold-duotone',
  },
};

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; icon: string }> = {
  CASH: { label: 'نقدي', icon: 'solar:wallet-bold' },
  BANK_TRANSFER: { label: 'تحويل بنكي', icon: 'solar:card-transfer-bold' },
  CARD: { label: 'بطاقة', icon: 'solar:card-bold' },
  CHEQUE: { label: 'شيك', icon: 'solar:document-text-bold' },
};

// ============================================
// COLUMN DEFINITIONS
// ============================================

export const transactionColumns: ColumnDef<Transaction>[] = [
  // Type column
  {
    accessorKey: 'type',
    header: 'النوع',
    size: 100,
    cell: ({ row }) => {
      const type = row.getValue('type') as string;
      const isIncome = type === 'INCOME';
      return (
        <Badge variant={isIncome ? 'success' : 'destructive'}>
          <Icon
            icon={isIncome ? 'solar:arrow-down-bold' : 'solar:arrow-up-bold'}
            className="w-3 h-3 ml-1"
          />
          {isIncome ? 'وارد' : 'مصروف'}
        </Badge>
      );
    },
  },

  // Amount column
  {
    accessorKey: 'amount',
    header: 'المبلغ',
    size: 130,
    cell: ({ row }) => {
      const amount = Number(row.getValue('amount'));
      const type = row.original.type;
      const isIncome = type === 'INCOME';
      const hasMultipleItems = (row.original.transactionInventoryItems?.length || 0) > 0;

      return (
        <div className="flex items-center gap-1">
          <span
            className={cn('font-semibold text-base', isIncome ? 'text-green-600' : 'text-red-600')}
          >
            {isIncome ? '+' : '-'}
            {amount.toFixed(2)}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">د.ع</span>
          {hasMultipleItems && (
            <Icon
              icon="solar:layers-minimalistic-bold-duotone"
              className="w-4 h-4 text-primary-600 mr-1"
              title="معاملة متعددة الأصناف"
            />
          )}
        </div>
      );
    },
  },

  // Category column
  {
    accessorKey: 'category',
    header: 'الفئة',
    size: 180,
    cell: ({ row }) => {
      const category = row.getValue('category') as string;
      const categoryConfig = CATEGORY_CONFIG[category] || {
        label: category,
        icon: 'solar:bill-list-bold-duotone',
      };
      const isIncome = row.original.type === 'INCOME';

      return (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              isIncome ? 'bg-green-100' : 'bg-red-100'
            )}
          >
            <Icon
              icon={categoryConfig.icon}
              className={cn('w-5 h-5', isIncome ? 'text-green-600' : 'text-red-600')}
            />
          </div>
          <span className="text-sm font-medium">{categoryConfig.label}</span>
        </div>
      );
    },
  },

  // Date column
  {
    accessorKey: 'date',
    header: 'التاريخ',
    size: 120,
    cell: ({ row }) => {
      const date = new Date(row.getValue('date') as string);
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">{format(date, 'dd MMM yyyy', { locale: ar })}</span>
          <span className="text-xs text-[var(--text-secondary)]">
            {format(date, 'EEEE', { locale: ar })}
          </span>
        </div>
      );
    },
  },

  // Payment Method column
  {
    accessorKey: 'paymentMethod',
    header: 'طريقة الدفع',
    size: 130,
    cell: ({ row }) => {
      const paymentMethod = row.getValue('paymentMethod') as string | null;
      if (!paymentMethod) return <span className="text-[var(--text-secondary)]">-</span>;

      const paymentConfig = PAYMENT_METHOD_CONFIG[paymentMethod] || {
        label: paymentMethod,
        icon: 'solar:wallet-bold',
      };

      return (
        <div className="flex items-center gap-2">
          <Icon icon={paymentConfig.icon} className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm">{paymentConfig.label}</span>
        </div>
      );
    },
  },

  // Branch column (conditional - only for admins)
  {
    accessorKey: 'branch',
    header: 'الفرع',
    size: 120,
    cell: ({ row }) => {
      const branch = row.original.branch;
      if (!branch) return <span className="text-[var(--text-secondary)]">-</span>;
      return <span className="text-sm">{branch.name}</span>;
    },
  },

  // Employee/Vendor Name column
  {
    accessorKey: 'employeeVendorName',
    header: 'الاسم',
    size: 150,
    cell: ({ row }) => {
      const name = row.getValue('employeeVendorName') as string;
      return name ? (
        <span className="text-sm">{name}</span>
      ) : (
        <span className="text-[var(--text-secondary)]">-</span>
      );
    },
  },

  // Actions column
  {
    id: 'actions',
    header: 'الإجراءات',
    size: 140,
    cell: ({ row, table }) => {
      const transaction = row.original;
      const meta = table.options.meta as any;

      return (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onView?.(transaction.id)}
            className="h-8 w-8 p-0"
            title="عرض التفاصيل"
          >
            <Icon icon="solar:eye-bold" className="h-4 w-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onEdit?.(transaction.id)}
            className="h-8 w-8 p-0"
            title="تعديل"
          >
            <Icon icon="solar:pen-bold" className="h-4 w-4 text-amber-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onDelete?.(transaction.id)}
            className="h-8 w-8 p-0"
            title="حذف"
          >
            <Icon icon="solar:trash-bin-minimalistic-bold" className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      );
    },
  },
];
