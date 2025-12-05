import {
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingDown,
  History,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { InventoryItem } from '@/types/entity';
import { InventoryUnit } from '@/types/enum';
import { formatCurrency, formatNumber } from '@/utils/format';

const UNIT_LABELS: Record<InventoryUnit, string> = {
  [InventoryUnit.KG]: 'كغ',
  [InventoryUnit.PIECE]: 'قطعة',
  [InventoryUnit.LITER]: 'لتر',
  [InventoryUnit.OTHER]: 'أخرى',
};

const LOW_STOCK_THRESHOLD = 10;

interface InventoryCardProps {
  item: InventoryItem;
  isAdmin: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onRecordConsumption: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
}

function getStockStatus(quantity: number) {
  if (quantity === 0) {
    return { label: 'نفذ', variant: 'destructive' as const, color: 'text-destructive' };
  }
  if (quantity < LOW_STOCK_THRESHOLD) {
    return { label: 'منخفض', variant: 'warning' as const, color: 'text-warning-600' };
  }
  return { label: 'متوفر', variant: 'success' as const, color: 'text-secondary' };
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '-';
  return formatCurrency(price);
}

export default function InventoryCard({
  item,
  isAdmin,
  onEdit,
  onDelete,
  onRecordConsumption,
  onViewHistory,
}: InventoryCardProps) {
  const stockStatus = getStockStatus(item.quantity);
  const unitLabel = UNIT_LABELS[item.unit as InventoryUnit] || item.unit;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* الرأس - اسم الصنف والإجراءات */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold text-lg">{item.name}</h3>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(item)}>
                  <Pencil className="h-4 w-4 ml-2" />
                  تعديل
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onRecordConsumption(item)}>
                      <TrendingDown className="h-4 w-4 ml-2" />
                      تسجيل استهلاك/تلف
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewHistory(item)}>
                      <History className="h-4 w-4 ml-2" />
                      سجل الاستهلاك
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(item)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 ml-2" />
                  حذف
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* الشارات */}
        <div className="flex flex-wrap gap-2 mb-3">
          {stockStatus.variant !== 'success' && (
            <Badge variant={stockStatus.variant}>
              <AlertTriangle className="h-3 w-3 ml-1" />
              {stockStatus.label}
            </Badge>
          )}
        </div>

        {/* التفاصيل */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">الكمية:</span>
            <span className={cn('font-medium', stockStatus.color)}>
              {formatNumber(item.quantity)} {unitLabel}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">سعر الشراء:</span>
            <span className="font-medium">{formatPrice(item.costPerUnit)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">سعر البيع:</span>
            <span className="font-medium">{formatPrice(item.sellingPrice)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
