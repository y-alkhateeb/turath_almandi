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
import { Card } from '@/ui/card';
import { RevenueDataPoint } from '@/types/dashboard';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import type { CurrencySettings } from '#/settings.types';

interface RevenueChartProps {
  data: RevenueDataPoint[];
  currency?: CurrencySettings | null;
}

const CustomTooltip = ({
  active,
  payload,
  currency,
}: TooltipProps<number, string> & { currency?: CurrencySettings | null }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-2">
          {payload[0].payload.month}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value as number, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function RevenueChart({ data, currency }: RevenueChartProps) {
  // Format Y-axis values as millions
  const formatYAxis = (value: number) => {
    return `${(value / 1000000).toFixed(0)}م`;
  };

  return (
    <Card className="p-6">
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">الإيرادات والمصروفات</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          مقارنة شهرية للإيرادات والمصروفات
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" style={{ fontSize: '12px' }} />
            <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} tickFormatter={formatYAxis} />
            <Tooltip content={<CustomTooltip currency={currency} />} />
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
    </Card>
  );
}
