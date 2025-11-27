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
import { ChevronRight, ArrowLeft, DollarSign, Calendar, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from '@/routes/hooks';
import { useParams } from '@/routes/hooks';
import { useDebt, useDeleteDebt } from '@/hooks/useDebts';
import { useAuth } from '@/hooks/useAuth';
import { PayDebtModal } from '@/components/PayDebtModal';
import { DebtPaymentHistory } from '@/components/debts/DebtPaymentHistory';
import { ErrorState } from '@/components/common/ErrorState';
import { formatDate } from '@/utils/format';
import { DebtStatus, Currency } from '@/types/enum';
import { Card } from '@/ui/card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/ui/button';
import { CurrencyAmountCompact } from '@/components/currency';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status badge styling
 */
const getStatusBadge = (
  status: DebtStatus
): { label: string; variant: 'warning' | 'info' | 'success' | 'neutral' } => {
  const badges: Record<
    DebtStatus,
    { label: string; variant: 'warning' | 'info' | 'success' | 'neutral' }
  > = {
    [DebtStatus.ACTIVE]: {
      label: 'نشط',
      variant: 'warning',
    },
    [DebtStatus.PARTIAL]: {
      label: 'دفع جزئي',
      variant: 'info',
    },
    [DebtStatus.PAID]: {
      label: 'مدفوع',
      variant: 'success',
    },
  };
  return badges[status] || { label: status, variant: 'neutral' };
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
  const { isAdmin } = useAuth();
  const deleteDebt = useDeleteDebt();

  // ============================================
  // DIALOG STATE
  // ============================================

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  /**
   * Handle delete debt (admin only)
   */
  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteDebt.mutateAsync(id);
      router.push('/management/debts/list');
    } catch (error) {
      // Error handled by mutation hook
    }
  }, [id, deleteDebt, router]);

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
            {error.statusCode === 404 ? 'الدين المطلوب غير موجود' : 'حدث خطأ أثناء تحميل الدين'}
          </p>
        </div>

        {/* Error State */}
        <ErrorState error={error} onRetry={handleRetry} />

        {/* Back Button */}
        <div>
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            العودة إلى القائمة
          </Button>
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
        <Card className="p-8">
          <div className="text-center">
            <p className="text-[var(--text-secondary)] mb-4">
              لم يتم العثور على الدين المطلوب. قد يكون محذوفاً أو غير موجود.
            </p>
            <Button onClick={handleBack}>العودة إلى القائمة</Button>
          </div>
        </Card>
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
      <div className="flex items-center justify-between flex-wrap gap-4" dir="rtl">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">تفاصيل الدين</h1>
          <p className="text-[var(--text-secondary)] mt-1">دين: {debt.creditorName}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Pay Button - Only for active/partial debts */}
          {canPay && (
            <Button variant="default" onClick={handlePay} className="gap-2">
              <DollarSign className="w-4 h-4" />
              دفع دين
            </Button>
          )}
          {/* Delete Button - Admin only */}
          {isAdmin && (
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="gap-2"
              disabled={deleteDebt.isPending}
            >
              <Trash2 className="w-4 h-4" />
              حذف
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            رجوع
          </Button>
        </div>
      </div>

      {/* Debt Details Card */}
      <Card className="p-8" dir="rtl">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">معلومات الدين</h2>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
            {overdue && (
              <Badge variant="danger" className="gap-1">
                <AlertCircle className="w-4 h-4" />
                متأخر
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Creditor Name */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              اسم الدائن
            </label>
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
              <span className="font-semibold text-[var(--text-primary)]">{debt.creditorName}</span>
            </div>
          </div>

          {/* Original Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              المبلغ الأصلي
            </label>
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
              <span className="font-semibold text-[var(--text-primary)]">
                <CurrencyAmountCompact amount={debt.originalAmount} />
              </span>
            </div>
          </div>

          {/* Remaining Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              المبلغ المتبقي
            </label>
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
              <span
                className={`font-semibold ${debt.status === DebtStatus.PAID ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
              >
                <CurrencyAmountCompact amount={debt.remainingAmount} />
              </span>
            </div>
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              المبلغ المدفوع
            </label>
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
              <span className="font-semibold text-green-600 dark:text-green-400">
                <CurrencyAmountCompact amount={paidAmount} />
              </span>
              <span className="text-sm text-[var(--text-secondary)] mr-2">
                ({paymentPercentage.toFixed(0)}%)
              </span>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              تاريخ الدين
            </label>
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-[var(--text-primary)]">{formatDate(debt.date)}</span>
            </div>
          </div>

          {/* Due Date */}
          {debt.dueDate && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                تاريخ الاستحقاق
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--text-secondary)]" />
                <span
                  className={`${overdue ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-[var(--text-primary)]'}`}
                >
                  {formatDate(debt.dueDate)}
                  {overdue && <span className="mr-2 text-sm">(متأخر)</span>}
                </span>
              </div>
            </div>
          )}

          {/* Branch */}
          {debt.branch && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                الفرع
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {debt.branch.name}
              </div>
            </div>
          )}

          {/* Creator */}
          {debt.creator && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                أنشئ بواسطة
              </label>
              <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
                {debt.creator.username}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        {debt.notes && (
          <div className="mt-6 pt-6 border-t border-[var(--border-color)]">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              ملاحظات
            </label>
            <div className="px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md">
              <p className="text-[var(--text-primary)] whitespace-pre-wrap">{debt.notes}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Payment History */}
      <Card className="p-8" dir="rtl">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">سجل الدفعات</h2>
        <DebtPaymentHistory payments={debt.payments || []} isLoading={false} />
      </Card>

      {/* Pay Debt Dialog */}
      {debt && <PayDebtModal isOpen={isPayDialogOpen} onClose={handleClosePayDialog} debt={debt} />}

      {/* Delete Confirmation Dialog - Admin only */}
      <ConfirmModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="حذف الدين"
        message={`هل أنت متأكد من حذف دين "${debt?.creditorName}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        isLoading={deleteDebt.isPending}
      />
    </div>
  );
}
