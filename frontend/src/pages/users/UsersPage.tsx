import { useState } from 'react';
import { Plus, Edit, UserX, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/useUsers';
import { Modal } from '@/components/Modal';
import { UserForm } from '@/components/UserForm';
import { PageLoading } from '@/components/loading';
import { EmptyState, PageHeader, Table, ConfirmModal } from '@/components/ui';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Alert } from '@/ui/alert';
import type { UserWithBranch, CreateUserDto, UpdateUserDto } from '@/types';
import type { Column } from '@/components/ui/Table';

export const UsersPage = () => {
  const { isAdmin } = useAuth();
  const { data: users = [], isLoading, error } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithBranch | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Handlers
  const handleCreate = async (data: CreateUserDto) => {
    await createUser.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdate = async (data: CreateUserDto) => {
    if (!editingUser) return;

    // Convert CreateUserDto to UpdateUserDto
    const updateData: UpdateUserDto = {
      role: data.role,
      branchId: data.branchId,
    };

    await updateUser.mutateAsync({ id: editingUser.id, data: updateData });
    setEditingUser(null);
  };

  const handleDelete = async () => {
    if (!deletingUserId) return;
    await deleteUser.mutateAsync(deletingUserId);
    setDeletingUserId(null);
  };

  const handleToggleStatus = async (user: UserWithBranch) => {
    await updateUser.mutateAsync({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  // Helper functions
  const getRoleDisplay = (role: string) => {
    return role === 'ADMIN' ? 'مدير' : 'محاسب';
  };

  const getRoleBadgeVariant = (role: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    return role === 'ADMIN' ? 'default' : 'secondary';
  };

  // Table columns configuration
  const columns: Column<UserWithBranch>[] = [
    {
      key: 'username',
      header: 'اسم المستخدم',
      render: (user) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="mr-4">
            <div className="text-sm font-medium text-gray-900">
              {user.username}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'الدور',
      render: (user) => (
        <Badge variant={getRoleBadgeVariant(user.role)}>
          {getRoleDisplay(user.role)}
        </Badge>
      ),
    },
    {
      key: 'branch',
      header: 'الفرع',
      render: (user) => (
        <div className="text-sm text-gray-700">
          {user.branch ? (
            <div>
              <div className="font-medium">{user.branch.name}</div>
              <div className="text-xs text-gray-500">{user.branch.location}</div>
            </div>
          ) : (
            <span className="text-gray-400">بدون فرع</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'الحالة',
      render: (user) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => isAdmin() && handleToggleStatus(user)}
          disabled={!isAdmin() || updateUser.isPending}
        >
          <Badge variant={user.isActive ? 'default' : 'destructive'}>
            {user.isActive ? 'نشط' : 'معطل'}
          </Badge>
        </Button>
      ),
    },
  ];

  // Add actions column if user is admin
  if (isAdmin()) {
    columns.push({
      key: 'actions',
      header: 'الإجراءات',
      render: (user) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingUser(user)}
          >
            <Edit className="w-4 h-4" />
            تعديل
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingUserId(user.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <UserX className="w-4 h-4" />
            حذف
          </Button>
        </div>
      ),
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="إدارة المستخدمين"
        description="إدارة المستخدمين وصلاحياتهم في النظام"
        actions={
          isAdmin() ? (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-5 h-5" />
              إضافة مستخدم جديد
            </Button>
          ) : undefined
        }
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          حدث خطأ أثناء تحميل المستخدمين. يرجى المحاولة مرة أخرى.
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <PageLoading message="جاري تحميل المستخدمين..." />
      ) : users.length === 0 ? (
        /* Empty State */
        <EmptyState
          variant="default"
          icon={<Users className="w-full h-full" />}
          title="لا يوجد مستخدمون"
          description="أضف مستخدمين جدد (مدراء أو محاسبين) لتمكينهم من استخدام النظام وإدارة العمليات المالية."
          actions={
            isAdmin()
              ? {
                  primary: {
                    label: 'إضافة مستخدم جديد',
                    onClick: () => setIsCreateModalOpen(true),
                  },
                }
              : undefined
          }
          size="lg"
        />
      ) : (
        /* Users Table */
        <Table columns={columns} data={users} keyExtractor={(user) => user.id} />
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة مستخدم جديد"
      >
        <UserForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="تعديل المستخدم"
      >
        <UserForm
          onSubmit={handleUpdate}
          onCancel={() => setEditingUser(null)}
          initialData={editingUser || undefined}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        onConfirm={handleDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteUser.isPending}
      />
    </div>
  );
};

export default UsersPage;
