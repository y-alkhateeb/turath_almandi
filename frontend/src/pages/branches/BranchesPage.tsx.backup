import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useBranches,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
} from '@/hooks/useBranches';
import { Modal } from '@/components/Modal';
import { BranchForm } from '@/components/BranchForm';
import { ConditionalRender } from '@/components/ConditionalRender';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Alert } from '@/components/ui/Alert';
import type { Branch, BranchFormData } from '@/types';

export const BranchesPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const { data: branches = [], isLoading, error } = useBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deletingBranchId, setDeletingBranchId] = useState<string | null>(null);

  // Handlers
  const handleCreate = async (data: BranchFormData) => {
    await createBranch.mutateAsync(data);
    setIsCreateModalOpen(false);
  };

  const handleUpdate = async (data: BranchFormData) => {
    if (!editingBranch) return;
    await updateBranch.mutateAsync({ id: editingBranch.id, data });
    setEditingBranch(null);
  };

  const handleDelete = async (id: string) => {
    await deleteBranch.mutateAsync(id);
    setDeletingBranchId(null);
  };

  const handleToggleStatus = async (branch: Branch) => {
    await updateBranch.mutateAsync({
      id: branch.id,
      data: { isActive: !branch.isActive },
    });
  };

  return (
    <div dir="rtl" className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">إدارة الفروع</h1>
            <p className="text-gray-600">
              {isAdmin() ? 'إدارة جميع فروع المؤسسة' : 'عرض الفرع المخصص'}
            </p>
          </div>

          {/* Add Branch Button - Admin Only */}
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
              إضافة فرع جديد
            </button>
          </ConditionalRender>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" text="جاري تحميل الفروع..." />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-6">
            <Alert variant="danger" title="خطأ">
              حدث خطأ أثناء تحميل الفروع. يرجى المحاولة مرة أخرى.
            </Alert>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && branches.length === 0 && (
          <div className="p-12">
            <EmptyState
              icon={
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
              title="لا توجد فروع"
              description={
                isAdmin()
                  ? 'لم يتم إضافة أي فرع بعد. ابدأ بإضافة فرع جديد.'
                  : 'لم يتم تعيين فرع لك بعد.'
              }
              action={
                isAdmin()
                  ? {
                      label: 'إضافة فرع جديد',
                      onClick: () => setIsCreateModalOpen(true),
                    }
                  : undefined
              }
            />
          </div>
        )}

        {/* Branches Table */}
        {!isLoading && !error && branches.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    اسم الفرع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الموقع
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    المدير
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    الهاتف
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
                {branches.map((branch) => (
                  <tr
                    key={branch.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {branch.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {branch.location}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {branch.managerName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" dir="ltr">
                      <div className="text-sm text-gray-700 text-right">
                        {branch.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => isAdmin() && handleToggleStatus(branch)}
                        disabled={!isAdmin() || updateBranch.isPending}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          branch.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        } ${
                          !isAdmin() || updateBranch.isPending
                            ? 'cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      >
                        {branch.isActive ? 'نشط' : 'غير نشط'}
                      </button>
                    </td>
                    <ConditionalRender roles={['ADMIN']}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => setEditingBranch(branch)}
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
                            onClick={() => setDeletingBranchId(branch.id)}
                            className="text-red-600 hover:text-red-800 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title="حذف"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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

      {/* Create Branch Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة فرع جديد"
        size="lg"
      >
        <BranchForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={createBranch.isPending}
        />
      </Modal>

      {/* Edit Branch Modal */}
      <Modal
        isOpen={!!editingBranch}
        onClose={() => setEditingBranch(null)}
        title="تعديل الفرع"
        size="lg"
      >
        <BranchForm
          onSubmit={handleUpdate}
          onCancel={() => setEditingBranch(null)}
          initialData={editingBranch}
          isLoading={updateBranch.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingBranchId}
        onClose={() => setDeletingBranchId(null)}
        title="تأكيد الحذف"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => deletingBranchId && handleDelete(deletingBranchId)}
              disabled={deleteBranch.isPending}
              className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              {deleteBranch.isPending && (
                <LoadingSpinner size="sm" color="white" />
              )}
              {deleteBranch.isPending ? 'جاري الحذف...' : 'حذف'}
            </button>
            <button
              onClick={() => setDeletingBranchId(null)}
              disabled={deleteBranch.isPending}
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
