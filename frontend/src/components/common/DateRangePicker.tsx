/**
 * DateRangePicker Component
 *
 * A date range picker with:
 * - Two date pickers (start and end)
 * - Automatic validation: end >= start
 * - Quick presets: Today, This Week, This Month, Custom
 * - React Hook Form integration
 * - RTL support
 * - Arabic labels
 *
 * Usage with React Hook Form Controller:
 * <Controller
 *   name="dateRange"
 *   control={control}
 *   render={({ field, fieldState }) => (
 *     <DateRangePicker
 *       value={field.value}
 *       onChange={field.onChange}
 *       error={fieldState.error}
 *     />
 *   )}
 * />
 */

import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import { FieldError } from 'react-hook-form';
import { DatePicker } from './DatePicker';

// Configure dayjs
dayjs.locale('ar');

// ============================================
// TYPES
// ============================================

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface DateRangePickerProps {
  /** Current value */
  value?: DateRange | null;

  /** Change handler */
  onChange: (value: DateRange | null) => void;

  /** Field error from React Hook Form */
  error?: FieldError;

  /** Disabled state */
  disabled?: boolean;

  /** Label text */
  label?: string;

  /** Required field indicator */
  required?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Show preset buttons */
  showPresets?: boolean;

  /** Restrict future dates for end date */
  restrictFuture?: boolean;

  /** Maximum date for end date */
  maxDate?: string | Date;

  /** Minimum date for start date */
  minDate?: string | Date;
}

// ============================================
// PRESET TYPES
// ============================================

type PresetType = 'today' | 'week' | 'month' | 'custom';

interface Preset {
  type: PresetType;
  label: string;
  getValue: () => DateRange;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get date range for today
 */
function getTodayRange(): DateRange {
  const today = dayjs().format('YYYY-MM-DD');
  return { start: today, end: today };
}

/**
 * Get date range for this week (Sunday to Saturday)
 */
function getThisWeekRange(): DateRange {
  const startOfWeek = dayjs().startOf('week').format('YYYY-MM-DD');
  const endOfWeek = dayjs().endOf('week').format('YYYY-MM-DD');
  return { start: startOfWeek, end: endOfWeek };
}

/**
 * Get date range for this month
 */
function getThisMonthRange(): DateRange {
  const startOfMonth = dayjs().startOf('month').format('YYYY-MM-DD');
  const endOfMonth = dayjs().endOf('month').format('YYYY-MM-DD');
  return { start: startOfMonth, end: endOfMonth };
}

/**
 * Check if two date ranges are equal
 */
function areRangesEqual(range1: DateRange | null | undefined, range2: DateRange): boolean {
  if (!range1) return false;
  return range1.start === range2.start && range1.end === range2.end;
}

// ============================================
// PRESETS CONFIGURATION
// ============================================

const PRESETS: Preset[] = [
  {
    type: 'today',
    label: 'اليوم',
    getValue: getTodayRange,
  },
  {
    type: 'week',
    label: 'هذا الأسبوع',
    getValue: getThisWeekRange,
  },
  {
    type: 'month',
    label: 'هذا الشهر',
    getValue: getThisMonthRange,
  },
  {
    type: 'custom',
    label: 'مخصص',
    getValue: () => ({ start: null, end: null }),
  },
];

// ============================================
// COMPONENT
// ============================================

export function DateRangePicker({
  value,
  onChange,
  error,
  disabled = false,
  label,
  required = false,
  className = '',
  showPresets = true,
  restrictFuture = false,
  maxDate,
  minDate,
}: DateRangePickerProps) {
  // Local state for active preset
  const [activePreset, setActivePreset] = useState<PresetType>('custom');

  // Determine active preset based on current value
  useEffect(() => {
    if (!value) {
      setActivePreset('custom');
      return;
    }

    const today = getTodayRange();
    const week = getThisWeekRange();
    const month = getThisMonthRange();

    if (areRangesEqual(value, today)) {
      setActivePreset('today');
    } else if (areRangesEqual(value, week)) {
      setActivePreset('week');
    } else if (areRangesEqual(value, month)) {
      setActivePreset('month');
    } else {
      setActivePreset('custom');
    }
  }, [value]);

  // Handle preset selection
  const handlePresetClick = (preset: Preset) => {
    const newRange = preset.getValue();
    setActivePreset(preset.type);
    onChange(newRange);
  };

  // Handle start date change
  const handleStartChange = (start: string | null) => {
    setActivePreset('custom');
    const currentEnd = value?.end || null;

    // If end date exists and is before new start date, clear end date
    if (start && currentEnd && new Date(currentEnd) < new Date(start)) {
      onChange({ start, end: null });
    } else {
      onChange({ start, end: currentEnd });
    }
  };

  // Handle end date change
  const handleEndChange = (end: string | null) => {
    setActivePreset('custom');
    const currentStart = value?.start || null;
    onChange({ start: currentStart, end });
  };

  // Calculate min date for end date (must be >= start date)
  const endMinDate = value?.start || minDate;

  // Calculate max date for end date
  const endMaxDate = maxDate || (restrictFuture ? dayjs().format('YYYY-MM-DD') : undefined);

  return (
    <div className={`${className}`} dir="rtl">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}

      {/* Preset Buttons */}
      {showPresets && (
        <div className="flex flex-wrap gap-2 mb-4" dir="rtl">
          {PRESETS.map((preset) => (
            <button
              key={preset.type}
              type="button"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
              className={`
                px-4 py-2 text-sm font-medium rounded-lg border transition-colors
                ${
                  activePreset === preset.type
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              `}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}

      {/* Date Pickers Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <DatePicker
          value={value?.start}
          onChange={handleStartChange}
          disabled={disabled}
          label="من تاريخ"
          minDate={minDate}
          maxDate={value?.end || endMaxDate}
          required={required}
          name="dateRange.start"
        />

        {/* End Date */}
        <DatePicker
          value={value?.end}
          onChange={handleEndChange}
          disabled={disabled}
          label="إلى تاريخ"
          minDate={endMinDate}
          maxDate={endMaxDate}
          required={required}
          name="dateRange.end"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert" dir="rtl">
          {error.message}
        </p>
      )}

      {/* Summary */}
      {value?.start && value?.end && !error && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg" dir="rtl">
          <p className="text-sm text-blue-800">
            <span className="font-medium">الفترة المحددة:</span>{' '}
            {dayjs(value.start).locale('ar').format('DD MMMM YYYY')} -{' '}
            {dayjs(value.end).locale('ar').format('DD MMMM YYYY')}
          </p>
          <p className="text-xs text-blue-700 mt-1">
            {dayjs(value.end).diff(dayjs(value.start), 'day') + 1} يوم
          </p>
        </div>
      )}
    </div>
  );
}

export default DateRangePicker;
