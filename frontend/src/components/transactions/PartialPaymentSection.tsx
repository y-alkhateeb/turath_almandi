/**
 * PartialPaymentSection Component
 * Section for handling partial payments with debt creation
 */

import { useState, useEffect } from 'react';
import { FormInput } from '@/components/form/FormInput';
import { FormTextarea } from '@/components/form/FormTextarea';
import { DateInput } from '@/components/form/DateInput';
import { CurrencyAmountCompact } from '@/components/currency';

interface PartialPaymentSectionProps {
  totalAmount: number;
  paidAmount: number;
  onPaidAmountChange: (value: number) => void;
  createDebt: boolean;
  onCreateDebtChange: (value: boolean) => void;
  debtCreditorName: string;
  onDebtCreditorNameChange: (value: string) => void;
  debtDueDate: string;
  onDebtDueDateChange: (value: string) => void;
  debtNotes: string;
  onDebtNotesChange: (value: string) => void;
  errors?: {
    paidAmount?: string;
    debtCreditorName?: string;
    debtDueDate?: string;
  };
}

export const PartialPaymentSection: React.FC<PartialPaymentSectionProps> = ({
  totalAmount,
  paidAmount,
  onPaidAmountChange,
  createDebt,
  onCreateDebtChange,
  debtCreditorName,
  onDebtCreditorNameChange,
  debtDueDate,
  onDebtDueDateChange,
  debtNotes,
  onDebtNotesChange,
  errors = {},
}) => {
  const [remainingAmount, setRemainingAmount] = useState(0);

  useEffect(() => {
    const remaining = Number(totalAmount) - Number(paidAmount);
    setRemainingAmount(remaining > 0 ? remaining : 0);
  }, [totalAmount, paidAmount]);

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onPaidAmountChange(value);
  };

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-secondary)] dark:bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">الدفع</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Amount */}
        <FormInput
          label="المبلغ الإجمالي"
          type="number"
          value={totalAmount}
          disabled
          className="opacity-70"
        />

        {/* Paid Amount */}
        <FormInput
          label="المبلغ المدفوع"
          type="number"
          value={paidAmount || ''}
          onChange={handlePaidAmountChange}
          error={errors.paidAmount}
          min={0}
          max={totalAmount}
          step="0.01"
          placeholder="أدخل المبلغ المدفوع"
        />

        {/* Remaining Amount */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            المتبقي
          </label>
          <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-md">
            <CurrencyAmountCompact
              amount={remainingAmount}
              decimals={2}
              className="text-lg font-semibold text-yellow-800 dark:text-yellow-400"
            />
          </div>
        </div>
      </div>

      {/* Create Debt Checkbox */}
      {remainingAmount > 0 && (
        <div className="mt-4">
          <label className="flex items-center space-x-2 space-x-reverse cursor-pointer">
            <input
              type="checkbox"
              checked={createDebt}
              onChange={(e) => onCreateDebtChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 dark:text-blue-400 border-[var(--border-color)] rounded focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span className="text-sm font-medium text-[var(--text-primary)]">
              تسجيل المبلغ المتبقي كدين
            </span>
          </label>
        </div>
      )}

      {/* Debt Fields */}
      {createDebt && remainingAmount > 0 && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700/50 space-y-4">
          <h4 className="text-md font-semibold text-blue-900 dark:text-blue-300">معلومات الدين</h4>

          <FormInput
            label="اسم الدائن *"
            type="text"
            value={debtCreditorName}
            onChange={(e) => onDebtCreditorNameChange(e.target.value)}
            error={errors.debtCreditorName}
            placeholder="أدخل اسم الدائن"
            required
          />

          <DateInput
            label="تاريخ الاستحقاق"
            value={debtDueDate}
            onChange={onDebtDueDateChange}
            error={errors.debtDueDate}
          />

          <FormTextarea
            label="ملاحظات الدين"
            value={debtNotes}
            onChange={(e) => onDebtNotesChange(e.target.value)}
            placeholder="ملاحظات إضافية حول الدين"
            rows={3}
          />

          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700/40">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>مبلغ الدين:</strong> <CurrencyAmountCompact amount={remainingAmount} decimals={2} />
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
