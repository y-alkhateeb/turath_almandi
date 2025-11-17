import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useInventory, useDeleteInventory } from '@/hooks/useInventory';
import { useAuth } from '@/hooks/useAuth';
import InventoryTable from '@/components/InventoryTable';
import { InventoryForm } from '@/components/InventoryForm';
import Modal from '@/components/Modal';
import { ConfirmModal } from '@/components/ui';
import { Button } from '@/ui/button';
import { Alert } from '@/ui/alert';
import type { InventoryItem, InventoryFilters } from '@/types/inventory.types';

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const [filters, setFilters] = useState<InventoryFilters>({
    page: 1,
    limit: 20,
  });

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: InventoryItem | null;
  }>({ isOpen: false, item: null });

  const { data, isLoading } = useInventory(filters);
  const deleteInventory = useDeleteInventory();

  const handleEdit = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
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

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleAddSuccess = () => {
    setIsAddModalOpen(false);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const getUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      KG: 'كيلو',
      PIECE: 'قطعة',
      LITER: 'لتر',
      OTHER: 'أخرى',
    };
    return labels[unit] || unit;
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
        <Button onClick={() => setIsAddModalOpen(true)}>
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

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleAddModalClose}
        title="إضافة صنف جديد"
      >
        <InventoryForm onSuccess={handleAddSuccess} onCancel={handleAddModalClose} />
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        title="تعديل الصنف"
      >
        {selectedItem && (
          <InventoryForm
            item={selectedItem}
            onSuccess={handleEditSuccess}
            onCancel={handleEditModalClose}
          />
        )}
      </Modal>

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
