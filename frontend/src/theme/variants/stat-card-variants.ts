/**
 * Stat Card Variant Styles
 *
 * Provides consistent styling for statistical cards, KPI cards, and dashboard metrics.
 * Each variant includes coordinated styles for background, border, icon, and text colors.
 *
 * Theme Tokens Used:
 * - success: Green-based (for revenue, income, positive metrics)
 * - warning: Amber-based (for alerts, cautions, neutral metrics)
 * - destructive: Red-based (for expenses, losses, negative metrics)
 * - accent/info: Terracotta-based (for informational metrics)
 * - primary: Gold brand color (for profit, featured metrics)
 * - secondary: Green brand color (for growth metrics)
 *
 * @example
 * ```tsx
 * import { STAT_CARD_VARIANTS, type StatCardVariant } from '@/theme/variants/stat-card-variants';
 *
 * const variant = STAT_CARD_VARIANTS.revenue;
 *
 * <Card className={variant.background}>
 *   <div className={variant.border}>
 *     <Icon className={variant.icon} />
 *     <span className={variant.text}>Revenue</span>
 *   </div>
 * </Card>
 * ```
 */

/**
 * Structure for stat card variant styles
 */
export interface StatCardVariant {
  /** Background color classes */
  background: string;
  /** Border color classes */
  border: string;
  /** Icon color classes */
  icon: string;
  /** Text color classes */
  text: string;
  /** Header/label text color (optional) */
  label?: string;
  /** Value/number text color (optional) */
  value?: string;
}

/**
 * Financial metric variants
 * For revenue, expenses, profit, and other financial KPIs
 */
export const STAT_CARD_VARIANTS = {
  /**
   * Revenue variant - Green success
   * Use for: Total revenue, income, sales figures
   */
  revenue: {
    background: 'bg-success/5 hover:bg-success/10 transition-colors',
    border: 'border border-success/20',
    icon: 'text-success',
    text: 'text-success',
    label: 'text-success/80',
    value: 'text-success font-semibold',
  },

  /**
   * Expenses variant - Red danger
   * Use for: Total expenses, costs, outgoing payments
   */
  expenses: {
    background: 'bg-destructive/5 hover:bg-destructive/10 transition-colors',
    border: 'border border-destructive/20',
    icon: 'text-destructive',
    text: 'text-destructive',
    label: 'text-destructive/80',
    value: 'text-destructive font-semibold',
  },

  /**
   * Profit variant - Gold primary
   * Use for: Net profit, gross profit, margin calculations
   */
  profit: {
    background: 'bg-primary/5 hover:bg-primary/10 transition-colors',
    border: 'border border-primary/20',
    icon: 'text-primary',
    text: 'text-primary',
    label: 'text-primary/80',
    value: 'text-primary font-semibold',
  },

  /**
   * Info variant - Terracotta accent
   * Use for: General information, neutral metrics, counts
   */
  info: {
    background: 'bg-accent/5 hover:bg-accent/10 transition-colors',
    border: 'border border-accent/20',
    icon: 'text-accent',
    text: 'text-accent',
    label: 'text-accent/80',
    value: 'text-accent font-semibold',
  },

  /**
   * Growth variant - Secondary green
   * Use for: Growth metrics, improvement indicators, positive trends
   */
  growth: {
    background: 'bg-secondary/5 hover:bg-secondary/10 transition-colors',
    border: 'border border-secondary/20',
    icon: 'text-secondary',
    text: 'text-secondary',
    label: 'text-secondary/80',
    value: 'text-secondary font-semibold',
  },

  /**
   * Warning variant - Amber warning
   * Use for: Alerts, cautionary metrics, thresholds reached
   */
  warning: {
    background: 'bg-warning-500/5 hover:bg-warning-500/10 transition-colors',
    border: 'border border-warning-500/20',
    icon: 'text-warning-600 dark:text-warning-400',
    text: 'text-warning-700 dark:text-warning-300',
    label: 'text-warning-600/80 dark:text-warning-400/80',
    value: 'text-warning-700 dark:text-warning-300 font-semibold',
  },

  /**
   * Default variant - Neutral
   * Use for: Generic stats, placeholder cards
   */
  default: {
    background: 'bg-card hover:bg-muted/50 transition-colors',
    border: 'border border-border',
    icon: 'text-muted-foreground',
    text: 'text-foreground',
    label: 'text-muted-foreground',
    value: 'text-foreground font-semibold',
  },
} as const;

/**
 * Transaction summary card variants
 * Specific to transaction-related statistics
 */
export const TRANSACTION_STAT_VARIANTS = {
  /**
   * Income summary - Green success
   */
  income: {
    background: 'bg-success/5 hover:bg-success/10 transition-colors',
    border: 'border border-success/20',
    icon: 'text-success',
    text: 'text-success',
    label: 'text-success/80',
    value: 'text-success font-semibold',
  },

  /**
   * Expense summary - Red danger
   */
  expense: {
    background: 'bg-destructive/5 hover:bg-destructive/10 transition-colors',
    border: 'border border-destructive/20',
    icon: 'text-destructive',
    text: 'text-destructive',
    label: 'text-destructive/80',
    value: 'text-destructive font-semibold',
  },

  /**
   * Balance summary - Gold primary
   */
  balance: {
    background: 'bg-primary/5 hover:bg-primary/10 transition-colors',
    border: 'border border-primary/20',
    icon: 'text-primary',
    text: 'text-primary',
    label: 'text-primary/80',
    value: 'text-primary font-semibold',
  },

  /**
   * Transfer summary - Terracotta info
   */
  transfer: {
    background: 'bg-accent/5 hover:bg-accent/10 transition-colors',
    border: 'border border-accent/20',
    icon: 'text-accent',
    text: 'text-accent',
    label: 'text-accent/80',
    value: 'text-accent font-semibold',
  },
} as const;

/**
 * Inventory stat card variants
 * For inventory and stock-related metrics
 */
export const INVENTORY_STAT_VARIANTS = {
  /**
   * Total inventory value - Primary gold
   */
  totalValue: {
    background: 'bg-primary/5 hover:bg-primary/10 transition-colors',
    border: 'border border-primary/20',
    icon: 'text-primary',
    text: 'text-primary',
    label: 'text-primary/80',
    value: 'text-primary font-semibold',
  },

  /**
   * In stock items - Green success
   */
  inStock: {
    background: 'bg-success/5 hover:bg-success/10 transition-colors',
    border: 'border border-success/20',
    icon: 'text-success',
    text: 'text-success',
    label: 'text-success/80',
    value: 'text-success font-semibold',
  },

  /**
   * Low stock items - Amber warning
   */
  lowStock: {
    background: 'bg-warning-500/5 hover:bg-warning-500/10 transition-colors',
    border: 'border border-warning-500/20',
    icon: 'text-warning-600 dark:text-warning-400',
    text: 'text-warning-700 dark:text-warning-300',
    label: 'text-warning-600/80 dark:text-warning-400/80',
    value: 'text-warning-700 dark:text-warning-300 font-semibold',
  },

  /**
   * Out of stock items - Red danger
   */
  outOfStock: {
    background: 'bg-destructive/5 hover:bg-destructive/10 transition-colors',
    border: 'border border-destructive/20',
    icon: 'text-destructive',
    text: 'text-destructive',
    label: 'text-destructive/80',
    value: 'text-destructive font-semibold',
  },
} as const;

/**
 * Performance metric variants
 * For KPIs, targets, and performance indicators
 */
export const PERFORMANCE_STAT_VARIANTS = {
  /**
   * Target achieved - Green success
   */
  achieved: {
    background: 'bg-success/5 hover:bg-success/10 transition-colors',
    border: 'border border-success/20',
    icon: 'text-success',
    text: 'text-success',
    label: 'text-success/80',
    value: 'text-success font-semibold',
  },

  /**
   * Target in progress - Terracotta info
   */
  inProgress: {
    background: 'bg-accent/5 hover:bg-accent/10 transition-colors',
    border: 'border border-accent/20',
    icon: 'text-accent',
    text: 'text-accent',
    label: 'text-accent/80',
    value: 'text-accent font-semibold',
  },

  /**
   * Target at risk - Amber warning
   */
  atRisk: {
    background: 'bg-warning-500/5 hover:bg-warning-500/10 transition-colors',
    border: 'border border-warning-500/20',
    icon: 'text-warning-600 dark:text-warning-400',
    text: 'text-warning-700 dark:text-warning-300',
    label: 'text-warning-600/80 dark:text-warning-400/80',
    value: 'text-warning-700 dark:text-warning-300 font-semibold',
  },

  /**
   * Target missed - Red danger
   */
  missed: {
    background: 'bg-destructive/5 hover:bg-destructive/10 transition-colors',
    border: 'border border-destructive/20',
    icon: 'text-destructive',
    text: 'text-destructive',
    label: 'text-destructive/80',
    value: 'text-destructive font-semibold',
  },
} as const;

/**
 * TypeScript types for variant categories
 */
export type StatCardVariantKey = keyof typeof STAT_CARD_VARIANTS;
export type TransactionStatVariantKey = keyof typeof TRANSACTION_STAT_VARIANTS;
export type InventoryStatVariantKey = keyof typeof INVENTORY_STAT_VARIANTS;
export type PerformanceStatVariantKey = keyof typeof PERFORMANCE_STAT_VARIANTS;

/**
 * Helper functions to get variant styles
 */
export function getStatCardVariant(variant: StatCardVariantKey): StatCardVariant {
  return STAT_CARD_VARIANTS[variant];
}

export function getTransactionStatVariant(variant: TransactionStatVariantKey): StatCardVariant {
  return TRANSACTION_STAT_VARIANTS[variant];
}

export function getInventoryStatVariant(variant: InventoryStatVariantKey): StatCardVariant {
  return INVENTORY_STAT_VARIANTS[variant];
}

export function getPerformanceStatVariant(variant: PerformanceStatVariantKey): StatCardVariant {
  return PERFORMANCE_STAT_VARIANTS[variant];
}

/**
 * Complete list of all available variants across all categories
 */
export const ALL_STAT_VARIANTS = {
  ...STAT_CARD_VARIANTS,
  ...TRANSACTION_STAT_VARIANTS,
  ...INVENTORY_STAT_VARIANTS,
  ...PERFORMANCE_STAT_VARIANTS,
} as const;

export type AllStatVariantKeys = keyof typeof ALL_STAT_VARIANTS;
