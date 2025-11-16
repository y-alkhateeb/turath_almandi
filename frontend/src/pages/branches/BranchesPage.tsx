import { useState } from 'react';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
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
import {
  LoadingSpinner,
  EmptyState,
  Alert,
  PageHeader,
  Button,
  Table,
  Badge,
  ConfirmModal,
} from '@/components/ui';
import type { Branch, BranchFormData } from '@/types';
import type { Column } from '@/components/ui/Table';

export const BranchesPage = () => {
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

  const handleDelete = async () => {
    if (!deletingBranchId) return;
    await deleteBranch.mutateAsync(deletingBranchId);
    setDeletingBranchId(null);
  };

  const handleToggleStatus = async (branch: Branch) => {
    await updateBranch.mutateAsync({
      id: branch.id,
      data: { isActive: !branch.isActive },
    });
  };

  // Table columns configuration
  const columns: Column<Branch>[] = [
    {
      key: 'name',
      header: 'اسم الفرع',
      render: (branch) => (
        <div className="font-medium text-gray-900">{branch.name}</div>
      ),
    },
    {
      key: 'location',
      header: 'الموقع',
      render: (branch) => <div className="text-gray-700">{branch.location}</div>,
    },
    {
      key: 'managerName',
      header: 'المدير',
      render: (branch) => (
        <div className="text-gray-700">{branch.managerName}</div>
      ),
    },
    {
      key: 'phone',
      header: 'الهاتف',
      render: (branch) => (
        <div className="text-gray-700" dir="ltr">
          {branch.phone}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'الحالة',
      render: (branch) => (
        <Button
          variant={branch.isActive ? 'success' : 'danger'}
          size="sm"
          onClick={() => isAdmin() && handleToggleStatus(branch)}
          disabled={!isAdmin() || updateBranch.isPending}
        >
          <Badge variant={branch.isActive ? 'success' : 'danger'}>
            {branch.isActive ? 'نشط' : 'غير نشط'}
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
      render: (branch) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingBranch(branch)}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            تعديل
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingBranchId(branch.id)}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
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
        title="إدارة الفروع"
        description={isAdmin() ? 'إدارة جميع فروع المؤسسة' : 'عرض الفرع المخصص'}
        actions={
          isAdmin() ? (
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              leftIcon={<Plus className="w-5 h-5" />}
            >
              إضافة فرع جديد
            </Button>
          ) : undefined
        }
      />

      {/* Error State */}
      {error && (
        <Alert variant="danger" title="خطأ">
          حدث خطأ أثناء تحميل الفروع. يرجى المحاولة مرة أخرى.
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" text="جاري تحميل الفروع..." />
        </div>
      ) : branches.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Building2 className="w-full h-full" />}
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
      ) : (
        /* Branches Table */
        <Table columns={columns} data={branches} />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="إضافة فرع جديد"
      >
        <BranchForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editingBranch}
        onClose={() => setEditingBranch(null)}
        title="تعديل الفرع"
      >
        <BranchForm
          onSubmit={handleUpdate}
          onCancel={() => setEditingBranch(null)}
          initialData={editingBranch || undefined}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingBranchId}
        onClose={() => setDeletingBranchId(null)}
        onConfirm={handleDelete}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا الفرع؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteBranch.isPending}
      />
    </div>
  );
};
