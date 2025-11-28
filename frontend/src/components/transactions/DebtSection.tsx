/**
 * DebtSection Component
 * Section for creating debts when DEBT category is selected
 *
 * Features:
 * - Creditor name input
 * - Amount and due date inputs
 * - Notes field
 * - Creates debt via useCreateDebt hook
 */

import { useState, useEffect } from 'react';
import { useCreateDebt } from '@/hooks/useDebts';
import { DateInput } from '@/components/form';
import { formatCurrency } from '@/utils/format';

interface DebtSectionProps {
  branchId: string | null;
  onSuccess: () => void;
  disabled?: boolean;
}

export function DebtSection({
  branchId,
  onSuccess,
  disabled = false,
}: DebtSectionProps) {
  const createDebt = useCreateDebt();

  // State
  const [creditorName, setCreditorName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  // Reset form when branch changes
  useEffect(() => {
    setCreditorName('');
    setAmount('');
    setNotes('');
    setDueDate('');
  }, [branchId]);

  const isSubmitting = createDebt.isPending;

  const handleSubmit = async () => {
    if (!creditorName || !amount || !date || !dueDate) return;

    try {
      const amountNumber = parseFloat(amount);

      await createDebt.mutateAsync({
        creditorName,
        amount: amountNumber,
        date,
        dueDate,
        notes: notes || undefined,
      });

      // Reset form on success
      setCreditorName('');
      setAmount('');
      setNotes('');
      setDueDate('');
      setDate(new Date().toISOString().split('T')[0]);

      onSuccess();
    } catch (error) {
      // Error handling is done by the mutation hooks
      console.error('Debt creation error:', error);
    }
  };

  if (!branchId) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          يرجى اختيار الفرع أولاً لتسجيل الدين
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
      <h4 className="font-medium text-[var(--text-primary)]">تسجيل دين جديد</h4>

      {/* Creditor Name */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          اسم الدائن <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={creditorName}
          onChange={(e) => setCreditorName(e.target.value)}
          disabled={disabled || isSubmitting}
          className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          placeholder="أدخل اسم الدائن"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          المبلغ <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={disabled || isSubmitting}
          className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          placeholder="0"
        />
      </div>

      {/* Date */}
      <DateInput
        label="تاريخ الدين"
        value={date}
        onChange={(value) => setDate(value || new Date().toISOString().split('T')[0])}
        max={new Date().toISOString().split('T')[0]}
        disabled={disabled || isSubmitting}
        showLabel
      />

      {/* Due Date */}
      <DateInput
        label="تاريخ الاستحقاق"
        value={dueDate}
        onChange={(value) => setDueDate(value || '')}
        min={date}
        disabled={disabled || isSubmitting}
        showLabel
        required
      />

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          ملاحظات (اختياري)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={disabled || isSubmitting}
          rows={2}
          className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed resize-none"
          placeholder="مثال: دين مواد خام، دين مورد..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={disabled || isSubmitting || !creditorName || !amount || !date || !dueDate}
        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting && (
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        تسجيل الدين
      </button>
    </div>
  );
}

export default DebtSection;
