/**
 * CurrencyList - Presentational Component
 * Display and manage currency settings
 *
 * Features:
 * - Table with currency information (code, name_ar, symbol, default status)
 * - "Set as Default" action button
 * - "Add Currency" button
 * - Default currency badge
 * - RTL layout
 * - Loading state
 * - Empty state
 */

import { Table, type Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { CurrencyWithUsage } from '#/settings.types';

// ============================================
// TYPES
// ============================================

export interface CurrencyListProps {
  /** List of currencies with usage statistics */
  currencies: CurrencyWithUsage[];
  /** Code of the default currency */
  defaultCode: string;
  /** Callback when "Set as Default" is clicked */
  onSetDefault: (currency: CurrencyWithUsage) => void;
  /** Callback when "Add Currency" is clicked */
  onAdd: () => void;
  /** Loading state */
  isLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function CurrencyList({
  currencies,
  defaultCode,
  onSetDefault,
  onAdd,
  isLoading,
}: CurrencyListProps) {
  // Define table columns for RTL layout
  const columns: Column<CurrencyWithUsage>[] = [
    {
      key: 'code',
      header: 'الرمز',
      width: '15%',
      render: (item) => (
        <span className="font-mono font-semibold text-[var(--text-primary)]">{item.code}</span>
      ),
    },
    {
      key: 'nameAr',
      header: 'الاسم',
      width: '25%',
      render: (item) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">{item.nameAr}</p>
          <p className="text-xs text-[var(--text-secondary)]">{item.nameEn}</p>
        </div>
      ),
    },
    {
      key: 'symbol',
      header: 'الرمز',
      width: '10%',
      render: (item) => (
        <span className="text-lg font-semibold text-[var(--text-primary)]">{item.symbol}</span>
      ),
    },
    {
      key: 'usageCount',
      header: 'عدد الاستخدامات',
      width: '15%',
      render: (item) => (
        <div className="text-sm">
          <p className="text-[var(--text-primary)]">
            {(item.usageCount?.transactions || 0) +
             (item.usageCount?.debts || 0) +
             (item.usageCount?.debtPayments || 0)}{' '}
            معاملة
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {item.usageCount?.transactions || 0} عملية، {item.usageCount?.debts || 0} دين،{' '}
            {item.usageCount?.debtPayments || 0} دفعة
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'الحالة',
      width: '15%',
      render: (item) =>
        item.isDefault ? (
          <Badge variant="success" size="sm">
            الافتراضية
          </Badge>
        ) : (
          <span className="text-sm text-[var(--text-secondary)]">غير افتراضية</span>
        ),
    },
    {
      key: 'actions',
      header: 'الإجراءات',
      width: '20%',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSetDefault(item)}
          disabled={item.isDefault}
        >
          {item.isDefault ? 'افتراضية حالياً' : 'تعيين كافتراضي'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">إدارة العملات</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            العملة الافتراضية: <span className="font-semibold">{defaultCode}</span>
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onAdd}
          leftIcon={
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          }
        >
          إضافة عملة
        </Button>
      </div>

      {/* Currency Table */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden">
        <Table
          data={currencies}
          columns={columns}
          keyExtractor={(item) => item.code}
          isLoading={isLoading}
          emptyMessage="لا توجد عملات مسجلة"
          hoverable={false}
          striped={true}
        />
      </div>

      {/* Info Box */}
      {currencies.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-semibold mb-1">ملاحظة هامة:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>العملة الافتراضية يتم تطبيقها تلقائياً على جميع المعاملات والديون الجديدة</li>
                <li>المعاملات والديون الموجودة ستبقى بعملتها الأصلية</li>
                <li>لا يمكن حذف عملة مستخدمة في معاملات موجودة</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrencyList;
