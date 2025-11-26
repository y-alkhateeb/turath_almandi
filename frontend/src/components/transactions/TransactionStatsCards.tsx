/**
 * TransactionStatsCards - Presentational Component
 * Displays transaction summary statistics in cards
 *
 * Features:
 * - Three stat cards: Total Income, Total Expenses, Net Profit
 * - Trend indicators with up/down icons
 * - Currency formatting
 * - Loading skeleton state
 * - RTL support
 */

import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton } from '@/components/skeletons';
import { formatCurrency } from '@/utils/format';

// ============================================
// TYPES
// ============================================

export interface TransactionSummary {
  income: number;
  expenses: number;
  netProfit: number;
}

export interface TransactionStatsCardsProps {
  summary: TransactionSummary;
  isLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function TransactionStatsCards({ summary, isLoading }: TransactionStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir="rtl">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  const { income, expenses, netProfit } = summary;

  // Determine trend for net profit
  const profitTrend: 'up' | 'down' = netProfit >= 0 ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6" dir="rtl">
      {/* Total Income Card */}
      <StatCard
        title="إجمالي الإيرادات"
        value={formatCurrency(income)}
        icon={TrendingUp}
        trend="up"
        description="إجمالي المبالغ المحصلة"
        className="border-r-4 border-green-500"
      />

      {/* Total Expenses Card */}
      <StatCard
        title="إجمالي المصروفات"
        value={formatCurrency(expenses)}
        icon={TrendingDown}
        trend="down"
        description="إجمالي المبالغ المدفوعة"
        className="border-r-4 border-red-500"
      />

      {/* Net Profit Card */}
      <StatCard
        title="صافي الربح"
        value={formatCurrency(Math.abs(netProfit))}
        icon={Wallet}
        trend={profitTrend}
        description={netProfit >= 0 ? 'ربح صافي' : 'خسارة صافية'}
        className={`border-r-4 ${netProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}
      />
    </div>
  );
}

export default TransactionStatsCards;
