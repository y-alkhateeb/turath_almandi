/**
 * DashboardRevenueChart - Presentational Component
 *
 * Line chart displaying revenue vs expenses over time.
 * Pure component with no business logic.
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { formatCurrency } from '@/utils/formatters';
import type { RevenueDataPoint } from '#/entity';

export interface DashboardRevenueChartProps {
  /** Revenue data points */
  data: RevenueDataPoint[];
}

/**
 * Custom tooltip for revenue chart
 */
function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
          {payload[0].payload.month}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value as number)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Format Y-axis values (e.g., 1000000 → 1م)
 */
function formatYAxis(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}م`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}ألف`;
  }
  return value.toString();
}

export function DashboardRevenueChart({ data }: DashboardRevenueChartProps) {
  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>الإيرادات والمصروفات</CardTitle>
          <CardDescription>مقارنة شهرية للإيرادات والمصروفات</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center text-[var(--text-secondary)]">
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
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '14px' }} iconType="circle" />
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
