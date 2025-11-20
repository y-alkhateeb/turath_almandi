/**
 * ReportFilters - Presentational Component
 * Filter controls for generating reports
 *
 * Features:
 * - Date range picker (for financial and salary reports)
 * - Branch selector (admin only)
 * - Report-specific filters (status for debts, unit for inventory)
 * - Reset button
 * - Generate report button
 * - RTL support
 * - No business logic
 */

import { Calendar, Filter, RefreshCw, FileText } from 'lucide-react';
import { BranchSelector } from '@/components/BranchSelector';
import type { SelectOption } from '@/components/form/FormSelect';
import { useAuth } from '@/hooks/useAuth';
import { toInputDate, startOfMonth } from '@/utils/format';
import { DebtStatus, InventoryUnit } from '@/types/enum';
import type { Branch } from '#/entity';

// ============================================
// DISCRIMINATED UNION FOR FILTERS
// ============================================

export type FinancialReportFilters = {
  type: 'financial';
  startDate: string;
  endDate: string;
  branchId: string | null;
};

export type DebtReportFilters = {
  type: 'debt';
  branchId: string | null;
  status: DebtStatus | 'all';
};

export type InventoryReportFilters = {
  type: 'inventory';
  branchId: string | null;
  unit: InventoryUnit | 'all';
};

export type SalaryReportFilters = {
  type: 'salary';
  startDate: string;
  endDate: string;
  branchId: string | null;
};

export type ReportFilters =
  | FinancialReportFilters
  | DebtReportFilters
  | InventoryReportFilters
  | SalaryReportFilters;

// ============================================
// TYPES
// ============================================

export interface ReportFiltersProps {
  reportType: 'financial' | 'debt' | 'inventory' | 'salary';
  filters: ReportFilters;
  branches: Branch[];
  onChange: (filters: ReportFilters) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Debt status options
 */
const debtStatusOptions: SelectOption[] = [
  { value: 'all', label: 'جميع الحالات' },
  { value: DebtStatus.ACTIVE, label: 'نشط' },
  { value: DebtStatus.PARTIAL, label: 'دفع جزئي' },
  { value: DebtStatus.PAID, label: 'مدفوع' },
];

/**
 * Inventory unit options
 */
const inventoryUnitOptions: SelectOption[] = [
  { value: 'all', label: 'جميع الوحدات' },
  { value: InventoryUnit.KG, label: 'كيلو (KG)' },
  { value: InventoryUnit.PIECE, label: 'قطعة (PIECE)' },
  { value: InventoryUnit.LITER, label: 'لتر (LITER)' },
  { value: InventoryUnit.OTHER, label: 'أخرى (OTHER)' },
];

/**
 * Report type labels
 */
const reportTypeLabels: Record<string, string> = {
  financial: 'التقرير المالي',
  debt: 'تقرير الديون',
  inventory: 'تقرير المخزون',
  salary: 'تقرير الرواتب',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get default filters for a report type
 */
const getDefaultFilters = (reportType: string): ReportFilters => {
  const today = new Date();
  const firstDayOfMonth = toInputDate(startOfMonth(today));
  const todayStr = toInputDate(today);

  switch (reportType) {
    case 'financial':
      return {
        type: 'financial',
        startDate: firstDayOfMonth,
        endDate: todayStr,
        branchId: null,
      };
    case 'debt':
      return {
        type: 'debt',
        branchId: null,
        status: 'all',
      };
    case 'inventory':
      return {
        type: 'inventory',
        branchId: null,
        unit: 'all',
      };
    case 'salary':
      return {
        type: 'salary',
        startDate: firstDayOfMonth,
        endDate: todayStr,
        branchId: null,
      };
    default:
      return {
        type: 'financial',
        startDate: firstDayOfMonth,
        endDate: todayStr,
        branchId: null,
      };
  }
};

// ============================================
// COMPONENT
// ============================================

export function ReportFilters({
  reportType,
  filters,
  branches: _branches,
  onChange,
  onGenerate,
  isGenerating,
}: ReportFiltersProps) {
  const { isAdmin } = useAuth();

  // Handle filter changes
  const handleBranchChange = (branchId: string | null) => {
    onChange({ ...filters, branchId });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (filters.type === 'financial' || filters.type === 'salary') {
      onChange({ ...filters, [field]: value });
    }
  };

  const handleStatusChange = (status: string) => {
    if (filters.type === 'debt') {
      onChange({ ...filters, status: status as DebtStatus | 'all' });
    }
  };

  const handleUnitChange = (unit: string) => {
    if (filters.type === 'inventory') {
      onChange({ ...filters, unit: unit as InventoryUnit | 'all' });
    }
  };

  const handleReset = () => {
    onChange(getDefaultFilters(reportType));
  };

  return (
    <div
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6"
      dir="rtl"
    >
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-100">
              <Filter className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {reportTypeLabels[reportType]}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">حدد المعايير لإنشاء التقرير</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة تعيين
          </button>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Branch Selector - Admin Only */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                الفرع
              </label>
              <BranchSelector
                value={filters.branchId}
                onChange={handleBranchChange}
                placeholder="جميع الفروع"
              />
            </div>
          )}

          {/* Date Range - Financial & Salary Reports */}
          {(filters.type === 'financial' || filters.type === 'salary') && (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  من تاريخ
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  إلى تاريخ
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 [color-scheme:light] dark:[color-scheme:dark]"
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
                </div>
              </div>
            </>
          )}

          {/* Status Filter - Debt Report */}
          {filters.type === 'debt' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                حالة الدين
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {debtStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Unit Filter - Inventory Report */}
          {filters.type === 'inventory' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                الوحدة
              </label>
              <select
                value={filters.unit}
                onChange={(e) => handleUnitChange(e.target.value)}
                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {inventoryUnitOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex justify-end pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                جاري الإنشاء...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                إنشاء التقرير
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportFilters;
