import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import TransactionTable from '@/components/TransactionTable';
import { Alert } from '@/ui/alert';
import type { Transaction, TransactionFilters } from '@/types/transactions.types';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
  }>({ isOpen: false, transaction: null });

  const { data, isLoading, error } = useTransactions(filters);
  const deleteTransaction = useDeleteTransaction();

  const handleView = (transaction: Transaction) => {
    navigate(`/transactions/view/${transaction.id}`);
  };

  const handleEdit = (transaction: Transaction) => {
    navigate(`/transactions/edit/${transaction.id}`);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeleteConfirmation({ isOpen: true, transaction });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.transaction) return;

    try {
      await deleteTransaction.mutateAsync(deleteConfirmation.transaction.id);
      setDeleteConfirmation({ isOpen: false, transaction: null });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, transaction: null });
  };

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة العمليات المالية</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          عرض وإدارة جميع الإيرادات والمصروفات
        </p>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <div className="flex flex-col gap-1">
            <div className="font-medium">حدث خطأ أثناء تحميل البيانات</div>
            <div className="text-sm">
              {(error as any)?.response?.data?.message || 'حدث خطأ غير متوقع'}
            </div>
          </div>
        </Alert>
      )}

      {/* Table */}
      <TransactionTable
        transactions={data?.data || []}
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
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
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
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">تأكيد الحذف</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  هل أنت متأكد من حذف هذه العملية؟
                </p>
              </div>
            </div>

            {deleteConfirmation.transaction && (
              <div className="mb-4 p-3 bg-[var(--bg-tertiary)] rounded-md border border-[var(--border-color)]">
                <div className="text-sm text-[var(--text-primary)]">
                  <p>
                    <span className="font-medium">النوع:</span>{' '}
                    <span
                      className={
                        deleteConfirmation.transaction.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {deleteConfirmation.transaction.type === 'INCOME' ? 'إيراد' : 'مصروف'}
                    </span>
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">المبلغ:</span>{' '}
                    {deleteConfirmation.transaction.amount.toLocaleString('ar-IQ')} IQD
                  </p>
                  <p className="mt-1">
                    <span className="font-medium">التاريخ:</span>{' '}
                    {new Date(deleteConfirmation.transaction.date).toLocaleDateString('ar-IQ')}
                  </p>
                </div>
              </div>
            )}

            <p className="text-sm text-[var(--text-secondary)] mb-6">
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف العملية نهائياً من النظام.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={deleteTransaction.isPending}
                className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-md hover:bg-[var(--bg-tertiary)] transition-colors font-medium disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteTransaction.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {deleteTransaction.isPending ? (
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
