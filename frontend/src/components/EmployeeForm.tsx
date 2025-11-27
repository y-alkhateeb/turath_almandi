import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Employee, CreateEmployeeInput } from '@/types';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { EmployeeStatus } from '@/types';
import { DateInput } from '@/components/form';

// Zod schema with Arabic validation messages
const employeeSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'اسم الموظف يجب أن يكون حرفين على الأقل' })
    .max(200, { message: 'اسم الموظف يجب ألا يتجاوز 200 حرف' }),
  position: z
    .string()
    .min(2, { message: 'المنصب يجب أن يكون حرفين على الأقل' })
    .max(100, { message: 'المنصب يجب ألا يتجاوز 100 حرف' }),
  baseSalary: z
    .number({ invalid_type_error: 'الراتب الأساسي يجب أن يكون رقم' })
    .positive({ message: 'الراتب الأساسي يجب أن يكون رقم موجب' })
    .max(999999999, { message: 'الراتب الأساسي كبير جداً' }),
  allowance: z
    .number({ invalid_type_error: 'البدلات يجب أن تكون رقم' })
    .nonnegative({ message: 'البدلات يجب أن تكون رقم موجب أو صفر' })
    .max(999999999, { message: 'البدلات كبيرة جداً' })
    .optional()
    .default(0),
  hireDate: z.string().min(1, { message: 'تاريخ التوظيف مطلوب' }),
  branchId: z.string().optional().nullable(),
  notes: z.string().max(1000, { message: 'الملاحظات يجب ألا تتجاوز 1000 حرف' }).optional(),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  onSubmit: (data: CreateEmployeeInput) => void;
  onCancel: () => void;
  initialData?: Employee | null;
  isLoading?: boolean;
}

export const EmployeeForm: React.FC<EmployeeFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const { data: branches = [], isLoading: isBranchesLoading } = useBranches();
  const { user, isAdmin } = useAuth();
  const isEditMode = !!initialData;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: initialData?.name || '',
      position: initialData?.position || '',
      baseSalary: initialData?.baseSalary || 0,
      allowance: initialData?.allowance || 0,
      hireDate: initialData?.hireDate ? initialData.hireDate.split('T')[0] : '',
      branchId: initialData?.branchId || (isAdmin ? null : user?.branchId || null),
      notes: initialData?.notes || '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        position: initialData.position,
        baseSalary: initialData.baseSalary,
        allowance: initialData.allowance || 0,
        hireDate: initialData.hireDate.split('T')[0],
        branchId: initialData.branchId,
        notes: initialData.notes || '',
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: EmployeeFormData) => {
    // For update mode, don't include branchId (backend doesn't allow updating it)
    if (isEditMode) {
      const submitData = {
        name: data.name,
        position: data.position,
        baseSalary: Number(data.baseSalary),
        allowance: Number(data.allowance) || 0,
        hireDate: data.hireDate,
        notes: data.notes || null,
      };
      onSubmit(submitData as CreateEmployeeInput);
    } else {
      // For create mode, include branchId
      const submitData: CreateEmployeeInput = {
        name: data.name,
        position: data.position,
        baseSalary: Number(data.baseSalary),
        allowance: Number(data.allowance) || 0,
        hireDate: data.hireDate,
        branchId: isAdmin ? data.branchId || null : user?.branchId || null,
        notes: data.notes || null,
      };
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          اسم الموظف <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          type="text"
          disabled={isLoading}
          className={`w-full px-4 py-3 border ${
            errors.name ? 'border-red-500' : 'border-[var(--border-color)]'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
          placeholder="أدخل اسم الموظف"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Position */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          المنصب <span className="text-red-500">*</span>
        </label>
        <input
          {...register('position')}
          type="text"
          disabled={isLoading}
          className={`w-full px-4 py-3 border ${
            errors.position ? 'border-red-500' : 'border-[var(--border-color)]'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
          placeholder="مثال: طباخ، نادل، مدير"
        />
        {errors.position && <p className="mt-1 text-sm text-red-600">{errors.position.message}</p>}
      </div>

      {/* Salary Fields Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Base Salary */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            الراتب الأساسي <span className="text-red-500">*</span>
          </label>
          <input
            {...register('baseSalary', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            disabled={isLoading}
            className={`w-full px-4 py-3 border ${
              errors.baseSalary ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            placeholder="0.00"
          />
          {errors.baseSalary && (
            <p className="mt-1 text-sm text-red-600">{errors.baseSalary.message}</p>
          )}
        </div>

        {/* Allowance */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            البدلات
          </label>
          <input
            {...register('allowance', { valueAsNumber: true })}
            type="number"
            step="0.01"
            min="0"
            disabled={isLoading}
            className={`w-full px-4 py-3 border ${
              errors.allowance ? 'border-red-500' : 'border-[var(--border-color)]'
            } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            placeholder="0.00"
          />
          {errors.allowance && (
            <p className="mt-1 text-sm text-red-600">{errors.allowance.message}</p>
          )}
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            بدلات إضافية (مواصلات، سكن، إلخ)
          </p>
        </div>
      </div>

      {/* Hire Date and Branch Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Hire Date */}
        <DateInput
          mode="form"
          name="hireDate"
          label="تاريخ التوظيف"
          register={register}
          error={errors.hireDate}
          required={true}
          disabled={isLoading}
          max={new Date().toISOString().split('T')[0]}
        />

        {/* Branch - Admin only */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              الفرع <span className="text-red-500">*</span>
            </label>
            <select
              {...register('branchId')}
              disabled={isLoading || isBranchesLoading}
              className={`w-full px-4 py-3 border ${
                errors.branchId ? 'border-red-500' : 'border-[var(--border-color)]'
              } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed`}
            >
              <option value="">اختر الفرع</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.location}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="mt-1 text-sm text-red-600">{errors.branchId.message}</p>
            )}
          </div>
        )}

        {/* Accountant - Display branch (read-only) */}
        {!isAdmin && user?.branch && (
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              الفرع
            </label>
            <div className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              {user.branch.name} - {user.branch.location}
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              سيتم إضافة الموظف إلى فرعك تلقائياً
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          ملاحظات
        </label>
        <textarea
          {...register('notes')}
          disabled={isLoading}
          rows={4}
          className={`w-full px-4 py-3 border ${
            errors.notes ? 'border-red-500' : 'border-[var(--border-color)]'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed resize-none`}
          placeholder="أضف ملاحظات إضافية (اختياري)"
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'جاري الحفظ...' : isEditMode ? 'تحديث البيانات' : 'إضافة الموظف'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
};
