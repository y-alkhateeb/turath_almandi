/**
 * DashboardFilters - Collapsible Filter Component
 *
 * Features:
 * - Collapsible section to save space
 * - Branch selector (admin only)
 * - Date range picker (from - to) - always visible
 * - Quick date buttons (today, this week, this month)
 * - RTL support and dark mode
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, X } from 'lucide-react';
import { BranchSelector } from '@/components/BranchSelector';
import { useAuth } from '@/hooks/useAuth';
import { toInputDate, startOfDay, startOfMonth, endOfDay } from '@/utils/format';
import type { Branch, DashboardFilters as DashboardFiltersType } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface DashboardFiltersProps {
  filters: DashboardFiltersType;
  branches: Branch[];
  onChange: (filters: DashboardFiltersType) => void;
}

interface QuickDateOption {
  label: string;
  getValue: () => { startDate: string; endDate: string };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get start of week (Sunday)
 */
function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Sunday, 6 = Saturday
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

// ============================================
// COMPONENT
// ============================================

export function DashboardFilters({ filters, branches: _branches, onChange }: DashboardFiltersProps) {
  const { isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(true);

  // Quick date options
  const quickDateOptions: QuickDateOption[] = [
    {
      label: 'اليوم',
      getValue: () => {
        const today = new Date();
        return {
          startDate: toInputDate(startOfDay(today)),
          endDate: toInputDate(endOfDay(today)),
        };
      },
    },
    {
      label: 'هذا الأسبوع',
      getValue: () => {
        const today = new Date();
        const weekStart = startOfWeek(today);
        return {
          startDate: toInputDate(weekStart),
          endDate: toInputDate(endOfDay(today)),
        };
      },
    },
    {
      label: 'هذا الشهر',
      getValue: () => {
        const today = new Date();
        const monthStart = startOfMonth(today);
        return {
          startDate: toInputDate(monthStart),
          endDate: toInputDate(endOfDay(today)),
        };
      },
    },
  ];

  const handleBranchChange = (branchId: string | null) => {
    onChange({
      ...filters,
      branchId: branchId || undefined,
    });
  };

  const handleQuickDate = (option: QuickDateOption) => {
    const { startDate, endDate } = option.getValue();
    onChange({
      ...filters,
      startDate,
      endDate,
      date: undefined, // Clear single date when using range
    });
  };

  const handleStartDateChange = (value: string) => {
    onChange({
      ...filters,
      startDate: value || undefined,
      date: undefined,
    });
  };

  const handleEndDateChange = (value: string) => {
    onChange({
      ...filters,
      endDate: value || undefined,
      date: undefined,
    });
  };

  const handleClearFilters = () => {
    onChange({
      branchId: undefined,
      date: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  const hasActiveFilters = !!(
    filters.branchId ||
    filters.date ||
    filters.startDate ||
    filters.endDate
  );

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm" dir="rtl">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">الفلاتر</h3>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">
              نشط
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearFilters();
              }}
              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              title="مسح الفلاتر"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
          )}
        </div>
      </button>

      {/* Filter Content */}
      {isOpen && (
        <div className="px-6 pb-6 space-y-6 border-t border-[var(--border-color)] pt-6">
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

          {/* Quick Date Buttons */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              اختيار سريع
            </label>
            <div className="grid grid-cols-3 gap-3">
              {quickDateOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickDate(option)}
                  className="px-4 py-2.5 text-sm font-medium bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 transition-all"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
              نطاق التاريخ
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                  من تاريخ
                </label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent [color-scheme:light] dark:[color-scheme:dark] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">
                  إلى تاريخ
                </label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent [color-scheme:light] dark:[color-scheme:dark] transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardFilters;
