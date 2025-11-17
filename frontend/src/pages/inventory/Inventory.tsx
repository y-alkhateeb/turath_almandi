import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useInventory, useDeleteInventory } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import InventoryTable from '@/components/InventoryTable';
import { ConfirmModal } from '@/components/ui';
import { Button } from '@/ui/button';
import { Alert } from '@/ui/alert';
import type { InventoryItem, InventoryFilters } from '@/types/inventory.types';

export default function InventoryPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 20,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
  }>({ isOpen: false, item: null });

  const { data, isLoading } = useInventory(filters);
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
    } catch (error) {
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
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المخزون</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            عرض وإدارة جميع أصناف المخزون
          </p>
        </div>
        <Button onClick={() => navigate('/inventory/create')}>
          <Plus className="w-5 h-5" />
          إضافة صنف جديد
        </Button>
      </div>

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
    </div>
  );
}
