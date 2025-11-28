/**
 * Inventory List Page - Container Component
 * Manages inventory with filters, pagination, and value tracking
 *
 * Architecture:
 * - Business logic in hooks (useInventory, useInventoryFilters, useInventoryValue)
 * - Presentational components (InventoryList, InventoryValueCard)
 * - This page only orchestrates components (container pattern)
 *
 * Features:
 * - Paginated inventory list with filters
 * - Total inventory value card with item count
 * - Unit filter (all, kg, piece, liter, other)
 * - Branch filter (admin only)
 * - Search filter
 * - Auto-added filter (manual, auto, all)
 * - Add inventory button → navigate to create
 * - Edit inventory → navigate to edit page
 * - Delete inventory with confirmation
 * - Pagination controls
 * - Loading states with skeleton
 * - Error and empty states
 * - RTL support
 * - Strict typing
 */

import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import {
  useInventory,
  useInventoryFilters,
  useInventoryValue,
  useDeleteInventory,
} from '@/hooks/useInventory';
import { useBranches } from '@/hooks/useBranches';
import { useAuth } from '@/hooks/useAuth';
import { InventoryList } from '@/components/inventory/InventoryList';
import { InventoryValueCard } from '@/components/inventory/InventoryValueCard';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';
import { ListSkeleton } from '@/components/skeletons/ListSkeleton';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function InventoryListPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // FILTERS & PAGINATION STATE
  // ============================================

  const { filters, setUnit, setBranchId, setSearch, setAutoAdded, setPage, resetFilters } =
    useInventoryFilters({
      page: 1,
      limit: 20, // Default 20 items per page
    });

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch total inventory value
   */
  const { data: totalValue = 0, isLoading: isLoadingValue } = useInventoryValue(filters.branchId);

  /**
   * Fetch paginated inventory with filters
   */
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    error: inventoryError,
    refetch: refetchInventory,
  } = useInventory(filters);

  /**
   * Fetch branches for filter dropdown (admins only)
   */
  const { data: branches = [] } = useBranches();

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Delete inventory mutation
   */
  const deleteInventory = useDeleteInventory();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle filter changes
   */
  const handleUnitChange = useCallback(
    (value: string) => {
      setUnit(value || undefined);
    },
    [setUnit]
  );

  const handleBranchChange = useCallback(
    (value: string) => {
      setBranchId(value || undefined);
    },
    [setBranchId]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value || undefined);
    },
    [setSearch]
  );

  const handleAutoAddedChange = useCallback(
    (value: string) => {
      if (value === 'manual') setAutoAdded(false);
      else if (value === 'auto') setAutoAdded(true);
      else setAutoAdded(undefined);
    },
    [setAutoAdded]
  );

  /**
   * Handle page change
   */
  const handlePageChange = useCallback(
    (page: number) => {
      setPage(page);
    },
    [setPage]
  );

  /**
   * Handle edit inventory
   * Navigate to edit page
   */
  const handleEdit = useCallback(
    (id: string) => {
      router.push(`/management/inventory/edit/${id}`);
    },
    [router]
  );

  /**
   * Handle delete inventory
   * Show confirmation dialog before deleting
   */
  const handleDelete = useCallback(
    async (id: string) => {
      // Find the item to check if it's auto-added
      const item = inventoryData?.data.find((i) => i.id === id);

      if (item?.autoAdded) {
        toast.error('لا يمكن حذف العناصر المضافة تلقائياً');
        return;
      }

      // Show confirmation dialog
      const confirmed = window.confirm(
        'هل أنت متأكد من حذف هذا الصنف؟ لا يمكن التراجع عن هذا الإجراء.'
      );

      if (!confirmed) return;

      try {
        await deleteInventory.mutateAsync(id);
        // Success toast shown by mutation
      } catch (_error) {
        // Error toast shown by global API interceptor
      }
    },
    [deleteInventory, inventoryData]
  );

  /**
   * Handle add new inventory
   * Navigate to create page
   */
  const handleAddNew = useCallback(() => {
    router.push('/management/inventory/create');
  }, [router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetchInventory();
  }, [refetchInventory]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const items = inventoryData?.data || [];
  const currentPage = inventoryData?.meta.currentPage || 1;
  const totalPages = inventoryData?.meta.totalPages || 0;
  const total = inventoryData?.meta.total || 0;
  const itemCount = total;

  const isLoading = isLoadingValue || isLoadingInventory;

  // Check if we have any inventory at all (not just for current filters)
  const hasNoInventoryAtAll = !isLoading && total === 0 && Object.keys(filters).length <= 2; // Only page and limit

  // Get auto-added filter value for select
  const autoAddedFilterValue =
    filters.autoAdded === false ? 'manual' : filters.autoAdded === true ? 'auto' : '';

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading && !inventoryData) {
    return (
      <div className="space-y-6" dir="rtl">
        {/* Page Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* Value Card Skeleton */}
        <div className="h-32 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse" />

        {/* Filters Skeleton */}
        <div className="h-20 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg animate-pulse" />

        {/* Table Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <ListSkeleton items={10} variant="default" />
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (inventoryError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المخزون</h1>
            <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة جميع أصناف المخزون</p>
          </div>
        </div>
        <ErrorState error={inventoryError} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // EMPTY STATE - NO INVENTORY AT ALL
  // ============================================

  if (hasNoInventoryAtAll) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between" dir="rtl">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المخزون</h1>
            <p className="text-[var(--text-secondary)] mt-1">تتبع وإدارة جميع أصناف المخزون</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            إضافة صنف
          </button>
        </div>

        {/* Empty State */}
        <EmptyState
          icon={<Plus className="w-8 h-8 text-primary-600" />}
          title="لا توجد أصناف في المخزون"
          description="ابدأ بإضافة أول صنف لتتبع المخزون وإدارة الكميات."
          action={{
            label: 'إضافة صنف جديد',
            onClick: handleAddNew,
          }}
        />
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">إدارة المخزون</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            تتبع وإدارة جميع أصناف المخزون ({total} صنف)
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة صنف
        </button>
      </div>

      {/* Inventory Value Card */}
      <InventoryValueCard
        totalValue={totalValue}
        itemCount={itemCount}
        isLoading={isLoadingValue}
      />

      {/* Filters */}
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-4"
        dir="rtl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Unit Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              الوحدة
            </label>
            <select
              value={filters.unit || ''}
              onChange={(e) => handleUnitChange(e.target.value)}
              dir="rtl"
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">جميع الوحدات</option>
              <option value="KG">كيلو</option>
              <option value="PIECE">قطعة</option>
              <option value="LITER">لتر</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>

          {/* Auto-Added Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              النوع
            </label>
            <select
              value={autoAddedFilterValue}
              onChange={(e) => handleAutoAddedChange(e.target.value)}
              dir="rtl"
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">الكل</option>
              <option value="manual">يدوي</option>
              <option value="auto">تلقائي</option>
            </select>
          </div>

          {/* Branch Filter - Admin Only */}
          {isAdmin && branches.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                الفرع
              </label>
              <select
                value={filters.branchId || ''}
                onChange={(e) => handleBranchChange(e.target.value)}
                dir="rtl"
                className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">جميع الفروع</option>
                {branches
                  .filter((branch) => !branch.deletedAt)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              البحث
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="بحث في الأصناف..."
              className="w-full px-3 py-2 border border-[var(--border-color)] rounded-md bg-[var(--bg-secondary)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md hover:bg-[var(--bg-secondary)] focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
              مسح الفلاتر
            </button>
          </div>
        </div>
      </div>

      {/* Inventory List */}
      {items.length === 0 ? (
        // Empty state for current filters
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <EmptyState
            title="لا توجد نتائج"
            description="لم يتم العثور على أصناف تطابق الفلاتر المحددة. حاول تعديل الفلاتر أو مسحها."
            action={{
              label: 'مسح جميع الفلاتر',
              onClick: () => resetFilters(),
            }}
          />
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
            <InventoryList
              items={items}
              isLoading={isLoadingInventory && !!inventoryData} // Show skeleton only on refetch
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between" dir="rtl">
              <p className="text-sm text-[var(--text-secondary)]">
                عرض الصفحة {currentPage} من {totalPages}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                maxVisiblePages={5}
                showFirstLast
              />
            </div>
          )}
        </>
      )}

      {/* Loading Overlay - Shown during delete operation */}
      {deleteInventory.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6 shadow-lg flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-[var(--text-primary)] font-medium">جاري الحذف...</span>
          </div>
        </div>
      )}
    </div>
  );
}
