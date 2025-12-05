import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormDialog } from '@/components/shared/FormDialog';
import type { InventoryItem, RecordConsumptionInput } from '@/types/entity';
import { InventoryUnit } from '@/types/enum';
import { formatNumber } from '@/utils/format';

const UNIT_LABELS: Record<InventoryUnit, string> = {
  [InventoryUnit.KG]: 'كغ',
  [InventoryUnit.PIECE]: 'قطعة',
  [InventoryUnit.LITER]: 'لتر',
  [InventoryUnit.OTHER]: 'أخرى',
};

const CONSUMPTION_REASONS = [
  { value: 'expired', label: 'انتهاء صلاحية' },
  { value: 'damaged', label: 'تلف' },
  { value: 'internal', label: 'استهلاك داخلي' },
  { value: 'other', label: 'أخرى' },
];

interface FormData {
  quantity: string;
  consumedAt: string;
  reason: string;
  customReason: string;
}

interface FormErrors {
  quantity?: string;
  consumedAt?: string;
  reason?: string;
}

interface RecordConsumptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
  onSubmit: (data: RecordConsumptionInput) => void;
  isSaving: boolean;
  error?: string | null;
}

export default function RecordConsumptionDialog({
  open,
  onOpenChange,
  item,
  onSubmit,
  isSaving,
  error,
}: RecordConsumptionDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    quantity: '',
    consumedAt: new Date().toISOString().split('T')[0],
    reason: '',
    customReason: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // إعادة تعيين النموذج عند الفتح
  useEffect(() => {
    if (open) {
      setFormData({
        quantity: '',
        consumedAt: new Date().toISOString().split('T')[0],
        reason: '',
        customReason: '',
      });
      setErrors({});
    }
  }, [open]);

  const validateForm = (): boolean => {
    if (!item) return false;

    const newErrors: FormErrors = {};

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر';
    } else if (quantity > item.quantity) {
      newErrors.quantity = `الكمية لا يمكن أن تتجاوز المتوفر (${item.quantity})`;
    }

    if (!formData.consumedAt) {
      newErrors.consumedAt = 'التاريخ مطلوب';
    }

    if (!formData.reason) {
      newErrors.reason = 'سبب الاستهلاك مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !item) return;

    const reasonText =
      formData.reason === 'other' ? formData.customReason :
      CONSUMPTION_REASONS.find((r) => r.value === formData.reason)?.label || formData.reason;

    const data: RecordConsumptionInput = {
      quantity: parseFloat(formData.quantity),
      unit: item.unit as InventoryUnit,
      reason: reasonText,
      consumedAt: formData.consumedAt,
    };

    onSubmit(data);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!item) return null;

  const unitLabel = UNIT_LABELS[item.unit as InventoryUnit] || item.unit;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="تسجيل استهلاك/تلف"
      description="تسجيل نقص في المخزون بسبب الاستهلاك أو التلف"
      maxWidth="sm:max-w-md"
    >
      {/* معلومات الصنف */}
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <Package className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              الكمية المتوفرة: {formatNumber(item.quantity)} {unitLabel}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* الكمية */}
          <div className="space-y-2">
            <Label htmlFor="quantity">الكمية المستهلكة *</Label>
            <Input
              id="quantity"
              type="number"
              min="0.001"
              max={item.quantity}
              step="0.001"
              placeholder="0"
              value={formData.quantity}
              onChange={(e) => handleChange('quantity', e.target.value)}
              disabled={isSaving}
            />
            {errors.quantity ? (
              <p className="text-sm text-destructive">{errors.quantity}</p>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                يجب أن لا تتجاوز الكمية المتوفرة ({item.quantity})
              </p>
            )}
          </div>

          {/* التاريخ */}
          <div className="space-y-2">
            <Label htmlFor="consumedAt">تاريخ الاستهلاك *</Label>
            <Input
              id="consumedAt"
              type="date"
              value={formData.consumedAt}
              onChange={(e) => handleChange('consumedAt', e.target.value)}
              disabled={isSaving}
            />
            {errors.consumedAt && (
              <p className="text-sm text-destructive">{errors.consumedAt}</p>
            )}
          </div>

          {/* سبب الاستهلاك */}
          <div className="space-y-2">
            <Label htmlFor="reason">سبب الاستهلاك *</Label>
            <Select
              value={formData.reason}
              onValueChange={(value) => handleChange('reason', value)}
              disabled={isSaving}
            >
              <SelectTrigger id="reason">
                <SelectValue placeholder="اختر السبب" />
              </SelectTrigger>
              <SelectContent>
                {CONSUMPTION_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
            )}
          </div>

          {/* سبب مخصص */}
          {formData.reason === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">حدد السبب</Label>
              <Input
                id="customReason"
                placeholder="أدخل سبب الاستهلاك"
                value={formData.customReason}
                onChange={(e) => handleChange('customReason', e.target.value)}
                disabled={isSaving}
              />
            </div>
          )}

          {/* ملاحظات إضافية */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              placeholder="ملاحظات إضافية..."
              rows={2}
              disabled={isSaving}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin me-2" />
                  جاري التسجيل...
                </>
              ) : (
                'تسجيل الاستهلاك'
              )}
            </Button>
          </div>
        </form>
    </FormDialog>
  );
}
