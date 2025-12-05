/**
 * PaymentMethodSelect Component
 * A reusable select component for choosing payment methods
 * Used across payables, receivables, and transactions
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormControl,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types/enum';
import { Banknote, CreditCard, type LucideIcon } from 'lucide-react';

// Payment method configuration with labels and icons
export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: LucideIcon }> = {
  [PaymentMethod.CASH]: {
    label: 'نقدي',
    icon: Banknote,
  },
  [PaymentMethod.MASTER]: {
    label: 'ماستر',
    icon: CreditCard,
  },
};

// Helper function to get payment method label
export function getPaymentMethodLabel(method: PaymentMethod | null | undefined): string {
  if (!method) return '-';
  return PAYMENT_METHOD_CONFIG[method]?.label || method;
}

// Get all payment methods as options
export function getPaymentMethodOptions() {
  return Object.entries(PAYMENT_METHOD_CONFIG).map(([value, config]) => ({
    value: value as PaymentMethod,
    label: config.label,
    icon: config.icon,
  }));
}

interface PaymentMethodSelectProps {
  value?: PaymentMethod;
  onValueChange: (value: PaymentMethod) => void;
  placeholder?: string;
  disabled?: boolean;
  showIcons?: boolean;
  /** If true, wraps in FormControl for use inside FormField */
  asFormControl?: boolean;
}

export function PaymentMethodSelect({
  value,
  onValueChange,
  placeholder = 'اختر طريقة الدفع',
  disabled = false,
  showIcons = true,
  asFormControl = false,
}: PaymentMethodSelectProps) {
  const options = getPaymentMethodOptions();

  const selectContent = (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as PaymentMethod)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && (
            <span className="flex items-center gap-2">
              {showIcons && (() => {
                const Icon = PAYMENT_METHOD_CONFIG[value]?.icon;
                return Icon ? <Icon className="h-4 w-4" /> : null;
              })()}
              {PAYMENT_METHOD_CONFIG[value]?.label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              {showIcons && <option.icon className="h-4 w-4" />}
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (asFormControl) {
    return <FormControl>{selectContent}</FormControl>;
  }

  return selectContent;
}

// Standalone Select component without FormControl wrapper for direct use
export function PaymentMethodSelectField({
  value,
  onChange,
  placeholder = 'اختر طريقة الدفع',
  disabled = false,
  showIcons = true,
}: {
  value?: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  placeholder?: string;
  disabled?: boolean;
  showIcons?: boolean;
}) {
  const options = getPaymentMethodOptions();

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as PaymentMethod)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <span className="flex items-center gap-2">
              {showIcons && <option.icon className="h-4 w-4" />}
              {option.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * PaymentMethodButtons Component
 * Button-based payment method selector for forms like CreateExpensePage
 */
interface PaymentMethodButtonsProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  disabled?: boolean;
  className?: string;
  cashOnly?: boolean;
}

export function PaymentMethodButtons({
  value,
  onChange,
  disabled = false,
  className,
  cashOnly = false,
}: PaymentMethodButtonsProps) {
  const options = getPaymentMethodOptions();

  // If cash-only, show only cash option
  if (cashOnly) {
    const CashOption = options.find((opt) => opt.value === PaymentMethod.CASH)!;
    const Icon = CashOption.icon;

    return (
      <div className="p-4 rounded-lg border-2 border-primary bg-primary/10">
        <div className="flex items-center justify-center gap-3 text-primary">
          <Icon className="h-5 w-5" />
          <span className="font-medium">نقدي فقط</span>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          هذه الفئة تدعم الدفع نقداً فقط
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {options.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
