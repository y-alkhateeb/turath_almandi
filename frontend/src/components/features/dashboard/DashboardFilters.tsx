/**
 * DashboardFilters - Presentational Component
 *
 * Date and branch filter controls for dashboard.
 * Pure component with no business logic - handlers passed as props.
 */

import { Calendar, Building } from 'lucide-react';
import { Card } from '@/ui/card';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/ui/select';
import type { Branch } from '@/types';

export interface DashboardFiltersProps {
  /** Selected date value */
  selectedDate: string;
  /** Handler for date change */
  onDateChange: (date: string) => void;
  /** Handler for "Today" button */
  onTodayClick: () => void;
  /** Whether to show branch filter (admin only) */
  showBranchFilter: boolean;
  /** Available branches */
  branches?: Branch[];
  /** Selected branch ID */
  selectedBranchId?: string;
  /** Handler for branch change */
  onBranchChange?: (branchId: string) => void;
}

export function DashboardFilters({
  selectedDate,
  onDateChange,
  onTodayClick,
  showBranchFilter,
  branches = [],
  selectedBranchId = 'ALL',
  onBranchChange,
}: DashboardFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Date Filter */}
      <Card className="flex items-center gap-3 p-3 w-full sm:w-auto">
        <Calendar className="w-5 h-5 text-[var(--text-secondary)]" />
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="border-0 h-auto focus:ring-0 text-sm w-auto"
        />
        <Button variant="ghost" size="sm" onClick={onTodayClick}>
          اليوم
        </Button>
      </Card>

      {/* Branch Filter - Admin Only */}
      {showBranchFilter && branches.length > 0 && onBranchChange && (
        <Card className="flex items-center gap-3 p-3 w-full sm:w-auto">
          <Building className="w-5 h-5 text-[var(--text-secondary)]" />
          <Select value={selectedBranchId} onValueChange={onBranchChange}>
            <SelectTrigger className="border-0 h-auto focus:ring-0 text-sm w-[200px]">
              <SelectValue placeholder="جميع الفروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">جميع الفروع</SelectItem>
              {branches.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      )}
    </div>
  );
}
