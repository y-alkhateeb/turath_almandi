/**
 * Create Transaction Page - Container Component
 * Handles transaction creation flow
 *
 * Architecture:
 * - Business logic in useCreateTransaction hook
 * - Presentational component (TransactionForm)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Create new transaction
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
import { TransactionFormWithInventory } from '@/components/transactions/TransactionFormWithInventory';
import type { Transaction } from '#/entity';

// ============================================
// PAGE COMPONENT
// ============================================

export default function CreateTransactionPage() {
  const router = useRouter();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle successful transaction creation
   * Navigate to list on success
   */
  const handleSuccess = useCallback(
    (_transaction: Transaction) => {
      // Success toast shown by form component
      // Navigate to transactions list
      router.push('/management/transactions/list');
    },
    [router]
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
          onClick={() => router.push('/management/transactions/list')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          العمليات المالية
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">إضافة عملية جديدة</span>
      </nav>

      {/* Page Header */}
      <div dir="rtl">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">إضافة عملية جديدة</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          قم بإضافة إيراد أو مصروف جديد إلى النظام
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
        <TransactionFormWithInventory
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
