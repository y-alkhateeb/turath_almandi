/**
 * DashboardCategoryChart - Presentational Component
 *
 * Pie chart displaying category breakdown with colors.
 * Pure component with no business logic.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/ui/card';
import { formatCurrency } from '@/utils/formatters';
import type { CategoryDataPoint } from '#/entity';

export interface DashboardCategoryChartProps {
  /** Category data points */
  data: CategoryDataPoint[];
}

/**
 * Custom tooltip for category chart
 */
function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{item.name}</p>
        <p className="text-sm text-[var(--text-secondary)]">
          {formatCurrency(item.value as number)}
        </p>
      </div>
    );
  }
  return null;
}

/**
 * Custom label renderer for pie slices
 */
function renderCustomizedLabel({
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
}) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Hide labels for small slices
  if (percent < 0.05) return null;

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
}

export function DashboardCategoryChart({ data }: DashboardCategoryChartProps) {
  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>توزيع الفئات</CardTitle>
          <CardDescription>توزيع الإيرادات حسب الفئة</CardDescription>
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
                formatter={(value) => {
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
