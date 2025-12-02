import { Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface InventoryStatsProps {
  totalItems: number;
  availableItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  isLoading?: boolean;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: 'default' | 'success' | 'warning' | 'danger';
  isLoading?: boolean;
}

function StatCard({ label, value, icon, variant, isLoading }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card border-border',
    success: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900',
    danger: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900',
  };

  const iconStyles = {
    default: 'text-muted-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400',
  };

  const valueStyles = {
    default: 'text-foreground',
    success: 'text-green-700 dark:text-green-300',
    warning: 'text-yellow-700 dark:text-yellow-300',
    danger: 'text-red-700 dark:text-red-300',
  };

  return (
    <Card className={cn('border', variantStyles[variant])}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', iconStyles[variant])}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {isLoading ? (
              <div className="h-7 w-12 bg-muted animate-pulse rounded mt-1" />
            ) : (
              <p className={cn('text-2xl font-bold', valueStyles[variant])}>
                {value}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InventoryStats({
  totalItems,
  availableItems,
  lowStockItems,
  outOfStockItems,
  isLoading,
}: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="إجمالي الأصناف"
        value={totalItems}
        icon={<Package className="h-5 w-5" />}
        variant="default"
        isLoading={isLoading}
      />
      <StatCard
        label="متوفر"
        value={availableItems}
        icon={<CheckCircle className="h-5 w-5" />}
        variant="success"
        isLoading={isLoading}
      />
      <StatCard
        label="مخزون منخفض"
        value={lowStockItems}
        icon={<AlertTriangle className="h-5 w-5" />}
        variant="warning"
        isLoading={isLoading}
      />
      <StatCard
        label="نفذ من المخزون"
        value={outOfStockItems}
        icon={<XCircle className="h-5 w-5" />}
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  );
}
