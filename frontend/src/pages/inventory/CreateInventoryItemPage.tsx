/**
 * Create Inventory Item Page
 * صفحة إضافة صنف جديد للمخزون
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowRight, Loader2, Save } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import inventoryService from '@/api/services/inventoryService';
import branchService from '@/api/services/branchService';
import { useAuth } from '@/hooks/api/useAuth';
import type { CreateInventoryInput, Branch, InventoryItem } from '@/types/entity';
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

const initialFormData: FormData = {
  name: '',
  unit: '',
  quantity: '0',
  costPerUnit: '0',
  sellingPrice: '0',
  branchId: '',
  notes: '',
};

export default function CreateInventoryItemPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const userBranchId = user?.branchId || null;

  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    branchId: isAdmin ? '' : userBranchId || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch branches for admin users
    // Fetch branches for admin
    const { data: branches = [] } = useQuery({
      queryKey: ['branches'],
      queryFn: () => branchService.getAllActive(),
      enabled: isAdmin,
    });

  // Create inventory item mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateInventoryInput) => inventoryService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('تم إضافة الصنف بنجاح');
      navigate('/inventory');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'حدث خطأ أثناء إضافة الصنف');
    },
  });

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

    if (isAdmin && !formData.branchId) {
      newErrors.branchId = 'الفرع مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء في النموذج');
      return;
    }

    const data: CreateInventoryInput = {
      name: formData.name.trim(),
      unit: formData.unit as InventoryUnit,
      quantity: parseFloat(formData.quantity),
      costPerUnit: parseFloat(formData.costPerUnit),
      sellingPrice: formData.sellingPrice ? parseFloat(formData.sellingPrice) : null,
      branchId: isAdmin ? formData.branchId : userBranchId!,
    };

    createMutation.mutate(data);
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCancel = () => {
    navigate('/inventory');
  };

  const isSaving = createMutation.isPending;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">إضافة صنف جديد</h1>
          <p className="text-muted-foreground">أدخل بيانات الصنف الجديد للمخزون</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الأساسية</CardTitle>
            <CardDescription>أدخل البيانات الرئيسية للصنف</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Name */}
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

            {/* Unit and Quantity */}
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

            {/* Prices */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPerUnit">سعر الشراء (للوحدة) *</Label>
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

            {/* Branch - Admin only */}
            {isAdmin && (
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                placeholder="ملاحظات إضافية..."
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                disabled={isSaving}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
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
              <>
                <Save className="h-4 w-4 ml-2" />
                حفظ الصنف
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
