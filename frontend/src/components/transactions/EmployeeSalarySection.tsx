/**
 * EmployeeSalarySection Component
 * Section for handling employee salary-related transactions
 *
 * Features:
 * - Employee selection (filtered by branch)
 * - Action type selection (Salary, Bonus, Advance)
 * - Dynamic fields based on action type
 * - Integrates with employee salary/bonus/advance APIs
 */

import { useState, useEffect } from 'react';
import { useActiveEmployeesByBranch, useRecordSalaryPayment, useCreateBonus, useCreateAdvance } from '@/hooks/useEmployees';
import { DateInput } from '@/components/form';
import { formatCurrency } from '@/utils/format';
import type { Employee } from '@/types';
import { EMPLOYEE_ACTION_OPTIONS, type EmployeeActionType } from '@/constants/transactionCategories';

interface EmployeeSalarySectionProps {
  branchId: string | null;
  onSuccess: () => void;
  disabled?: boolean;
}

export function EmployeeSalarySection({
  branchId,
  onSuccess,
  disabled = false,
}: EmployeeSalarySectionProps) {
  // Fetch employees for the selected branch
  const { data: employees = [], isLoading: isLoadingEmployees } = useActiveEmployeesByBranch(branchId);

  // State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [actionType, setActionType] = useState<EmployeeActionType>('SALARY');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [monthlyDeduction, setMonthlyDeduction] = useState<string>('');

  // Mutations
  const recordSalaryPayment = useRecordSalaryPayment();
  const createBonus = useCreateBonus();
  const createAdvance = useCreateAdvance();

  // Get selected employee details
  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

  // Reset form when branch changes
  useEffect(() => {
    setSelectedEmployeeId('');
    setAmount('');
    setNotes('');
    setReason('');
    setMonthlyDeduction('');
  }, [branchId]);

  // Pre-fill amount with salary when employee is selected and action is SALARY
  useEffect(() => {
    if (selectedEmployee && actionType === 'SALARY') {
      const totalSalary = Number(selectedEmployee.baseSalary) + Number(selectedEmployee.allowance || 0);
      setAmount(totalSalary.toString());
    } else if (actionType !== 'SALARY') {
      setAmount('');
    }
  }, [selectedEmployee, actionType]);

  const isSubmitting = recordSalaryPayment.isPending || createBonus.isPending || createAdvance.isPending;

  const handleSubmit = async () => {
    if (!selectedEmployeeId || !amount || !date) return;

    try {
      const amountNumber = parseFloat(amount);

      switch (actionType) {
        case 'SALARY':
          await recordSalaryPayment.mutateAsync({
            employeeId: selectedEmployeeId,
            data: {
              amount: amountNumber,
              paymentDate: date,
              notes: notes || undefined,
            },
          });
          break;

        case 'BONUS':
          await createBonus.mutateAsync({
            employeeId: selectedEmployeeId,
            data: {
              amount: amountNumber,
              bonusDate: date,
              reason: reason || undefined,
            },
          });
          break;

        case 'ADVANCE':
          const monthlyDeductionNumber = parseFloat(monthlyDeduction);
          if (!monthlyDeductionNumber) return;

          await createAdvance.mutateAsync({
            employeeId: selectedEmployeeId,
            amount: amountNumber,
            monthlyDeduction: monthlyDeductionNumber,
            advanceDate: date,
            reason: reason || undefined,
          });
          break;
      }

      // Reset form on success
      setSelectedEmployeeId('');
      setAmount('');
      setNotes('');
      setReason('');
      setMonthlyDeduction('');
      setDate(new Date().toISOString().split('T')[0]);

      onSuccess();
    } catch (error) {
      // Error handling is done by the mutation hooks
      console.error('Employee salary action error:', error);
    }
  };

  // Calculate 2-month salary warning for advances
  const twoMonthsSalary = selectedEmployee
    ? (Number(selectedEmployee.baseSalary) + Number(selectedEmployee.allowance || 0)) * 2
    : 0;
  const advanceExceedsTwoMonths = actionType === 'ADVANCE' && parseFloat(amount) > twoMonthsSalary;

  // Estimated months for advance repayment
  const estimatedMonths = actionType === 'ADVANCE' && parseFloat(amount) > 0 && parseFloat(monthlyDeduction) > 0
    ? Math.ceil(parseFloat(amount) / parseFloat(monthlyDeduction))
    : 0;

  if (!branchId) {
    return (
      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          يرجى اختيار الفرع أولاً لعرض الموظفين
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
      <h4 className="font-medium text-[var(--text-primary)]">رواتب الموظفين</h4>

      {/* Employee Selector */}
      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          اختر الموظف <span className="text-red-500">*</span>
        </label>
        {isLoadingEmployees ? (
          <div className="w-full px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse">
            جاري تحميل الموظفين...
          </div>
        ) : employees.length === 0 ? (
          <div className="w-full px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-200 text-sm">
            لا يوجد موظفين نشطين في هذا الفرع
          </div>
        ) : (
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            disabled={disabled || isSubmitting}
            dir="rtl"
            className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          >
            <option value="">-- اختر الموظف --</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name} - {employee.position}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Employee Info Card */}
      {selectedEmployee && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">الراتب الأساسي:</span>
              <span className="mr-2 font-medium text-blue-900 dark:text-blue-100">
                {formatCurrency(selectedEmployee.baseSalary)}
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">البدلات:</span>
              <span className="mr-2 font-medium text-blue-900 dark:text-blue-100">
                {formatCurrency(selectedEmployee.allowance || 0)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-blue-700 dark:text-blue-300">إجمالي الراتب:</span>
              <span className="mr-2 font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(Number(selectedEmployee.baseSalary) + Number(selectedEmployee.allowance || 0))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Type Selector */}
      {selectedEmployeeId && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            نوع العملية <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {EMPLOYEE_ACTION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setActionType(option.value)}
                disabled={disabled || isSubmitting}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  actionType === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-primary-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Fields based on Action Type */}
      {selectedEmployeeId && (
        <div className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {actionType === 'SALARY' ? 'مبلغ الراتب' : actionType === 'BONUS' ? 'مبلغ المكافأة' : 'مبلغ السلفة'}{' '}
              <span className="text-red-500">*</span>
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

          {/* Monthly Deduction - Only for Advance */}
          {actionType === 'ADVANCE' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                مبلغ الخصم الشهري <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={monthlyDeduction}
                onChange={(e) => setMonthlyDeduction(e.target.value)}
                disabled={disabled || isSubmitting}
                className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
                placeholder="0"
              />
              {estimatedMonths > 0 && (
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  عدد الأشهر المتوقعة للسداد: {estimatedMonths} شهر
                </p>
              )}
            </div>
          )}

          {/* Date */}
          <DateInput
            label={actionType === 'SALARY' ? 'تاريخ الدفع' : actionType === 'BONUS' ? 'تاريخ المكافأة' : 'تاريخ السلفة'}
            value={date}
            onChange={(value) => setDate(value || new Date().toISOString().split('T')[0])}
            max={new Date().toISOString().split('T')[0]}
            disabled={disabled || isSubmitting}
            showLabel
          />

          {/* Notes/Reason */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              {actionType === 'SALARY' ? 'ملاحظات' : 'السبب'} (اختياري)
            </label>
            <textarea
              value={actionType === 'SALARY' ? notes : reason}
              onChange={(e) => actionType === 'SALARY' ? setNotes(e.target.value) : setReason(e.target.value)}
              disabled={disabled || isSubmitting}
              rows={2}
              className="w-full px-4 py-3 border border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed resize-none"
              placeholder={actionType === 'SALARY' ? 'مثال: راتب شهر نوفمبر' : 'مثال: أداء متميز، مصاريف طبية...'}
            />
          </div>

          {/* Warning for Advance exceeding 2 months salary */}
          {advanceExceedsTwoMonths && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-amber-800 dark:text-amber-200 font-medium text-sm">
                تحذير: مبلغ السلفة يتجاوز راتب شهرين!
              </p>
              <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                قيمة راتب شهرين: {formatCurrency(twoMonthsSalary)}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isSubmitting || !selectedEmployeeId || !amount || !date || (actionType === 'ADVANCE' && !monthlyDeduction)}
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
            {actionType === 'SALARY' ? 'تسجيل الراتب' : actionType === 'BONUS' ? 'تسجيل المكافأة' : 'تسجيل السلفة'}
          </button>
        </div>
      )}
    </div>
  );
}

export default EmployeeSalarySection;
