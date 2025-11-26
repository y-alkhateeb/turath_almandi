import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { FormSelect } from './FormSelect';

/**
 * BranchSelector Component
 *
 * Reusable component for branch selection in both forms and filters.
 * Follows SOLID principles with single responsibility and DRY pattern.
 *
 * Two modes:
 * 1. Form mode (with react-hook-form): Uses name, register, error props
 * 2. Controlled mode (for filters): Uses value, onChange props
 *
 * Features:
 * - Admin users: See dropdown to select branch
 * - Accountant users: See read-only display of assigned branch (form mode only)
 * - Automatically fetches branches using useBranches hook
 * - Accessible with ARIA attributes
 * - Arabic interface with RTL support
 */

// Form mode props (with react-hook-form)
interface BranchSelectorFormProps<T extends FieldValues> {
  mode: 'form';
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  className?: string;
}

// Controlled mode props (for filters and standalone usage)
interface BranchSelectorControlledProps {
  mode?: 'controlled';
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

// Discriminated union of both prop types
type BranchSelectorProps<T extends FieldValues = any> =
  | BranchSelectorFormProps<T>
  | BranchSelectorControlledProps;

export function BranchSelector<T extends FieldValues = any>(props: BranchSelectorProps<T>) {
  const { user, isAdmin } = useAuth();
  const { data: branches = [], isLoading: branchesLoading } = useBranches();

  // Form mode with react-hook-form
  if (props.mode === 'form') {
    const { name, register, error, required = true, className = '' } = props;

    // Admin users: Show dropdown selector with FormSelect
    if (isAdmin) {
      const options = branches.map((branch) => ({
        value: branch.id,
        label: branch.name,
      }));

      return (
        <FormSelect
          name={name}
          label="الفرع"
          options={options}
          register={register}
          error={error}
          required={required}
          disabled={branchesLoading}
          placeholder="اختر الفرع"
          className={className}
        />
      );
    }

    // Accountant users: Show read-only display
    if (user?.branch) {
      return (
        <div className={`mb-4 ${className}`}>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الفرع</label>
          <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
            {user.branch.name}
          </div>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            يتم تعبئة الفرع تلقائيًا من حسابك
          </p>
        </div>
      );
    }

    return null;
  }

  // Controlled mode (default or explicit mode='controlled')
  const {
    value,
    onChange,
    placeholder = 'اختر الفرع',
    className = '',
    showLabel = true,
    label = 'الفرع',
  } = props as BranchSelectorControlledProps;

  // Only show for admin users in controlled mode
  if (!isAdmin) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          {label}
        </label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={branchesLoading}
        className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors disabled:bg-[var(--bg-tertiary)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
    </div>
  );
}
