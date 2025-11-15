import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { formatCurrency } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
} from 'lucide-react';

/**
 * Dashboard Page Component
 *
 * Modern dashboard with comprehensive financial overview featuring:
 * - 4 stat cards showing key metrics
 * - Revenue vs Expenses line chart
 * - Category distribution pie chart
 * - Recent transactions table
 * - Responsive design (mobile/tablet/desktop)
 * - RTL layout with Arabic text
 * - Auto-refresh every 30 seconds
 */
export default function DashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error">
        حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
      </Alert>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-sm text-gray-600 mt-2">
          مرحباً بك في نظام إدارة تراث المندي
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          change={12.5}
          description="مقارنة بالشهر الماضي"
          color="blue"
        />
        <StatCard
          title="إجمالي المصروفات"
          value={formatCurrency(stats.totalExpenses)}
          icon={TrendingDown}
          change={-8.2}
          description="مقارنة بالشهر الماضي"
          color="red"
        />
        <StatCard
          title="صافي الربح"
          value={formatCurrency(stats.netProfit)}
          icon={DollarSign}
          change={18.7}
          description="مقارنة بالشهر الماضي"
          color="green"
        />
        <StatCard
          title="عمليات اليوم"
          value={stats.todayTransactions}
          icon={Activity}
          description="إجمالي العمليات اليوم"
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={stats.revenueData} />
        <CategoryChart data={stats.categoryData} />
      </div>

      {/* Recent Transactions */}
      <RecentTransactions transactions={stats.recentTransactions} />
    </div>
  );
}
