/**
 * DashboardFilters - Collapsible Filter Component
 *
 * Features:
 * - Collapsible section to save space
 * - Branch selector (admin only)
 * - Date range picker (from - to) - always visible
 * - Quick date buttons (today, this week, this month)
 * - Active filter summary text
 * - RTL support and dark mode
 */

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { BranchSelector } from '@/components/BranchSelector';
import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';
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

/**
 * Format date to Arabic readable format
 */
function formatDateArabic(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ============================================
// COMPONENT
// ============================================

export function DashboardFilters({ filters, branches: _branches, onChange }: DashboardFiltersProps) {
  const { isAdmin } = useAuth();
  const { data: branches = [] } = useBranches({ enabled: isAdmin });
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

  // Generate active filter summary text
  const activeFilterText = useMemo(() => {
    const parts: string[] = [];

    // Branch filter
    if (filters.branchId && isAdmin) {
      const branch = branches.find((b) => b.id === filters.branchId);
      if (branch) {
        parts.push(`الفرع: ${branch.name}`);
      }
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      if (filters.startDate === filters.endDate) {
        parts.push(`التاريخ: ${formatDateArabic(filters.startDate)}`);
      } else {
        parts.push(
          `من ${formatDateArabic(filters.startDate)} إلى ${formatDateArabic(filters.endDate)}`
        );
      }
    } else if (filters.startDate) {
      parts.push(`من ${formatDateArabic(filters.startDate)}`);
    } else if (filters.endDate) {
      parts.push(`حتى ${formatDateArabic(filters.endDate)}`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'لم يتم تطبيق فلاتر';
  }, [filters, branches, isAdmin]);

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden shadow-sm" dir="rtl">
      {/* Header - Collapsible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <div className="text-right">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">الفلاتر</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">{activeFilterText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
                showLabel={false}
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
