import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { FormSelect } from './FormSelect';

/**
 * BranchSelector Component
 *
 * Reusable component for branch selection in forms.
 * Follows SOLID principles with single responsibility and DRY pattern.
 *
 * Features:
 * - Admin users: See dropdown to select branch (required)
 * - Accountant users: See read-only display of assigned branch
 * - Automatically fetches branches using useBranches hook
 * - Integrates with react-hook-form
 * - Accessible with ARIA attributes
 * - Arabic interface with RTL support
 *
 * @template T - The form data type extending FieldValues
 */
export interface BranchSelectorProps<T extends FieldValues> {
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  required?: boolean;
  className?: string;
}

export function BranchSelector<T extends FieldValues>({
  name,
  register,
  error,
  required = true,
  className = '',
}: BranchSelectorProps<T>) {
  const { user, isAdmin } = useAuth();
  const { data: branches = [], isLoading: branchesLoading } = useBranches();

  // Admin users: Show dropdown selector
  if (isAdmin()) {
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
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
          الفرع
        </label>
        <div className="w-full px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)]">
          {user.branch.name}
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          يتم تعبئة الفرع تلقائيًا من حسابك
        </p>
      </div>
    );
  }

  // No branch assigned: Return null (shouldn't happen in normal flow)
  return null;
}
