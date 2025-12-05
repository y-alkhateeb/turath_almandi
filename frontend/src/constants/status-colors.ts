/**
 * Transaction and status color utilities
 * Semantic colors that adapt to light/dark mode
 *
 * Uses semantic tokens from the theme system:
 * - success: Green-based success states
 * - warning: Amber-based warning states
 * - destructive: Red-based error/destructive states
 * - info: Terracotta-based informational states
 * - secondary: Green for income/active
 * - primary: Gold for primary actions
 */

/**
 * Income/Expense colors for transactions
 */
export const INCOME_COLORS = {
  text: 'text-success', // Green for income
  bg: 'bg-success/10',
  border: 'border-success/20',
  icon: 'text-success',
} as const;

export const EXPENSE_COLORS = {
  text: 'text-destructive', // Red for expense
  bg: 'bg-destructive/10',
  border: 'border-destructive/20',
  icon: 'text-destructive',
} as const;

/**
 * Required field indicator (red asterisk)
 */
export const REQUIRED_INDICATOR = 'text-destructive';

/**
 * Status colors using semantic tokens
 */
export const STATUS_COLORS = {
  active: 'text-success', // Green
  inactive: 'text-muted-foreground', // Gray
  warning: 'text-warning-600 dark:text-warning-400', // Warning semantic token
  error: 'text-destructive', // Red
  info: 'text-info-600 dark:text-info-400', // Terracotta info token
} as const;

/**
 * Badge colors for different statuses
 * Using semantic tokens for consistent theming
 */
export const STATUS_BADGE_COLORS = {
  paid: 'bg-success/10 text-success hover:bg-success/20',
  partial: 'bg-warning-500/10 text-warning-700 hover:bg-warning-500/20 dark:text-warning-400',
  unpaid: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  active: 'bg-success/10 text-success hover:bg-success/20',
  supplier: 'bg-success/10 text-success hover:bg-success/20', // Green for suppliers
  customer: 'bg-primary/10 text-primary hover:bg-primary/20', // Gold for customers
  info: 'bg-info-500/10 text-info-700 hover:bg-info-500/20 dark:text-info-400', // Info variant
} as const;

/**
 * Inventory status colors using semantic tokens
 */
export const INVENTORY_STATUS_COLORS = {
  outOfStock: 'text-destructive', // Red
  low: 'text-warning-600 dark:text-warning-400', // Warning token
  inStock: 'text-success', // Green
} as const;

/**
 * Activity status colors for active/inactive states
 * Using semantic tokens for consistent theming
 */
export const ACTIVITY_STATUS_COLORS = {
  active: 'bg-success/10 text-success hover:bg-success/20',
  inactive: 'bg-muted text-muted-foreground hover:bg-muted/80',
} as const;

/**
 * TypeScript types for better IDE support
 */
export type StatusColorKey = keyof typeof STATUS_COLORS;
export type BadgeColorKey = keyof typeof STATUS_BADGE_COLORS;
export type InventoryStatusKey = keyof typeof INVENTORY_STATUS_COLORS;
export type ActivityStatusKey = keyof typeof ACTIVITY_STATUS_COLORS;
