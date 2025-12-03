/**
 * Dashboard Page
 * Main dashboard with statistics, charts, and recent transactions
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency, formatDate, formatNumber, toInputDate } from '@/utils/format';
import type { DateRange } from 'react-day-picker';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Banknote,
  Receipt,
  Package,
  AlertCircle,
  Building2,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DateRangePicker,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import dashboardService from '@/api/services/dashboardService';
import branchService from '@/api/services/branchService';
import transactionService from '@/api/services/transactionService';
import { useUserInfo } from '@/store/userStore';
import { TransactionType } from '@/types/enum';
import { getPaymentMethodLabel } from '@/components/shared/PaymentMethodSelect';

// ============================================
// TYPES
// ============================================

// (types moved inline)

// ============================================
// HELPER COMPONENTS
// ============================================

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  currency?: boolean;
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  variant = 'default',
  currency = true,
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    success: 'bg-secondary/10 border-secondary/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    danger: 'bg-destructive/10 border-destructive/20',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-secondary/20 text-secondary',
    warning: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    danger: 'bg-destructive/20 text-destructive',
  };

  return (
    <Card className={cn('border transition-all hover:shadow-md', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground">
              {currency ? formatCurrency(value) : formatNumber(value)}
            </p>
            {trend && trendValue && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'neutral' && 'text-muted-foreground'
                )}
              >
                {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconStyles[variant])}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}



function getTransactionTypeLabel(type: TransactionType): string {
  return type === TransactionType.INCOME ? 'إيراد' : 'مصروف';
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const userInfo = useUserInfo();
  const isAdmin = userInfo?.role === 'ADMIN';

  // Filters state
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: today };
  });
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Calculate query date range
  const queryDateRange = useMemo(() => {
    if (!dateRange?.from) {
      const today = new Date();
      return { date: toInputDate(today) };
    }

    if (dateRange.to) {
      return {
        startDate: toInputDate(dateRange.from),
        endDate: toInputDate(dateRange.to),
      };
    }

    return { date: toInputDate(dateRange.from) };
  }, [dateRange]);

  // Fetch branches (admin only)
  const { data: branches = [] } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchService.getAllActive(),
    enabled: isAdmin,
  });

  // Build query params
  const queryParams = useMemo(() => {
    const params: Record<string, string | undefined> = {
      ...queryDateRange,
    };
    if (isAdmin && selectedBranch !== 'all') {
      params.branchId = selectedBranch;
    }
    return params;
  }, [queryDateRange, selectedBranch, isAdmin]);

  // Fetch dashboard stats
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['dashboard-stats', queryParams],
    queryFn: () => dashboardService.getStats(queryParams),
  });

  // Fetch recent transactions
  const { data: recentTransactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['recent-transactions', queryParams],
    queryFn: () =>
      transactionService.getAll({
        ...queryParams,
        limit: '10',
        page: '1',
      }),
  });

  // Loading state
  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h3 className="font-semibold text-lg">حدث خطأ</h3>
            <p className="text-muted-foreground">لم نتمكن من تحميل بيانات لوحة التحكم</p>
            <Button onClick={() => window.location.reload()}>إعادة المحاولة</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Date Range Picker */}
            <div className="w-full sm:w-auto">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="اختر نطاق التاريخ"
                showTime={false}
                className="w-full sm:w-[300px]"
              />
            </div>

            {/* Branch Filter (Admin only) */}
            {isAdmin && branches.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="اختر الفرع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفروع</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الإيرادات"
          value={stats?.totalRevenue || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="إجمالي المصروفات"
          value={stats?.totalExpenses || 0}
          icon={<TrendingDown className="h-5 w-5" />}
          variant="danger"
        />
        <StatCard
          title="صافي الربح"
          value={stats?.netProfit || 0}
          icon={<DollarSign className="h-5 w-5" />}
          variant={
            (stats?.netProfit || 0) > 0
              ? 'success'
              : (stats?.netProfit || 0) < 0
                ? 'danger'
                : 'default'
          }
        />
        <StatCard
          title="عدد المعاملات"
          value={stats?.todayTransactions || 0}
          icon={<Receipt className="h-5 w-5" />}
          currency={false}
        />
      </div>

      {/* Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Banknote className="h-4 w-4 text-green-600" />
              الإيرادات النقدية (كاش)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(stats?.cashRevenue || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              إيرادات (ماستر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(stats?.masterRevenue || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debts & Inventory Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              إجمالي الديون المستحقة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">
              {formatCurrency(stats?.totalDebts || 0)}
            </p>
            {stats?.activeDebts !== undefined && (
              <p className="text-sm text-muted-foreground mt-1">
                {stats.activeDebts} ذمة نشطة
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              قيمة المخزون الحالية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {formatCurrency(stats?.inventoryValue || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>أحدث المعاملات</span>
            <Button variant="outline" size="sm" asChild>
              <a href="/transactions">عرض الكل</a>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentTransactions?.data && recentTransactions.data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      التاريخ
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      النوع
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      الفئة
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      طريقة الدفع
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      المبلغ
                    </th>
                    {isAdmin && (
                      <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                        الفرع
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.data.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            transaction.type === TransactionType.INCOME
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-red-500/10 text-red-600'
                          )}
                        >
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{transaction.category}</td>
                      <td className="py-3 px-4 text-sm">
                        {getPaymentMethodLabel(transaction.paymentMethod)}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        <span
                          className={
                            transaction.type === TransactionType.INCOME
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {transaction.type === TransactionType.INCOME ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {transaction.branch?.name || '-'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">لا توجد معاملات</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section - Placeholder for future implementation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">اتجاه الإيرادات الشهري</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">
                سيتم إضافة المخطط البياني قريباً
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">توزيع المصروفات حسب الفئة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/30 rounded-lg">
              <p className="text-muted-foreground text-sm">
                سيتم إضافة المخطط البياني قريباً
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
