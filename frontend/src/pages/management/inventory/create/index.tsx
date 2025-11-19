/**
 * Create Inventory Page - Container Component
 * Handles inventory item creation flow
 *
 * Architecture:
 * - Business logic in useCreateInventory hook
 * - Presentational component (InventoryForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Create new inventory item
 * - Navigate to list on success
 * - Handle errors with toast (global interceptor)
 * - Breadcrumb navigation
 * - Loading state during submission
 * - Cancel navigation
 * - Strict typing
 */

import { useCallback } from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useCreateInventory } from '@/hooks/useInventory';
import { InventoryForm } from '@/components/inventory/InventoryForm';
import type { CreateInventoryInput } from '#/entity';

// ============================================
// PAGE COMPONENT
// ============================================

export default function CreateInventoryPage() {
  const router = useRouter();

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Create inventory mutation
   */
  const createInventory = useCreateInventory();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Creates inventory item and navigates to list on success
   */
  const handleSubmit = useCallback(
    async (data: CreateInventoryInput) => {
      await createInventory.mutateAsync(data);
      // Success toast shown by mutation
      // Navigate to inventory list
      router.push('/management/inventory/list');
    },
    [createInventory, router]
  );

  /**
   * Handle cancel
   * Navigate back to list
   */
  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  // ============================================
  // RENDER
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
        <span className="text-[var(--text-primary)] font-medium">إضافة صنف جديد</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">إضافة صنف جديد</h1>
        <p className="text-[var(--text-secondary)] mt-1">قم بإضافة صنف جديد إلى المخزون</p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <InventoryForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={createInventory.isPending}
        />
      </div>
    </div>
  );
}
