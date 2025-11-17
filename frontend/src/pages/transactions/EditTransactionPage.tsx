import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight } from 'lucide-react';
import { useTransactions, useUpdateTransaction } from '@/hooks/useTransactions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { PageLoading } from '@/components/loading';
import { Alert } from '@/ui/alert';
import { TransactionType, PaymentMethod } from '@/types/transactions.types';

/**
 * Edit Transaction Page
 * Full page for editing a transaction
 */

// Validation schema for edit mode
const editTransactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.string().min(1, 'المبلغ مطلوب'),
  paymentMethod: z.nativeEnum(PaymentMethod).nullable().optional(),
  category: z.string().optional(),
  date: z.date(),
  employeeVendorName: z.string().optional(),
  notes: z.string().optional(),
});

type EditTransactionFormData = z.infer<typeof editTransactionSchema>;

export const EditTransactionPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: transactions = [], isLoading } = useTransactions();
  const updateTransaction = useUpdateTransaction();

  // Find the transaction to edit
  const transaction = transactions.find((t) => t.id === id);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTransactionFormData>({
    resolver: zodResolver(editTransactionSchema),
  });

  const transactionType = watch('type');

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      reset({
        type: transaction.type,
        amount: transaction.amount.toString(),
        paymentMethod: transaction.paymentMethod || undefined,
        category: transaction.category || '',
        date: new Date(transaction.date),
        employeeVendorName: transaction.employeeVendorName || '',
        notes: transaction.notes || '',
      });
    }
  }, [transaction, reset]);

  const onSubmit = async (data: EditTransactionFormData) => {
    if (!transaction || !id) return;

    try {
      await updateTransaction.mutateAsync({
        id,
        data: {
          type: data.type,
          amount: parseFloat(data.amount),
          paymentMethod: data.paymentMethod,
          category: data.category || undefined,
          date: data.date.toISOString().split('T')[0],
          employeeVendorName: data.employeeVendorName || undefined,
          notes: data.notes || undefined,
        },
      });
      navigate('/transactions');
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleCancel = () => {
    navigate('/transactions');
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات العملية..." />;
  }

  if (!transaction) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          لم يتم العثور على العملية المطلوبة
        </Alert>
        <Button onClick={handleCancel}>
          <ArrowRight className="w-4 h-4" />
          العودة إلى العمليات
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            تعديل العملية
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            تعديل بيانات العملية المالية
          </p>
        </div>
      </div>

      {/* Edit Form Card */}
      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                نوع العملية <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="INCOME">إيراد</option>
                <option value="EXPENSE">مصروف</option>
              </select>
              {errors.type && (
                <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                المبلغ (IQD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount')}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                التاريخ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date', { valueAsDate: true })}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Payment Method - Only for INCOME */}
            {transactionType === 'INCOME' && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  طريقة الدفع
                </label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="CASH"
                      {...register('paymentMethod')}
                      className="ml-2 w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">نقدي</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="MASTER"
                      {...register('paymentMethod')}
                      className="ml-2 w-4 h-4 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">ماستر کارد</span>
                  </label>
                </div>
                {errors.paymentMethod && (
                  <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                )}
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الفئة</label>
              <input
                type="text"
                {...register('category')}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="مثال: مبيعات، رواتب، إيجار..."
              />
            </div>

            {/* Employee/Vendor Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                {transactionType === 'INCOME' ? 'اسم العميل' : 'اسم الموظف/المورد'}
              </label>
              <input
                type="text"
                {...register('employeeVendorName')}
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="اسم..."
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">ملاحظات</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors font-medium disabled:opacity-50"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditTransactionPage;
