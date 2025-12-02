import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import type { InventoryItem, Branch, CreateInventoryInput, UpdateInventoryInput } from '@/types/entity';
import { InventoryUnit } from '@/types/enum';

const UNIT_OPTIONS: { value: InventoryUnit; label: string }[] = [
  { value: InventoryUnit.KG, label: 'كيلوغرام (كغ)' },
  { value: InventoryUnit.PIECE, label: 'قطعة' },
  { value: InventoryUnit.LITER, label: 'لتر' },
  { value: InventoryUnit.OTHER, label: 'أخرى' },
];

interface FormData {
  name: string;
  unit: InventoryUnit | '';
  quantity: string;
  costPerUnit: string;
  sellingPrice: string;
  branchId: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  unit?: string;
  quantity?: string;
  costPerUnit?: string;
  sellingPrice?: string;
  branchId?: string;
}

interface AddEditItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null; // null = إضافة جديد
  branches: Branch[];
  isAdmin: boolean;
  userBranchId: string | null;
  onSave: (data: CreateInventoryInput | UpdateInventoryInput, isEdit: boolean) => void;
  isSaving: boolean;
  error?: string | null;
}

const initialFormData: FormData = {
  name: '',
  unit: '',
  quantity: '0',
  costPerUnit: '0',
  sellingPrice: '0',
  branchId: '',
  notes: '',
};

export default function AddEditItemDialog({
  open,
  onOpenChange,
  item,
  branches,
  isAdmin,
  userBranchId,
  onSave,
  isSaving,
  error,
}: AddEditItemDialogProps) {
  const isEdit = !!item;
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  // تحميل بيانات الصنف عند التعديل
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        unit: item.unit as InventoryUnit,
        quantity: item.quantity.toString(),
        costPerUnit: item.costPerUnit.toString(),
        sellingPrice: item.sellingPrice?.toString() || '0',
        branchId: item.branchId,
        notes: '',
      });
    } else {
      setFormData({
        ...initialFormData,
        branchId: isAdmin ? '' : userBranchId || '',
      });
    }
    setErrors({});
  }, [item, isAdmin, userBranchId, open]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم الصنف مطلوب';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'اسم الصنف يجب أن يكون حرفين على الأقل';
    }

    if (!formData.unit) {
      newErrors.unit = 'الوحدة مطلوبة';
    }

    const quantity = parseFloat(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      newErrors.quantity = 'الكمية يجب أن تكون رقماً صحيحاً';
    }

    const costPerUnit = parseFloat(formData.costPerUnit);
    if (isNaN(costPerUnit) || costPerUnit < 0) {
      newErrors.costPerUnit = 'سعر الشراء يجب أن يكون رقماً صحيحاً';
    }

    const sellingPrice = parseFloat(formData.sellingPrice);
    if (formData.sellingPrice && (isNaN(sellingPrice) || sellingPrice < 0)) {
      newErrors.sellingPrice = 'سعر البيع يجب أن يكون رقماً صحيحاً';
    }

    if (isAdmin && !isEdit && !formData.branchId) {
      newErrors.branchId = 'الفرع مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const data: CreateInventoryInput | UpdateInventoryInput = {
      name: formData.name.trim(),
      unit: formData.unit as InventoryUnit,
      quantity: parseFloat(formData.quantity),
      costPerUnit: parseFloat(formData.costPerUnit),
      sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
    };

    // إضافة الفرع فقط عند الإنشاء وللأدمن
    if (!isEdit && isAdmin) {
      (data as CreateInventoryInput).branchId = formData.branchId;
    }

    onSave(data, isEdit);
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // مسح الخطأ عند التعديل
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'تعديل صنف' : 'إضافة صنف جديد'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'قم بتعديل بيانات الصنف'
              : 'أدخل بيانات الصنف الجديد'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* اسم الصنف */}
          <div className="space-y-2">
            <Label htmlFor="name">اسم الصنف *</Label>
            <Input
              id="name"
              placeholder="مثال: فروج، أرز، زيت..."
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isSaving}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* الوحدة والكمية */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">الوحدة *</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) => handleChange('unit', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="اختر الوحدة" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">الكمية الابتدائية</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => handleChange('quantity', e.target.value)}
                disabled={isSaving}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">{errors.quantity}</p>
              )}
            </div>
          </div>

          {/* الأسعار */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPerUnit">سعر الشراء (للوحدة)</Label>
              <div className="relative">
                <Input
                  id="costPerUnit"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.costPerUnit}
                  onChange={(e) => handleChange('costPerUnit', e.target.value)}
                  disabled={isSaving}
                  className="pl-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  د.ع
                </span>
              </div>
              {errors.costPerUnit && (
                <p className="text-sm text-destructive">{errors.costPerUnit}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellingPrice">سعر البيع (للوحدة)</Label>
              <div className="relative">
                <Input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.sellingPrice}
                  onChange={(e) => handleChange('sellingPrice', e.target.value)}
                  disabled={isSaving}
                  className="pl-12"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  د.ع
                </span>
              </div>
              {errors.sellingPrice && (
                <p className="text-sm text-destructive">{errors.sellingPrice}</p>
              )}
            </div>
          </div>

          {/* الفرع - للأدمن فقط وعند الإضافة */}
          {isAdmin && !isEdit && (
            <div className="space-y-2">
              <Label htmlFor="branchId">الفرع *</Label>
              <Select
                value={formData.branchId}
                onValueChange={(value) => handleChange('branchId', value)}
                disabled={isSaving}
              >
                <SelectTrigger id="branchId">
                  <SelectValue placeholder="اختر الفرع" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.branchId && (
                <p className="text-sm text-destructive">{errors.branchId}</p>
              )}
            </div>
          )}

          {/* الملاحظات */}
          <div className="space-y-2">
            <Label htmlFor="notes">ملاحظات (اختياري)</Label>
            <Textarea
              id="notes"
              placeholder="ملاحظات إضافية..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              disabled={isSaving}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
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
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
