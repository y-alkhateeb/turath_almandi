/**
 * InventoryValueCard - Presentational Component
 * Single card displaying total inventory value and item count
 *
 * Features:
 * - Shows total value with currency formatting
 * - Shows item count
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Package } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { formatCurrency, formatNumber } from '@/utils/format';

// ============================================
// TYPES
// ============================================

export interface InventoryValueCardProps {
  totalValue: number;
  itemCount: number;
  isLoading: boolean;
}

// ============================================
// LOADING SKELETON
// ============================================

function InventoryValueCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded mb-3" />
          <div className="h-10 w-48 bg-[var(--bg-tertiary)] rounded mb-2" />
          <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded" />
        </div>
        <div className="w-14 h-14 rounded-xl bg-[var(--bg-tertiary)]" />
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function InventoryValueCard({
  totalValue,
  itemCount,
  isLoading,
}: InventoryValueCardProps) {
  if (isLoading) {
    return (
      <div dir="rtl">
        <InventoryValueCardSkeleton />
      </div>
    );
  }

  return (
    <div dir="rtl">
      <StatCard
        title="قيمة المخزون الإجمالية"
        value={formatCurrency(totalValue)}
        icon={Package}
        description={`${formatNumber(itemCount)} صنف في المخزون`}
        className="border-r-4 border-primary-500"
      />
    </div>
  );
}

export default InventoryValueCard;
