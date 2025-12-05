/**
 * BranchSelect Component
 * A reusable select component for choosing branches
 * Automatically handles admin (dropdown) vs accountant (auto-select) behavior
 * Used across forms, filters, and transaction pages
 */

import { useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  FormControl,
} from '@/components/ui';
import { useAuth } from '@/hooks/api/useAuth';
import { useBranchList, useBranch } from '@/hooks/api/useBranches';
import { Building2 } from 'lucide-react';

interface BranchSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** If true, wraps in FormControl for use inside FormField */
  asFormControl?: boolean;
  /** If true, shows only active branches (default: true) */
  includeInactive?: boolean;
}

export function BranchSelect({
  value,
  onValueChange,
  placeholder = 'اختر الفرع',
  disabled = false,
  asFormControl = false,
  includeInactive = false,
}: BranchSelectProps) {
  const { user, isAdmin, isAccountant } = useAuth();
  const { data: branches = [], isLoading } = useBranchList({
    enabled: isAdmin, // Only fetch branches for admin
  });

  // Fetch branch name for accountant if not already in user object
  const shouldFetchBranch = isAccountant && user?.branchId && !user?.branch;
  const { data: accountantBranch } = useBranch(user?.branchId || '', {
    enabled: shouldFetchBranch,
  });

  // Auto-select accountant's branch on mount
  useEffect(() => {
    if (isAccountant && user?.branchId && !value) {
      onValueChange(user.branchId);
    }
  }, [isAccountant, user?.branchId, value, onValueChange]);

  // For accountants: show read-only display
  if (isAccountant) {
    const userBranch = user?.branch || accountantBranch;
    const displayName = userBranch?.name || user?.branchId || 'غير محدد';

    const readOnlyContent = (
      <div className="p-3 rounded-md bg-muted">
        <span className="font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          {displayName}
        </span>
      </div>
    );

    if (asFormControl) {
      return <FormControl>{readOnlyContent}</FormControl>;
    }

    return readOnlyContent;
  }

  // For admin: show dropdown select
  const activeBranches = branches.filter((branch) => includeInactive || !branch.isDeleted);

  const selectContent = (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={isLoading ? 'جاري التحميل...' : placeholder}>
          {value && (
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {activeBranches.find((b) => b.id === value)?.name || value}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {activeBranches.map((branch) => (
          <SelectItem key={branch.id} value={branch.id}>
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {branch.name}
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

