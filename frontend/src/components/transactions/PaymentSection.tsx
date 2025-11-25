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

  return (
    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        قسم الدفع
      </h3>

      {/* المبلغ الإجمالي */}
      <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            المبلغ الإجمالي:
          </span>
          <CurrencyAmountCompact
            amount={totalAmount}
            decimals={2}
            className="text-lg font-bold text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* طريقة الدفع */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          طريقة الدفع
        </label>
        <div className="flex gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="CASH"
              checked={paymentMethod === 'CASH'}
              onChange={() => onPaymentMethodChange('CASH')}
              disabled={disabled}
              className="w-4 h-4 text-amber-600 focus:ring-amber-500"
            />
            <span className="mr-2 text-gray-700 dark:text-gray-300">نقدي</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="paymentMethod"
              value="MASTER"
              checked={paymentMethod === 'MASTER'}
              onChange={() => onPaymentMethodChange('MASTER')}
              disabled={disabled}
              className="w-4 h-4 text-amber-600 focus:ring-amber-500"
            />
            <span className="mr-2 text-gray-700 dark:text-gray-300">ماستر كارد</span>
          </label>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 my-4"></div>

      {/* خيار الدفع الجزئي */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPartialPayment}
          onChange={(e) => onPartialPaymentChange(e.target.checked)}
          disabled={disabled || totalAmount === 0}
          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          دفع جزئي
        </span>
      </label>

      {/* حقول الدفع الجزئي */}
      {isPartialPayment && (
        <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
          {/* المبلغ المدفوع */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* المتبقي */}
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                المتبقي:
              </span>
              <CurrencyAmountCompact
                amount={remainingAmount}
                decimals={2}
                className="text-lg font-bold text-yellow-800 dark:text-yellow-300"
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
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  تسجيل المتبقي كدين
                </span>
              </label>

              {createDebt && (
                <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                  <h4 className="text-md font-semibold text-amber-900 dark:text-amber-300">
                    معلومات الدين
                  </h4>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      اسم الدائن <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={debtCreditorName}
                      onChange={(e) => onDebtCreditorNameChange(e.target.value)}
                      placeholder="أدخل اسم الدائن"
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      تاريخ الاستحقاق (اختياري)
                    </label>
                    <input
                      type="date"
                      value={debtDueDate}
                      onChange={(e) => onDebtDueDateChange(e.target.value)}
                      disabled={disabled}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
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
