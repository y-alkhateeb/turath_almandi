/**
 * View Debt Page - Container Component
 * Displays debt details with payment history
 *
 * Architecture:
 * - Business logic in useDebt and usePayDebt hooks
 * - Presentational components (DebtPaymentHistory, PayDebtModal)
 * - This page only orchestrates flow (container pattern)
 *
 * Features:
 * - Fetch and display debt details
 * - Show payment history table
 * - Pay debt button → opens PayDebtModal dialog
 * - Status badge (active, partial, paid, overdue)
 * - Back button → navigate to list
 * - Handle not found (404) error
 * - Breadcrumb navigation
 * - Loading state during fetch
 * - Strict typing
 */

import { useCallback, useState } from 'react';
import { ChevronRight, ArrowLeft, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useParams } from '@/routes/hooks';
import { useDebt } from '@/hooks/useDebts';
import { PayDebtModal } from '@/components/PayDebtModal';
import { DebtPaymentHistory } from '@/components/debts/DebtPaymentHistory';
import { ErrorState } from '@/components/common/ErrorState';
import { formatCurrency, formatDate } from '@/utils/format';
import { DebtStatus, Currency } from '@/types/enum';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status badge styling
 */
const getStatusBadge = (status: DebtStatus): { label: string; className: string } => {
  const badges: Record<DebtStatus, { label: string; className: string }> = {
    [DebtStatus.ACTIVE]: {
      label: 'نشط',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    [DebtStatus.PARTIAL]: {
      label: 'دفع جزئي',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    [DebtStatus.PAID]: {
      label: 'مدفوع',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
  };
  return badges[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-300' };
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
 * Check if debt is overdue
 */
const isOverdue = (dueDate: string | null, status: DebtStatus): boolean => {
  if (!dueDate || status === DebtStatus.PAID) return false;
  return new Date(dueDate) < new Date();
};

// ============================================
// PAGE COMPONENT
// ============================================

export default function ViewDebtPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  // ============================================
  // DIALOG STATE
  // ============================================

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch debt by ID with payments
   */
  const {
    data: debt,
    isLoading,
    error,
    refetch,
  } = useDebt(id || '', {
    enabled: !!id,
  });

  // ============================================
  // HANDLERS
  // ============================================

  /**
   * Handle pay debt
   * Open pay dialog
   */
  const handlePay = useCallback(() => {
    setIsPayDialogOpen(true);
  }, []);

  /**
   * Handle close pay dialog
   */
  const handleClosePayDialog = useCallback(() => {
    setIsPayDialogOpen(false);
  }, []);

  /**
   * Handle back
   * Navigate to list
   */
  const handleBack = useCallback(() => {
    router.push('/management/debts/list');
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
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6">
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
            إدارة الديون
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">عرض تفاصيل الدين</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">عرض تفاصيل الدين</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {error.statusCode === 404
              ? 'الدين المطلوب غير موجود'
              : 'حدث خطأ أثناء تحميل الدين'}
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

  if (!debt) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm" dir="rtl">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            إدارة الديون
          </button>
          <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-primary)] font-medium">عرض تفاصيل الدين</span>
        </nav>

        {/* Page Header */}
        <div dir="rtl">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">عرض تفاصيل الدين</h1>
          <p className="text-[var(--text-secondary)] mt-1">الدين المطلوب غير موجود</p>
        </div>

        {/* Not Found Message */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-12">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              لم يتم العثور على الدين المطلوب. قد يكون محذوفاً أو غير موجود.
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
  // COMPUTED VALUES
  // ============================================

  const statusBadge = getStatusBadge(debt.status);
  const overdue = isOverdue(debt.dueDate, debt.status);
  const canPay = debt.status === DebtStatus.ACTIVE || debt.status === DebtStatus.PARTIAL;
  const paidAmount = debt.originalAmount - debt.remainingAmount;
  const paymentPercentage = (paidAmount / debt.originalAmount) * 100;

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
          إدارة الديون
        </button>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" />
        <span className="text-[var(--text-primary)] font-medium">عرض تفاصيل الدين</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تفاصيل الدين</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            دين: {debt.creditorName}
          </p>
        </div>

        {/* Pay Button - Only for active/partial debts */}
        {canPay && (
          <button
            onClick={handlePay}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            دفع دين
          </button>
        )}
      </div>

      {/* Debt Details Card */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6" dir="rtl">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">معلومات الدين</h2>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
            {overdue && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-300">
                <AlertCircle className="w-4 h-4" />
                متأخر
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creditor Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              اسم الدائن
            </label>
            <p className="text-lg text-[var(--text-primary)] font-semibold">{debt.creditorName}</p>
          </div>

          {/* Original Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              المبلغ الأصلي
            </label>
            <p className="text-lg text-[var(--text-primary)] font-semibold">
              {formatCurrency(debt.originalAmount)} {getCurrencyLabel(debt.currency)}
            </p>
          </div>

          {/* Remaining Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              المبلغ المتبقي
            </label>
            <p className={`text-lg font-semibold ${debt.status === DebtStatus.PAID ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(debt.remainingAmount)} {getCurrencyLabel(debt.currency)}
            </p>
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              المبلغ المدفوع
            </label>
            <p className="text-lg text-green-600 font-semibold">
              {formatCurrency(paidAmount)} {getCurrencyLabel(debt.currency)}
              <span className="text-sm text-[var(--text-secondary)] mr-2">
                ({paymentPercentage.toFixed(0)}%)
              </span>
            </p>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              تاريخ الدين
            </label>
            <p className="text-lg text-[var(--text-primary)]">
              <Calendar className="w-4 h-4 inline-block ml-2" />
              {formatDate(debt.date)}
            </p>
          </div>

          {/* Due Date */}
          {debt.dueDate && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                تاريخ الاستحقاق
              </label>
              <p className={`text-lg ${overdue ? 'text-red-600 font-semibold' : 'text-[var(--text-primary)]'}`}>
                <Calendar className="w-4 h-4 inline-block ml-2" />
                {formatDate(debt.dueDate)}
                {overdue && <span className="mr-2 text-sm">(متأخر)</span>}
              </p>
            </div>
          )}

          {/* Branch */}
          {debt.branch && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                الفرع
              </label>
              <p className="text-lg text-[var(--text-primary)]">{debt.branch.name}</p>
            </div>
          )}

          {/* Creator */}
          {debt.creator && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                أنشئ بواسطة
              </label>
              <p className="text-lg text-[var(--text-primary)]">{debt.creator.username}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {debt.notes && (
          <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              ملاحظات
            </label>
            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{debt.notes}</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-6" dir="rtl">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">سجل الدفعات</h2>
        <DebtPaymentHistory
          payments={debt.payments || []}
          isLoading={false}
        />
      </div>

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

      {/* Pay Debt Dialog */}
      {debt && (
        <PayDebtModal
          isOpen={isPayDialogOpen}
          onClose={handleClosePayDialog}
          debt={debt}
        />
      )}
    </div>
  );
}
