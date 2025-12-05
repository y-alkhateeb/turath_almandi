/**
 * Badge Variant Styles
 *
 * Comprehensive badge styling system using semantic tokens from the theme system.
 * Provides consistent, accessible, and theme-aware badge styles for various use cases.
 *
 * Theme Tokens Used:
 * - success: Green-based (for paid, active, success states)
 * - warning: Amber-based (for partial, pending, warning states)
 * - destructive: Red-based (for unpaid, error, danger states)
 * - accent/info: Terracotta-based (for informational states)
 * - primary: Gold brand color (for primary actions)
 * - secondary: Green brand color (for secondary actions)
 *
 * @example
 * ```tsx
 * import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants/badge-variants';
 *
 * <Badge className={SEMANTIC_BADGE_VARIANTS.success}>
 *   Success
 * </Badge>
 * ```
 */

/**
 * Base semantic badge variants
 * General-purpose badges for common use cases
 */
export const SEMANTIC_BADGE_VARIANTS = {
  /**
   * Success variant - Green-based
   * Use for: Completed actions, success messages, paid status
   */
  success: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',

  /**
   * Warning variant - Amber-based
   * Use for: Cautionary messages, pending states, partial status
   */
  warning: 'bg-warning-500/10 text-warning-700 border border-warning-500/20 hover:bg-warning-500/20 dark:text-warning-400',

  /**
   * Danger variant - Red-based
   * Use for: Errors, destructive actions, unpaid status
   */
  danger: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',

  /**
   * Info variant - Terracotta-based
   * Use for: Informational messages, neutral notifications
   */
  info: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',

  /**
   * Default variant
   * Use for: Generic badges, neutral states
   */
  default: 'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20',

  /**
   * Primary variant - Gold-based
   * Use for: Primary actions, featured items
   */
  primary: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',
} as const;

/**
 * Payment status badge variants
 * Specific to financial transactions and payment states
 */
export const PAYMENT_STATUS_BADGES = {
  /**
   * Paid - Green success
   * Indicates full payment received
   */
  paid: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',

  /**
   * Partial - Amber warning
   * Indicates partial payment received
   */
  partial: 'bg-warning-500/10 text-warning-700 border border-warning-500/20 hover:bg-warning-500/20 dark:text-warning-400',

  /**
   * Unpaid - Red danger
   * Indicates no payment received
   */
  unpaid: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',

  /**
   * Pending - Terracotta info
   * Indicates payment is being processed
   */
  pending: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',

  /**
   * Overdue - Dark red danger
   * Indicates payment is past due
   */
  overdue: 'bg-danger-600/10 text-danger-700 border border-danger-600/20 hover:bg-danger-600/20 dark:text-danger-400',
} as const;

/**
 * Transaction type badge variants
 * For income, expense, and transfer classifications
 */
export const TRANSACTION_TYPE_BADGES = {
  /**
   * Income - Green success
   * For revenue and income transactions
   */
  income: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',

  /**
   * Expense - Red danger
   * For cost and expense transactions
   */
  expense: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',

  /**
   * Transfer - Terracotta info
   * For transfer transactions
   */
  transfer: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',

  /**
   * Info - Terracotta info
   * For informational transaction types
   */
  info: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',
} as const;

/**
 * Entity type badge variants
 * For different business entities (customers, suppliers, etc.)
 */
export const ENTITY_TYPE_BADGES = {
  /**
   * Customer - Gold primary
   * For customer-related badges
   */
  customer: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',

  /**
   * Supplier - Green success
   * For supplier-related badges
   */
  supplier: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',

  /**
   * Employee - Terracotta info
   * For employee-related badges
   */
  employee: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',

  /**
   * Partner - Secondary green
   * For partner-related badges
   */
  partner: 'bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20',
} as const;

/**
 * Activity status badge variants
 * For active/inactive states
 */
export const ACTIVITY_STATUS_BADGES = {
  /**
   * Active - Green success
   * Indicates entity is active
   */
  active: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',

  /**
   * Inactive - Muted gray
   * Indicates entity is inactive
   */
  inactive: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80',

  /**
   * Suspended - Amber warning
   * Indicates entity is temporarily suspended
   */
  suspended: 'bg-warning-500/10 text-warning-700 border border-warning-500/20 hover:bg-warning-500/20 dark:text-warning-400',

  /**
   * Archived - Gray neutral
   * Indicates entity is archived
   */
  archived: 'bg-neutral-200/50 text-neutral-600 border border-neutral-300/50 hover:bg-neutral-200/80 dark:bg-neutral-800/50 dark:text-neutral-400 dark:border-neutral-700/50',
} as const;

/**
 * Inventory status badge variants
 * For stock levels and inventory states
 */
export const INVENTORY_STATUS_BADGES = {
  /**
   * In Stock - Green success
   * Adequate inventory available
   */
  inStock: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',

  /**
   * Low Stock - Amber warning
   * Inventory is running low
   */
  lowStock: 'bg-warning-500/10 text-warning-700 border border-warning-500/20 hover:bg-warning-500/20 dark:text-warning-400',

  /**
   * Out of Stock - Red danger
   * No inventory available
   */
  outOfStock: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',

  /**
   * On Order - Terracotta info
   * Inventory is on order
   */
  onOrder: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',
} as const;

/**
 * TypeScript types for badge variants
 */
export type SemanticBadgeVariant = keyof typeof SEMANTIC_BADGE_VARIANTS;
export type PaymentStatusBadge = keyof typeof PAYMENT_STATUS_BADGES;
export type TransactionTypeBadge = keyof typeof TRANSACTION_TYPE_BADGES;
export type EntityTypeBadge = keyof typeof ENTITY_TYPE_BADGES;
export type ActivityStatusBadge = keyof typeof ACTIVITY_STATUS_BADGES;
export type InventoryStatusBadge = keyof typeof INVENTORY_STATUS_BADGES;

/**
 * Helper function to get badge variant by key
 */
export function getSemanticBadge(variant: SemanticBadgeVariant): string {
  return SEMANTIC_BADGE_VARIANTS[variant];
}

export function getPaymentStatusBadge(status: PaymentStatusBadge): string {
  return PAYMENT_STATUS_BADGES[status];
}

export function getTransactionTypeBadge(type: TransactionTypeBadge): string {
  return TRANSACTION_TYPE_BADGES[type];
}

export function getEntityTypeBadge(type: EntityTypeBadge): string {
  return ENTITY_TYPE_BADGES[type];
}

export function getActivityStatusBadge(status: ActivityStatusBadge): string {
  return ACTIVITY_STATUS_BADGES[status];
}

export function getInventoryStatusBadge(status: InventoryStatusBadge): string {
  return INVENTORY_STATUS_BADGES[status];
}
