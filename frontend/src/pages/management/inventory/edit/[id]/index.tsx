/**
 * Edit Inventory Page - Container Component
 * Handles inventory item editing flow with auto-added protection
 *
 * Architecture:
 * - Business logic in useInventoryItem and useUpdateInventory hooks
 * - Presentational component (InventoryForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Fetch inventory item by ID
 * - Update inventory item
 * - Navigate to list on success
 * - Prevent edit if autoAdded=true (redirect with toast)
 * - Handle not found (404) error
 * - Handle errors with toast (global interceptor)
 * - Breadcrumb navigation
 * - Loading state during fetch and submission
 * - Cancel navigation
 * - Strict typing
 */

import { useCallback, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useParams } from '@/routes/hooks';
import { useInventoryItem, useUpdateInventory } from '@/hooks/useInventory';
import { InventoryForm } from '@/components/inventory/InventoryForm';
import { ErrorState } from '@/components/common/ErrorState';
import type { UpdateInventoryInput } from '#/entity';
import { toast } from 'sonner';

// ============================================
// PAGE COMPONENT
// ============================================

export default function EditInventoryPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch inventory item by ID
   */
  const {
    data: item,
    isLoading,
    error,
    refetch,
  } = useInventoryItem(id || '', {
    enabled: !!id,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Update inventory mutation
   */
  const updateInventory = useUpdateInventory();

  // ============================================
  // AUTO-ADDED PROTECTION
  // ============================================

  /**
   * Redirect if item is auto-added
   * Auto-added items are read-only and managed by the system
   */
  useEffect(() => {
    if (item && item.autoAdded) {
      toast.error('لا يمكن تعديل العناصر المضافة تلقائياً');
      router.push('/management/inventory/list');
    }
  }, [item, router]);

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Updates inventory item and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: UpdateInventoryInput) => {
      if (!id) return;

      // Double-check auto-added protection
      if (item?.autoAdded) {
        toast.error('لا يمكن تعديل العناصر المضافة تلقائياً');
        router.push('/management/inventory/list');
        return;
      }

      await updateInventory.mutateAsync({ id, data });
      // Success toast shown by mutation
      // Navigate to inventory list
      router.push('/management/inventory/list');
    },
    [id, item, updateInventory, router]
  );

  /**
   * Handle cancel
   * Navigate back to list
   */
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Skeleton */}
        <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />

        {/* Header Skeleton */}
        <div className="space-y-2">
          <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="h-5 w-96 bg-[var(--bg-tertiary)] rounded animate-pulse" />
        </div>

        {/* Form Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={() => router.push('/management/inventory/list')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            إدارة المخزون
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل صنف</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل صنف</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {error.statusCode === 404 ? 'الصنف المطلوب غير موجود' : 'حدث خطأ أثناء تحميل الصنف'}
          </p>
        </div>

        {/* Error State */}
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // NOT FOUND STATE
  // ============================================

  if (!item) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={() => router.push('/management/inventory/list')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            إدارة المخزون
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل صنف</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل صنف</h1>
          <p className="text-[var(--text-secondary)] mt-1">الصنف المطلوب غير موجود</p>
        </div>

        {/* Not Found Message */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              لم يتم العثور على الصنف المطلوب. قد يكون محذوفاً أو غير موجود.
            </p>
            <button
              onClick={() => router.push('/management/inventory/list')}
              className="px-6 py-3 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              العودة إلى القائمة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // AUTO-ADDED WARNING (Should not reach here due to useEffect redirect)
  // ============================================

  if (item.autoAdded) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={() => router.push('/management/inventory/list')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            إدارة المخزون
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">تعديل صنف</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل صنف</h1>
          <p className="text-[var(--text-secondary)] mt-1">لا يمكن تعديل هذا الصنف</p>
        </div>

        {/* Auto-Added Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" dir="rtl">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-bold">!</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">عنصر مضاف تلقائياً</h3>
              <p className="text-yellow-800 mb-4">
                هذا الصنف تم إضافته تلقائياً من خلال العمليات المالية ولا يمكن تعديله يدوياً. يتم
                تحديث الكمية تلقائياً عند إضافة عمليات جديدة.
              </p>
              <button
                onClick={() => router.push('/management/inventory/list')}
                className="px-4 py-2 text-sm font-medium text-yellow-900 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors"
              >
                العودة إلى القائمة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" dir="rtl">
        <button
          onClick={() => router.push('/management/inventory/list')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          إدارة المخزون
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">تعديل صنف</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">تعديل صنف</h1>
        <p className="text-[var(--text-secondary)] mt-1">قم بتعديل بيانات الصنف: {item.name}</p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <InventoryForm
          mode="edit"
          initialData={item}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={updateInventory.isPending}
        />
      </div>
    </div>
  );
}
