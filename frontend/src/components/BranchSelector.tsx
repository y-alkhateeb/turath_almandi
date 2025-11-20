import { useAuth } from '@/hooks/useAuth';
import { useBranches } from '@/hooks/useBranches';

interface BranchSelectorProps {
  value?: string | null;
  onChange: (branchId: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export const BranchSelector = ({
  value,
  onChange,
  disabled = false,
  className = '',
}: BranchSelectorProps) => {
  const { user, isAdmin } = useAuth();
  const { data: branches = [], isLoading: loading, error } = useBranches();

  // Accountants can't change branch - show their assigned branch only
  if (!isAdmin && user?.branchId) {
    const userBranch = branches.find((b) => b.id === user.branchId);
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">الفرع</label>
        <input
          type="text"
          value={userBranch?.name || 'جاري التحميل...'}
          disabled
          className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-tertiary)] text-[var(--text-primary)] cursor-not-allowed"
        />
      </div>
    );
  }

  // Admin can select any branch
  return (
    <div className={className}>
      <label
        htmlFor="branch-select"
        className="block text-sm font-medium text-[var(--text-primary)] mb-1"
      >
        الفرع
      </label>
      <select
        id="branch-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || loading}
        className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--text-primary)]"
      >
        <option value="">اختر الفرع...</option>
        {branches
          .filter((b) => b.isActive)
          .map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} - {branch.location}
            </option>
          ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
