/**
 * BranchList - Presentational Component
 * Table displaying branches for admin management
 *
 * Features:
 * - Table: name, location, managerName, isActive, createdAt, actions
 * - Active/inactive badge (green/gray)
 * - Edit, delete, and toggle active actions
 * - Loading skeleton
 * - RTL support
 * - No business logic
 */

import { Edit, Trash2, Calendar, MapPin, User } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { formatDate } from '@/utils/format';
import type { Branch } from '#/entity';

// ============================================
// TYPES
// ============================================

export interface BranchListProps {
  branches: Branch[];
  isLoading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get active status badge
 */
const getActiveBadge = (isActive: boolean): React.ReactNode => {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive
          ? 'bg-green-100 text-green-800 border border-green-300'
          : 'bg-gray-100 text-gray-800 border border-gray-300'
      }`}
    >
      {isActive ? 'نشط' : 'معطل'}
    </span>
  );
};

// ============================================
// COMPONENT
// ============================================

export function BranchList({
  branches,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
}: BranchListProps) {
  // Define table columns
  const columns: Column<Branch>[] = [
    {
      key: 'name',
      header: 'اسم الفرع',
      width: '180px',
      render: (branch) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium text-[var(--text-primary)]">{branch.name}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'الموقع',
      width: '200px',
      render: (branch) => (
        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          <MapPin className="w-4 h-4" />
          {branch.location}
        </div>
      ),
    },
    {
      key: 'managerName',
      header: 'اسم المدير',
      width: '150px',
      render: (branch) => (
        <div className="flex items-center gap-1 text-sm">
          <User className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-[var(--text-primary)]">{branch.managerName}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'الحالة',
      width: '100px',
      align: 'center',
      render: (branch) => getActiveBadge(branch.isActive),
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      width: '140px',
      render: (branch) => (
        <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
          <Calendar className="w-4 h-4" />
          {formatDate(branch.createdAt)}
        </div>
      ),
    },
  ];

  // Add actions column if handlers provided
  if (onEdit || onDelete || onToggleActive) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      width: '180px',
      align: 'center',
      render: (branch) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {/* Toggle Active Button */}
          {onToggleActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(branch.id);
              }}
              className={`px-3 py-1 text-xs rounded transition-colors font-semibold ${
                branch.isActive
                  ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
              }`}
              title={branch.isActive ? 'تعطيل' : 'تفعيل'}
            >
              {branch.isActive ? 'تعطيل' : 'تفعيل'}
            </button>
          )}

          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(branch.id);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {/* Delete Button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(branch.id);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="حذف"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="w-full" dir="rtl">
      <Table<Branch>
        data={branches}
        columns={columns}
        keyExtractor={(branch) => branch.id}
        isLoading={isLoading}
        emptyMessage="لا توجد فروع"
        striped
        hoverable
      />
    </div>
  );
}

export default BranchList;
