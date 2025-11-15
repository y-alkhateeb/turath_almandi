import { useState } from 'react';
import { useInventory, useDeleteInventory } from '../../hooks/useInventory';
import { useAuth } from '../../hooks/useAuth';
import InventoryTable from '../../components/InventoryTable';
import { InventoryForm } from '../../components/InventoryForm';
import Modal from '../../components/Modal';
import type { InventoryItem, InventoryFilters } from '../../types/inventory.types';

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

  const { data, isLoading, error } = useInventory(filters);
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
          <h1 className="text-3xl font-bold text-gray-900">إدارة المخزون</h1>
          <p className="mt-2 text-gray-600">
            عرض وإدارة جميع أصناف المخزون
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + إضافة صنف جديد
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-red-800">
                حدث خطأ أثناء تحميل البيانات
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {(error as any)?.response?.data?.message || 'حدث خطأ غير متوقع'}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center ml-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">تأكيد الحذف</h3>
                <p className="mt-1 text-sm text-gray-600">
                  هل أنت متأكد من حذف هذا الصنف؟
                </p>
              </div>
            </div>

            {deleteConfirmation.item && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="text-sm text-gray-700">
                  <p>
                    <span className="font-medium">الاسم:</span>{' '}
                    {deleteConfirmation.item.name}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">الكمية:</span>{' '}
                    {deleteConfirmation.item.quantity.toLocaleString('ar-IQ')}{' '}
                    {getUnitLabel(deleteConfirmation.item.unit)}
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">سعر الوحدة:</span>{' '}
                    {deleteConfirmation.item.costPerUnit.toLocaleString('ar-IQ')} $
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600 mb-6">
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف الصنف نهائياً من النظام.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleteInventory.isPending}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteInventory.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {deleteInventory.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>جاري الحذف...</span>
                  </>
                ) : (
                  'حذف'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
