import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      {/* Branch Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اسم الفرع <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name')}
          type="text"
          disabled={isLoading}
          className={`w-full px-4 py-3 border ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="أدخل اسم الفرع"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          الموقع <span className="text-red-500">*</span>
        </label>
        <input
          {...register('location')}
          type="text"
          disabled={isLoading}
          className={`w-full px-4 py-3 border ${
            errors.location ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="أدخل موقع الفرع"
        />
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      {/* Manager Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          اسم المدير <span className="text-red-500">*</span>
        </label>
        <input
          {...register('managerName')}
          type="text"
          disabled={isLoading}
          className={`w-full px-4 py-3 border ${
            errors.managerName ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="أدخل اسم مدير الفرع"
        />
        {errors.managerName && (
          <p className="mt-1 text-sm text-red-600">{errors.managerName.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          رقم الهاتف <span className="text-red-500">*</span>
        </label>
        <input
          {...register('phone')}
          type="tel"
          disabled={isLoading}
          className={`w-full px-4 py-3 border ${
            errors.phone ? 'border-red-500' : 'border-gray-300'
          } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed`}
          placeholder="أدخل رقم الهاتف"
          dir="ltr"
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              جاري الحفظ...
            </span>
          ) : initialData ? (
            'تحديث'
          ) : (
            'إضافة'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
};
