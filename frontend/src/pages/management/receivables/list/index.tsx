/**
 * Receivables List Page - Container Component
 * Manages receivables (accounts receivable) with filters, statistics, and collection handling
 *
 * Features:
 * - Paginated receivables list with filters
 * - Receivable summary statistics in cards
 * - Status filter (all, active, partial, paid)
 * - Branch filter (admin only)
 * - Collect receivable dialog with CollectionForm
 * - Create/edit receivable dialogs
 * - View collection history
 * - RTL support and strict typing
 */

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import {
  useReceivables,
  useReceivableFilters,
  useReceivableSummary,
  useCreateReceivable,
  useUpdateReceivable,
  useCollectReceivable,
  useReceivable,
} from '@/hooks/useReceivables';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { ReceivableList, ReceivableStatsCards, ReceivableForm, CollectionForm } from '@/components/receivables';
import { Pagination } from '@/components/ui/Pagination';
import { Dialog } from '@/components/ui/Dialog';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import type { CreateReceivableInput, UpdateReceivableInput, CollectReceivableDto } from '@/types/receivables.types';

export default function ReceivablesListPage() {
  const { isAdmin } = useAuth();

  const [selectedReceivableId, setSelectedReceivableId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCollectDialogOpen, setIsCollectDialogOpen] = useState(false);

  const { filters, setFilter, setPage, resetFilters } = useReceivableFilters({
    page: 1,
    limit: 20,
  });

  const {
    data: summary,
    isLoading: isLoadingSummary,
    error: summaryError,
  } = useReceivableSummary(filters.branchId);

  const {
    data: receivablesData,
    isLoading: isLoadingReceivables,
    error: receivablesError,
    refetch: refetchReceivables,
  } = useReceivables(filters);

  const { data: branches = [] } = useBranches();
  const { data: selectedReceivable } = useReceivable(selectedReceivableId || '', {
    enabled: !!selectedReceivableId,
  });

  const createReceivable = useCreateReceivable();
  const updateReceivable = useUpdateReceivable();
  const collectReceivable = useCollectReceivable();

  const handleFiltersChange = useCallback(
    (key: string, value: string | undefined) => {
      setFilter(key as keyof typeof filters, value);
      setPage(1);
    },
    [setFilter, setPage]
  );

  const handlePageChange = useCallback((page: number) => setPage(page), [setPage]);

  const handleCollect = useCallback((id: string) => {
    setSelectedReceivableId(id);
    setIsCollectDialogOpen(true);
  }, []);

  const handleView = useCallback((id: string) => {
    setSelectedReceivableId(id);
    setIsEditDialogOpen(true);
  }, []);

  const handleAddNew = useCallback(() => setIsCreateDialogOpen(true), []);
  const handleRetry = useCallback(() => refetchReceivables(), [refetchReceivables]);

  const handleCreateSubmit = useCallback(
    async (data: CreateReceivableInput) => {
      await createReceivable.mutateAsync(data);
      setIsCreateDialogOpen(false);
    },
    [createReceivable]
  );

  const handleUpdateSubmit = useCallback(
    async (data: UpdateReceivableInput) => {
      if (!selectedReceivableId) return;
      await updateReceivable.mutateAsync({ id: selectedReceivableId, data });
      setIsEditDialogOpen(false);
      setSelectedReceivableId(null);
    },
    [selectedReceivableId, updateReceivable]
  );

  const handleCollectSubmit = useCallback(
    async (data: CollectReceivableDto) => {
      if (!selectedReceivableId) return;
      await collectReceivable.mutateAsync({ id: selectedReceivableId, data });
      setIsCollectDialogOpen(false);
      setSelectedReceivableId(null);
    },
    [selectedReceivableId, collectReceivable]
  );

  const receivables = receivablesData?.data || [];
  const currentPage = receivablesData?.meta.currentPage || 1;
  const totalPages = receivablesData?.meta.totalPages || 0;
  const total = receivablesData?.meta.total || 0;

  const isLoading = isLoadingSummary || isLoadingReceivables;
  const error = summaryError || receivablesError;

  const hasNoReceivablesAtAll = !isLoading && total === 0 && Object.keys(filters).length <= 2;

  if (isLoading && !receivablesData && !summary) {
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
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الحسابات المدينة</h1>
            <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة المبالغ المستحقة من العملاء</p>
          </div>
        </div>
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  if (hasNoReceivablesAtAll) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الحسابات المدينة</h1>
            <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة المبالغ المستحقة من العملاء</p>
          </div>
          <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
            <Plus className="w-4 h-4" />
            إضافة حساب مدين
          </button>
        </div>
        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا توجد حسابات مدينة مسجلة"
          description="ابدأ بإضافة أول حساب مدين لتتبع المستحقات من العملاء."
          action={{ label: 'إضافة حساب مدين جديد', onClick: handleAddNew }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة الحسابات المدينة</h1>
          <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة المبالغ المستحقة من العملاء ({total} حساب)</p>
        </div>
        <button onClick={handleAddNew} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors">
          <Plus className="w-4 h-4" />
          إضافة حساب مدين
        </button>
      </div>

      {summary && <ReceivableStatsCards summary={summary} isLoading={isLoadingSummary} />}

      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">الحالة</label>
            <select value={filters.status || ''} onChange={(e) => handleFiltersChange('status', e.target.value || undefined)} dir="rtl" className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">الكل</option>
              <option value="ACTIVE">نشط</option>
              <option value="PARTIAL">تحصيل جزئي</option>
              <option value="PAID">محصل</option>
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

      {receivables.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <EmptyState title="لا توجد نتائج" description="لم يتم العثور على حسابات مدينة تطابق الفلاتر المحددة." action={{ label: 'مسح جميع الفلاتر', onClick: () => resetFilters() }} />
        </div>
      ) : (
        <>
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
            <ReceivableList receivables={receivables} isLoading={isLoadingReceivables && !!receivablesData} onCollect={handleCollect} onView={handleView} />
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between" dir="rtl">
              <p className="text-sm text-[var(--text-secondary)]">عرض الصفحة {currentPage} من {totalPages}</p>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} maxVisiblePages={5} showFirstLast />
            </div>
          )}
        </>
      )}

      <Dialog isOpen={isCreateDialogOpen} onClose={() => setIsCreateDialogOpen(false)} title="إضافة حساب مدين جديد" size="large">
        <ReceivableForm mode="create" onSubmit={handleCreateSubmit} onCancel={() => setIsCreateDialogOpen(false)} isSubmitting={createReceivable.isPending} />
      </Dialog>

      {selectedReceivable && (
        <>
          <Dialog isOpen={isEditDialogOpen} onClose={() => { setIsEditDialogOpen(false); setSelectedReceivableId(null); }} title="تعديل الحساب المدين" size="large">
            <ReceivableForm mode="edit" initialData={selectedReceivable} onSubmit={handleUpdateSubmit} onCancel={() => { setIsEditDialogOpen(false); setSelectedReceivableId(null); }} isSubmitting={updateReceivable.isPending} />
          </Dialog>

          <Dialog isOpen={isCollectDialogOpen} onClose={() => { setIsCollectDialogOpen(false); setSelectedReceivableId(null); }} title="تسجيل تحصيل" size="medium">
            <CollectionForm receivable={selectedReceivable} onSubmit={handleCollectSubmit} onCancel={() => { setIsCollectDialogOpen(false); setSelectedReceivableId(null); }} isSubmitting={collectReceivable.isPending} />
          </Dialog>
        </>
      )}
    </div>
  );
}
