import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/hooks/useUsers';
import { Modal } from '@/components/Modal';
import { UserForm } from '@/components/UserForm';
import { ConditionalRender } from '@/components/ConditionalRender';
import type { UserWithBranch, CreateUserDto, UpdateUserDto } from '@/types';

export const UsersPage: React.FC = () => {
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

  const handleDelete = async (id: string) => {
    await deleteUser.mutateAsync(id);
    setDeletingUserId(null);
  };

  const handleToggleStatus = async (user: UserWithBranch) => {
    await updateUser.mutateAsync({
      id: user.id,
      data: { isActive: !user.isActive },
    });
  };

  // Helper function to get role display name
  const getRoleDisplay = (role: string) => {
    return role === 'ADMIN' ? 'مدير' : 'محاسب';
  };

  // Helper function to get status display
  const getStatusDisplay = (isActive: boolean) => {
    return isActive ? 'نشط' : 'معطل';
  };

  return (
    <div dir="rtl" className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة المستخدمين</h1>
            <p className="text-gray-600">
              إدارة المستخدمين وصلاحياتهم في النظام
            </p>
          </div>

          {/* Add User Button - Admin Only */}
          <ConditionalRender roles={['ADMIN']}>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-medium shadow-sm"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              إضافة مستخدم جديد
            </button>
          </ConditionalRender>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <svg
                className="animate-spin h-10 w-10 text-primary-600 mx-auto mb-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600">جاري تحميل المستخدمين...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
              <p className="text-red-800">
                حدث خطأ أثناء تحميل المستخدمين. يرجى المحاولة مرة أخرى.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && users.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا يوجد مستخدمون
            </h3>
            <p className="text-gray-600 mb-4">
              لم يتم إضافة أي مستخدم بعد. ابدأ بإضافة مستخدم جديد.
            </p>
            <ConditionalRender roles={['ADMIN']}>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                إضافة مستخدم جديد
              </button>
            </ConditionalRender>
          </div>
        )}

        {/* Users Table */}
        {!isLoading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    اسم المستخدم
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الدور
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الفرع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الحالة
                  </th>
                  <ConditionalRender roles={['ADMIN']}>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </ConditionalRender>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {getRoleDisplay(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => isAdmin() && handleToggleStatus(user)}
                        disabled={!isAdmin() || updateUser.isPending}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${
                          !isAdmin() || updateUser.isPending
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        {getStatusDisplay(user.isActive)}
                      </button>
                    </td>
                    <ConditionalRender roles={['ADMIN']}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-primary-600 hover:text-primary-800 transition-colors p-2 rounded-lg hover:bg-primary-50"
                            title="تعديل"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingUserId(user.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title="تعطيل"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </ConditionalRender>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة مستخدم جديد"
        size="lg"
      >
        <UserForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createUser.isPending}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="تعديل المستخدم"
        size="lg"
      >
        <UserForm
          onSubmit={handleUpdate}
          onCancel={() => setEditingUser(null)}
          initialData={editingUser}
          isLoading={updateUser.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingUserId}
        onClose={() => setDeletingUserId(null)}
        title="تأكيد التعطيل"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            هل أنت متأكد من تعطيل هذا المستخدم؟ سيتم إيقاف وصوله إلى النظام.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => deletingUserId && handleDelete(deletingUserId)}
              disabled={deleteUser.isPending}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {deleteUser.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  جاري التعطيل...
                </span>
              ) : (
                'تعطيل'
              )}
            </button>
            <button
              onClick={() => setDeletingUserId(null)}
              disabled={deleteUser.isPending}
              className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
