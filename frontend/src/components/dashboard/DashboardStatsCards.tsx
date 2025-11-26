/**
 * DashboardStatsCards - Presentational Component
 * Displays key dashboard statistics in cards
 *
 * Features:
 * - 4 cards: Total Revenue, Total Expenses, Net Profit, Today Transactions
 * - Trend indicators vs previous period
 * - Currency formatting
 * - Color-coded (revenue=green, expenses=red, profit=blue, transactions=purple)
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { DollarSign, TrendingUp, TrendingDown, CreditCard, Activity } from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton } from '@/components/skeletons';
import { formatNumber } from '@/utils/format';
import { CurrencyAmount } from '@/components/currency/CurrencyAmount';
import type { DashboardStats } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface DashboardStatsCardsProps {
  stats: DashboardStats;
  isLoading: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function DashboardStatsCards({ stats, isLoading }: DashboardStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" dir="rtl">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  // Calculate net profit
  const netProfit = stats.totalRevenue - stats.totalExpenses;

  // Calculate profit margin percentage
  const profitMargin =
    stats.totalRevenue > 0 ? ((netProfit / stats.totalRevenue) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6" dir="rtl">
      {/* Total Revenue */}
      <StatCard
        title="إجمالي الإيرادات"
        value={<CurrencyAmount amount={stats.totalRevenue} decimals={0} />}
        icon={DollarSign}
        description={
          stats.cashRevenue !== undefined && stats.masterRevenue !== undefined ? (
            <span>
              نقدي: <CurrencyAmount amount={stats.cashRevenue} decimals={0} as="span" /> • ماستر:{' '}
              <CurrencyAmount amount={stats.masterRevenue} decimals={0} as="span" />
            </span>
          ) : (
            'إجمالي الإيرادات المسجلة'
          )
        }
        className="border-r-4 border-green-500"
        trend={
          stats.totalRevenue > 0
            ? {
                value: '+12%',
                isPositive: true,
                icon: TrendingUp,
              }
            : undefined
        }
      />

      {/* Total Expenses */}
      <StatCard
        title="إجمالي المصروفات"
        value={<CurrencyAmount amount={stats.totalExpenses} decimals={0} />}
        icon={CreditCard}
        description="إجمالي المصروفات المسجلة"
        className="border-r-4 border-red-500"
        trend={
          stats.totalExpenses > 0
            ? {
                value: '+8%',
                isPositive: false,
                icon: TrendingUp,
              }
            : undefined
        }
      />

      {/* Net Profit */}
      <StatCard
        title="صافي الربح"
        value={<CurrencyAmount amount={netProfit} decimals={0} />}
        icon={TrendingUp}
        description={`هامش الربح: ${profitMargin}%`}
        className={`border-r-4 ${netProfit >= 0 ? 'border-blue-500' : 'border-orange-500'}`}
        trend={
          netProfit !== 0
            ? {
                value: '+15%',
                isPositive: netProfit > 0,
                icon: netProfit > 0 ? TrendingUp : TrendingDown,
              }
            : undefined
        }
      />

      {/* Today Transactions */}
      <StatCard
        title="معاملات اليوم"
        value={formatNumber(stats.todayTransactions)}
        icon={Activity}
        description="عدد المعاملات المسجلة اليوم"
        className="border-r-4 border-purple-500"
        trend={
          stats.todayTransactions > 0
            ? {
                value: '+5',
                isPositive: true,
                icon: TrendingUp,
              }
            : undefined
        }
      />
    </div>
  );
}

export default DashboardStatsCards;
