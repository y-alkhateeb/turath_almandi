/**
 * Date Picker Component
 * Single date selection with Popover and Calendar
 */

import * as React from 'react';
import { formatDate } from '@/utils/format';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface DatePickerProps {
  /** Selected date */
  value?: Date;
  /** Callback when date changes */
  onChange?: (date: Date | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable the picker */
  disabled?: boolean;
  /** Disable future dates */
  disableFuture?: boolean;
  /** Disable past dates */
  disablePast?: boolean;
  /** Custom class name */
  className?: string;
  /** Error state */
  error?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'اختر التاريخ',
  disabled = false,
  disableFuture = false,
  disablePast = false,
  className,
  error = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Format display text
  const displayText = value
    ? formatDate(value)
    : placeholder;

  // Build disabled matcher
  const disabledDays = React.useMemo(() => {
    const matchers: Array<{ before: Date } | { after: Date }> = [];
    if (disableFuture) {
      matchers.push({ after: new Date() });
    }
    if (disablePast) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      matchers.push({ before: yesterday });
    }
    return matchers.length === 1 ? matchers[0] : matchers.length > 1 ? matchers : undefined;
  }, [disableFuture, disablePast]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-right font-normal',
            !value && 'text-muted-foreground',
            error && 'border-destructive focus:ring-destructive',
            className
          )}
        >
          <CalendarIcon className="ml-2 h-4 w-4" />
          <span className="flex-1">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date);
            setIsOpen(false);
          }}
          disabled={disabledDays}
          defaultMonth={value}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
