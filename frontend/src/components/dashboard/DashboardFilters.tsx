/**
 * DashboardFilters - Presentational Component
 * Modern filter controls for dashboard data
 *
 * Features:
 * - Branch selector (admin only)
 * - Date picker with icon
 * - Quick date buttons (today, this week, this month)
 * - Modern card design with shadows
 * - RTL support
 * - Dark mode compatible
 */

import { Calendar, Filter, X } from 'lucide-react';
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

export function DashboardFilters({ filters, branches: _branches, onChange }: DashboardFiltersProps) {
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
  const hasActiveFilters = !!(
    filters.branchId ||
    filters.date ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <div
      className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
      dir="rtl"
    >
      {/* Header with gradient background */}
      <div className="bg-gradient-to-l from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent border-b border-[var(--border-color)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-lg flex items-center justify-center">
              <Filter className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">الفلاتر</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {hasActiveFilters ? 'يتم تطبيق الفلاتر' : 'اختر الفلاتر المناسبة'}
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:bg-red-500 border border-red-300 dark:border-red-700 rounded-lg font-medium transition-all duration-200"
            >
              <X className="w-4 h-4" />
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Branch Selector - Admin Only */}
          {isAdmin && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                🏢 الفرع
              </label>
              <BranchSelector
                value={filters.branchId || null}
                onChange={handleBranchChange}
                placeholder="جميع الفروع"
              />
            </div>
          )}

          {/* Date Selection Section */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-[var(--text-primary)]">
              📅 التاريخ
            </label>

            {/* Date Picker */}
            <div className="relative">
              <input
                type="date"
                value={filters.date || ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-4 py-3 pr-11 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 [color-scheme:light] dark:[color-scheme:dark] transition-all duration-200"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)] pointer-events-none" />
            </div>

            {/* Quick Date Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {quickDateOptions.map((option) => {
                const isActive = filters.date === option.value;
                return (
                  <button
                    key={option.label}
                    onClick={() => handleQuickDate(option.value)}
                    className={`
                      relative px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all duration-200 overflow-hidden group
                      ${
                        isActive
                          ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                          : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)] hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute inset-0 bg-gradient-to-r from-primary-500 to-primary-700 opacity-90" />
                    )}
                    <span className="relative">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range (Optional - for future use) */}
          {(filters.startDate || filters.endDate) && (
            <div className="space-y-4 pt-4 border-t border-[var(--border-color)]">
              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                📆 نطاق التاريخ
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
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
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 [color-scheme:light] dark:[color-scheme:dark] transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
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
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border-2 border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 [color-scheme:light] dark:[color-scheme:dark] transition-all duration-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardFilters;
