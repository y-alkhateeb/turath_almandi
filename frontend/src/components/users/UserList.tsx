/**
 * UserList - Presentational Component
 * Table displaying users for admin management
 *
 * Features:
 * - Table: username, role, branch, isActive, createdAt, actions
 * - Role badge (admin=blue, accountant=green)
 * - Active/inactive toggle button
 * - Edit and delete actions
 * - Loading skeleton
 * - RTL support
 * - Admin only
 * - No business logic
 */

import { Edit, Calendar, Shield, User as UserIcon, UserX } from 'lucide-react';
import { Table, type Column } from '../ui/Table';
import { formatDate } from '@/utils/format';
import { UserRole } from '@/types/enum';
import type { User } from '@/types/auth.types';

// ============================================
// TYPES
// ============================================

// Extended User type with optional createdAt from backend
export interface UserWithTimestamp extends User {
  createdAt?: string;
}

export interface UserListProps {
  users: UserWithTimestamp[];
  isLoading: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string) => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get role badge styling
 */
const getRoleBadge = (role: string): React.ReactNode => {
  const isAdmin = role === UserRole.ADMIN;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAdmin
          ? 'bg-blue-100 text-blue-800 border border-blue-300'
          : 'bg-green-100 text-green-800 border border-green-300'
      }`}
    >
      {isAdmin ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
      {isAdmin ? 'مدير' : 'محاسب'}
    </span>
  );
};

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

export function UserList({ users, isLoading, onEdit, onDelete, onToggleActive }: UserListProps) {
  // Define table columns
  const columns: Column<UserWithTimestamp>[] = [
    {
      key: 'username',
      header: 'اسم المستخدم',
      width: '200px',
      render: (user) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-primary-600" />
          </div>
          <span className="font-medium text-[var(--text-primary)]">{user.username}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'الدور',
      width: '120px',
      align: 'center',
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'branch',
      header: 'الفرع',
      width: '150px',
      render: (user) => user.branch?.name || '-',
    },
    {
      key: 'isActive',
      header: 'الحالة',
      width: '100px',
      align: 'center',
      render: (user) => getActiveBadge(user.isActive),
    },
    {
      key: 'createdAt',
      header: 'تاريخ الإنشاء',
      width: '140px',
      render: (user) =>
        user.createdAt ? (
          <div className="flex items-center gap-1 text-sm text-[var(--text-secondary)]">
            <Calendar className="w-4 h-4" />
            {formatDate(user.createdAt)}
          </div>
        ) : (
          '-'
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
      render: (user) => (
        <div className="flex items-center justify-center gap-2" dir="ltr">
          {/* Toggle Active Button */}
          {onToggleActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleActive(user.id);
              }}
              className={`px-3 py-1 text-xs rounded transition-colors font-semibold ${
                user.isActive
                  ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                  : 'text-green-600 hover:text-green-800 hover:bg-green-50'
              }`}
              title={user.isActive ? 'تعطيل' : 'تفعيل'}
            >
              {user.isActive ? 'تعطيل' : 'تفعيل'}
            </button>
          )}

          {/* Edit Button */}
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(user.id);
              }}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
              title="تعديل"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {/* Deactivate Button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user.id);
              }}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
              title="تعطيل المستخدم"
            >
              <UserX className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="w-full" dir="rtl">
      <Table<UserWithTimestamp>
        data={users}
        columns={columns}
        keyExtractor={(user) => user.id}
        isLoading={isLoading}
        emptyMessage="لا توجد مستخدمين"
        striped
        hoverable
      />
    </div>
  );
}

export default UserList;
