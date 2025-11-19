/**
 * DashboardCategoryChart - Presentational Component
 * Pie chart showing expense categories breakdown
 *
 * Features:
 * - Pie chart: expense categories with colors
 * - Uses Recharts library
 * - RTL support
 * - Show percentages inside pie slices
 * - Custom tooltip with currency
 * - Legend with values
 * - Loading skeleton
 * - Empty state
 * - No business logic
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
import { PieChartIcon } from 'lucide-react';
import { formatCurrency, formatPercentage } from '@/utils/format';
import type { CategoryDataPoint } from '#/entity';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// ============================================
// TYPES
// ============================================

export interface DashboardCategoryChartProps {
  data: CategoryDataPoint[];
  isLoading: boolean;
}

// ============================================
// CUSTOM TOOLTIP
// ============================================

const CustomTooltip = ({ active, payload }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
          {data.name}
        </p>
        <p className="text-sm text-[var(--text-secondary)]">
          {formatCurrency(Number(data.value))}
        </p>
      </div>
    );
  }
  return null;
};

// ============================================
// CUSTOM LABEL
// ============================================

const RADIAN = Math.PI / 180;

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is > 5%
  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
      style={{ fontFamily: 'inherit' }}
    >
      {formatPercentage(percent * 100, 0)}
    </text>
  );
};

// ============================================
// DEFAULT COLORS
// ============================================

const DEFAULT_COLORS = [
  '#0ea5e9', // sky-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#f59e0b', // amber-500
  '#10b981', // emerald-500
  '#ef4444', // red-500
  '#6366f1', // indigo-500
  '#14b8a6', // teal-500
];

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
      <div className="h-80 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-[var(--bg-tertiary)] animate-pulse" />
      </div>
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
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          توزيع الإيرادات حسب الفئة
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          نسبة الإيرادات من كل فئة
        </p>
      </div>
      <div className="flex flex-col items-center justify-center h-80">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
          <PieChartIcon className="w-8 h-8 text-[var(--text-tertiary)]" />
        </div>
        <p className="text-[var(--text-secondary)] text-center">
          لا توجد بيانات لعرضها
        </p>
        <p className="text-sm text-[var(--text-tertiary)] text-center mt-1">
          سيتم عرض توزيع الفئات هنا بعد تسجيل المعاملات
        </p>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT
// ============================================

export function DashboardCategoryChart({ data, isLoading }: DashboardCategoryChartProps) {
  // Loading state
  if (isLoading) {
    return <ChartSkeleton />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Add colors to data if not provided
  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6" dir="rtl">
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          توزيع الإيرادات حسب الفئة
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          نسبة الإيرادات من كل فئة
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithColors}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="category"
            >
              {dataWithColors.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px', fontFamily: 'inherit' }}
              iconType="circle"
              formatter={(value: string) => {
                const item = dataWithColors.find((d) => d.category === value);
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
    </div>
  );
}

export default DashboardCategoryChart;
