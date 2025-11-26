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
import { StatCardSkeleton } from '@/components/skeletons';
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
// COMPONENT
// ============================================

export function InventoryValueCard({ totalValue, itemCount, isLoading }: InventoryValueCardProps) {
  if (isLoading) {
    return (
      <div dir="rtl">
        <StatCardSkeleton />
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
