import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useInventory, useDeleteInventory } from '@/hooks/useInventory';
import InventoryTable from '@/components/InventoryTable';
import { ConfirmModal } from '@/components/ui';
import { Button } from '@/ui/button';
import { PageLayout } from '@/components/layouts';
import type { InventoryItem, InventoryFilters } from '@/types/inventory.types';

export default function InventoryPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 20,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
  }>({ isOpen: false, item: null });

  const { data, isLoading, error, refetch } = useInventory(filters);
  const deleteInventory = useDeleteInventory();

  const handleEdit = (item: InventoryItem) => {
    navigate(`/inventory/edit/${item.id}`);
  };

  const handleDelete = (item: InventoryItem) => {
    setDeleteConfirmation({ isOpen: true, item });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.item) return;

    try {
      await deleteInventory.mutateAsync(deleteConfirmation.item.id);
      setDeleteConfirmation({ isOpen: false, item: null });
    } catch (_error) {
      // Error is handled in the hook
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, item: null });
  };

  const handleFiltersChange = (newFilters: InventoryFilters) => {
    setFilters(newFilters);
  };

  return (
    <PageLayout
      title="إدارة المخزون"
      description="عرض وإدارة جميع أصناف المخزون"
      error={error}
      onRetry={() => refetch()}
      actions={
        <Button onClick={() => navigate('/inventory/create')}>
          <Plus className="w-5 h-5" />
          إضافة صنف جديد
        </Button>
      }
    >
      {/* Table */}
      <InventoryTable
        items={data?.data || []}
        pagination={
          data?.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
          }
        }
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmation.isOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="تأكيد الحذف"
        message={
          deleteConfirmation.item
            ? `هل أنت متأكد من حذف "${deleteConfirmation.item.name}"؟ هذا الإجراء لا يمكن التراجع عنه.`
            : 'هل أنت متأكد من حذف هذا الصنف؟'
        }
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteInventory.isPending}
      />
    </PageLayout>
  );
}
