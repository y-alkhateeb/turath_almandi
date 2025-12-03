import { Badge } from '@/components/ui/badge';
import { BADGE_VARIANT_STYLES, type VariantType } from '@/constants/variant-styles';
import { DebtStatus, ContactType, UserRole } from '@/types/enum';

/**
 * Renders a badge for debt status (Payables/Receivables)
 */
export function DebtStatusBadge({ status }: { status: DebtStatus }) {
  const config: Record<DebtStatus, { label: string; variant: VariantType }> = {
    PAID: { label: 'مدفوع', variant: 'success' },
    PARTIAL: { label: 'جزئي', variant: 'warning' },
    ACTIVE: { label: 'غير مدفوع', variant: 'danger' },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant="secondary" className={BADGE_VARIANT_STYLES[variant]}>
      {label}
    </Badge>
  );
}

/**
 * Renders a badge for payable status with custom labels
 */
export function PayableStatusBadge({ status }: { status: DebtStatus }) {
  const config: Record<DebtStatus, { label: string; variant: VariantType }> = {
    PAID: { label: 'مدفوع', variant: 'success' },
    PARTIAL: { label: 'جزئي', variant: 'warning' },
    ACTIVE: { label: 'غير مدفوع', variant: 'danger' },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant="secondary" className={BADGE_VARIANT_STYLES[variant]}>
      {label}
    </Badge>
  );
}

/**
 * Renders a badge for receivable status with custom labels
 */
export function ReceivableStatusBadge({ status }: { status: DebtStatus }) {
  const config: Record<DebtStatus, { label: string; variant: VariantType }> = {
    PAID: { label: 'مستلم', variant: 'success' },
    PARTIAL: { label: 'جزئي', variant: 'warning' },
    ACTIVE: { label: 'غير مستلم', variant: 'danger' },
  };

  const { label, variant } = config[status];

  return (
    <Badge variant="secondary" className={BADGE_VARIANT_STYLES[variant]}>
      {label}
    </Badge>
  );
}

/**
 * Renders a badge for contact type
 */
export function ContactTypeBadge({ type }: { type: ContactType }) {
  const config: Record<ContactType, { label: string; variant: VariantType }> = {
    SUPPLIER: { label: 'مورد', variant: 'info' },
    CUSTOMER: { label: 'عميل', variant: 'success' },
    BOTH: { label: 'مورد وعميل', variant: 'default' },
    OTHER: { label: 'أخرى', variant: 'default' },
  };

  const { label, variant } = config[type];

  return (
    <Badge variant="secondary" className={BADGE_VARIANT_STYLES[variant]}>
      {label}
    </Badge>
  );
}

/**
 * Renders a badge for user role
 */
export function UserRoleBadge({ role }: { role: UserRole }) {
  const config: Record<UserRole, { label: string; variant: VariantType }> = {
    ADMIN: { label: 'مدير', variant: 'info' },
    ACCOUNTANT: { label: 'محاسب', variant: 'success' },
  };

  const { label, variant } = config[role];

  return (
    <Badge variant="secondary" className={BADGE_VARIANT_STYLES[variant]}>
      {label}
    </Badge>
  );
}

/**
 * Renders a badge for active/inactive status
 */
export function ActiveStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge 
      variant="secondary" 
      className={BADGE_VARIANT_STYLES[isActive ? 'success' : 'danger']}
    >
      {isActive ? 'نشط' : 'غير نشط'}
    </Badge>
  );
}
