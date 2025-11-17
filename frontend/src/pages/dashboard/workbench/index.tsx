/**
 * Dashboard Workbench Page - Refactored
 *
 * Modern dashboard with comprehensive financial overview.
 * Refactored to separate logic from presentation using new architecture pattern.
 *
 * Features:
 * - 4 stat cards (totalRevenue, totalExpenses, netProfit, todayTransactions)
 * - RevenueChart: Line chart showing revenue vs expenses for last 6 months
 * - CategoryChart: Pie chart showing category breakdown
 * - RecentTransactions: Table showing 5 latest transactions
 * - Filters: Date picker + branch select (admin only)
 * - Auto-refresh: 30s via TanStack Query refetchInterval
 * - RTL: Full RTL support with Arabic labels
 * - Responsive: Mobile-first design
 *
 * Architecture:
 * - Business logic in hooks/features/useDashboardData
 * - Presentational components in components/features/dashboard
 * - This page only orchestrates components
 */

import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/ui/button';
import { Alert, AlertDescription } from '@/ui/alert';
import { PageLoading } from '@/components/loading';
import { EmptyState } from '@/components/ui';
import { useRouter } from '@/routes/hooks';
import { formatCurrency } from '@/utils/formatters';
import {
  DashboardStatCard,
  DashboardRevenueChart,
  DashboardCategoryChart,
  DashboardRecentTransactions,
  DashboardFilters,
} from '@/components/features/dashboard';
import { useDashboardData } from '@/hooks/features';

export default function DashboardWorkbench() {
  const router = useRouter();

  // All business logic is in the hook
  const {
    userInfo,
    isAdmin,
    selectedDate,
    selectedBranchId,
    stats,
    branches,
    isLoading,
    error,
    setSelectedDate,
    setSelectedBranchId,
    handleTodayClick,
    handleRetry,
    hasNoTransactionsEver,
  } = useDashboardData();

  // Loading state
  if (isLoading) {
    return <PageLoading message="جاري تحميل لوحة التحكم..." />;
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.</span>
          <Button variant="outline" size="sm" onClick={handleRetry} className="mr-4">
            <RefreshCw className="w-4 h-4 ml-2" />
            إعادة المحاولة
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // No data state
  if (!stats) {
    return (
      <Alert>
        <AlertDescription>لا توجد بيانات متاحة</AlertDescription>
      </Alert>
    );
  }

  // Empty state - No transactions ever
  if (hasNoTransactionsEver) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">لوحة التحكم</h1>
            <p className="text-[var(--text-secondary)] mt-1">
              مرحباً بك، {userInfo?.username || 'المستخدم'}
            </p>
          </div>
        </div>

        {/* Empty State */}
        <EmptyState
          variant="default"
          icon={<Activity className="w-full h-full" />}
          title="ابدأ رحلتك المالية"
          description="لم يتم تسجيل أي عمليات مالية بعد. ابدأ بإضافة أول إيراد أو مصروف لتتبع أموالك وإدارتها بشكل احترافي."
          actions={{
            primary: {
              label: 'إضافة عملية جديدة',
              onClick: () => router.push('/transactions'),
            },
          }}
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">لوحة التحكم</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            مرحباً بك، {userInfo?.username || 'المستخدم'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRetry}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Filters */}
      <DashboardFilters
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onTodayClick={handleTodayClick}
        showBranchFilter={isAdmin}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardStatCard
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue)}
          icon={TrendingUp}
          description="إيرادات اليوم"
          color="blue"
        />
        <DashboardStatCard
          title="إجمالي المصروفات"
          value={formatCurrency(stats.totalExpenses)}
          icon={TrendingDown}
          description="مصروفات اليوم"
          color="red"
        />
        <DashboardStatCard
          title="صافي الربح"
          value={formatCurrency(stats.netProfit)}
          icon={DollarSign}
          description="الربح الصافي اليوم"
          color="green"
        />
        <DashboardStatCard
          title="معاملات اليوم"
          value={stats.todayTransactions}
          icon={Activity}
          description="إجمالي العمليات"
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardRevenueChart data={stats.revenueData} />
        <DashboardCategoryChart data={stats.categoryData} />
      </div>

      {/* Recent Transactions */}
      <DashboardRecentTransactions transactions={stats.recentTransactions} maxItems={5} />

      {/* Empty State - No Transactions Today */}
      {stats.todayTransactions === 0 && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col gap-1">
              <span className="font-medium">لا توجد عمليات لهذا التاريخ</span>
              <span className="text-sm text-[var(--text-secondary)]">
                لم يتم تسجيل أي عمليات مالية في التاريخ المحدد.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
