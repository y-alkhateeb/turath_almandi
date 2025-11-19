/**
 * DashboardFilters - Presentational Component
 * Filter controls for dashboard data
 *
 * Features:
 * - Branch selector (admin only)
 * - Date picker
 * - Quick date buttons (today, this week, this month)
 * - RTL support
 * - No business logic
 */

import { Calendar } from 'lucide-react';
import { BranchSelector } from '@/components/BranchSelector';
import { useAuth } from '@/hooks/useAuth';
import { toInputDate, startOfDay, startOfMonth } from '@/utils/format';
import type { Branch, DashboardFilters as DashboardFiltersType } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  branches: Branch[];
  onChange: (filters: DashboardFiltersType) => void;
}

// ============================================
// QUICK DATE OPTIONS
// ============================================

interface QuickDateOption {
  label: string;
  value: string;
}

/**
 * Get quick date options
 */
const getQuickDateOptions = (): QuickDateOption[] => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

  const startOfMonthDate = startOfMonth(today);

  return [
    {
      label: 'اليوم',
      value: toInputDate(startOfDay(today)),
    },
    {
      label: 'هذا الأسبوع',
      value: toInputDate(startOfWeek),
    },
    {
      label: 'هذا الشهر',
      value: toInputDate(startOfMonthDate),
    },
  ];
};

// ============================================
// COMPONENT
// ============================================

export function DashboardFilters({
  filters,
  branches,
  onChange,
}: DashboardFiltersProps) {
  const { isAdmin } = useAuth();
  const quickDateOptions = getQuickDateOptions();

  // Handle branch change
  const handleBranchChange = (branchId: string | null) => {
    onChange({
      ...filters,
      branchId: branchId || undefined,
    });
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    onChange({
      ...filters,
      date: date || undefined,
    });
  };

  // Handle quick date selection
  const handleQuickDate = (date: string) => {
    onChange({
      ...filters,
      date,
    });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    onChange({
      branchId: undefined,
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  // Check if any filters are active
  const hasActiveFilters = !!(filters.branchId || filters.date || filters.startDate || filters.endDate);

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6" dir="rtl">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            الفلاتر
          </h3>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Branch Selector - Admin Only */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                الفرع
              </label>
              <BranchSelector
                value={filters.branchId || null}
                onChange={handleBranchChange}
                placeholder="جميع الفروع"
              />
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              التاريخ
            </label>
            <div className="relative">
              <input
                type="date"
                value={filters.date || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-4 py-2 pr-10 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
            </div>
          </div>

          {/* Quick Date Buttons */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              اختيار سريع
            </label>
            <div className="flex gap-2">
              {quickDateOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickDate(option.value)}
                  className={`
                    px-4 py-2 text-sm font-medium rounded-lg border transition-colors flex-1
                    ${
                      filters.date === option.value
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Date Range (Optional - for future use) */}
        {(filters.startDate || filters.endDate) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[var(--border-color)]">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                من تاريخ
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    startDate: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    endDate: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardFilters;
