/**
 * Unified variant styles for consistent theming
 * Using semantic theme variables that adapt to light/dark mode
 */

export type VariantType = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Card/Container variant styles
 * For stat cards, info panels, alerts, etc.
 * Uses semantic theme variables that adapt to light/dark mode
 */
export const CARD_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'bg-card border-border',
  success: 'bg-primary/5 border-primary/20',        // Gold (brand primary)
  warning: 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-500/20 dark:border-amber-500/40',
  danger: 'bg-destructive/10 border-destructive/30',
  info: 'bg-secondary/10 border-secondary/30',      // Green (brand secondary)
};

/**
 * Icon variant styles
 * For icons within cards, badges, etc.
 */
export const ICON_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'text-muted-foreground',
  success: 'text-primary',                           // Gold
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-destructive',
  info: 'text-secondary',                            // Green
};

/**
 * Text variant styles
 * For headings, values, labels
 */
export const TEXT_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'text-foreground',
  success: 'text-primary',                           // Gold
  warning: 'text-amber-700 dark:text-amber-300',
  danger: 'text-destructive',
  info: 'text-secondary',                            // Green
};

/**
 * Badge variant styles
 * For status badges, pills, tags
 */
export const BADGE_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  success: 'bg-primary/10 text-primary hover:bg-primary/20',
  warning: 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400',
  danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  info: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
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
