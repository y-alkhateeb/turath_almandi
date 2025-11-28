/**
 * PaymentSection - قسم الدفع
 * يدعم الدفع الجزئي لجميع أنواع المعاملات (إيراد ومصروف)
 */

import { useEffect, useState } from 'react';
import { CurrencyAmountCompact } from '@/components/currency';

interface PaymentSectionProps {
  totalAmount: number;
  paymentMethod: 'CASH' | 'MASTER';
  onPaymentMethodChange: (method: 'CASH' | 'MASTER') => void;
  isPartialPayment: boolean;
  onPartialPaymentChange: (value: boolean) => void;
  paidAmount: number;
  onPaidAmountChange: (value: number) => void;
  createDebt: boolean;
  onCreateDebtChange: (value: boolean) => void;
  debtCreditorName: string;
  onDebtCreditorNameChange: (value: string) => void;
  debtDueDate: string;
  onDebtDueDateChange: (value: string) => void;
  disabled?: boolean;
  isExpense?: boolean; // المصروفات = نقدي فقط
  isDebtCategory?: boolean; // فئة الدين - إظهار نموذج الدين مباشرة
  allowPartialPayment?: boolean; // السماح بالدفع الجزئي
}

export function PaymentSection({
  totalAmount,
  paymentMethod,
  onPaymentMethodChange,
  isPartialPayment,
  onPartialPaymentChange,
  paidAmount,
  onPaidAmountChange,
  createDebt,
  onCreateDebtChange,
  debtCreditorName,
  onDebtCreditorNameChange,
  debtDueDate,
  onDebtDueDateChange,
  disabled = false,
  isExpense = false,
  isDebtCategory = false,
  allowPartialPayment = true,
}: PaymentSectionProps) {
  const [remainingAmount, setRemainingAmount] = useState(0);

  // حساب المبلغ المتبقي
  useEffect(() => {
    const remaining = totalAmount - paidAmount;
    setRemainingAmount(remaining > 0 ? remaining : 0);
  }, [totalAmount, paidAmount]);

  // إعادة ضبط الدفع الجزئي عندما يكون المبلغ 0
  useEffect(() => {
    if (totalAmount === 0) {
      onPartialPaymentChange(false);
      onPaidAmountChange(0);
    }
  }, [totalAmount, onPartialPaymentChange, onPaidAmountChange]);

  // تعيين المبلغ المدفوع = الإجمالي عند إلغاء الدفع الجزئي
  useEffect(() => {
    if (!isPartialPayment && totalAmount > 0) {
      onPaidAmountChange(totalAmount);
    }
  }, [isPartialPayment, totalAmount, onPaidAmountChange]);

  // For DEBT category, show debt form directly
  if (isDebtCategory) {
    return (
      <div className="space-y-4 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          تسجيل الدين
        </h3>

        {/* المبلغ الإجمالي */}
        <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              مبلغ الدين:
            </span>
            <CurrencyAmountCompact
              amount={totalAmount}
              decimals={2}
              className="text-lg font-bold text-[var(--text-primary)]"
            />
          </div>
        </div>

        {/* حقول الدين مباشرة */}
        <div className="space-y-4 p-4 bg-brand-gold-50 dark:bg-brand-gold-900/20 rounded-lg border border-brand-gold-200 dark:border-brand-gold-700">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              اسم الدائن <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={debtCreditorName}
              onChange={(e) => onDebtCreditorNameChange(e.target.value)}
              placeholder="أدخل اسم الدائن"
              disabled={disabled}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              تاريخ الاستحقاق (اختياري)
            </label>
            <input
              type="date"
              value={debtDueDate}
              onChange={(e) => onDebtDueDateChange(e.target.value)}
              disabled={disabled}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-200"
              dir="ltr"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        قسم الدفع
      </h3>

      {/* المبلغ الإجمالي */}
      <div className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            المبلغ الإجمالي:
          </span>
          <CurrencyAmountCompact
            amount={totalAmount}
            decimals={2}
            className="text-lg font-bold text-[var(--text-primary)]"
          />
        </div>
      </div>

      {/* طريقة الدفع */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          طريقة الدفع
        </label>
        {isExpense ? (
          // المصروفات = نقدي فقط
          <div className="px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg">
            <span className="text-[var(--text-primary)]">نقدي</span>
            <span className="text-xs text-[var(--text-secondary)] mr-2">(المصروفات تدفع نقدًا فقط)</span>
          </div>
        ) : (
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="CASH"
                checked={paymentMethod === 'CASH'}
                onChange={() => onPaymentMethodChange('CASH')}
                disabled={disabled}
                className="w-4 h-4 text-brand-gold-600 focus:ring-brand-gold-500"
              />
              <span className="mr-2 text-[var(--text-primary)]">نقدي</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="paymentMethod"
                value="MASTER"
                checked={paymentMethod === 'MASTER'}
                onChange={() => onPaymentMethodChange('MASTER')}
                disabled={disabled}
                className="w-4 h-4 text-brand-gold-600 focus:ring-brand-gold-500"
              />
              <span className="mr-2 text-[var(--text-primary)]">ماستر كارد</span>
            </label>
          </div>
        )}
      </div>

      {/* خيار الدفع الجزئي - فقط للفئات المسموح بها */}
      {allowPartialPayment && (
        <>
          <div className="border-t border-[var(--border-color)] my-4"></div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPartialPayment}
              onChange={(e) => onPartialPaymentChange(e.target.checked)}
              disabled={disabled || totalAmount === 0}
              className="w-4 h-4 text-brand-gold-600 border-[var(--border-color)] rounded focus:ring-brand-gold-500"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              دفع جزئي
            </span>
          </label>
        </>
      )}

      {/* حقول الدفع الجزئي */}
      {isPartialPayment && (
        <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
          {/* المبلغ المدفوع */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              المبلغ المدفوع
            </label>
            <input
              type="number"
              value={paidAmount || ''}
              onChange={(e) => onPaidAmountChange(parseFloat(e.target.value) || 0)}
              min={0}
              max={totalAmount}
              step="0.01"
              placeholder="أدخل المبلغ المدفوع"
              disabled={disabled}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
            />
          </div>

          {/* المتبقي */}
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                المتبقي:
              </span>
              <CurrencyAmountCompact
                amount={remainingAmount}
                decimals={2}
                className="text-lg font-bold text-amber-800 dark:text-amber-300"
              />
            </div>
          </div>

          {/* تسجيل الدين */}
          {remainingAmount > 0 && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDebt}
                  onChange={(e) => onCreateDebtChange(e.target.checked)}
                  disabled={disabled}
                  className="w-4 h-4 text-brand-gold-600 border-[var(--border-color)] rounded focus:ring-brand-gold-500"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  تسجيل المتبقي كدين
                </span>
              </label>

              {createDebt && (
                <div className="space-y-4 p-4 bg-brand-gold-50 dark:bg-brand-gold-900/20 rounded-lg border border-brand-gold-200 dark:border-brand-gold-700">
                  <h4 className="text-md font-semibold text-brand-gold-900 dark:text-brand-gold-300">
                    معلومات الدين
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      اسم الدائن <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={debtCreditorName}
                      onChange={(e) => onDebtCreditorNameChange(e.target.value)}
                      placeholder="أدخل اسم الدائن"
                      disabled={disabled}
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      تاريخ الاستحقاق (اختياري)
                    </label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => onDebtDueDateChange(e.target.value)}
                      disabled={disabled}
                      className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:brightness-200"
                      dir="ltr"
                    />
                  </div>

                  <div className="p-3 bg-brand-gold-100 dark:bg-brand-gold-900/30 rounded">
                    <p className="text-sm text-brand-gold-800 dark:text-brand-gold-300">
                      <strong>مبلغ الدين:</strong>{' '}
                      <CurrencyAmountCompact amount={remainingAmount} decimals={2} />
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentSection;
