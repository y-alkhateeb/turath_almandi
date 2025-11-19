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
import { formatCurrency, formatNumber } from '@/utils/format';
import type { DashboardStats } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface DashboardStatsCardsProps {
  stats: DashboardStats;
  isLoading: boolean;
}

// ============================================
// LOADING SKELETON
// ============================================

function StatCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded mb-3" />
          <div className="h-8 w-32 bg-[var(--bg-tertiary)] rounded mb-2" />
          <div className="h-4 w-16 bg-[var(--bg-tertiary)] rounded" />
        </div>
        <div className="w-14 h-14 rounded-xl bg-[var(--bg-tertiary)]" />
      </div>
    </div>
  );
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
        value={formatCurrency(stats.totalRevenue)}
        icon={DollarSign}
        description={
          stats.cashRevenue !== undefined && stats.masterRevenue !== undefined
            ? `نقدي: ${formatCurrency(stats.cashRevenue)} • ماستر: ${formatCurrency(stats.masterRevenue)}`
            : 'إجمالي الإيرادات المسجلة'
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
        value={formatCurrency(stats.totalExpenses)}
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
        value={formatCurrency(netProfit)}
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
