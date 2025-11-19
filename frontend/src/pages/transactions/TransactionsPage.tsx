import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions';
import TransactionTable from '@/components/TransactionTable';
import { PageLayout } from '@/components/layouts';
import { ConfirmDeleteDialog } from '@/components/dialogs';
import { Button } from '@/ui/button';
import type { Transaction, TransactionFilters } from '@/types/transactions.types';
import { formatCurrency, formatDate } from '@/utils/formatters';

export default function TransactionsPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<TransactionFilters>({
    page: 1,
    limit: 20,
  });

  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const { data, isLoading, refetch } = useTransactions(filters);
  const deleteTransaction = useDeleteTransaction();

  const handleView = (transaction: Transaction) => {
    navigate(`/transactions/view/${transaction.id}`);
  };

  const handleEdit = (transaction: Transaction) => {
    navigate(`/transactions/edit/${transaction.id}`);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
  };

  const confirmDelete = async () => {
    if (!deletingTransaction) return;

    try {
      await deleteTransaction.mutateAsync(deletingTransaction.id);
      setDeletingTransaction(null);
    } catch (_error) {
      // Error is handled in the hook
    }
  };

  const cancelDelete = () => {
    setDeletingTransaction(null);
  };

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  // Format transaction description for delete dialog
  const getTransactionDescription = () => {
    if (!deletingTransaction) return '';

    return `${deletingTransaction.type === 'INCOME' ? 'إيراد' : 'مصروف'} - ${formatCurrency(deletingTransaction.amount)} - ${formatDate(deletingTransaction.date)}`;
  };

  return (
    <PageLayout
      title="إدارة العمليات المالية"
      description="عرض وإدارة جميع الإيرادات والمصروفات"
      onRetry={() => refetch()}
      actions={
        <Button onClick={() => navigate('/income/create')}>
          <Plus className="w-5 h-5" />
          إضافة عملية جديدة
        </Button>
      }
    >
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
      <ConfirmDeleteDialog
        isOpen={!!deletingTransaction}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        itemName="العملية المالية"
        itemDescription={getTransactionDescription()}
        isLoading={deleteTransaction.isPending}
      />
    </PageLayout>
  );
}
