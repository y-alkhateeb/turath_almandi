/**
 * Currency Settings Page - Container Component
 * Page for managing currency settings (Admin only)
 *
 * Architecture:
 * - Business logic in hooks (useAllCurrencies, useSetDefaultCurrency, useCreateCurrency)
 * - Presentational components (CurrencyList, CurrencyChangeModal, AddCurrencyModal)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Fetch all currencies with usage statistics
 * - Set default currency with confirmation modal
 * - Add new currencies via modal form
 * - Loading states with skeleton
 * - Error states
 * - Breadcrumb navigation
 * - RTL support
 * - Admin-only access
 * - Strict typing
 */

import { useState, useCallback } from 'react';
import { useRouter } from '@/routes/hooks';
import { useAuth } from '@/hooks/useAuth';
import {
  useAllCurrencies,
  useSetDefaultCurrency,
  useCreateCurrency,
} from '@/hooks/queries/useSettings';
import {
  CurrencyList,
  CurrencyChangeModal,
  AddCurrencyModal,
} from '@/components/settings';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import type { CurrencyWithUsage, CreateCurrencyInput } from '#/settings.types';

// ============================================
// PAGE COMPONENT
// ============================================

export default function CurrencySettingsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // ============================================
  // STATE
  // ============================================

  /**
   * Change currency modal state
   */
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  /**
   * Add currency modal state
   */
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  /**
   * Selected currency for changing default
   */
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyWithUsage | null>(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch all currencies with usage statistics
   * Only enabled for admin users
   */
  const {
    data: currencies = [],
    isLoading,
    error,
    refetch,
  } = useAllCurrencies(isAdmin);

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Set default currency mutation
   */
  const setDefaultCurrency = useSetDefaultCurrency();

  /**
   * Create new currency mutation
   */
  const createCurrency = useCreateCurrency();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle "Set as Default" button click
   * Opens confirmation modal with selected currency
   */
  const handleSetDefault = useCallback((currency: CurrencyWithUsage) => {
    setSelectedCurrency(currency);
    setIsChangeModalOpen(true);
  }, []);

  /**
   * Handle confirm currency change
   * Calls API to set new default currency
   */
  const handleConfirmChange = useCallback(async () => {
    if (!selectedCurrency) return;

    try {
      await setDefaultCurrency.mutateAsync({ code: selectedCurrency.code });
      // Success toast shown by mutation
      // Refetch currencies to update UI
      await refetch();
      // Close modal
      setIsChangeModalOpen(false);
      setSelectedCurrency(null);
    } catch (error) {
      // Error toast shown by mutation
      console.error('Failed to set default currency:', error);
    }
  }, [selectedCurrency, setDefaultCurrency, refetch]);

  /**
   * Handle cancel currency change
   * Closes modal without making changes
   */
  const handleCancelChange = useCallback(() => {
    setIsChangeModalOpen(false);
    setSelectedCurrency(null);
  }, []);

  /**
   * Handle "Add Currency" button click
   * Opens add currency modal
   */
  const handleAddClick = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  /**
   * Handle submit new currency
   * Calls API to create new currency
   */
  const handleAddSubmit = useCallback(
    async (data: CreateCurrencyInput) => {
      try {
        await createCurrency.mutateAsync(data);
        // Success toast shown by mutation
        // Refetch currencies to update UI
        await refetch();
        // Modal will be closed by AddCurrencyModal component on success
      } catch (error) {
        // Error toast shown by mutation
        console.error('Failed to create currency:', error);
        // Re-throw to prevent modal from closing
        throw error;
      }
    },
    [createCurrency, refetch]
  );

  /**
   * Handle cancel add currency
   * Closes add modal without making changes
   */
  const handleCancelAdd = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  /**
   * Handle retry on error
   */
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    router.push('/settings');
  }, [router]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  /**
   * Get default currency code
   */
  const defaultCurrencyCode = currencies.find((c) => c.isDefault)?.code || '';

  /**
   * Calculate total transaction count across all currencies
   */
  const totalTransactionCount = currencies.reduce(
    (sum, currency) =>
      sum +
      (currency.usageCount?.transactions || 0) +
      (currency.usageCount?.debts || 0) +
      (currency.usageCount?.debtPayments || 0),
    0
  );

  // ============================================
  // ADMIN ACCESS CHECK
  // ============================================

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center" dir="rtl">
          <svg
            className="w-16 h-16 text-red-500 mx-auto mb-4"
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
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            غير مصرح بالوصول
          </h2>
          <p className="text-[var(--text-secondary)] mb-4">
            هذه الصفحة متاحة للمديرين فقط
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
            العودة إلى لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header Skeleton */}
        <div className="space-y-4">
          <div className="h-5 w-64 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              <div className="h-5 w-96 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="space-y-4">
            {/* Table Header Skeleton */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b border-[var(--border-color)]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-4 bg-[var(--bg-tertiary)] rounded animate-pulse" />
              ))}
            </div>

            {/* Table Rows Skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 py-4">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className="h-6 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                ))}
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
        {/* Page Header */}
        <PageHeader
          title="إعدادات العملة"
          description="حدث خطأ أثناء تحميل البيانات"
          breadcrumbs={[
            { label: 'الإعدادات', onClick: handleBack },
            { label: 'العملة' },
          ]}
        />

        {/* Error State */}
        <ErrorState error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // ============================================
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="إعدادات العملة"
        description="إدارة العملات المتاحة في النظام وتحديد العملة الافتراضية"
        breadcrumbs={[
          { label: 'الإعدادات', onClick: handleBack },
          { label: 'العملة' },
        ]}
      />

      {/* Currency List */}
      <CurrencyList
        currencies={currencies}
        defaultCode={defaultCurrencyCode}
        onSetDefault={handleSetDefault}
        onAdd={handleAddClick}
        isLoading={false}
      />

      {/* Currency Change Confirmation Modal */}
      <CurrencyChangeModal
        isOpen={isChangeModalOpen}
        onClose={handleCancelChange}
        onConfirm={handleConfirmChange}
        currency={selectedCurrency}
        transactionCount={totalTransactionCount}
        isSubmitting={setDefaultCurrency.isPending}
      />

      {/* Add Currency Modal */}
      <AddCurrencyModal
        isOpen={isAddModalOpen}
        onClose={handleCancelAdd}
        onSubmit={handleAddSubmit}
        isSubmitting={createCurrency.isPending}
      />
    </div>
  );
}
