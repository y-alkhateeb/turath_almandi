import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import { useSuppliers, useCustomers } from '@/hooks/useContacts';
import { FormSelect } from './FormSelect';

/**
 * ContactSelector Component
 *
 * Reusable component for contact selection in both forms and filters.
 * Follows SOLID principles with single responsibility and DRY pattern.
 *
 * Two modes:
 * 1. Form mode (with react-hook-form): Uses name, register, error props
 * 2. Controlled mode (for filters): Uses value, onChange props
 *
 * Features:
 * - Automatically fetches suppliers or customers based on type
 * - Support for both SUPPLIER and CUSTOMER types
 * - Accessible with ARIA attributes
 * - Arabic interface with RTL support
 */

// Form mode props (with react-hook-form)
interface ContactSelectorFormProps<T extends FieldValues> {
  mode: 'form';
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  contactType: 'SUPPLIER' | 'CUSTOMER';
  required?: boolean;
  className?: string;
}

// Controlled mode props (for filters and standalone usage)
interface ContactSelectorControlledProps {
  mode?: 'controlled';
  value: string | null;
  onChange: (value: string | null) => void;
  contactType: 'SUPPLIER' | 'CUSTOMER';
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

// Discriminated union of both prop types
type ContactSelectorProps<T extends FieldValues = any> =
  | ContactSelectorFormProps<T>
  | ContactSelectorControlledProps;

export function ContactSelector<T extends FieldValues = any>(props: ContactSelectorProps<T>) {
  const { contactType } = props;

  // Fetch contacts based on type
  const { data: suppliers = [], isLoading: suppliersLoading } = useSuppliers();
  const { data: customers = [], isLoading: customersLoading } = useCustomers();

  const contacts = contactType === 'SUPPLIER' ? suppliers : customers;
  const isLoading = contactType === 'SUPPLIER' ? suppliersLoading : customersLoading;

  const options = (contacts.data || []).map((contact) => ({
    value: contact.id,
    label: contact.name,
  }));

  const label = contactType === 'SUPPLIER' ? 'المورد' : 'العميل';
  const placeholder = contactType === 'SUPPLIER' ? 'اختر المورد' : 'اختر العميل';

  // Form mode with react-hook-form
  if (props.mode === 'form') {
    const { name, register, error, required = true, className = '' } = props;

    return (
      <FormSelect
        name={name}
        label={label}
        options={options}
        register={register}
        error={error}
        required={required}
        disabled={isLoading}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  // Controlled mode for filters and standalone usage
  const {
    value,
    onChange,
    placeholder: customPlaceholder,
    className = '',
    showLabel = true,
    label: customLabel,
  } = props;

  return (
    <div className={className}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {customLabel || label}
        </label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={isLoading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{customPlaceholder || placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
