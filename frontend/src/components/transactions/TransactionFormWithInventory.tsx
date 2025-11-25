/**
 * TransactionFormWithInventory - نموذج إضافة معاملة جديدة
 *
 * السيناريوهات:
 * 1. مصروف + مشتريات مخزون = شراء وإضافة للمخزون (سعر قابل للتعديل)
 * 2. إيراد + مبيعات المخزون = بيع من المخزون (سعر قابل للتعديل + عرض الربح)
 * 3. باقي الفئات = إدخال مبلغ يدوي
 *
 * الدفع الجزئي متاح لجميع المعاملات
 */

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BranchSelector, DateInput } from '@/components/form';
import { PaymentSection } from './PaymentSection';
import { InventoryItemSection, type SelectedInventoryItem } from './InventoryItemSection';
import { useAuth } from '@/hooks/useAuth';
import { TransactionType } from '@/types/enum';
import type { Transaction } from '#/entity';
import type { TransactionWithInventoryRequest } from '@/types/inventoryOperation.types';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/constants/transactionCategories';
import transactionService from '@/api/services/transactionService';

// ============================================
// VALIDATION SCHEMA
// ============================================

const formSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'الفئة مطلوبة'),
  date: z.string().min(1, 'التاريخ مطلوب'),
  notes: z.string().max(1000).optional(),
  branchId: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

// ============================================
// COMPONENT
// ============================================

interface TransactionFormWithInventoryProps {
  onSuccess?: (transaction: Transaction) => void;
  onCancel?: () => void;
}

export function TransactionFormWithInventory({
  onSuccess,
  onCancel,
}: TransactionFormWithInventoryProps) {
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // حالة الدفع
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MASTER'>('CASH');
  const [isPartialPayment, setIsPartialPayment] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [createDebt, setCreateDebt] = useState(false);
  const [debtCreditorName, setDebtCreditorName] = useState('');
  const [debtDueDate, setDebtDueDate] = useState('');

  // حالة المخزون
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<SelectedInventoryItem | null>(null);
  const [inventoryTotal, setInventoryTotal] = useState(0);

  // المبلغ اليدوي
  const [manualAmount, setManualAmount] = useState(0);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'EXPENSE',
      category: 'OTHER_EXPENSE',
      date: new Date().toISOString().split('T')[0],
      notes: '',
      branchId: isAdmin ? undefined : user?.branchId,
    },
  });

  const transactionType = watch('type');
  const category = watch('category');
  const branchId = watch('branchId') || user?.branchId || null;

  // ============================================
  // حساب الفئات المتاحة
  // ============================================
  const categoryOptions = transactionType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  // ============================================
  // هل نعرض قسم المخزون؟
  // ============================================
  const isInventoryCategory =
    (transactionType === 'EXPENSE' && category === 'INVENTORY') ||
    (transactionType === 'INCOME' && category === 'INVENTORY_SALES');

  // نوع عملية المخزون
  const inventoryOperationType = isInventoryCategory
    ? transactionType === 'EXPENSE'
      ? 'PURCHASE'
      : 'CONSUMPTION'
    : null;

  // ============================================
  // حساب المبلغ الإجمالي
  // ============================================
  const totalAmount = isInventoryCategory ? inventoryTotal : manualAmount;

  // ============================================
  // تأثيرات جانبية
  // ============================================

  // تغيير الفئة الافتراضية عند تغيير النوع
  useEffect(() => {
    const defaultCategory = transactionType === 'INCOME' ? 'SALES' : 'OTHER_EXPENSE';
    setValue('category', defaultCategory);
  }, [transactionType, setValue]);

  // تحديث المبلغ المدفوع عند تغيير الإجمالي
  useEffect(() => {
    if (!isPartialPayment) {
      setPaidAmount(totalAmount);
    }
  }, [totalAmount, isPartialPayment]);

  // إعادة ضبط المخزون عند تغيير الفئة
  useEffect(() => {
    if (!isInventoryCategory) {
      setSelectedInventoryItem(null);
      setInventoryTotal(0);
    }
  }, [isInventoryCategory]);

  // ============================================
  // إرسال النموذج
  // ============================================
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // التحقق من المبلغ
      if (totalAmount <= 0) {
        throw new Error('المبلغ الإجمالي يجب أن يكون أكبر من صفر');
      }

      // التحقق من المخزون
      if (isInventoryCategory) {
        if (!selectedInventoryItem) {
          throw new Error('يرجى اختيار صنف من المخزون');
        }
        if (selectedInventoryItem.quantity <= 0) {
          throw new Error('الكمية يجب أن تكون أكبر من صفر');
        }
        if (selectedInventoryItem.unitPrice <= 0) {
          throw new Error('سعر الوحدة يجب أن يكون أكبر من صفر');
        }
      }

      // التحقق من الدين
      const remainingAmount = totalAmount - paidAmount;
      if (createDebt && remainingAmount > 0 && !debtCreditorName.trim()) {
        throw new Error('اسم الدائن مطلوب عند تسجيل دين');
      }

      // بناء البيانات
      const requestData: TransactionWithInventoryRequest = {
        type: data.type as TransactionType,
        totalAmount,
        paidAmount: isPartialPayment ? paidAmount : totalAmount,
        category: data.category,
        paymentMethod,
        date: data.date,
        notes: data.notes,
        branchId: data.branchId,
        createDebtForRemaining: createDebt && remainingAmount > 0,
        debtCreditorName: createDebt && remainingAmount > 0 ? debtCreditorName : undefined,
        debtDueDate: createDebt && debtDueDate ? debtDueDate : undefined,
      };

      // إضافة بيانات المخزون
      if (isInventoryCategory && selectedInventoryItem && inventoryOperationType) {
        requestData.inventoryItem = {
          itemId: selectedInventoryItem.itemId,
          quantity: selectedInventoryItem.quantity,
          operationType: inventoryOperationType,
          unitPrice: selectedInventoryItem.unitPrice,
        };
      }

      // إرسال الطلب
      const result = await transactionService.createWithInventory(requestData);

      // إعادة ضبط النموذج
      reset();
      setPaymentMethod('CASH');
      setIsPartialPayment(false);
      setPaidAmount(0);
      setCreateDebt(false);
      setDebtCreditorName('');
      setDebtDueDate('');
      setSelectedInventoryItem(null);
      setInventoryTotal(0);
      setManualAmount(0);

      onSuccess?.(result);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'حدث خطأ أثناء إنشاء المعاملة');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // واجهة المستخدم
  // ============================================
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" dir="rtl">
      {/* رسالة الخطأ */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* نوع العملية والفرع */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            نوع العملية <span className="text-red-500">*</span>
          </label>
          <select
            {...register('type')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="EXPENSE">مصروف</option>
            <option value="INCOME">إيراد</option>
          </select>
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type.message}</p>
          )}
        </div>

        {isAdmin ? (
          <Controller
            name="branchId"
            control={control}
            render={({ field }) => (
              <BranchSelector
                value={field.value || null}
                onChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
        ) : user?.branch ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              الفرع
            </label>
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100">
              {user.branch.name}
            </div>
          </div>
        ) : null}
      </div>

      {/* الفئة والتاريخ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            الفئة <span className="text-red-500">*</span>
          </label>
          <select
            {...register('category')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {categoryOptions.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-sm text-red-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        <DateInput
          mode="form"
          name="date"
          label="التاريخ"
          register={register}
          error={errors.date}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* قسم المخزون - يظهر فقط للفئات المتعلقة بالمخزون */}
      {isInventoryCategory && inventoryOperationType && (
        <InventoryItemSection
          branchId={branchId}
          operationType={inventoryOperationType}
          selectedItem={selectedInventoryItem}
          onItemChange={setSelectedInventoryItem}
          onTotalChange={setInventoryTotal}
          disabled={isSubmitting}
        />
      )}

      {/* المبلغ اليدوي - يظهر فقط للفئات العادية */}
      {!isInventoryCategory && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            المبلغ الإجمالي <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={manualAmount || ''}
            onChange={(e) => setManualAmount(parseFloat(e.target.value) || 0)}
            min="0.01"
            step="0.01"
            placeholder="أدخل المبلغ"
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      )}

      {/* قسم الدفع */}
      <PaymentSection
        totalAmount={totalAmount}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        isPartialPayment={isPartialPayment}
        onPartialPaymentChange={setIsPartialPayment}
        paidAmount={paidAmount}
        onPaidAmountChange={setPaidAmount}
        createDebt={createDebt}
        onCreateDebtChange={setCreateDebt}
        debtCreditorName={debtCreditorName}
        onDebtCreditorNameChange={setDebtCreditorName}
        debtDueDate={debtDueDate}
        onDebtDueDateChange={setDebtDueDate}
        disabled={isSubmitting}
      />

      {/* الملاحظات */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          ملاحظات (اختياري)
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          maxLength={1000}
          placeholder="أدخل ملاحظات إضافية"
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
        />
        {errors.notes && (
          <p className="text-sm text-red-500 mt-1">{errors.notes.message}</p>
        )}
      </div>

      {/* أزرار التحكم */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            إلغاء
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          إضافة معاملة
        </button>
      </div>
    </form>
  );
}

export default TransactionFormWithInventory;
