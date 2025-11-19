import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { Card } from '@/components/ui/Card';
import { CategoryDataPoint } from '@/types/dashboard';
import { formatCurrency, formatPercentage } from '@/lib/utils';

interface CategoryChartProps {
  data: CategoryDataPoint[];
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{data.name}</p>
        <p className="text-sm text-[var(--text-secondary)]">
          {formatCurrency(data.value as number)}
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
  name: _name,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${formatPercentage(percent * 100, 0)}`}
    </text>
  );
};

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <Card className="p-6">
      <div className="border-b border-[var(--border-color)] pb-5 mb-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          توزيع الإيرادات حسب الفئة
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">نسبة الإيرادات من كل فئة</p>
      </div>

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
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px' }}
              iconType="circle"
              formatter={(value) => {
                const item = data.find((d) => d.name === value);
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
    </Card>
  );
}
