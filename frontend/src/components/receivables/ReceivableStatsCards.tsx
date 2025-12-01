/**
 * ReceivableStatsCards - Presentational Component
 * Displays receivable summary statistics in cards
 *
 * Features:
 * - Stat cards: Total Count, Active, Partial, Collected, Total Amount, Remaining Amount
 * - Color-coded: active=yellow, partial=blue, collected=green, amounts=orange/teal
 * - Currency formatting
 * - Loading skeleton state
 * - RTL support
 * - No business logic
 */

import { DollarSign, Clock, CheckCircle, TrendingUp, Wallet } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton } from '@/components/skeletons';
import { formatCurrency } from '@/utils/format';
import type { ReceivablesSummary } from '@/types/receivables.types';

// ============================================
// TYPES
// ============================================

export interface ReceivableStatsCardsProps {
  summary: ReceivablesSummary;
  isLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ReceivableStatsCards({ summary, isLoading }: ReceivableStatsCardsProps) {
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
      {/* Total Receivables */}
      <StatCard
        title="إجمالي الحسابات"
        value={total}
        icon={DollarSign}
        description="مجموع جميع الحسابات المدينة"
        className="border-r-4 border-gray-500"
      />

      {/* Active Receivables */}
      <StatCard
        title="حسابات نشطة"
        value={byStatus.pending}
        icon={Clock}
        description="لم يتم التحصيل"
        className="border-r-4 border-yellow-500"
      />

      {/* Partial Receivables */}
      <StatCard
        title="تحصيل جزئي"
        value={byStatus.partial}
        icon={TrendingUp}
        description="تم تحصيل جزء منها"
        className="border-r-4 border-blue-500"
      />

      {/* Collected Receivables */}
      <StatCard
        title="حسابات محصلة"
        value={byStatus.paid}
        icon={CheckCircle}
        description="تم التحصيل بالكامل"
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
        description="المبالغ المستحقة للتحصيل"
        className="border-r-4 border-orange-500"
      />
    </div>
  );
}

export default ReceivableStatsCards;
