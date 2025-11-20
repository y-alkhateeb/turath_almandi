import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useDebt, usePayDebt } from '@/hooks/useDebts';
import { Card } from '@/components/ui/Card';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { PageLoading } from '@/components/loading';
import { Alert } from '@/ui/alert';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { PayDebtFormData } from '@/types/debts.types';

/**
 * Pay Debt Page
 * Full page for paying an existing debt
 */
export const PayDebtPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: debt, isLoading, error } = useDebt(id || '');
  const payDebt = usePayDebt();

  const createPayDebtSchema = (maxAmount: number) =>
    z.object({
      amountPaid: z
        .string()
        .min(1, { message: 'المبلغ المدفوع مطلوب' })
        .refine(
          (val) => {
            const num = parseFloat(val);
            return !isNaN(num) && num > 0;
          },
          { message: 'المبلغ يجب أن يكون رقم أكبر من صفر' }
        )
        .refine(
          (val) => {
            const num = parseFloat(val);
            return num <= maxAmount;
          },
          { message: `المبلغ المدفوع لا يمكن أن يتجاوز المبلغ المتبقي (${maxAmount})` }
        ),
      paymentDate: z.date({ message: 'تاريخ الدفع مطلوب' }),
      notes: z.string(),
    });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset: _reset,
  } = useForm<PayDebtFormData>({
    resolver: debt ? zodResolver(createPayDebtSchema(debt.remainingAmount)) : undefined,
    defaultValues: {
      amountPaid: '',
      paymentDate: new Date(),
      notes: '',
    },
  });

  const onSubmit = async (data: PayDebtFormData) => {
    if (!debt || !id) return;

    try {
      const paymentData = {
        amountPaid: parseFloat(data.amountPaid),
        paymentDate: data.paymentDate.toISOString().split('T')[0],
        notes: data.notes || undefined,
      };

      await payDebt.mutateAsync({ debtId: id, data: paymentData });
      navigate('/debts');
    } catch (error) {
      console.error('Failed to pay debt:', error);
    }
  };

  const handleCancel = () => {
    navigate('/debts');
  };

  if (isLoading) {
    return <PageLoading message="جاري تحميل بيانات الدين..." />;
  }

  if (error || !debt) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          {error?.message || 'لم يتم العثور على الدين المطلوب'}
        </Alert>
        <Button onClick={handleCancel}>
          <ArrowRight className="w-4 h-4" />
          العودة إلى قائمة الديون
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">دفع دين</h1>
          <p className="text-[var(--text-secondary)] mt-1">دفع دين {debt.creditorName}</p>
        </div>
      </div>

      {/* Debt Details Card */}
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">تفاصيل الدين</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">اسم الدائن</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{debt.creditorName}</p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-secondary)]">الحالة</p>
            <Badge
              variant={
                debt.status === 'PAID'
                  ? 'success'
                  : debt.status === 'PARTIAL'
                    ? 'warning'
                    : 'destructive'
              }
            >
              {debt.status === 'PAID'
                ? 'مدفوع'
                : debt.status === 'PARTIAL'
                  ? 'مدفوع جزئياً'
                  : 'نشط'}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-[var(--text-secondary)]">المبلغ الأصلي</p>
            <p className="text-sm font-medium text-[var(--text-primary)]" dir="ltr">
              ${debt.originalAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--text-secondary)]">المبلغ المتبقي</p>
            <p className="text-sm font-bold text-red-600" dir="ltr">
              ${debt.remainingAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {debt.dueDate && (
          <div className="pt-2 border-t border-[var(--border-color)] mt-3">
            <p className="text-xs text-[var(--text-secondary)]">تاريخ الاستحقاق</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {new Date(debt.dueDate).toLocaleDateString('ar-SA')}
            </p>
          </div>
        )}
      </Card>

      {/* Payment Form */}
      <Card padding="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <FormInput
              name="amountPaid"
              label="المبلغ المراد دفعه"
              type="number"
              register={register}
              error={errors.amountPaid}
              required
              disabled={isSubmitting}
              placeholder="0.00"
              step="0.01"
              min="0"
              max={debt.remainingAmount}
            />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              الحد الأقصى: ${debt.remainingAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <label
              htmlFor="paymentDate"
              className="block text-sm font-medium text-[var(--text-primary)] mb-2"
            >
              تاريخ الدفع <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="paymentDate"
              {...register('paymentDate', {
                valueAsDate: true,
              })}
              defaultValue={new Date().toISOString().split('T')[0]}
              className={`w-full px-4 py-3 border ${
                errors.paymentDate ? 'border-red-500' : 'border-[var(--border-color)]'
              } rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.paymentDate && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
            )}
          </div>

          <FormTextarea
            name="notes"
            label="ملاحظات"
            register={register}
            error={errors.notes}
            disabled={isSubmitting}
            placeholder="أضف أي ملاحظات إضافية هنا..."
            rows={3}
          />

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || payDebt.isPending}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {(isSubmitting || payDebt.isPending) && <LoadingSpinner size="sm" color="white" />}
              {isSubmitting || payDebt.isPending ? 'جاري الدفع...' : 'دفع الدين'}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting || payDebt.isPending}
              className="px-6 py-3 border border-[var(--border-color)] rounded-lg font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              إلغاء
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default PayDebtPage;
