/**
 * Date Range Picker Component
 * Combines Calendar with Popover for date range selection
 */

import * as React from 'react';
import { formatDate } from '@/utils/format';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface DateRangePickerProps {
  /** Selected date range */
  value?: DateRange;
  /** Callback when date range changes */
  onChange?: (range: DateRange | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Show time selection */
  showTime?: boolean;
  /** Custom class name */
  className?: string;
  /** Align popover */
  align?: 'start' | 'center' | 'end';
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = 'اختر نطاق التاريخ',
  disabled = false,
  showTime = false,
  className,
  align = 'start',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [startTime, setStartTime] = React.useState('00:00');
  const [endTime, setEndTime] = React.useState('23:59');

  // Format display text
  const displayText = React.useMemo(() => {
    if (!value?.from) return placeholder;

    if (value.to) {
      const fromStr = formatDate(value.from);
      const toStr = formatDate(value.to);
      if (showTime) {
        return `${fromStr} ${startTime} - ${toStr} ${endTime}`;
      }
      return `${fromStr} - ${toStr}`;
    }

    return formatDate(value.from);
  }, [value, placeholder, showTime, startTime, endTime]);

  // Handle date selection
  const handleSelect = (range: DateRange | undefined) => {
    onChange?.(range);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
    setStartTime('00:00');
    setEndTime('23:59');
  };

  // Quick select presets
  const presets = [
    {
      label: 'اليوم',
      getValue: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      label: 'أمس',
      getValue: () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      label: 'آخر 7 أيام',
      getValue: () => {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: weekAgo, to: today };
      },
    },
    {
      label: 'آخر 30 يوم',
      getValue: () => {
        const today = new Date();
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return { from: monthAgo, to: today };
      },
    },
    {
      label: 'هذا الشهر',
      getValue: () => {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: startOfMonth, to: today };
      },
    },
    {
      label: 'الشهر الماضي',
      getValue: () => {
        const today = new Date();
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: startOfLastMonth, to: endOfLastMonth };
      },
    },
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-right font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          <span className="flex-1 truncate">{displayText}</span>
          {value?.from && (
            <X
              className="mr-2 h-4 w-4 opacity-50 hover:opacity-100"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="flex flex-col sm:flex-row">
          {/* Presets */}
          <div className="border-b sm:border-b-0 sm:border-l border-border p-3 space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-2">اختيار سريع</p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => {
                  handleSelect(preset.getValue());
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={{ after: new Date() }}
            />

            {/* Time Selection */}
            {showTime && (
              <div className="border-t border-border mt-3 pt-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">وقت البداية</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">وقت النهاية</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleSelect(undefined);
                }}
              >
                مسح
              </Button>
              <Button
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                تطبيق
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
