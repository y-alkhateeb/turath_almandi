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
import { BranchSelector } from '@/components/BranchSelector';
import { useAuth } from '@/hooks/useAuth';
import { InventoryUnit } from '@/types/enum';
import { formatCurrency } from '@/utils/format';
import type { InventoryItem, CreateInventoryInput, UpdateInventoryInput } from '#/entity';

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

/**
 * Zod schema for creating inventory item
 * Matches backend CreateInventoryDto validation rules
 */
const createInventorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم الصنف مطلوب' })
    .max(200, { message: 'اسم الصنف يجب ألا يتجاوز 200 حرف' }),
  quantity: z
    .number({
      required_error: 'الكمية مطلوبة',
      invalid_type_error: 'الكمية يجب أن تكون رقمًا',
    })
    .min(0, { message: 'الكمية يجب أن تكون صفر أو أكبر' })
    .nonnegative({ message: 'الكمية يجب أن تكون موجبة' }),
  unit: z.nativeEnum(InventoryUnit, {
    errorMap: () => ({ message: 'الوحدة مطلوبة' }),
  }),
  costPerUnit: z
    .number({
      required_error: 'سعر الوحدة مطلوب',
      invalid_type_error: 'سعر الوحدة يجب أن يكون رقمًا',
    })
    .min(0, { message: 'سعر الوحدة يجب أن يكون صفر أو أكبر' })
    .nonnegative({ message: 'سعر الوحدة يجب أن يكون موجبًا' }),
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
      invalid_type_error: 'سعر الوحدة يجب أن يكون رقمًا',
    })
    .min(0, { message: 'سعر الوحدة يجب أن يكون صفر أو أكبر' })
    .nonnegative({ message: 'سعر الوحدة يجب أن يكون موجبًا' })
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
            notes: undefined, // Notes not returned from backend
          }
        : {
            name: '',
            quantity: undefined,
            unit: InventoryUnit.KG,
            costPerUnit: undefined,
            notes: '',
            branchId: isAdmin ? undefined : user?.branchId,
          },
  });

  // Watch quantity and costPerUnit for total cost calculation
  const quantity = watch('quantity' as keyof CreateFormData) as number | undefined;
  const costPerUnit = watch('costPerUnit' as keyof CreateFormData) as number | undefined;

  // Calculate total cost
  const [totalCost, setTotalCost] = useState<number>(0);

  useEffect(() => {
    if (quantity !== undefined && costPerUnit !== undefined) {
      setTotalCost(quantity * costPerUnit);
    } else {
      setTotalCost(0);
    }
  }, [quantity, costPerUnit]);

  // Reset form when mode or initialData changes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        quantity: initialData.quantity,
        unit: initialData.unit,
        costPerUnit: initialData.costPerUnit,
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
          quantity: createData.quantity,
          unit: createData.unit,
          costPerUnit: createData.costPerUnit,
          notes: createData.notes || undefined,
          branchId: createData.branchId,
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

      {/* Quantity */}
      <FormInput
        name="quantity"
        label="الكمية"
        type="number"
        step="0.01"
        min="0"
        placeholder="أدخل الكمية"
        register={register}
        error={errors.quantity}
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

      {/* Cost Per Unit */}
      <FormInput
        name="costPerUnit"
        label="سعر الوحدة"
        type="number"
        step="0.01"
        min="0"
        placeholder="أدخل سعر الوحدة"
        register={register}
        error={errors.costPerUnit}
        required
        disabled={isSubmitting}
      />

      {/* Total Cost Display - Calculated */}
      {totalCost > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">القيمة الإجمالية (تلقائي):</span>
            <span className="text-lg font-bold text-blue-900">{formatCurrency(totalCost)}</span>
          </div>
          <p className="text-xs text-blue-700 mt-1">
            الكمية × سعر الوحدة = {quantity?.toFixed(2)} × {formatCurrency(costPerUnit || 0)}
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
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-[var(--border-color)]">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSubmitting && (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}
          {mode === 'create' ? 'إضافة صنف' : 'تحديث الصنف'}
        </button>
      </div>
    </form>
  );
}

export default InventoryForm;
