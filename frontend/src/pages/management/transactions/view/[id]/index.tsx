/**
 * View Transaction Page - Container Component
 * Displays transaction details in read-only mode
 *
 * Architecture:
 * - Business logic in useTransaction and useDeleteTransaction hooks
 * - Presentational components for display
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Fetch and display transaction details
 * - Show related inventory item if exists
 * - Show audit log for this transaction (admin only)
 * - Edit button → navigate to edit page
 * - Delete button → confirm and delete
 * - Back button → navigate to list
 * - Handle not found (404) error
 * - Breadcrumb navigation
 * - Loading state during fetch
 * - Strict typing
 */

import { useCallback } from 'react';
import { ChevronRight, Edit, Trash2, ArrowLeft, Package } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useParams } from '@/routes/hooks';
import { useTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format';
import { TransactionType, PaymentMethod, Currency } from '@/types/enum';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get transaction type label in Arabic
 */
const getTypeLabel = (type: TransactionType): string => {
  return type === TransactionType.INCOME ? 'إيراد' : 'مصروف';
};

/**
 * Get transaction type color
 */
const getTypeColor = (type: TransactionType): string => {
  return type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600';
};

/**
 * Get payment method label in Arabic
 */
const getPaymentMethodLabel = (method: PaymentMethod | null): string => {
  if (!method) return '-';
  const labels: Record<PaymentMethod, string> = {
    CASH: 'نقدي',
    CARD: 'بطاقة',
    BANK_TRANSFER: 'تحويل بنكي',
    CHECK: 'شيك',
    OTHER: 'أخرى',
    MASTER: 'ماستر كارد',
  };
  return labels[method] || method;
};

/**
 * Get currency label
 */
const getCurrencyLabel = (currency: Currency): string => {
  const labels: Record<Currency, string> = {
    IQD: 'دينار عراقي',
    USD: 'دولار أمريكي',
  };
  return labels[currency] || currency;
};

/**
 * Get category label in Arabic
 */
const getCategoryLabel = (category: string | null): string => {
  if (!category) return '-';
  const labels: Record<string, string> = {
    SALE: 'بيع',
    PURCHASE: 'شراء',
    EXPENSE: 'مصروف',
    SALARY: 'راتب',
    DEBT_PAYMENT: 'دفع دين',
    OTHER: 'أخرى',
  };
  return labels[category] || category;
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function ViewTransactionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch transaction by ID with relations
   */
  const {
    data: transaction,
    isLoading,
    error,
    refetch,
  } = useTransaction(id || '', {
    enabled: !!id,
  });

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Delete transaction mutation
   */
  const deleteTransaction = useDeleteTransaction();

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle edit
   * Navigate to edit page
   */
  const handleEdit = useCallback(() => {
    if (!id) return;
    router.push(`/management/transactions/edit/${id}`);
  }, [id, router]);

  /**
   * Handle delete
   * Show confirmation dialog before deleting
   */
  const handleDelete = useCallback(async () => {
    if (!id) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      'هل أنت متأكد من حذف هذه العملية؟ لا يمكن التراجع عن هذا الإجراء.'
    );

    if (!confirmed) return;

    try {
      await deleteTransaction.mutateAsync(id);
      // Success toast shown by mutation
      // Navigate to transactions list
      router.push('/management/transactions/list');
    } catch (_error) {
      // Error toast shown by global API interceptor
    }
  }, [id, deleteTransaction, router]);

  /**
   * Handle back
   * Navigate to list
   */
  const handleBack = useCallback(() => {
    router.push('/management/transactions/list');
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
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-5 w-96 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
            <div className="h-10 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse" />
                <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded animate-pulse" />
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
            onClick={handleBack}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            العمليات المالية
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">عرض تفاصيل العملية</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">عرض تفاصيل العملية</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {error.statusCode === 404
              ? 'العملية المطلوبة غير موجودة'
              : 'حدث خطأ أثناء تحميل العملية'}
          </p>
        </div>

        {/* Error State */}
        <ErrorState error={error} onRetry={handleRetry} />

        {/* Back Button */}
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة إلى القائمة
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // NOT FOUND STATE
  // ============================================

  if (!transaction) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            العمليات المالية
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">عرض تفاصيل العملية</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">عرض تفاصيل العملية</h1>
          <p className="text-[var(--text-secondary)] mt-1">العملية المطلوبة غير موجودة</p>
        </div>

        {/* Not Found Message */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              لم يتم العثور على العملية المطلوبة. قد تكون محذوفة أو غير موجودة.
            </p>
            <button
              onClick={handleBack}
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
  // MAIN CONTENT
  // ============================================

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" dir="rtl">
        <button
          onClick={handleBack}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          العمليات المالية
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">عرض تفاصيل العملية</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تفاصيل العملية</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            عملية رقم: {transaction.id.substring(0, 13)}...
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <Edit className="w-4 h-4" />
            تعديل
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTransaction.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {deleteTransaction.isPending ? 'جاري الحذف...' : 'حذف'}
          </button>
        </div>
      </div>

      {/* Transaction Details Card */}
      <div
        className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6"
        dir="rtl"
      >
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6">معلومات العملية</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              نوع العملية
            </label>
            <p className={`text-lg font-semibold ${getTypeColor(transaction.type)}`}>
              {getTypeLabel(transaction.type)}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              المبلغ
            </label>
            <p className={`text-lg font-semibold ${getTypeColor(transaction.type)}`}>
              {formatCurrency(transaction.amount)} {getCurrencyLabel(transaction.currency)}
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              التاريخ
            </label>
            <p className="text-lg text-[var(--text-primary)]">{formatDate(transaction.date)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              طريقة الدفع
            </label>
            <p className="text-lg text-[var(--text-primary)]">
              {getPaymentMethodLabel(transaction.paymentMethod)}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              الفئة
            </label>
            <p className="text-lg text-[var(--text-primary)]">
              {getCategoryLabel(transaction.category)}
            </p>
          </div>

          {/* Branch */}
          {transaction.branch && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                الفرع
              </label>
              <p className="text-lg text-[var(--text-primary)]">{transaction.branch.name}</p>
            </div>
          )}

          {/* Employee/Vendor Name */}
          {transaction.employeeVendorName && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                اسم الموظف/البائع
              </label>
              <p className="text-lg text-[var(--text-primary)]">{transaction.employeeVendorName}</p>
            </div>
          )}

          {/* Created By */}
          {transaction.creator && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                أنشئت بواسطة
              </label>
              <p className="text-lg text-[var(--text-primary)]">{transaction.creator.username}</p>
            </div>
          )}

          {/* Created At */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              تاريخ الإنشاء
            </label>
            <p className="text-lg text-[var(--text-primary)]">
              {formatDateTime(transaction.createdAt)}
            </p>
          </div>

          {/* Updated At */}
          {transaction.updatedAt !== transaction.createdAt && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                آخر تحديث
              </label>
              <p className="text-lg text-[var(--text-primary)]">
                {formatDateTime(transaction.updatedAt)}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        {transaction.notes && (
          <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              ملاحظات
            </label>
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{transaction.notes}</p>
          </div>
        )}
      </div>

      {/* Related Inventory Item */}
      {transaction.inventoryItem && (
        <div
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6"
          dir="rtl"
        >
          <div className="flex items-center gap-3 mb-4">
            <Package className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">
              صنف المخزون المرتبط
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                اسم الصنف
              </label>
              <p className="text-lg text-[var(--text-primary)]">{transaction.inventoryItem.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                الكمية
              </label>
              <p className="text-lg text-[var(--text-primary)]">
                {transaction.inventoryItem.quantity} {transaction.inventoryItem.unit}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() =>
                router.push(`/management/inventory/view/${transaction.inventoryItem?.id}`)
              }
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              عرض تفاصيل الصنف ←
            </button>
          </div>
        </div>
      )}

      {/* Audit Log - Admin Only */}
      {isAdmin && (
        <div
          className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6"
          dir="rtl"
        >
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">سجل التدقيق</h2>
          <p className="text-[var(--text-secondary)]">
            سيتم عرض سجل التدقيق الكامل للعملية هنا (قيد التطوير)
          </p>
        </div>
      )}

      {/* Back Button */}
      <div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-primary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          العودة إلى القائمة
        </button>
      </div>
    </div>
  );
}
