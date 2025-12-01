/**
 * Payables List Page - Container Component
 * Manages payables (accounts payable) with filters, statistics, and payment handling
 *
 * Features:
 * - Paginated payables list with filters
 * - Payable summary statistics in cards
 * - Status filter (all, active, partial, paid)
 * - Branch filter (admin only)
 * - Pay payable dialog with PaymentForm
 * - Create/edit payable dialogs
 * - View payment history
 * - RTL support and strict typing
 */

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  usePayables,
  usePayableFilters,
  usePayableSummary,
  useCreatePayable,
  useUpdatePayable,
  usePayPayable,
  usePayable,
} from '@/hooks/usePayables';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { PayableList, PayableStatsCards, PayableForm, PaymentForm } from '@/components/payables';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import type { CreatePayableInput, UpdatePayableInput, PayPayableDto } from '@/types/payables.types';

export default function PayablesListPage() {
  const { isAdmin } = useAuth();

  const [selectedPayableId, setSelectedPayableId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  const { filters, setFilter, setPage, resetFilters } = usePayableFilters({
    page: 1,
    limit: 20,
  });

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = usePayableSummary(filters.branchId);

  const {
    data: payablesData,
    isLoading: isLoadingPayables,
    error: payablesError,
    refetch: refetchPayables,
  } = usePayables(filters);

  const { data: branches = [] } = useBranches();
  const { data: selectedPayable } = usePayable(selectedPayableId || '', {
    enabled: !!selectedPayableId,
  });

  const createPayable = useCreatePayable();
  const updatePayable = useUpdatePayable();
  const payPayable = usePayPayable();

  const handleFiltersChange = useCallback(
    (key: string, value: string | undefined) => {
      setFilter(key as keyof typeof filters, value);
      setPage(1);
    },
    [setFilter, setPage]
  );

  const handlePageChange = useCallback((page: number) => setPage(page), [setPage]);

  const handlePay = useCallback((id: string) => {
    setSelectedPayableId(id);
    setIsPayDialogOpen(true);
  }, []);

  const handleView = useCallback((id: string) => {
    setSelectedPayableId(id);
    setIsEditDialogOpen(true);
  }, []);

  const handleAddNew = useCallback(() => setIsCreateDialogOpen(true), []);
  const handleRetry = useCallback(() => refetchPayables(), [refetchPayables]);

  const handleCreateSubmit = useCallback(
    async (data: CreatePayableInput) => {
      await createPayable.mutateAsync(data);
      setIsCreateDialogOpen(false);
    },
    [createPayable]
  );

  const handleUpdateSubmit = useCallback(
    async (data: UpdatePayableInput) => {
      if (!selectedPayableId) return;
      await updatePayable.mutateAsync({ id: selectedPayableId, data });
      setIsEditDialogOpen(false);
      setSelectedPayableId(null);
    },
    [selectedPayableId, updatePayable]
  );

  const handlePaySubmit = useCallback(
    async (data: PayPayableDto) => {
      if (!selectedPayableId) return;
      await payPayable.mutateAsync({ id: selectedPayableId, data });
      setIsPayDialogOpen(false);
      setSelectedPayableId(null);
    },
    [selectedPayableId, payPayable]
  );

  const payables = payablesData?.data || [];
  const currentPage = payablesData?.meta.currentPage || 1;
  const totalPages = payablesData?.meta.totalPages || 0;
  const total = payablesData?.meta.total || 0;

  const isLoading = isLoadingSummary || isLoadingPayables;
  const error = summaryError || payablesError;

  const hasNoPayablesAtAll = !isLoading && total === 0 && Object.keys(filters).length <= 2;

  if (isLoading && !payablesData && !summary) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>
        <CardSkeleton count={6} variant="stat" />
        <div className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse" />
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <ListSkeleton items={10} variant="default" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الحسابات الدائنة</h1>
            <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة المبالغ المستحقة للموردين</p>
          </div>
        </div>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (hasNoPayablesAtAll) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الحسابات الدائنة</h1>
            <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة المبالغ المستحقة للموردين</p>
          </div>
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
            <Plus className="w-4 h-4" />
            إضافة حساب دائن
          </button>
        </div>
        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا توجد حسابات دائنة مسجلة"
          description="ابدأ بإضافة أول حساب دائن لتتبع المستحقات للموردين."
          action={{ label: 'إضافة حساب دائن جديد', onClick: handleAddNew }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الحسابات الدائنة</h1>
          <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة المبالغ المستحقة للموردين ({total} حساب)</p>
        </div>
        <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
          <Plus className="w-4 h-4" />
          إضافة حساب دائن
        </button>
      </div>

      {summary && <PayableStatsCards summary={summary} isLoading={isLoadingSummary} />}

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الحالة</label>
            <select value={filters.status || ''} onChange={(e) => handleFiltersChange('status', e.target.value || undefined)} dir="rtl" className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">الكل</option>
              <option value="ACTIVE">نشط</option>
              <option value="PARTIAL">دفع جزئي</option>
              <option value="PAID">مدفوع</option>
            </select>
          </div>

          {isAdmin && branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الفرع</label>
              <select value={filters.branchId || ''} onChange={(e) => handleFiltersChange('branchId', e.target.value || undefined)} dir="rtl" className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="">جميع الفروع</option>
                {branches.filter((branch) => !branch.deletedAt).map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button type="button" onClick={resetFilters} className="w-full px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors">
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {payables.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <EmptyState title="لا توجد نتائج" description="لم يتم العثور على حسابات دائنة تطابق الفلاتر المحددة." action={{ label: 'مسح جميع الفلاتر', onClick: () => resetFilters() }} />
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
            <PayableList payables={payables} isLoading={isLoadingPayables && !!payablesData} onPay={handlePay} onView={handleView} />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between" dir="rtl">
              <p className="text-sm text-[var(--text-secondary)]">عرض الصفحة {currentPage} من {totalPages}</p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} maxVisiblePages={5} showFirstLast />
            </div>
          )}
        </>
      )}

      <Dialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} title="إضافة حساب دائن جديد" size="large">
        <PayableForm mode="create" onSubmit={handleCreateSubmit} onCancel={() => setIsCreateDialogOpen(false)} isSubmitting={createPayable.isPending} />
      </Dialog>

      {selectedPayable && (
        <>
          <Dialog isOpen={isEditDialogOpen} onClose={() => { setIsEditDialogOpen(false); setSelectedPayableId(null); }} title="تعديل الحساب الدائن" size="large">
            <PayableForm mode="edit" initialData={selectedPayable} onSubmit={handleUpdateSubmit} onCancel={() => { setIsEditDialogOpen(false); setSelectedPayableId(null); }} isSubmitting={updatePayable.isPending} />
          </Dialog>

          <Dialog isOpen={isPayDialogOpen} onClose={() => { setIsPayDialogOpen(false); setSelectedPayableId(null); }} title="تسجيل دفع" size="medium">
            <PaymentForm payable={selectedPayable} onSubmit={handlePaySubmit} onCancel={() => { setIsPayDialogOpen(false); setSelectedPayableId(null); }} isSubmitting={payPayable.isPending} />
          </Dialog>
        </>
      )}
    </div>
  );
}
