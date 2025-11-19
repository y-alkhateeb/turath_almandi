/**
 * DatePicker Usage Examples
 *
 * This file demonstrates various ways to use the DatePicker component
 * with React Hook Form, Zod validation, and different configurations.
 */

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DatePicker } from './DatePicker';
import { FormDatePicker } from './FormDatePicker';

// ============================================
// EXAMPLE 1: Basic Usage with Controller
// ============================================

const basicSchema = z.object({
  date: z
    .string()
    .min(1, { message: 'التاريخ مطلوب' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح',
    }),
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
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="date"
        control={control}
        render={({ field }) => (
          <DatePicker
            value={field.value}
            onChange={field.onChange}
            error={errors.date}
            label="التاريخ"
            required
          />
        )}
      />
      <button type="submit">إرسال</button>
    </form>
  );
}

// ============================================
// EXAMPLE 2: Using FormDatePicker Wrapper
// ============================================

function SimpleExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  const onSubmit = (data: BasicFormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormDatePicker name="date" control={control} error={errors.date} label="التاريخ" required />
      <button type="submit">إرسال</button>
    </form>
  );
}

// ============================================
// EXAMPLE 3: Restrict Future Dates
// ============================================

const transactionSchema = z.object({
  date: z
    .string()
    .min(1, { message: 'التاريخ مطلوب' })
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح',
    })
    .refine((date) => new Date(date) <= new Date(), {
      message: 'التاريخ لا يمكن أن يكون في المستقبل',
    }),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

function TransactionExample() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Today
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    console.log('Transaction date:', data.date);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormDatePicker
        name="date"
        control={control}
        error={errors.date}
        label="تاريخ العملية"
        restrictFuture
        required
        disabled={isSubmitting}
        helperText="اختر تاريخ العملية (لا يمكن اختيار تاريخ مستقبلي)"
      />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 4: Date Range (Min/Max Dates)
// ============================================

const debtSchema = z
  .object({
    date: z
      .string()
      .min(1, { message: 'تاريخ الدين مطلوب' })
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'التاريخ غير صالح',
      }),
    dueDate: z
      .string()
      .min(1, { message: 'تاريخ الاستحقاق مطلوب' })
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'التاريخ غير صالح',
      }),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.date), {
    message: 'تاريخ الاستحقاق يجب أن يكون مساوياً أو بعد تاريخ الدين',
    path: ['dueDate'],
  });

type DebtFormData = z.infer<typeof debtSchema>;

function DebtExample() {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DebtFormData>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
    },
  });

  // Watch the debt date to set minimum for due date
  const debtDate = watch('date');

  const onSubmit = async (data: DebtFormData) => {
    console.log('Debt data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Debt Date */}
      <FormDatePicker
        name="date"
        control={control}
        error={errors.date}
        label="تاريخ الدين"
        restrictFuture
        required
        disabled={isSubmitting}
      />

      {/* Due Date */}
      <FormDatePicker
        name="dueDate"
        control={control}
        error={errors.dueDate}
        label="تاريخ الاستحقاق"
        minDate={debtDate} // Must be after or equal to debt date
        required
        disabled={isSubmitting}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'جاري الإضافة...' : 'إضافة دين'}
      </button>
    </form>
  );
}

// ============================================
// EXAMPLE 5: Optional Date Field
// ============================================

const reportSchema = z.object({
  startDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح',
    }),
  endDate: z
    .string()
    .optional()
    .refine((date) => !date || !isNaN(Date.parse(date)), {
      message: 'التاريخ غير صالح',
    }),
});

type ReportFormData = z.infer<typeof reportSchema>;

function ReportFilterExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = (data: ReportFormData) => {
    console.log('Report filters:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormDatePicker
        name="startDate"
        control={control}
        error={errors.startDate}
        label="من تاريخ"
        placeholder="اختياري"
        helperText="اترك فارغاً لعرض كل التواريخ"
      />

      <FormDatePicker
        name="endDate"
        control={control}
        error={errors.endDate}
        label="إلى تاريخ"
        placeholder="اختياري"
        restrictFuture
      />

      <button type="submit">عرض التقرير</button>
    </form>
  );
}

// ============================================
// EXAMPLE 6: With Custom Max Date
// ============================================

function CustomMaxDateExample() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<BasicFormData>({
    resolver: zodResolver(basicSchema),
  });

  // Max date is 30 days from now
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  const onSubmit = (data: BasicFormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormDatePicker
        name="date"
        control={control}
        error={errors.date}
        label="تاريخ الموعد"
        maxDate={maxDate}
        required
        helperText="يمكن اختيار تاريخ حتى 30 يوماً من الآن"
      />
      <button type="submit">حجز</button>
    </form>
  );
}

// Export all examples
export {
  BasicExample,
  SimpleExample,
  TransactionExample,
  DebtExample,
  ReportFilterExample,
  CustomMaxDateExample,
};
