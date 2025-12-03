/**
 * Transaction and status color utilities
 * Semantic colors that adapt to light/dark mode
 */

/**
 * Income/Expense colors for transactions
 */
export const INCOME_COLORS = {
  text: 'text-secondary', // Green for income
  bg: 'bg-secondary/10',
  border: 'border-secondary/20',
  icon: 'text-secondary',
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
 * Status colors
 */
export const STATUS_COLORS = {
  active: 'text-secondary', // Green
  inactive: 'text-muted-foreground', // Gray
  warning: 'text-amber-600 dark:text-amber-400', // Yellow/Amber
  error: 'text-destructive', // Red
} as const;

/**
 * Badge colors for different statuses
 */
export const STATUS_BADGE_COLORS = {
  paid: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  partial: 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400',
  unpaid: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  active: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  supplier: 'bg-secondary/10 text-secondary hover:bg-secondary/20', // Green for suppliers
  customer: 'bg-primary/10 text-primary hover:bg-primary/20', // Gold for customers
} as const;

/**
 * Inventory status colors
 */
export const INVENTORY_STATUS_COLORS = {
  outOfStock: 'text-destructive', // Red
  low: 'text-amber-600 dark:text-amber-400', // Yellow
  inStock: 'text-secondary', // Green
} as const;
