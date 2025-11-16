import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from './Modal';
import { TransactionType, PaymentMethod, type Transaction } from '../types/transactions.types';
import { useUpdateTransaction } from '../hooks/useTransactions';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  mode: 'view' | 'edit';
}

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

export default function TransactionModal({
  isOpen,
  onClose,
  transaction,
  mode,
}: TransactionModalProps) {
  const updateTransaction = useUpdateTransaction();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
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
    if (!transaction || mode === 'view') return;

    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
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
      onClose();
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ar-IQ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const getTypeLabel = (type: TransactionType) => {
    return type === 'INCOME' ? 'إيراد' : 'مصروف';
  };

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    if (!method) return '-';
    return method === 'CASH' ? 'نقدي' : 'ماستر کارد';
  };

  if (!transaction) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'view' ? 'تفاصيل العملية' : 'تعديل العملية'}
      size="lg"
    >
      {mode === 'view' ? (
        // View Mode - Read-only display
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع العملية
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <span
                  className={`font-semibold ${
                    transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {getTypeLabel(transaction.type)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                <span className="font-semibold">{formatAmount(transaction.amount)} IQD</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {formatDate(transaction.date)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {getPaymentMethodLabel(transaction.paymentMethod)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {transaction.category || '-'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {transaction.type === 'INCOME' ? 'اسم العميل' : 'اسم الموظف/المورد'}
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {transaction.employeeVendorName || '-'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الفرع</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {transaction.branch?.name || '-'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">أنشئ بواسطة</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                {transaction.creator?.username || '-'}
              </div>
            </div>

            {transaction.inventoryItem && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  مرتبط بالمخزون
                </label>
                <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                  <span className="font-medium text-blue-900">
                    {transaction.inventoryItem.name} ({transaction.inventoryItem.quantity}{' '}
                    {transaction.inventoryItem.unit})
                  </span>
                </div>
              </div>
            )}
          </div>

          {transaction.notes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md min-h-[80px]">
                {transaction.notes}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium"
            >
              إغلاق
            </button>
          </div>
        </div>
      ) : (
        // Edit Mode - Editable form
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع العملية <span className="text-red-500">*</span>
              </label>
              <select
                {...register('type')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                المبلغ (IQD) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                التاريخ <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date', { valueAsDate: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* Payment Method - Only for INCOME */}
            {transactionType === 'INCOME' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">الفئة</label>
              <input
                type="text"
                {...register('category')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="مثال: مبيعات، رواتب، إيجار..."
              />
            </div>

            {/* Employee/Vendor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {transactionType === 'INCOME' ? 'اسم العميل' : 'اسم الموظف/المورد'}
              </label>
              <input
                type="text"
                {...register('employeeVendorName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="اسم..."
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="ملاحظات إضافية..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
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
      )}
    </Modal>
  );
}
