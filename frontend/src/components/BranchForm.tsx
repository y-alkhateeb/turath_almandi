import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput } from '@/components/form/FormInput';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Branch, BranchFormData } from '@/types';

// Zod schema with Arabic validation messages
const branchSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'اسم الفرع مطلوب' })
    .max(200, { message: 'اسم الفرع يجب ألا يتجاوز 200 حرف' }),
  location: z
    .string()
    .min(1, { message: 'الموقع مطلوب' })
    .max(500, { message: 'الموقع يجب ألا يتجاوز 500 حرف' }),
  managerName: z
    .string()
    .min(1, { message: 'اسم المدير مطلوب' })
    .max(200, { message: 'اسم المدير يجب ألا يتجاوز 200 حرف' }),
  phone: z
    .string()
    .min(1, { message: 'رقم الهاتف مطلوب' })
    .max(50, { message: 'رقم الهاتف يجب ألا يتجاوز 50 حرف' }),
});

interface BranchFormProps {
  onSubmit: (data: BranchFormData) => void;
  onCancel: () => void;
  initialData?: Branch | null;
  isLoading?: boolean;
}

export const BranchForm: React.FC<BranchFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BranchFormData>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: initialData?.name || '',
      location: initialData?.location || '',
      managerName: initialData?.managerName || '',
      phone: initialData?.phone || '',
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        location: initialData.location,
        managerName: initialData.managerName,
        phone: initialData.phone,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = (data: BranchFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <FormInput
        name="name"
        label="اسم الفرع"
        register={register}
        error={errors.name}
        required
        disabled={isLoading}
        placeholder="أدخل اسم الفرع"
      />

      <FormInput
        name="location"
        label="الموقع"
        register={register}
        error={errors.location}
        required
        disabled={isLoading}
        placeholder="أدخل موقع الفرع"
      />

      <FormInput
        name="managerName"
        label="اسم المدير"
        register={register}
        error={errors.managerName}
        required
        disabled={isLoading}
        placeholder="أدخل اسم مدير الفرع"
      />

      <FormInput
        name="phone"
        label="رقم الهاتف"
        type="tel"
        register={register}
        error={errors.phone}
        required
        disabled={isLoading}
        placeholder="أدخل رقم الهاتف"
        autoComplete="tel"
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-[var(--text-secondary)] disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          {isLoading && <LoadingSpinner size="sm" color="white" />}
          {isLoading ? 'جاري الحفظ...' : initialData ? 'تحديث' : 'إضافة'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] px-6 py-3 rounded-lg hover:bg-[var(--border-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
};
