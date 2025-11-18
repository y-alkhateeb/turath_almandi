import { ConfirmModal } from '../ui/ConfirmModal';

/**
 * ConfirmDeleteDialog - Specialized delete confirmation dialog
 *
 * A semantic wrapper around ConfirmModal specifically for delete operations.
 * Provides sensible defaults for delete confirmations with Arabic text.
 *
 * @example
 * ```tsx
 * <ConfirmDeleteDialog
 *   isOpen={!!deletingItemId}
 *   onClose={() => setDeletingItemId(null)}
 *   onConfirm={handleDelete}
 *   itemName="الفرع"
 *   itemDescription={branch.name}
 *   isLoading={isDeleting}
 * />
 * ```
 */

export interface ConfirmDeleteDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog is closed/cancelled */
  onClose: () => void;
  /** Callback when delete is confirmed */
  onConfirm: () => void | Promise<void>;
  /** Name of the item type being deleted (e.g., "الفرع", "المستخدم") */
  itemName: string;
  /** Optional: Specific description of the item (e.g., branch name, user name) */
  itemDescription?: string;
  /** Optional: Custom title (default: "تأكيد الحذف") */
  title?: string;
  /** Optional: Custom message (auto-generated if not provided) */
  message?: string;
  /** Optional: Custom confirm button text (default: "حذف") */
  confirmText?: string;
  /** Optional: Custom cancel button text (default: "إلغاء") */
  cancelText?: string;
  /** Optional: Loading state during deletion */
  isLoading?: boolean;
  /** Optional: Additional warning message */
  warningMessage?: string;
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemDescription,
  title = 'تأكيد الحذف',
  message,
  confirmText = 'حذف',
  cancelText = 'إلغاء',
  isLoading = false,
  warningMessage = 'لا يمكن التراجع عن هذا الإجراء.',
}: ConfirmDeleteDialogProps) {
  // Auto-generate message if not provided
  const defaultMessage = itemDescription
    ? `هل أنت متأكد من حذف ${itemName} "${itemDescription}"؟ ${warningMessage}`
    : `هل أنت متأكد من حذف ${itemName}؟ ${warningMessage}`;

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      message={message || defaultMessage}
      confirmText={confirmText}
      cancelText={cancelText}
      variant="danger"
      isLoading={isLoading}
    />
  );
}
