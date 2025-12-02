/**
 * ContactTypeSelect Component
 * A reusable select component for choosing contact types
 * Used across contacts, payables, receivables, and transactions
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
import { ContactType } from '@/types/enum';
import { Truck, User, Users, CircleUser, type LucideIcon } from 'lucide-react';

// Contact type configuration with labels and icons
export const CONTACT_TYPE_CONFIG: Record<ContactType, { label: string; icon: LucideIcon }> = {
  [ContactType.SUPPLIER]: {
    label: 'مورد',
    icon: Truck,
  },
  [ContactType.CUSTOMER]: {
    label: 'عميل',
    icon: User,
  },
  [ContactType.BOTH]: {
    label: 'مورد وعميل',
    icon: Users,
  },
  [ContactType.OTHER]: {
    label: 'أخرى',
    icon: CircleUser,
  },
};

// Helper function to get contact type label
export function getContactTypeLabel(type: ContactType | null | undefined): string {
  if (!type) return '-';
  return CONTACT_TYPE_CONFIG[type]?.label || type;
}

// Get all contact types as options
export function getContactTypeOptions() {
  return Object.entries(CONTACT_TYPE_CONFIG).map(([value, config]) => ({
    value: value as ContactType,
    label: config.label,
    icon: config.icon,
  }));
}

interface ContactTypeSelectProps {
  value?: ContactType;
  onValueChange: (value: ContactType) => void;
  placeholder?: string;
  disabled?: boolean;
  showIcons?: boolean;
  /** If true, wraps in FormControl for use inside FormField */
  asFormControl?: boolean;
}

export function ContactTypeSelect({
  value,
  onValueChange,
  placeholder = 'اختر نوع جهة الاتصال',
  disabled = false,
  showIcons = true,
  asFormControl = false,
}: ContactTypeSelectProps) {
  const options = getContactTypeOptions();

  const selectContent = (
    <Select
      value={value}
      onValueChange={(val) => onValueChange(val as ContactType)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {value && (
            <span className="flex items-center gap-2">
              {showIcons && (() => {
                const Icon = CONTACT_TYPE_CONFIG[value]?.icon;
                return Icon ? <Icon className="h-4 w-4" /> : null;
              })()}
              {CONTACT_TYPE_CONFIG[value]?.label}
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

/**
 * ContactTypeButtons Component
 * Button-based contact type selector for filters
 */
interface ContactTypeButtonsProps {
  value?: ContactType | 'all';
  onChange: (value: ContactType | 'all') => void;
  disabled?: boolean;
  className?: string;
  showAll?: boolean;
}

export function ContactTypeButtons({
  value = 'all',
  onChange,
  disabled = false,
  className,
  showAll = true,
}: ContactTypeButtonsProps) {
  const options = getContactTypeOptions();

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {showAll && (
        <button
          type="button"
          onClick={() => onChange('all')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
            value === 'all'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="font-medium">الكل</span>
        </button>
      )}
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
              'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="font-medium">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

