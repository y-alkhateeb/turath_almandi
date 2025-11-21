/**
 * CurrencyChangeModal - Presentational Component
 * Confirmation modal for changing default currency
 *
 * Features:
 * - Warning icon and message
 * - Display currency details (name_ar, symbol)
 * - Show transaction count if exists
 * - Confirm/Cancel actions
 * - RTL layout
 * - Loading state on confirm button
 */

import { Modal } from '@/components/Modal';
import { Button } from '@/components/ui/Button';
import type { CurrencyWithUsage } from '#/settings.types';

// ============================================
// TYPES
// ============================================

export interface CurrencyChangeModalProps {
  /** Modal open state */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback to confirm currency change */
  onConfirm: () => void;
  /** Currency to be set as default */
  currency: CurrencyWithUsage | null;
  /** Total transaction count across all currencies */
  transactionCount: number;
  /** Submitting state */
  isSubmitting: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function CurrencyChangeModal({
  isOpen,
  onClose,
  onConfirm,
  currency,
  transactionCount,
  isSubmitting,
}: CurrencyChangeModalProps) {
  if (!currency) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تغيير العملة الافتراضية" size="md">
      <div className="space-y-6" dir="rtl">
        {/* Warning Icon */}
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-amber-600 dark:text-amber-500"
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
          </div>
        </div>

        {/* Currency Information */}
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4">
          <p className="text-sm text-[var(--text-secondary)] mb-2">العملة الجديدة:</p>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-[var(--text-primary)]">{currency.symbol}</span>
            <div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{currency.nameAr}</p>
              <p className="text-sm text-[var(--text-secondary)]">
                {currency.nameEn} ({currency.code})
              </p>
            </div>
          </div>
        </div>

        {/* Main Message */}
        <div className="space-y-3">
          <p className="text-base text-[var(--text-primary)]">
            سيتم تطبيق العملة <span className="font-bold">{currency.nameAr}</span> (
            <span className="font-mono font-semibold">{currency.symbol}</span>) على جميع المعاملات
            والديون الجديدة.
          </p>

          {/* Transaction Count Warning */}
          {transactionCount > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-semibold mb-1">تنبيه:</p>
                  <p>
                    يوجد <span className="font-bold">{transactionCount}</span> معاملة في النظام.
                    المعاملات الحالية <span className="font-semibold">ستبقى بعملتها الأصلية</span> ولن
                    يتم تغييرها.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Zero Transactions Message */}
          {transactionCount === 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-green-800 dark:text-green-200">
                  لا توجد معاملات في النظام. يمكنك تغيير العملة الافتراضية بأمان.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            fullWidth
          >
            {isSubmitting ? 'جاري التغيير...' : 'تأكيد'}
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
            fullWidth
          >
            إلغاء
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CurrencyChangeModal;
