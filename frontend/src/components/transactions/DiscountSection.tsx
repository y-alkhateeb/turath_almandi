/**
 * DiscountSection Component
 * Component for applying transaction-level discount
 *
 * Features:
 * - Discount type selector (percentage or fixed amount)
 * - Discount value input with validation
 * - Discount reason selection with autocomplete from discount_reasons table
 * - Show discount amount calculated from subtotal
 * - Show final total after discount
 *
 * Only shown for INCOME transactions with categories: INVENTORY_SALES, APP_PURCHASES
 */

import { Control, Controller, UseFormWatch } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDiscountReasons } from '@/hooks/useDiscountReasons';
import { DiscountType } from '@/types/enum';
import { Percent, DollarSign } from 'lucide-react';

interface DiscountSectionProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  subtotal: number;
}

export const DiscountSection: React.FC<DiscountSectionProps> = ({ control, watch, subtotal }) => {
  const { data: discountReasons, isLoading } = useDiscountReasons();

  const discountType = watch('discountType');
  const discountValue = watch('discountValue') || 0;

  // Calculate discount amount
  const calculateDiscountAmount = (): number => {
    if (!discountType || !discountValue) return 0;

    let discountAmount = 0;
    if (discountType === DiscountType.PERCENTAGE) {
      discountAmount = (subtotal * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }

    // Ensure discount doesn't exceed subtotal
    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }

    return discountAmount;
  };

  const discountAmount = calculateDiscountAmount();
  const finalTotal = subtotal - discountAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>الخصم على المعاملة</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Discount Type */}
          <div className="space-y-2">
            <Label htmlFor="discountType">نوع الخصم</Label>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger id="discountType">
                    <SelectValue placeholder="بدون خصم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">بدون خصم</SelectItem>
                    <SelectItem value={DiscountType.PERCENTAGE}>
                      <div className="flex items-center">
                        <Percent className="ml-2 h-4 w-4" />
                        نسبة مئوية (%)
                      </div>
                    </SelectItem>
                    <SelectItem value={DiscountType.AMOUNT}>
                      <div className="flex items-center">
                        <DollarSign className="ml-2 h-4 w-4" />
                        مبلغ ثابت
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Discount Value */}
          {discountType && (
            <div className="space-y-2">
              <Label htmlFor="discountValue">
                قيمة الخصم {discountType === DiscountType.PERCENTAGE ? '(%)' : ''}
              </Label>
              <Controller
                name="discountValue"
                control={control}
                render={({ field }) => (
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                )}
              />
            </div>
          )}
        </div>

        {/* Discount Reason */}
        {discountType && (
          <div className="space-y-2">
            <Label htmlFor="discountReason">سبب الخصم (اختياري)</Label>
            <Controller
              name="discountReason"
              control={control}
              render={({ field }) => (
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <SelectTrigger id="discountReason">
                    <SelectValue placeholder="اختر سبب الخصم" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- اختياري --</SelectItem>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        جاري التحميل...
                      </SelectItem>
                    ) : (
                      discountReasons?.map((reason) => (
                        <SelectItem key={reason.id} value={reason.reason}>
                          {reason.reason}
                          {reason.description && (
                            <span className="text-xs text-muted-foreground mr-2">
                              ({reason.description})
                            </span>
                          )}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        )}

        {/* Summary */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">المجموع الفرعي:</span>
            <span className="font-medium">{subtotal.toFixed(2)}</span>
          </div>

          {discountType && discountValue > 0 && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  الخصم (
                  {discountType === DiscountType.PERCENTAGE
                    ? `${discountValue}%`
                    : discountValue.toFixed(2)}
                  ):
                </span>
                <span className="font-medium text-destructive">-{discountAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                <span>الإجمالي النهائي:</span>
                <span className="text-primary">{finalTotal.toFixed(2)}</span>
              </div>
            </>
          )}

          {(!discountType || discountValue === 0) && (
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
              <span>الإجمالي النهائي:</span>
              <span className="text-primary">{subtotal.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
