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
import { PageLoading } from '@/components/loading';
import { EmptyState, PageHeader, Table, ConfirmModal } from '@/components/ui';
import { Button } from '@/ui/button';
import { Badge } from '@/ui/badge';
import { Alert } from '@/ui/alert';
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
        <div className="font-medium text-[var(--text-primary)]">{branch.name}</div>
      ),
    },
    {
      key: 'location',
      header: 'الموقع',
      render: (branch) => <div className="text-[var(--text-primary)]">{branch.location}</div>,
    },
    {
      key: 'managerName',
      header: 'المدير',
      render: (branch) => (
        <div className="text-[var(--text-primary)]">{branch.managerName}</div>
      ),
    },
    {
      key: 'phone',
      header: 'الهاتف',
      render: (branch) => (
        <div className="text-[var(--text-primary)]" dir="ltr">
          {branch.phone}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'الحالة',
      render: (branch) => (
        <Button
          variant={branch.isActive ? 'success' : 'destructive'}
          size="sm"
          onClick={() => isAdmin() && handleToggleStatus(branch)}
          disabled={!isAdmin() || updateBranch.isPending}
        >
          <Badge variant={branch.isActive ? 'success' : 'destructive'}>
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
          >
            <Edit className="w-4 h-4" />
            تعديل
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeletingBranchId(branch.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
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
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-5 h-5" />
              إضافة فرع جديد
            </Button>
          ) : undefined
        }
      />

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          حدث خطأ أثناء تحميل الفروع. يرجى المحاولة مرة أخرى.
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <PageLoading message="جاري تحميل الفروع..." />
      ) : branches.length === 0 ? (
        /* Empty State */
        <EmptyState
          variant="default"
          icon={<Building2 className="w-full h-full" />}
          title="لا توجد فروع"
          description={
            isAdmin()
              ? 'أنشئ أول فرع لبدء إدارة عملك عبر مواقع متعددة. يمكنك تعيين مدير ورقم هاتف لكل فرع.'
              : 'لم يتم تعيين فرع لك بعد. تواصل مع المدير لتعيين فرع لك.'
          }
          actions={
            isAdmin()
              ? {
                  primary: {
                    label: 'إضافة فرع جديد',
                    onClick: () => setIsCreateModalOpen(true),
                  },
                }
              : undefined
          }
          size="lg"
        />
      ) : (
        /* Branches Table */
        <Table columns={columns} data={branches} keyExtractor={(branch) => branch.id} />
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

export default BranchesPage;
