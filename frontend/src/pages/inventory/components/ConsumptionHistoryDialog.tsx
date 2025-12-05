import { useState, useEffect } from 'react';
import { formatDateTime, formatTime, formatNumber } from '@/utils/format';
import { Loader2, Calendar, Package, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FormDialog } from '@/components/shared/FormDialog';
import type { InventoryItem, ConsumptionHistoryItem } from '@/types/entity';
import { InventoryUnit } from '@/types/enum';

const UNIT_LABELS: Record<InventoryUnit, string> = {
  [InventoryUnit.KG]: 'كغ',
  [InventoryUnit.PIECE]: 'قطعة',
  [InventoryUnit.LITER]: 'لتر',
  [InventoryUnit.OTHER]: 'أخرى',
};

interface ConsumptionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  history: ConsumptionHistoryItem[];
  isLoading: boolean;
  onFetchHistory: (startDate?: string, endDate?: string) => void;
}

export default function ConsumptionHistoryDialog({
  open,
  onOpenChange,
  item,
  history,
  isLoading,
  onFetchHistory,
}: ConsumptionHistoryDialogProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // تعيين الفترة الافتراضية (آخر 30 يوم)
  useEffect(() => {
    if (open) {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  }, [open]);

  // جلب السجل عند فتح النافذة أو تغيير التاريخ
  useEffect(() => {
    if (open && startDate && endDate) {
      onFetchHistory(startDate, endDate);
    }
  }, [open, startDate, endDate, onFetchHistory]);

  if (!item) return null;

  const unitLabel = UNIT_LABELS[item.unit as InventoryUnit] || item.unit;

  // حساب إجمالي الاستهلاك
  const totalConsumption = history.reduce((sum, h) => sum + h.quantity, 0);

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`سجل استهلاك: ${item.name}`}
      description="عرض سجل الاستهلاك والتلف لهذا الصنف"
      maxWidth="sm:max-w-lg"
    >
      {/* فلتر التاريخ */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="startDate" className="text-xs">
              من
            </Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate" className="text-xs">
              إلى
            </Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* سجل الاستهلاك */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                لا يوجد سجل استهلاك في هذه الفترة
              </p>
            </div>
          ) : (
            <>
              {/* قائمة السجلات */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {history.map((record) => (
                  <Card key={record.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          {/* التاريخ */}
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              {formatDateTime(record.consumedAt)}
                            </span>
                            <Clock className="h-3 w-3 text-muted-foreground mr-2" />
                            <span className="text-muted-foreground">
                              {formatTime(record.consumedAt)}
                            </span>
                          </div>

                          {/* الكمية والسبب */}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-medium text-destructive">
                              -{formatNumber(record.quantity)} {unitLabel}
                            </span>
                            {record.reason && (
                              <span className="text-muted-foreground">
                                | السبب: {record.reason}
                              </span>
                            )}
                          </div>

                          {/* المسجل */}
                          {record.recorder && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>المسجل: {record.recorder.username}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* الإجمالي */}
              <div className="flex items-center justify-between p-3 border-t">
                <span className="font-medium">إجمالي الاستهلاك في الفترة:</span>
                <span className="font-bold text-destructive">
                  {formatNumber(totalConsumption)} {unitLabel}
                </span>
              </div>
            </>
          )}
        </div>

        {/* زر الإغلاق */}
        <div className="flex justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
        </div>
    </FormDialog>
  );
}
