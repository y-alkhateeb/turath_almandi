/**
 * PayableStatsCards - Presentational Component
 * Displays payable summary statistics in cards
 *
 * Features:
 * - Stat cards: Total Count, Active, Partial, Paid, Total Amount, Remaining Amount
 * - Color-coded: active=yellow, partial=blue, paid=green, amounts=red/orange
 * - Currency formatting
 * - Loading skeleton state
 * - RTL support
 * - No business logic
 */

import { DollarSign, Clock, CheckCircle, TrendingDown, Wallet } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton } from '@/components/skeletons';
import { formatCurrency } from '@/utils/format';
import type { PayablesSummary } from '@/types/payables.types';

// ============================================
// TYPES
// ============================================

export interface PayableStatsCardsProps {
  summary: PayablesSummary;
  isLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function PayableStatsCards({ summary, isLoading }: PayableStatsCardsProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6"
        dir="rtl"
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const { total, byStatus, amounts } = summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6" dir="rtl">
      {/* Total Payables */}
      <StatCard
        title="إجمالي الحسابات"
        value={total}
        icon={DollarSign}
        description="مجموع جميع الحسابات الدائنة"
        className="border-r-4 border-gray-500"
      />

      {/* Active Payables */}
      <StatCard
        title="حسابات نشطة"
        value={byStatus.pending}
        icon={Clock}
        description="لم يتم الدفع"
        className="border-r-4 border-yellow-500"
      />

      {/* Partial Payables */}
      <StatCard
        title="دفع جزئي"
        value={byStatus.partial}
        icon={TrendingDown}
        description="تم دفع جزء منها"
        className="border-r-4 border-blue-500"
      />

      {/* Paid Payables */}
      <StatCard
        title="حسابات مدفوعة"
        value={byStatus.paid}
        icon={CheckCircle}
        description="تم الدفع بالكامل"
        className="border-r-4 border-green-500"
      />

      {/* Total Amount */}
      <StatCard
        title="إجمالي المبالغ"
        value={formatCurrency(amounts.total)}
        icon={Wallet}
        description="مجموع جميع المبالغ الأصلية"
        className="border-r-4 border-purple-500"
      />

      {/* Remaining Amount */}
      <StatCard
        title="المبالغ المتبقية"
        value={formatCurrency(amounts.remaining)}
        icon={DollarSign}
        description="المبالغ المستحقة للدفع"
        className="border-r-4 border-red-500"
      />
    </div>
  );
}

export default PayableStatsCards;
