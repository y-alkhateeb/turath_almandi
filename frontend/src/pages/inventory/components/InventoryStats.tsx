import { Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

interface InventoryStatsProps {
  totalItems: number;
  availableItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  isLoading?: boolean;
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
