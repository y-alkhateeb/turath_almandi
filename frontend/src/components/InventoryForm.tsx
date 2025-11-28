import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateInventory, useUpdateInventory } from '../hooks/useInventory';
import { InventoryUnit } from '../types/inventory.types';
import type { InventoryItem } from '../types/inventory.types';
import { useAuth } from '../hooks/useAuth';
import { BranchSelector } from '@/components/form/BranchSelector';

/**
 * Zod Validation Schema for Inventory Form
 * Only name and unit are required - quantity and costPerUnit are managed by transactions
 */
const inventorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم الصنف مطلوب' })
    .min(2, { message: 'اسم الصنف يجب أن يكون حرفين على الأقل' }),
  unit: z.nativeEnum(InventoryUnit, {
    message: 'الوحدة مطلوبة',
  }),
  costPerUnit: z.string().optional().default('0'),
  sellingPrice: z.string().optional().default(''),
  notes: z.string(),
  branchId: z.string().optional(),
});

type InventoryFormValues = z.infer<typeof inventorySchema>;

interface InventoryFormProps {
  item?: InventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Inventory Form Component
 *
 * Features:
 * - Item name validation (>= 2 chars)
 * - Unit selection (KG, PIECE, LITER, OTHER)
 * - Optional notes
 * - Auto-filled branch from user (read-only for accountant)
 * - Real-time validation
 * - Loading state on submit
 * - Success message and form reset
 * - Error handling
 * - Arabic interface with RTL layout
 * - Edit mode support
 *
 * Note: Quantity and costPerUnit are managed through transactions, not this form
 */
export const InventoryForm = ({ item, onSuccess, onCancel }: InventoryFormProps) => {
  const { user, isAdmin } = useAuth();
  const createInventory = useCreateInventory();
  const updateInventory = useUpdateInventory();

  const isEditMode = !!item;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<InventoryFormValues>({
    resolver: zodResolver(inventorySchema),
    defaultValues: {
      name: item?.name || '',
      unit: item?.unit || InventoryUnit.KG,
      costPerUnit: item?.costPerUnit?.toString() || '0',
      sellingPrice: item?.sellingPrice?.toString() || '',
      notes: '',
      branchId: isAdmin ? '' : user?.branchId,
    },
  });

  const onSubmit = async (data: InventoryFormValues) => {
    try {
      // For admin users, use selected branchId; for accountants, use their assigned branch
      const effectiveBranchId = data.branchId || (isAdmin ? undefined : user?.branchId);
      const branchIdValue = effectiveBranchId && effectiveBranchId.trim() !== '' ? effectiveBranchId : undefined;

      if (isEditMode) {
        // Don't send branchId when updating - only name, unit, and notes
        await updateInventory.mutateAsync({
          id: item.id,
          data: {
            name: data.name,
            unit: data.unit,
            costPerUnit: parseFloat(data.costPerUnit),
            sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
            notes: data.notes || undefined,
          },
        });
      } else {
        // Create with initial quantity=0 and costPerUnit=0
        await createInventory.mutateAsync({
          name: data.name,
          quantity: 0,
          unit: data.unit,
          costPerUnit: parseFloat(data.costPerUnit),
          sellingPrice: data.sellingPrice ? parseFloat(data.sellingPrice) : null,
          notes: data.notes || undefined,
          branchId: branchIdValue,
        });

        // Reset form on success (only for create mode)
        reset({
          name: '',
          unit: InventoryUnit.KG,
          costPerUnit: '',
          sellingPrice: '',
          notes: '',
          branchId: isAdmin ? '' : user?.branchId,
        });
      }

      // Call success callback if provided
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error('Failed to save inventory item:', error);
    }
  };

  // Unit labels in Arabic
  const unitLabels: Record<InventoryUnit, string> = {
    [InventoryUnit.KG]: 'كيلو',
    [InventoryUnit.PIECE]: 'قطعة',
    [InventoryUnit.LITER]: 'لتر',
    [InventoryUnit.OTHER]: 'أخرى',
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Branch Selection - Only show in create mode */}
      {!isEditMode && isAdmin && (
        <Controller
          name="branchId"
          control={control}
          render={({ field }) => (
            <BranchSelector
              mode="controlled"
              value={field.value || null}
              onChange={(val) => field.onChange(val || '')}
              showLabel
              label="الفرع"
            />
          )}
        />
      )}
      {!isEditMode && !isAdmin && user?.branch && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الفرع</label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {user.branch.name}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            يتم تعبئة الفرع تلقائيًا من حسابك
          </p>
        </div>
      )}

      {/* Item Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          اسم الصنف <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
            errors.name ? 'border-red-500' : 'border-[var(--border-color)]'
          }`}
          placeholder="مثال: طحين، سكر، زيت"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
      </div>

      {/* Quantity and Unit Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Quantity */}
        <div>
          <label
            htmlFor="quantity"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            الكمية <span className="text-[var(--text-secondary)] text-xs">(اختياري)</span>
          </label>
          <input
            id="quantity"
            type="number"
            step="0.001"
            {...register('quantity')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              errors.quantity ? 'border-red-500' : 'border-[var(--border-color)]'
            }`}
            placeholder="0"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-500">{errors.quantity.message}</p>
          )}
        </div>

        {/* Unit */}
        <div>
          <label
            htmlFor="unit"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            الوحدة <span className="text-red-500">*</span>
          </label>
          <select
            id="unit"
            {...register('unit')}
            dir="rtl"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              errors.unit ? 'border-red-500' : 'border-[var(--border-color)]'
            }`}
          >
            {Object.entries(unitLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.unit && <p className="mt-1 text-sm text-red-500">{errors.unit.message}</p>}
        </div>
      </div>

      {/* Prices Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Cost Per Unit (Purchase Price) */}
        <div>
          <label
            htmlFor="costPerUnit"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            سعر الشراء <span className="text-[var(--text-secondary)] text-xs">(اختياري)</span>
          </label>
          <input
            id="costPerUnit"
            type="number"
            step="0.01"
            {...register('costPerUnit')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              errors.costPerUnit ? 'border-red-500' : 'border-[var(--border-color)]'
            }`}
            placeholder="0.00"
          />
          {errors.costPerUnit && (
            <p className="mt-1 text-sm text-red-500">{errors.costPerUnit.message}</p>
          )}
        </div>

        {/* Selling Price */}
        <div>
          <label
            htmlFor="sellingPrice"
            className="block text-sm font-medium text-[var(--text-primary)] mb-2"
          >
            سعر البيع <span className="text-[var(--text-secondary)] text-xs">(اختياري)</span>
          </label>
          <input
            id="sellingPrice"
            type="number"
            step="0.01"
            {...register('sellingPrice')}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors ${
              errors.sellingPrice ? 'border-red-500' : 'border-[var(--border-color)]'
            }`}
            placeholder="0.00"
          />
          {errors.sellingPrice && (
            <p className="mt-1 text-sm text-red-500">{errors.sellingPrice.message}</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label
          htmlFor="notes"
          className="block text-sm font-medium text-[var(--text-primary)] mb-2"
        >
          ملاحظات
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
          placeholder="ملاحظات إضافية (اختياري)"
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'جاري الحفظ...' : isEditMode ? 'تحديث الصنف' : 'إضافة الصنف'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            إلغاء
          </button>
        )}
      </div>
    </form>
  );
};
