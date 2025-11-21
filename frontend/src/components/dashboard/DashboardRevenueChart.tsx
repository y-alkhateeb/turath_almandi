/**
 * DashboardRevenueChart - Presentational Component
 * Line chart showing revenue vs expenses over time
 *
 * Features:
 * - Line chart: revenue (blue) vs expenses (red)
 * - Uses Recharts library
 * - RTL support
 * - Responsive container
 * - Custom tooltip with currency formatting
 * - Loading skeleton
 * - Empty state
 * - No business logic
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { RevenueDataPoint } from '#/entity';
import type { CurrencySettings } from '#/settings.types';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// ============================================
// TYPES
// ============================================

export interface DashboardRevenueChartProps {
  data: RevenueDataPoint[];
  currency?: CurrencySettings | null;
  isLoading: boolean;
}

// ============================================
// CUSTOM TOOLTIP
// ============================================

const CustomTooltip = ({
  active,
  payload,
  currency,
}: TooltipProps<ValueType, NameType> & { currency?: CurrencySettings | null }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
          {payload[0].payload.month}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(Number(entry.value), currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================
// LOADING SKELETON
// ============================================

function ChartSkeleton() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <div className="h-6 w-48 bg-[var(--bg-tertiary)] rounded mb-2 animate-pulse" />
        <div className="h-4 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
      </div>
      <div className="h-80 bg-[var(--bg-tertiary)] rounded animate-pulse" />
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">الإيرادات والمصروفات</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          مقارنة شهرية للإيرادات والمصروفات
        </p>
      </div>
      <div className="flex flex-col items-center justify-center h-80">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-[var(--text-secondary)] text-center">لا توجد بيانات لعرضها</p>
        <p className="text-sm text-[var(--text-tertiary)] text-center mt-1">
          سيتم عرض الإيرادات والمصروفات هنا بعد تسجيل المعاملات
        </p>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function DashboardRevenueChart({ data, currency, isLoading }: DashboardRevenueChartProps) {
  // Loading state
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Format Y-axis values as millions (م) or thousands (ألف)
  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)}م`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}ألف`;
    }
    return value.toString();
  };

  return (
    <div
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6"
      dir="rtl"
    >
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">الإيرادات والمصروفات</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          مقارنة شهرية للإيرادات والمصروفات
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              style={{ fontSize: '12px', fontFamily: 'inherit' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '12px', fontFamily: 'inherit' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend wrapperStyle={{ fontSize: '14px', fontFamily: 'inherit' }} iconType="circle" />
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
    </div>
  );
}

export default DashboardRevenueChart;
