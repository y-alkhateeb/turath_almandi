/**
 * Contact Type Badge Color Constants
 *
 * Provides consistent badge styling for contact types (supplier, customer, both)
 * using semantic design tokens for proper dark mode support.
 */

export const CONTACT_TYPE_BADGE_COLORS = {
  supplier: 'bg-primary/10 text-primary hover:bg-primary/20',
  customer: 'bg-secondary/10 text-secondary hover:bg-secondary/20',
  both: 'bg-accent/10 text-accent hover:bg-accent/20',
} as const;

export type ContactType = keyof typeof CONTACT_TYPE_BADGE_COLORS;
