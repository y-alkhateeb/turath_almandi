/**
 * MultiSelect Usage Examples
 *
 * This file demonstrates various ways to use the MultiSelect component
 * with React Hook Form, Zod validation, and different configurations.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MultiSelect, MultiSelectOption } from './MultiSelect';
import { FormMultiSelect } from './FormMultiSelect';

// ============================================
// SAMPLE DATA
// ============================================

const branchOptions: MultiSelectOption[] = [
  { value: 'branch-1', label: 'فرع بغداد' },
  { value: 'branch-2', label: 'فرع البصرة' },
  { value: 'branch-3', label: 'فرع أربيل' },
  { value: 'branch-4', label: 'فرع النجف' },
  { value: 'branch-5', label: 'فرع كربلاء' },
  { value: 'branch-6', label: 'فرع الموصل', disabled: true }, // Disabled example
];

const notificationOptions: MultiSelectOption[] = [
  { value: 'email', label: 'البريد الإلكتروني' },
  { value: 'sms', label: 'الرسائل النصية' },
  { value: 'push', label: 'إشعارات التطبيق' },
  { value: 'whatsapp', label: 'واتساب' },
];

const categoryOptions: MultiSelectOption[] = [
  { value: 'SALE', label: 'بيع' },
  { value: 'PURCHASE', label: 'شراء' },
  { value: 'EXPENSE', label: 'مصروف' },
  { value: 'SALARY', label: 'راتب' },
  { value: 'DEBT_PAYMENT', label: 'دفع دين' },
  { value: 'OTHER', label: 'أخرى' },
];

// ============================================
// EXAMPLE 1: Basic Usage with FormMultiSelect
// ============================================

const basicSchema = z.object({
  branches: z.array(z.string()).min(1, { message: 'يجب اختيار فرع واحد على الأقل' }),
});

type BasicFormData = z.infer<typeof basicSchema>;

function BasicExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      branches: [],
    },
  });

  const onSubmit = (data: BasicFormData) => {
    console.log('Selected branches:', data.branches);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormMultiSelect
        name="branches"
        control={control}
        options={branchOptions}
        label="اختر الفروع"
        placeholder="حدد فرع أو أكثر"
        error={errors.branches?.message}
        required
      />
      <button type="submit">إرسال</button>
    </form>
  );
}

// ============================================
// EXAMPLE 2: Optional Multi-Select
// ============================================

const optionalSchema = z.object({
  notifications: z.array(z.string()).optional(),
});

type OptionalFormData = z.infer<typeof optionalSchema>;

function OptionalExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OptionalFormData>({
    resolver: zodResolver(optionalSchema),
    defaultValues: {
      notifications: [],
    },
  });

  const onSubmit = (data: OptionalFormData) => {
    console.log('Notification preferences:', data.notifications);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormMultiSelect
        name="notifications"
        control={control}
        options={notificationOptions}
        label="طرق التنبيه (اختياري)"
        placeholder="اختر طرق التنبيه"
        error={errors.notifications?.message}
      />
      <button type="submit">حفظ التفضيلات</button>
    </form>
  );
}

// ============================================
// EXAMPLE 3: With Controller (Advanced)
// ============================================

function ControllerExample() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
    defaultValues: {
      branches: [],
    },
  });

  const selectedBranches = watch('branches');

  const onSubmit = (data: BasicFormData) => {
    console.log('Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="branches"
        control={control}
        render={({ field }) => (
          <MultiSelect
            options={branchOptions}
            value={field.value}
            onChange={field.onChange}
            label="الفروع"
            placeholder="اختر الفروع"
            error={errors.branches?.message}
            required
          />
        )}
      />

      {/* Show selected count */}
      {selectedBranches.length > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            عدد الفروع المحددة: <strong>{selectedBranches.length}</strong>
          </p>
        </div>
      )}

      <button type="submit">تأكيد</button>
    </form>
  );
}

// ============================================
// EXAMPLE 4: Max Selection Validation
// ============================================

const maxSelectionSchema = z.object({
  categories: z
    .array(z.string())
    .min(1, { message: 'يجب اختيار فئة واحدة على الأقل' })
    .max(3, { message: 'يمكنك اختيار 3 فئات كحد أقصى' }),
});

type MaxSelectionFormData = z.infer<typeof maxSelectionSchema>;

function MaxSelectionExample() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MaxSelectionFormData>({
    resolver: zodResolver(maxSelectionSchema),
    defaultValues: {
      categories: [],
    },
  });

  const selectedCategories = watch('categories');

  const onSubmit = (data: MaxSelectionFormData) => {
    console.log('Selected categories:', data.categories);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormMultiSelect
        name="categories"
        control={control}
        options={categoryOptions}
        label="الفئات (حد أقصى 3)"
        placeholder="اختر الفئات"
        error={errors.categories?.message}
        required
      />

      <p className="text-xs text-[var(--text-secondary)]">{selectedCategories.length} / 3 محدد</p>

      <button type="submit">حفظ</button>
    </form>
  );
}

// ============================================
// EXAMPLE 5: Notification Settings
// ============================================

const notificationSettingsSchema = z.object({
  branches: z.array(z.string()).min(1, { message: 'يجب اختيار فرع واحد على الأقل' }),
  notificationTypes: z
    .array(z.string())
    .min(1, { message: 'يجب اختيار طريقة تنبيه واحدة على الأقل' }),
});

type NotificationSettingsFormData = z.infer<typeof notificationSettingsSchema>;

function NotificationSettingsExample() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NotificationSettingsFormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      branches: [],
      notificationTypes: ['push'], // Default to push notifications
    },
  });

  const onSubmit = async (data: NotificationSettingsFormData) => {
    console.log('Notification settings:', data);
    // API call here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormMultiSelect
        name="branches"
        control={control}
        options={branchOptions}
        label="الفروع المراد مراقبتها"
        placeholder="اختر الفروع"
        error={errors.branches?.message}
        required
        disabled={isSubmitting}
      />

      <FormMultiSelect
        name="notificationTypes"
        control={control}
        options={notificationOptions}
        label="طرق التنبيه"
        placeholder="اختر طرق التنبيه"
        error={errors.notificationTypes?.message}
        required
        disabled={isSubmitting}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 6: Without Search
// ============================================

function NoSearchExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  const onSubmit = (data: BasicFormData) => {
    console.log('Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormMultiSelect
        name="branches"
        control={control}
        options={branchOptions}
        label="الفروع"
        placeholder="اختر الفروع"
        error={errors.branches?.message}
        searchable={false}
        showSelectAll={false}
        required
      />
      <button type="submit">إرسال</button>
    </form>
  );
}

// ============================================
// EXAMPLE 7: Report Filters
// ============================================

const reportFilterSchema = z.object({
  branches: z.array(z.string()),
  categories: z.array(z.string()),
  dateRange: z.object({
    start: z.string().nullable(),
    end: z.string().nullable(),
  }),
});

type ReportFilterFormData = z.infer<typeof reportFilterSchema>;

function ReportFilterExample() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportFilterFormData>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      branches: [],
      categories: [],
      dateRange: { start: null, end: null },
    },
  });

  const onSubmit = (data: ReportFilterFormData) => {
    console.log('Report filters:', data);
    // Generate report with filters
  };

  const handleReset = () => {
    reset({
      branches: [],
      categories: [],
      dateRange: { start: null, end: null },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormMultiSelect
          name="branches"
          control={control}
          options={branchOptions}
          label="الفروع"
          placeholder="كل الفروع"
          error={errors.branches?.message}
        />

        <FormMultiSelect
          name="categories"
          control={control}
          options={categoryOptions}
          label="الفئات"
          placeholder="كل الفئات"
          error={errors.categories?.message}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          إنشاء تقرير
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)]"
        >
          إعادة تعيين
        </button>
      </div>
    </form>
  );
}

// ============================================
// EXAMPLE 8: Custom Styling
// ============================================

function CustomStylingExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  const onSubmit = (data: BasicFormData) => {
    console.log('Data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormMultiSelect
        name="branches"
        control={control}
        options={branchOptions}
        label="الفروع"
        placeholder="اختر الفروع"
        error={errors.branches?.message}
        required
        maxHeight="200px"
        searchPlaceholder="ابحث عن فرع..."
        className="custom-multi-select"
      />
      <button type="submit">إرسال</button>
    </form>
  );
}

// Export all examples
export {
  BasicExample,
  OptionalExample,
  ControllerExample,
  MaxSelectionExample,
  NotificationSettingsExample,
  NoSearchExample,
  ReportFilterExample,
  CustomStylingExample,
};
