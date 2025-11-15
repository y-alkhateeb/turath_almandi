import { useState } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Alert } from '@/components/ui/Alert';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Building,
} from 'lucide-react';

/**
 * Dashboard Page Component
 *
 * Modern dashboard with comprehensive financial overview featuring:
 * - 4 stat cards showing key metrics
 * - Revenue vs Expenses line chart
 * - Category distribution pie chart
 * - Recent transactions table
 * - Branch filter for admin users
 * - Responsive design (mobile/tablet/desktop)
 * - RTL layout with Arabic text
 * - Auto-refresh every 30 seconds
 */
export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  // Fetch branches for admin users
  const { data: branches } = useBranches({ enabled: isAdmin() });

  // Fetch dashboard stats with branch filter
  const { data: stats, isLoading, error } = useDashboardStats({
    branchId: selectedBranchId || undefined,
  });

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-sm text-gray-600 mt-2">
            مرحباً بك {user?.name || user?.username}
          </p>
        </div>

        {/* Branch Filter - Admin Only */}
        {isAdmin() && branches && branches.length > 0 && (
          <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
            <Building className="w-5 h-5 text-gray-500" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="border-0 focus:ring-2 focus:ring-blue-500 rounded-lg text-sm bg-transparent"
            >
              <option value="">جميع الفروع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          description="إيرادات اليوم"
          color="blue"
        />
        <StatCard
          title="إجمالي المصروفات"
          value={formatCurrency(stats.totalExpenses)}
          icon={TrendingDown}
          description="مصروفات اليوم"
          color="red"
        />
        <StatCard
          title="صافي الربح"
          value={formatCurrency(stats.netProfit)}
          icon={DollarSign}
          description="الربح الصافي اليوم"
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
