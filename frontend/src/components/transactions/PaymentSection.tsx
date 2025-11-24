/**
 * PaymentSection Component
 * Unified payment section with payment method, partial payment, and debt creation
 */

import { useState, useEffect } from 'react';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { DateInput } from '@/components/form/DateInput';
import { FormRadioGroup, type RadioOption } from '@/components/form/FormRadioGroup';
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

const paymentMethodOptions: RadioOption[] = [
  { label: 'نقدي', value: 'CASH' },
  { label: 'ماستر كارد', value: 'MASTER' },
];

export const PaymentSection: React.FC<PaymentSectionProps> = ({
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
}) => {
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Calculate remaining amount
  useEffect(() => {
    const remaining = Number(totalAmount) - Number(paidAmount);
    setRemainingAmount(remaining > 0 ? remaining : 0);
  }, [totalAmount, paidAmount]);

  // Reset partial payment when total is 0
  useEffect(() => {
    if (totalAmount === 0) {
      onPartialPaymentChange(false);
      onPaidAmountChange(0);
    }
  }, [totalAmount]);

  // Auto-set paid amount to total when partial payment is disabled
  useEffect(() => {
    if (!isPartialPayment && totalAmount > 0) {
      onPaidAmountChange(totalAmount);
    }
  }, [isPartialPayment, totalAmount]);

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onPaidAmountChange(value);
  };

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">قسم الدفع</h3>

      {/* Total Amount (readonly) */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--text-primary)]">المبلغ الإجمالي:</span>
          <CurrencyAmountCompact
            amount={totalAmount}
            decimals={2}
            className="text-lg font-bold text-[var(--text-primary)]"
          />
        </div>
      </div>

      {/* Payment Method Selection */}
      <FormRadioGroup
        label="طريقة الدفع"
        options={paymentMethodOptions}
        value={paymentMethod}
        onChange={(value) => onPaymentMethodChange(value as 'CASH' | 'MASTER')}
        disabled={disabled}
        required
      />

      {/* Divider */}
      <div className="border-t border-[var(--border-color)] my-4"></div>

      {/* Partial Payment Checkbox */}
      <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
        <input
          type="checkbox"
          checked={isPartialPayment}
          onChange={(e) => onPartialPaymentChange(e.target.checked)}
          disabled={disabled || totalAmount === 0}
          className="w-4 h-4 text-brand-gold-500 border-[var(--border-color)] rounded focus:ring-brand-gold-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-sm font-medium text-[var(--text-primary)]">دفع جزئي</span>
      </label>

      {/* Partial Payment Fields */}
      {isPartialPayment && (
        <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
          {/* Paid Amount Input */}
          <FormInput
            label="المبلغ المدفوع"
            type="number"
            value={paidAmount || ''}
            onChange={handlePaidAmountChange}
            min={0}
            max={totalAmount}
            step="0.01"
            placeholder="أدخل المبلغ المدفوع"
            required
            disabled={disabled}
          />

          {/* Remaining Amount Display */}
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700/40">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-yellow-900 dark:text-yellow-300">
                المتبقي:
              </span>
              <CurrencyAmountCompact
                amount={remainingAmount}
                decimals={2}
                className="text-lg font-bold text-yellow-800 dark:text-yellow-400"
              />
            </div>
          </div>

          {/* Create Debt Checkbox */}
          {remainingAmount > 0 && (
            <>
              <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  checked={createDebt}
                  onChange={(e) => onCreateDebtChange(e.target.checked)}
                  disabled={disabled}
                  className="w-4 h-4 text-brand-gold-500 border-[var(--border-color)] rounded focus:ring-brand-gold-500"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  تسجيل المتبقي كدين
                </span>
              </label>

              {/* Debt Fields */}
              {createDebt && (
                <div className="space-y-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700/50">
                  <h4 className="text-md font-semibold text-amber-900 dark:text-amber-300">
                    معلومات الدين
                  </h4>

                  <FormInput
                    label="اسم الدائن"
                    type="text"
                    value={debtCreditorName}
                    onChange={(e) => onDebtCreditorNameChange(e.target.value)}
                    placeholder="أدخل اسم الدائن"
                    required
                    disabled={disabled}
                  />

                  <DateInput
                    mode="form"
                    label="تاريخ الاستحقاق (اختياري)"
                    value={debtDueDate}
                    onChange={onDebtDueDateChange}
                    disabled={disabled}
                  />

                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded border border-amber-200 dark:border-amber-700/40">
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
};
