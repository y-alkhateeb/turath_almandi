import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingDown,
  History,
  AlertTriangle,
  Loader2,
  Package,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
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

interface InventoryTableProps {
  items: InventoryItem[];
  isLoading: boolean;
  isAdmin: boolean;
  onEdit: (item: InventoryItem) => void;
  onDelete: (item: InventoryItem) => void;
  onRecordConsumption: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
  isDeleting?: boolean;
}

function getStockStatus(quantity: number) {
  if (quantity === 0) {
    return { label: 'نفذ', variant: 'destructive' as const, showWarning: true };
  }
  if (quantity < LOW_STOCK_THRESHOLD) {
    return { label: 'منخفض', variant: 'warning' as const, showWarning: true };
  }
  return { label: 'متوفر', variant: 'success' as const, showWarning: false };
}

function formatPrice(price: number | null): string {
  if (price === null || price === undefined) return '-';
  return formatCurrency(price);
}

export default function InventoryTable({
  items,
  isLoading,
  isAdmin,
  onEdit,
  onDelete,
  onRecordConsumption,
  onViewHistory,
  isDeleting,
}: InventoryTableProps) {
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const handleDeleteConfirm = () => {
    if (deleteItem) {
      onDelete(deleteItem);
      setDeleteItem(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-1">
            لا توجد أصناف
          </h3>
          <p className="text-sm text-muted-foreground">
            لم يتم العثور على أي أصناف في المخزون
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الصنف</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">الوحدة</TableHead>
                  <TableHead className="text-right hidden md:table-cell">سعر الشراء</TableHead>
                  <TableHead className="text-right hidden md:table-cell">سعر البيع</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">الحالة</TableHead>
                  <TableHead className="text-right w-[100px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const stockStatus = getStockStatus(item.quantity);

                  return (
                    <TableRow key={item.id}>
                      {/* اسم الصنف */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>

                      {/* الكمية */}
                      <TableCell>
                        <span
                          className={cn(
                            'font-medium',
                            item.quantity === 0 && 'text-destructive',
                            item.quantity < LOW_STOCK_THRESHOLD &&
                              item.quantity > 0 &&
                              'text-warning-600'
                          )}
                        >
                          {formatNumber(item.quantity)}
                        </span>
                      </TableCell>

                      {/* الوحدة */}
                      <TableCell className="hidden sm:table-cell">
                        {UNIT_LABELS[item.unit as InventoryUnit] || item.unit}
                      </TableCell>

                      {/* سعر الشراء */}
                      <TableCell className="hidden md:table-cell">
                        {formatPrice(item.costPerUnit)}
                      </TableCell>

                      {/* سعر البيع */}
                      <TableCell className="hidden md:table-cell">
                        {formatPrice(item.sellingPrice)}
                      </TableCell>

                      {/* الحالة */}
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                            {stockStatus.showWarning && (
                              <Badge variant={stockStatus.variant} className="text-xs">
                                <AlertTriangle className="h-3 w-3 ml-1" />
                                {stockStatus.label}
                              </Badge>
                            )}
                          </div>
                      </TableCell>

                      {/* الإجراءات */}
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {/* قائمة الإجراءات */}
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
                                  <DropdownMenuItem
                                    onClick={() => onRecordConsumption(item)}
                                  >
                                    <TrendingDown className="h-4 w-4 ml-2" />
                                    تسجيل استهلاك/تلف
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onViewHistory(item)}
                                  >
                                    <History className="h-4 w-4 ml-2" />
                                    سجل الاستهلاك
                                  </DropdownMenuItem>
                                </>
                              )}

                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => setDeleteItem(item)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 ml-2" />
                                حذف
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* نافذة تأكيد الحذف */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الصنف "{deleteItem?.name}"؟ لا يمكن التراجع عن
              هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحذف...
                </>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
