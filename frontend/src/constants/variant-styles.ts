/**
 * Unified variant styles for consistent theming
 * Using brand colors from logo.jpg (gold/brown tones + green)
 */

export type VariantType = 'default' | 'success' | 'warning' | 'danger' | 'info';

/**
 * Card/Container variant styles
 * For stat cards, info panels, alerts, etc.
 */
export const CARD_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'bg-card border-border',
  success: 'bg-gold-500/5 border-gold-500/20',        // Brand gold from logo
  warning: 'bg-orange-500/5 border-orange-500/20',    // Orange for visibility
  danger: 'bg-destructive/5 border-destructive/20',   // Red for errors
  info: 'bg-green-600/5 border-green-600/20',         // Brand green from logo
};

/**
 * Icon variant styles
 * For icons within cards, badges, etc.
 */
export const ICON_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'text-muted-foreground',
  success: 'text-gold-600 dark:text-gold-400',
  warning: 'text-orange-600 dark:text-orange-400',
  danger: 'text-destructive',
  info: 'text-green-600 dark:text-green-400',
};

/**
 * Text variant styles
 * For headings, values, labels
 */
export const TEXT_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'text-foreground',
  success: 'text-gold-700 dark:text-gold-300',
  warning: 'text-orange-700 dark:text-orange-300',
  danger: 'text-destructive',
  info: 'text-green-700 dark:text-green-300',
};

/**
 * Badge variant styles
 * For status badges, pills, tags
 */
export const BADGE_VARIANT_STYLES: Record<VariantType, string> = {
  default: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  success: 'bg-gold-500/10 text-gold-700 hover:bg-gold-500/20 dark:text-gold-400',
  warning: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20',
  danger: 'bg-destructive/10 text-destructive hover:bg-destructive/20',
  info: 'bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:text-green-400',
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
