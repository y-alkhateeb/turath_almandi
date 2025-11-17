/**
 * Dashboard Workbench Page
 *
 * Modern dashboard with comprehensive financial overview using new architecture (ARCHITECTURE.md)
 *
 * Features:
 * - 4 stat cards (totalRevenue, totalExpenses, netProfit, todayTransactions)
 * - RevenueChart: Line chart showing revenue vs expenses for last 6 months
 * - CategoryChart: Pie chart showing category breakdown
 * - RecentTransactions: Table showing 5 latest transactions
 * - Filters: Date picker + branch select (admin only)
 * - Auto-refresh: 30s via TanStack Query refetchInterval
 * - RTL: Full RTL support with Arabic labels
 * - Responsive: Mobile-first design with breakpoints
 * - Loading/Error states with proper components
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Building,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { Alert, AlertDescription } from '@/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/select';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
import { PageLoading } from '@/components/loading';
import { EmptyState } from '@/components/ui';
import { useUserInfo, useIsAdmin } from '@/store/userStore';
import { useRouter } from '@/routes/hooks';
import { getDashboardStats } from '@/api/services/dashboardService';
import { getAll as getAllBranches } from '@/api/services/branchService';
import { formatCurrency, formatDateShort } from '@/utils/format';
import type { DashboardStats, RevenueDataPoint, CategoryDataPoint } from '#/entity';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils';

// ============================================
// INLINE COMPONENTS
// ============================================

/**
 * StatCard Component
 * Displays a single statistic with icon, title, value, and optional trend
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color: 'blue' | 'green' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, icon: Icon, description, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      border: 'border-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      border: 'border-green-100',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      border: 'border-red-100',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      border: 'border-purple-100',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className={cn('border-2', colors.border)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {Math.abs(trend.value)}%
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colors.bg)}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * RevenueChart Component
 * Line chart displaying revenue vs expenses over time
 */
interface RevenueChartProps {
  data: RevenueDataPoint[];
}

function RevenueChart({ data }: RevenueChartProps) {
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {payload[0].payload.month}
          </p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value as number)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}م`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}ألف`;
    }
    return value.toString();
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الإيرادات والمصروفات</CardTitle>
          <CardDescription>مقارنة شهرية للإيرادات والمصروفات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            لا توجد بيانات
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>الإيرادات والمصروفات</CardTitle>
        <CardDescription>مقارنة شهرية للإيرادات والمصروفات</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '14px' }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="revenue"
                name="الإيرادات"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="المصروفات"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * CategoryChart Component
 * Pie chart displaying category breakdown with colors
 */
interface CategoryChartProps {
  data: CategoryDataPoint[];
}

function CategoryChart({ data }: CategoryChartProps) {
  const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-1">
            {item.name}
          </p>
          <p className="text-sm text-gray-600">
            {formatCurrency(item.value as number)}
          </p>
        </div>
      );
    }
    return null;
  };

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Hide labels for small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>توزيع الفئات</CardTitle>
          <CardDescription>توزيع الإيرادات حسب الفئة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-gray-500">
            لا توجد بيانات
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>توزيع الفئات</CardTitle>
        <CardDescription>توزيع الإيرادات حسب الفئة</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="category"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || `hsl(${index * 45}, 70%, 50%)`}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '14px' }}
                iconType="circle"
                formatter={(value, entry: any) => {
                  const item = data.find((d) => d.category === value);
                  return (
                    <span className="text-sm">
                      {value} - {item ? formatCurrency(item.value) : ''}
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * RecentTransactions Component
 * Table displaying the 5 most recent transactions
 */
interface RecentTransactionsProps {
  transactions: DashboardStats['recentTransactions'];
}

function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>آخر العمليات</CardTitle>
          <CardDescription>أحدث 5 عمليات مالية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">لا توجد عمليات حتى الآن</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>آخر العمليات</CardTitle>
        <CardDescription>أحدث {transactions.length} عمليات مالية</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full" dir="rtl">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-right text-sm font-medium text-gray-700 pb-3 pr-2">
                  التاريخ
                </th>
                <th className="text-right text-sm font-medium text-gray-700 pb-3">
                  النوع
                </th>
                <th className="text-right text-sm font-medium text-gray-700 pb-3">
                  الفئة
                </th>
                <th className="text-right text-sm font-medium text-gray-700 pb-3">
                  المبلغ
                </th>
                <th className="text-right text-sm font-medium text-gray-700 pb-3 pl-2">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((transaction) => (
                <tr
                  key={transaction.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="py-3 text-sm text-gray-600 pr-2">
                    {formatDateShort(transaction.date)}
                  </td>
                  <td className="py-3">
                    <Badge
                      variant={
                        transaction.type === 'INCOME' ? 'success' : 'destructive'
                      }
                    >
                      {transaction.type === 'INCOME' ? 'إيراد' : 'مصروف'}
                    </Badge>
                  </td>
                  <td className="py-3 text-sm text-gray-900">
                    {transaction.category}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        'text-sm font-medium',
                        transaction.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {transaction.type === 'INCOME' ? '+ ' : '- '}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">مكتمل</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// MAIN DASHBOARD PAGE
// ============================================

export default function DashboardWorkbench() {
  const userInfo = useUserInfo();
  const isAdmin = useIsAdmin();
  const router = useRouter();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Determine effective branch ID (accountants can only see their branch)
  const effectiveBranchId =
    userInfo?.role === 'ACCOUNTANT' ? userInfo?.branchId : selectedBranchId === 'ALL' ? undefined : selectedBranchId;

  // Fetch branches for admin users
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: getAllBranches,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch dashboard stats with auto-refresh
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats', selectedDate, effectiveBranchId],
    queryFn: () =>
      getDashboardStats({
        date: selectedDate,
        branchId: effectiveBranchId || undefined,
      }),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 2,
  });

  // Handlers
  const handleTodayClick = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const handleRetry = () => {
    refetch();
  };

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
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="mr-4"
          >
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

  // Check if there are NO transactions EVER (not just filtered)
  const hasNoTransactionsEver =
    stats.totalRevenue === 0 &&
    stats.totalExpenses === 0 &&
    stats.recentTransactions.length === 0 &&
    stats.todayTransactions === 0;

  // Show comprehensive empty state if no transactions exist
  if (hasNoTransactionsEver) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
            <p className="text-gray-600 mt-1">
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
          <h1 className="text-3xl font-bold text-gray-900">لوحة التحكم</h1>
          <p className="text-gray-600 mt-1">
            مرحباً بك، {userInfo.username || 'المستخدم'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Date Filter */}
        <Card className="flex items-center gap-3 p-3 w-full sm:w-auto">
          <Calendar className="w-5 h-5 text-gray-500" />
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-0 h-auto focus:ring-0 text-sm w-auto"
          />
          <Button variant="ghost" size="sm" onClick={handleTodayClick}>
            اليوم
          </Button>
        </Card>

        {/* Branch Filter - Admin Only */}
        {isAdmin && branches && branches.length > 0 && (
          <Card className="flex items-center gap-3 p-3 w-full sm:w-auto">
            <Building className="w-5 h-5 text-gray-500" />
            <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="border-0 h-auto focus:ring-0 text-sm w-[200px]">
                <SelectValue placeholder="جميع الفروع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الفروع</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
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
          title="معاملات اليوم"
          value={stats.todayTransactions}
          icon={Activity}
          description="إجمالي العمليات"
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

      {/* Empty State - No Transactions Today */}
      {stats.todayTransactions === 0 && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col gap-1">
              <span className="font-medium">لا توجد عمليات لهذا التاريخ</span>
              <span className="text-sm text-gray-600">
                لم يتم تسجيل أي عمليات مالية في التاريخ المحدد.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
