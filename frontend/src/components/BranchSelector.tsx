import { useState, useEffect } from 'react';
import { useAuth } from '@hooks/useAuth';
import { branchesService, Branch } from '@services/branches.service';

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
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoading(true);
        const data = await branchesService.getAll();
        setBranches(data);
        setError(null);
      } catch (err) {
        setError('Failed to load branches');
        console.error('Error fetching branches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  // Accountants can't change branch - show their assigned branch only
  if (!isAdmin() && user?.branchId) {
    const userBranch = branches.find((b) => b.id === user.branchId);
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Branch
        </label>
        <input
          type="text"
          value={userBranch?.name || 'Loading...'}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 cursor-not-allowed"
        />
      </div>
    );
  }

  // Admin can select any branch
  return (
    <div className={className}>
      <label htmlFor="branch-select" className="block text-sm font-medium text-gray-700 mb-1">
        Branch
      </label>
      <select
        id="branch-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={disabled || loading}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">All Branches</option>
        {branches
          .filter((b) => b.isActive)
          .map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} - {branch.location}
            </option>
          ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
