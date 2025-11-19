/**
 * InventoryList - Presentational Component
 * Table displaying inventory items with auto-added badges and low stock indicators
 *
 * Features:
 * - Table with name, quantity, unit, costPerUnit, totalCost, branch, autoAdded, lastUpdated
 * - Auto-added badge (read-only indicator)
 * - Disabled edit/delete for auto-added items
 * - Low stock indicator (quantity < 10)
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Package, AlertTriangle, Calendar } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { formatCurrency, formatDate } from '@/utils/format';
import { InventoryUnit } from '@/types/enum';
import type { InventoryItem } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface InventoryListProps {
  items: InventoryItem[];
  isLoading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Low stock threshold
 */
const LOW_STOCK_THRESHOLD = 10;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get unit label in Arabic
 */
const getUnitLabel = (unit: InventoryUnit): string => {
  const labels: Record<InventoryUnit, string> = {
    [InventoryUnit.KG]: 'كيلو',
    [InventoryUnit.PIECE]: 'قطعة',
    [InventoryUnit.LITER]: 'لتر',
    [InventoryUnit.OTHER]: 'أخرى',
  };
  return labels[unit];
};

/**
 * Calculate total cost
 */
const calculateTotalCost = (quantity: number, costPerUnit: number): number => {
  return quantity * costPerUnit;
};

/**
 * Check if item has low stock
 */
const isLowStock = (item: InventoryItem): boolean => {
  return item.quantity < LOW_STOCK_THRESHOLD && !item.autoAdded;
};

/**
 * Get auto-added badge
 */
const getAutoAddedBadge = (autoAdded: boolean): React.ReactNode => {
  if (!autoAdded) return null;

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
      تلقائي
    </span>
  );
};

/**
 * Get low stock indicator
 */
const getLowStockIndicator = (item: InventoryItem): React.ReactNode => {
  if (!isLowStock(item)) return null;

  return (
    <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold mt-1">
      <AlertTriangle className="w-3 h-3" />
      <span>مخزون منخفض</span>
    </div>
  );
};

// ============================================
// COMPONENT
// ============================================

export function InventoryList({
  items,
  isLoading,
  onEdit,
  onDelete,
}: InventoryListProps) {
  // Define table columns
  const columns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: 'الصنف',
      width: '200px',
      render: (item) => (
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="font-medium text-[var(--text-primary)]">
              {item.name}
            </span>
          </div>
          {getAutoAddedBadge(item.autoAdded)}
          {getLowStockIndicator(item)}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'الكمية',
      width: '100px',
      align: 'right',
      render: (item) => (
        <span
          className={`font-semibold ${
            isLowStock(item) ? 'text-orange-600' : 'text-[var(--text-primary)]'
          }`}
        >
          {item.quantity.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'unit',
      header: 'الوحدة',
      width: '100px',
      align: 'center',
      render: (item) => (
        <span className="text-sm text-[var(--text-secondary)]">
          {getUnitLabel(item.unit)}
        </span>
      ),
    },
    {
      key: 'costPerUnit',
      header: 'سعر الوحدة',
      width: '120px',
      align: 'right',
      render: (item) => (
        <span className="text-sm">{formatCurrency(item.costPerUnit)}</span>
      ),
    },
    {
      key: 'totalCost',
      header: 'القيمة الإجمالية',
      width: '140px',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-primary-600">
          {formatCurrency(calculateTotalCost(item.quantity, item.costPerUnit))}
        </span>
      ),
    },
    {
      key: 'branch',
      header: 'الفرع',
      width: '120px',
      render: (item) => item.branch?.name || '-',
    },
    {
      key: 'lastUpdated',
      header: 'آخر تحديث',
      width: '140px',
      render: (item) => (
        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          <Calendar className="w-4 h-4" />
          {formatDate(item.lastUpdated)}
        </div>
      ),
    },
  ];

  // Add actions column if handlers are provided
  if (onEdit || onDelete) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      width: '150px',
      align: 'center',
      render: (item) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item.id);
              }}
              disabled={item.autoAdded}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                item.autoAdded
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
              }`}
              title={item.autoAdded ? 'لا يمكن تعديل العناصر المضافة تلقائيًا' : 'تعديل'}
            >
              تعديل
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              disabled={item.autoAdded}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                item.autoAdded
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-red-600 hover:text-red-800 hover:bg-red-50'
              }`}
              title={item.autoAdded ? 'لا يمكن حذف العناصر المضافة تلقائيًا' : 'حذف'}
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
      <Table<InventoryItem>
        data={items}
        columns={columns}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="لا توجد أصناف في المخزون"
        striped
        hoverable
      />
    </div>
  );
}

export default InventoryList;
