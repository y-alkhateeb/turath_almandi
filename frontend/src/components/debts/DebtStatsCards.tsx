/**
 * DebtStatsCards - Presentational Component
 * Displays debt summary statistics in cards
 *
 * Features:
 * - 5 stat cards: Total, Active, Partial, Paid, Overdue, Total Owed
 * - Color-coded: overdue=red, active=yellow, partial=blue, paid=green
 * - Currency formatting
 * - Loading skeleton state
 * - RTL support
 * - No business logic
 */

import { DollarSign, AlertCircle, Clock, CheckCircle, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton } from '@/components/skeletons';
import { formatCurrency } from '@/utils/format';

// ============================================
// TYPES
// ============================================

export interface DebtSummary {
  totalDebts: number;
  activeDebts: number;
  paidDebts: number;
  partialDebts: number;
  totalOwed: number;
  overdueDebts: number;
}

export interface DebtStatsCardsProps {
  summary: DebtSummary;
  isLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function DebtStatsCards({ summary, isLoading }: DebtStatsCardsProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
        dir="rtl"
      >
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const { totalDebts, activeDebts, paidDebts, partialDebts, totalOwed: _totalOwed, overdueDebts } = summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6" dir="rtl">
      {/* Total Debts */}
      <StatCard
        title="إجمالي الديون"
        value={totalDebts}
        icon={DollarSign}
        description="مجموع جميع الديون"
        className="border-r-4 border-gray-500"
      />

      {/* Active Debts */}
      <StatCard
        title="ديون نشطة"
        value={activeDebts}
        icon={Clock}
        description="لم يتم الدفع"
        className="border-r-4 border-yellow-500"
      />

      {/* Partial Debts */}
      <StatCard
        title="دفع جزئي"
        value={partialDebts}
        icon={TrendingDown}
        description="تم دفع جزء منها"
        className="border-r-4 border-blue-500"
      />

      {/* Paid Debts */}
      <StatCard
        title="ديون مدفوعة"
        value={paidDebts}
        icon={CheckCircle}
        description="تم الدفع بالكامل"
        className="border-r-4 border-green-500"
      />

      {/* Overdue Debts */}
      <StatCard
        title="ديون متأخرة"
        value={overdueDebts}
        icon={AlertCircle}
        description="تجاوزت تاريخ الاستحقاق"
        className="border-r-4 border-red-500"
      />
    </div>
  );
}

/**
 * DebtTotalOwedCard - Separate card for total owed amount
 * Can be used alongside stats cards or separately
 */
export function DebtTotalOwedCard({
  totalOwed,
  isLoading,
}: {
  totalOwed: number;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <StatCardSkeleton />;
  }

  return (
    <StatCard
      title="إجمالي المبالغ المستحقة"
      value={formatCurrency(totalOwed)}
      icon={DollarSign}
      description="مجموع المبالغ المتبقية"
      className="border-r-4 border-orange-500"
    />
  );
}

export default DebtStatsCards;
