/**
 * InventoryForm - Presentational Component
 * Form for creating and editing inventory items with validation
 *
 * Features:
 * - Create/Edit modes
 * - react-hook-form with Zod validation
 * - Fields: name, quantity, unit, costPerUnit, notes, branchId
 * - Auto-calculate totalCost (quantity * costPerUnit)
 * - BranchSelector for admins
 * - Arabic labels and error messages
 * - Strict typing matching backend DTOs
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import { FormSelect, type SelectOption } from '@/components/form/FormSelect';
import { FormTextarea } from '@/components/form/FormTextarea';
import { BranchSelector } from '@/components/form/BranchSelector';
import { useAuth } from '@/hooks/useAuth';
import { InventoryUnit } from '@/types/enum';
import { formatCurrency } from '@/utils/format';
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Zod schema for creating inventory item
 * الكمية والسعر اختياريان - يتم تحديدهما من خلال معاملات مشتريات المخزون
 */
const createInventorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم الصنف مطلوب' })
    .max(200, { message: 'اسم الصنف يجب ألا يتجاوز 200 حرف' }),
  unit: z.nativeEnum(InventoryUnit, {
    errorMap: () => ({ message: 'الوحدة مطلوبة' }),
  }),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
  branchId: z.string().optional(),
});

/**
 * Zod schema for updating inventory item
 * All fields optional except validation rules remain the same
 */
const updateInventorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم الصنف مطلوب' })
    .max(200, { message: 'اسم الصنف يجب ألا يتجاوز 200 حرف' })
    .optional(),
  quantity: z
    .number({
      invalid_type_error: 'الكمية يجب أن تكون رقمًا',
    })
    .min(0, { message: 'الكمية يجب أن تكون صفر أو أكبر' })
    .nonnegative({ message: 'الكمية يجب أن تكون موجبة' })
    .optional(),
  unit: z.nativeEnum(InventoryUnit).optional(),
  costPerUnit: z
    .number({
      invalid_type_error: 'سعر الشراء يجب أن يكون رقمًا',
    })
    .min(0, { message: 'سعر الشراء يجب أن يكون صفر أو أكبر' })
    .nonnegative({ message: 'سعر الشراء يجب أن يكون موجبًا' })
    .optional(),
  sellingPrice: z
    .number({
      invalid_type_error: 'سعر البيع يجب أن يكون رقمًا',
    })
    .min(0, { message: 'سعر البيع يجب أن يكون صفر أو أكبر' })
    .nonnegative({ message: 'سعر البيع يجب أن يكون موجبًا' })
    .nullable()
    .optional(),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
});

type CreateFormData = z.infer<typeof createInventorySchema>;
type UpdateFormData = z.infer<typeof updateInventorySchema>;

// ============================================
// TYPES
// ============================================

export interface InventoryFormProps {
  mode: 'create' | 'edit';
  initialData?: InventoryItem;
  onSubmit: (data: CreateInventoryInput | UpdateInventoryInput) => Promise<void>;
  onCancel?: () => void;
  isSubmitting: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Unit options (Arabic)
 */
const unitOptions: SelectOption[] = [
  { value: InventoryUnit.KG, label: 'كيلو (KG)' },
  { value: InventoryUnit.PIECE, label: 'قطعة (PIECE)' },
  { value: InventoryUnit.LITER, label: 'لتر (LITER)' },
  { value: InventoryUnit.OTHER, label: 'أخرى (OTHER)' },
];

// ============================================
// COMPONENT
// ============================================

export function InventoryForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
}: InventoryFormProps) {
  const { user, isAdmin } = useAuth();

  // Use appropriate schema based on mode
  const schema = mode === 'create' ? createInventorySchema : updateInventorySchema;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === 'edit' && initialData
        ? {
            name: initialData.name,
            quantity: initialData.quantity,
            unit: initialData.unit,
            costPerUnit: initialData.costPerUnit,
            sellingPrice: initialData.sellingPrice,
            notes: undefined, // Notes not returned from backend
          }
        : {
            name: '',
            unit: InventoryUnit.KG,
            notes: '',
            branchId: isAdmin ? undefined : user?.branchId,
          },
  });

  // Watch quantity and costPerUnit for total cost calculation (edit mode only)
  const quantity = watch('quantity' as keyof UpdateFormData) as number | undefined;
  const costPerUnit = watch('costPerUnit' as keyof UpdateFormData) as number | undefined;

  // Calculate total cost (edit mode only)
  const [totalCost, setTotalCost] = useState<number>(0);

  useEffect(() => {
    if (mode === 'edit' && quantity !== undefined && costPerUnit !== undefined) {
      setTotalCost(quantity * costPerUnit);
    } else {
      setTotalCost(0);
    }
  }, [mode, quantity, costPerUnit]);

  // Reset form when mode or initialData changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        quantity: initialData.quantity,
        unit: initialData.unit,
        costPerUnit: initialData.costPerUnit,
        sellingPrice: initialData.sellingPrice,
        notes: undefined,
      });
    }
  }, [mode, initialData, reset]);

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      if (mode === 'create') {
        const createData = data as CreateFormData;
        const submitData: CreateInventoryInput = {
          name: createData.name,
          unit: createData.unit,
          notes: createData.notes || undefined,
          branchId: createData.branchId,
          // الكمية والسعر = 0 افتراضياً، يتم تحديثهما من خلال معاملات المشتريات
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      } else {
        const updateData = data as UpdateFormData;
        const submitData: UpdateInventoryInput = {
          name: updateData.name,
          quantity: updateData.quantity,
          unit: updateData.unit,
          costPerUnit: updateData.costPerUnit,
          sellingPrice: updateData.sellingPrice,
          notes: updateData.notes || undefined,
        };
        await onSubmit(submitData);
        // Reset form after successful submission
        reset();
      }
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" dir="rtl">
      {/* Item Name */}
      <FormInput
        name="name"
        label="اسم الصنف"
        type="text"
        placeholder="أدخل اسم الصنف"
        register={register}
        error={errors.name}
        required
        disabled={isSubmitting}
      />

      {/* Unit */}
      <FormSelect
        name="unit"
        label="الوحدة"
        options={unitOptions}
        register={register}
        error={errors.unit}
        required
        disabled={isSubmitting}
      />

      {/* Quantity - Edit mode only */}
      {mode === 'edit' && (
        <FormInput
          name="quantity"
          label="الكمية"
          type="number"
          step="0.01"
          min="0"
          placeholder="أدخل الكمية"
          register={register}
          error={errors.quantity}
          disabled={isSubmitting}
        />
      )}

      {/* Prices - Edit mode only */}
      {mode === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Cost Per Unit (Purchase Price) */}
          <FormInput
            name="costPerUnit"
            label="سعر الشراء"
            type="number"
            step="0.01"
            min="0"
            placeholder="أدخل سعر الشراء"
            register={register}
            error={errors.costPerUnit}
            disabled={isSubmitting}
          />

          {/* Selling Price */}
          <FormInput
            name="sellingPrice"
            label="سعر البيع"
            type="number"
            step="0.01"
            min="0"
            placeholder="أدخل سعر البيع (اختياري)"
            register={register}
            error={errors.sellingPrice}
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Total Cost Display - Calculated (Edit mode only) */}
      {mode === 'edit' && totalCost > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">القيمة الإجمالية (تلقائي):</span>
            <span className="text-lg font-bold text-blue-900 dark:text-blue-200">{formatCurrency(totalCost)}</span>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            الكمية × سعر الشراء = {quantity?.toFixed(2)} × {formatCurrency(costPerUnit || 0)}
          </p>
        </div>
      )}

      {/* Info message for create mode */}
      {mode === 'create' && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>ملاحظة:</strong> الكمية والسعر سيتم تحديدهما من خلال معاملة &quot;مشتريات مخزون&quot;
          </p>
        </div>
      )}

      {/* Branch Selector - Only for admins in create mode */}
      {mode === 'create' && isAdmin && (
        <Controller
          name="branchId"
          control={control}
          render={({ field }) => (
            <BranchSelector
              value={field.value || null}
              onChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
      )}

      {/* Branch Display - Read-only for accountants in create mode */}
      {mode === 'create' && !isAdmin && user?.branch && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الفرع</label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {user.branch.name}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            يتم تعبئة الفرع تلقائيًا من حسابك
          </p>
        </div>
      )}

      {/* Notes */}
      <FormTextarea
        name="notes"
        label="ملاحظات"
        placeholder="أدخل ملاحظات إضافية (اختياري)"
        rows={3}
        maxLength={1000}
        register={register}
        error={errors.notes}
        disabled={isSubmitting}
      />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'جاري الحفظ...' : mode === 'create' ? 'إضافة صنف' : 'تحديث الصنف'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
}

export default InventoryForm;
