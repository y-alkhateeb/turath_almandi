/**
 * TransactionListPage
 * Main transaction list view with card-based UI
 *
 * Features:
 * - Statistics cards at top (income, expense, profit)
 * - Collapsible filter panel with calendar pickers
 * - Card grid view (replaces table)
 * - Pagination
 * - Delete confirmation dialog
 * - Navigation to create/view/edit pages
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/icon';
import { Button } from '@/ui/button';
import { Card, CardContent } from '@/ui/card';
import { cn } from '@/utils';
import { DataTable } from '@/ui/data-table';
import { transactionColumns } from '@/components/transactions/transaction-columns';
import { PageLayout } from '@/components/layouts';
import { ConfirmDeleteDialog } from '@/components/dialogs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import transactionService from '@/api/services/transactionService';
import type { Transaction } from '#/entity';
import type { TransactionQueryFilters } from '#/api';
import { toast } from 'sonner';

// ============================================
// COMPONENT
// ============================================

export default function TransactionListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<TransactionQueryFilters>({
    page: 1,
    limit: 12,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  const { data: transactionsData, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', 'list', filters],
    queryFn: () => transactionService.getAll(filters),
  });

  const { data: summaryData, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['transactions', 'summary', filters],
    queryFn: () => transactionService.getSummary({
      startDate: filters.startDate,
      endDate: filters.endDate,
      category: filters.category,
      branchId: filters.branchId,
    }),
  });

  // ============================================
  // MUTATIONS
  // ============================================

  const deleteMutation = useMutation({
    mutationFn: (id: string) => transactionService.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success('تم حذف المعاملة بنجاح');

      setDeletingTransaction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'حدث خطأ أثناء الحذف');
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  const handleView = (id: string) => {
    navigate(`/transactions/view/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/transactions/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    const transaction = transactionsData?.data.find((t) => t.id === id);
    if (transaction) {
      setDeletingTransaction(transaction);
    }
  };

  const confirmDelete = () => {
    if (deletingTransaction) {
      deleteMutation.mutate(deletingTransaction.id);
    }
  };

  const cancelDelete = () => {
    setDeletingTransaction(null);
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const transactions = transactionsData?.data || [];
  const pagination = transactionsData?.pagination;

  const totalIncome = summaryData?.totalIncome || 0;
  const totalExpense = summaryData?.totalExpense || 0;
  const netProfit = totalIncome - totalExpense;

  // ============================================
  // RENDER
  // ============================================

  return (
    <PageLayout
      title="إدارة المعاملات"
      description="عرض وإدارة جميع المعاملات المالية"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/transactions/create/expense')}
            className="gap-2"
          >
            <Icon icon="solar:wallet-money-bold-duotone" className="w-4 h-4" />
            إضافة مصروف
          </Button>
          <Button
            onClick={() => navigate('/transactions/create/income')}
            className="gap-2"
          >
            <Icon icon="solar:hand-money-bold-duotone" className="w-4 h-4" />
            إضافة وارد
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Income Card */}
          <Card className="border-r-4 border-r-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    إجمالي الواردات
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalIncome.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">د.ع</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Icon
                    icon="solar:hand-money-bold-duotone"
                    className="w-6 h-6 text-green-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expense Card */}
          <Card className="border-r-4 border-r-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    إجمالي المصروفات
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {totalExpense.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">د.ع</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Icon
                    icon="solar:wallet-money-bold-duotone"
                    className="w-6 h-6 text-red-600"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Profit Card */}
          <Card className={cn(
            'border-r-4',
            netProfit >= 0 ? 'border-r-blue-500' : 'border-r-amber-500'
          )}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-secondary)] mb-1">
                    صافي الربح
                  </p>
                  <p className={cn(
                    'text-2xl font-bold',
                    netProfit >= 0 ? 'text-blue-600' : 'text-amber-600'
                  )}>
                    {netProfit.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">د.ع</p>
                </div>
                <div className={cn(
                  'h-12 w-12 rounded-full flex items-center justify-center',
                  netProfit >= 0 ? 'bg-blue-100' : 'bg-amber-100'
                )}>
                  <Icon
                    icon={netProfit >= 0 ? 'solar:chart-2-bold-duotone' : 'solar:chart-bold-duotone'}
                    className={cn(
                      'w-6 h-6',
                      netProfit >= 0 ? 'text-blue-600' : 'text-amber-600'
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Toggle Button */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Icon icon="solar:filter-bold-duotone" className="w-4 h-4" />
            {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
            <Icon
              icon={showFilters ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'}
              className="w-4 h-4"
            />
          </Button>

          {/* Active Filters Count */}
          {Object.keys(filters).filter((key) => !['page', 'limit'].includes(key) && filters[key as keyof typeof filters]).length > 0 && (
            <span className="text-sm text-[var(--text-secondary)]">
              {Object.keys(filters).filter((key) => !['page', 'limit'].includes(key) && filters[key as keyof typeof filters]).length} فلتر نشط
            </span>
          )}
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Date Range - Start */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    من تاريخ
                  </label>
                  <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, startDate: e.target.value || undefined, page: 1 }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  />
                </div>

                {/* Date Range - End */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    إلى تاريخ
                  </label>
                  <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, endDate: e.target.value || undefined, page: 1 }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  />
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    نوع المعاملة
                  </label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        type: e.target.value ? (e.target.value as 'INCOME' | 'EXPENSE') : undefined,
                        page: 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="">الكل</option>
                    <option value="INCOME">وارد</option>
                    <option value="EXPENSE">مصروف</option>
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    طريقة الدفع
                  </label>
                  <select
                    value={filters.paymentMethod || ''}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        paymentMethod: e.target.value || undefined,
                        page: 1,
                      }))
                    }
                    className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
                  >
                    <option value="">الكل</option>
                    <option value="CASH">نقدي</option>
                    <option value="BANK_TRANSFER">تحويل بنكي</option>
                    <option value="CARD">بطاقة</option>
                    <option value="CHEQUE">شيك</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters Button */}
              {Object.keys(filters).filter((key) => !['page', 'limit'].includes(key) && filters[key as keyof typeof filters]).length > 0 && (
                <div className="mt-4 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilters({ page: 1, limit: 12 })}
                    className="gap-2"
                  >
                    <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                    مسح الفلاتر
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction Table */}
        <DataTable
          columns={transactionColumns}
          data={transactions}
          isLoading={isLoadingTransactions}
          pagination={pagination}
          onPageChange={handlePageChange}
          meta={{
            onView: handleView,
            onEdit: handleEdit,
            onDelete: handleDelete,
          }}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        isOpen={!!deletingTransaction}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        itemName="المعاملة"
        itemDescription={deletingTransaction ? `${deletingTransaction.type === 'INCOME' ? 'وارد' : 'مصروف'} - ${Number(deletingTransaction.amount).toFixed(2)} د.ع` : ''}
        isDeleting={deleteMutation.isPending}
      />
    </PageLayout>
  );
}
