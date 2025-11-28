import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingDown, TrendingUp } from 'lucide-react';
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

    return `${deletingTransaction.type === 'INCOME' ? 'واردات صندوق' : 'صرفيات الصندوق'} - ${formatCurrency(deletingTransaction.amount)} - ${formatDate(deletingTransaction.date)}`;
  };

  return (
    <PageLayout
      title="إدارة العمليات المالية"
      description="عرض وإدارة جميع واردات وصرفيات الصندوق"
      onRetry={() => refetch()}
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/transactions/create/expense')}
            className="gap-2"
          >
            <TrendingDown className="w-4 h-4" />
            إضافة مصروف
          </Button>
          <Button
            onClick={() => navigate('/transactions/create/income')}
            className="gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            إضافة إيراد
          </Button>
        </div>
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
