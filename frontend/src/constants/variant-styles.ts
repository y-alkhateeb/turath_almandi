/**
 * Unified variant styles for consistent theming
 * Using semantic theme variables that adapt to light/dark mode
 *
 * Semantic tokens used:
 * - success: Green-based success states (using theme success token)
 * - warning: Amber-based warning states (using theme warning token)
 * - danger: Red-based error states (using theme destructive token)
 * - info: Terracotta-based informational states (using theme accent/info token)
 * - primary: Gold brand color
 * - secondary: Green brand color
 */

export type VariantType = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Card/Container variant styles
 * For stat cards, info panels, alerts, etc.
 * Uses semantic theme variables that adapt to light/dark mode
 */
export const CARD_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'bg-card border-border',
  success: 'bg-success/5 border-success/20',        // Green success
  warning: 'bg-warning-500/10 border-warning-500/30 dark:bg-warning-500/20 dark:border-warning-500/40',
  danger: 'bg-destructive/10 border-destructive/30',
  info: 'bg-accent/10 border-accent/30',            // Terracotta accent/info
};

/**
 * Icon variant styles
 * For icons within cards, badges, etc.
 */
export const ICON_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'text-muted-foreground',
  success: 'text-success',                          // Green success
  warning: 'text-warning-600 dark:text-warning-400',
  danger: 'text-destructive',
  info: 'text-accent',                              // Terracotta accent
};

/**
 * Text variant styles
 * For headings, values, labels
 */
export const TEXT_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'text-foreground',
  success: 'text-success',                          // Green success
  warning: 'text-warning-700 dark:text-warning-300',
  danger: 'text-destructive',
  info: 'text-accent',                              // Terracotta accent
};

/**
 * Badge variant styles
 * For status badges, pills, tags
 */
export const BADGE_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  success: 'bg-success/10 text-success hover:bg-success/20',
  warning: 'bg-warning-500/10 text-warning-700 hover:bg-warning-500/20 dark:text-warning-400',
  danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  info: 'bg-accent/10 text-accent hover:bg-accent/20', // Terracotta accent/info
};

/**
 * Get variant styles for a specific use case
 */
export function getCardVariant(variant: VariantType): string {
  return CARD_VARIANT_STYLES[variant];
}

export function getIconVariant(variant: VariantType): string {
  return ICON_VARIANT_STYLES[variant];
}

export function getTextVariant(variant: VariantType): string {
  return TEXT_VARIANT_STYLES[variant];
}

export function getBadgeVariant(variant: VariantType): string {
  return BADGE_VARIANT_STYLES[variant];
}
