/**
 * DateRangePicker Usage Examples
 *
 * This file demonstrates various ways to use the DateRangePicker component
 * with React Hook Form, Zod validation, and different configurations.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { FormDateRangePicker } from './FormDateRangePicker';

// ============================================
// EXAMPLE 1: Basic Usage with Presets
// ============================================

const basicSchema = z.object({
  dateRange: z
    .object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
    .refine(
      (data) => {
        // Both must be filled or both empty
        if (data.start && !data.end) return false;
        if (!data.start && data.end) return false;
        return true;
      },
      {
        message: 'يجب تحديد تاريخ البداية والنهاية',
      }
    )
    .refine(
      (data) => {
        // If both filled, end must be >= start
        if (data.start && data.end) {
          return new Date(data.end) >= new Date(data.start);
        }
        return true;
      },
      {
        message: 'تاريخ النهاية يجب أن يكون بعد أو يساوي تاريخ البداية',
      }
    ),
});

type BasicFormData = z.infer<typeof basicSchema>;

function BasicExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  const onSubmit = (data: BasicFormData) => {
    console.log('Date range:', data.dateRange);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormDateRangePicker
        name="dateRange"
        control={control}
        error={errors.dateRange}
        label="اختر الفترة"
        showPresets
        required
      />
      <button type="submit">عرض البيانات</button>
    </form>
  );
}

// ============================================
// EXAMPLE 2: Report Filter with Presets
// ============================================

const reportSchema = z.object({
  dateRange: z
    .object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
    .refine((data) => data.start && data.end, {
      message: 'فترة التقرير مطلوبة',
    })
    .refine(
      (data) => {
        if (data.start && data.end) {
          return new Date(data.end) >= new Date(data.start);
        }
        return true;
      },
      {
        message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
      }
    ),
});

type ReportFormData = z.infer<typeof reportSchema>;

function ReportFilterExample() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      dateRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    },
  });

  const onSubmit = async (data: ReportFormData) => {
    console.log('Generating report for:', data.dateRange);
    // API call here
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormDateRangePicker
        name="dateRange"
        control={control}
        error={errors.dateRange}
        label="فترة التقرير"
        showPresets
        restrictFuture
        required
        disabled={isSubmitting}
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
      >
        {isSubmitting ? 'جاري إنشاء التقرير...' : 'إنشاء تقرير'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 3: Optional Date Range Filter
// ============================================

const optionalSchema = z.object({
  dateRange: z
    .object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
    .nullable()
    .optional()
    .refine(
      (data) => {
        if (!data) return true;
        if (data.start && data.end) {
          return new Date(data.end) >= new Date(data.start);
        }
        return true;
      },
      {
        message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
      }
    ),
});

type OptionalFormData = z.infer<typeof optionalSchema>;

function OptionalFilterExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<OptionalFormData>({
    resolver: zodResolver(optionalSchema),
  });

  const onSubmit = (data: OptionalFormData) => {
    console.log('Filter:', data.dateRange);
    // If null/undefined, show all data
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormDateRangePicker
        name="dateRange"
        control={control}
        error={errors.dateRange}
        label="فلترة حسب التاريخ (اختياري)"
        showPresets
      />
      <button type="submit">تطبيق الفلتر</button>
    </form>
  );
}

// ============================================
// EXAMPLE 4: Dashboard Filters
// ============================================

const dashboardSchema = z.object({
  dateRange: z.object({
    start: z.string().nullable(),
    end: z.string().nullable(),
  }),
  transactionType: z.enum(['all', 'income', 'expense']).optional(),
});

type DashboardFormData = z.infer<typeof dashboardSchema>;

function DashboardFiltersExample() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DashboardFormData>({
    resolver: zodResolver(dashboardSchema),
    defaultValues: {
      dateRange: {
        start: null,
        end: null,
      },
      transactionType: 'all',
    },
  });

  const dateRange = watch('dateRange');

  const onSubmit = (data: DashboardFormData) => {
    console.log('Dashboard filters:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Date Range Picker */}
      <FormDateRangePicker
        name="dateRange"
        control={control}
        error={errors.dateRange}
        label="فترة الإحصائيات"
        showPresets
        restrictFuture
      />

      {/* Show selected range info */}
      {dateRange?.start && dateRange?.end && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            عرض البيانات من <strong>{dateRange.start}</strong> إلى{' '}
            <strong>{dateRange.end}</strong>
          </p>
        </div>
      )}

      <button type="submit" className="btn-primary">
        تحديث الإحصائيات
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 5: Custom Validation - Max 90 Days
// ============================================

const maxRangeSchema = z.object({
  dateRange: z
    .object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    })
    .refine((data) => data.start && data.end, {
      message: 'يجب تحديد تاريخ البداية والنهاية',
    })
    .refine(
      (data) => {
        if (data.start && data.end) {
          return new Date(data.end) >= new Date(data.start);
        }
        return true;
      },
      {
        message: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
      }
    )
    .refine(
      (data) => {
        if (data.start && data.end) {
          const diffInDays =
            (new Date(data.end).getTime() - new Date(data.start).getTime()) /
            (1000 * 60 * 60 * 24);
          return diffInDays <= 90;
        }
        return true;
      },
      {
        message: 'الفترة المحددة يجب ألا تتجاوز 90 يوماً',
      }
    ),
});

type MaxRangeFormData = z.infer<typeof maxRangeSchema>;

function MaxRangeExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<MaxRangeFormData>({
    resolver: zodResolver(maxRangeSchema),
  });

  const onSubmit = (data: MaxRangeFormData) => {
    console.log('Date range (max 90 days):', data.dateRange);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormDateRangePicker
        name="dateRange"
        control={control}
        error={errors.dateRange}
        label="اختر الفترة (حد أقصى 90 يوماً)"
        showPresets
        required
      />
      <button type="submit">تأكيد</button>
    </form>
  );
}

// ============================================
// EXAMPLE 6: Using with Controller (Advanced)
// ============================================

function AdvancedControllerExample() {
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  const dateRange = watch('dateRange');

  const onSubmit = (data: BasicFormData) => {
    console.log('Data:', data);
  };

  // Programmatically set date range
  const setLastMonth = () => {
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 1);

    setValue('dateRange', {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="dateRange"
        control={control}
        render={({ field }) => (
          <DateRangePicker
            value={field.value}
            onChange={field.onChange}
            error={errors.dateRange}
            label="الفترة الزمنية"
            showPresets
          />
        )}
      />

      <button type="button" onClick={setLastMonth} className="btn-secondary">
        آخر شهر
      </button>

      <button type="submit" className="btn-primary">
        إرسال
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 7: With Custom Min/Max Dates
// ============================================

function CustomConstraintsExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  // Only allow dates from 2024 onwards
  const minDate = '2024-01-01';

  const onSubmit = (data: BasicFormData) => {
    console.log('Date range:', data.dateRange);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormDateRangePicker
        name="dateRange"
        control={control}
        error={errors.dateRange}
        label="اختر الفترة (من 2024 فصاعداً)"
        showPresets
        minDate={minDate}
        restrictFuture
        required
      />
      <button type="submit">بحث</button>
    </form>
  );
}

// Export all examples
export {
  BasicExample,
  ReportFilterExample,
  OptionalFilterExample,
  DashboardFiltersExample,
  MaxRangeExample,
  AdvancedControllerExample,
  CustomConstraintsExample,
};
