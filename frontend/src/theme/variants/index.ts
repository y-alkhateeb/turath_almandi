/**
 * Theme Variants
 *
 * Centralized exports for all theme variant styles.
 * This file provides a single import point for all variant systems.
 *
 * @example
 * ```tsx
 * // Import specific variants
 * import { SEMANTIC_BADGE_VARIANTS, STAT_CARD_VARIANTS } from '@/theme/variants';
 *
 * // Or import everything
 * import * as variants from '@/theme/variants';
 * ```
 */

// Badge variants
export {
  SEMANTIC_BADGE_VARIANTS,
  PAYMENT_STATUS_BADGES,
  TRANSACTION_TYPE_BADGES,
  ENTITY_TYPE_BADGES,
  ACTIVITY_STATUS_BADGES,
  INVENTORY_STATUS_BADGES,
  getSemanticBadge,
  getPaymentStatusBadge,
  getTransactionTypeBadge,
  getEntityTypeBadge,
  getActivityStatusBadge,
  getInventoryStatusBadge,
  type SemanticBadgeVariant,
  type PaymentStatusBadge,
  type TransactionTypeBadge,
  type EntityTypeBadge,
  type ActivityStatusBadge,
  type InventoryStatusBadge,
} from './badge-variants';

// Stat card variants
export {
  STAT_CARD_VARIANTS,
  TRANSACTION_STAT_VARIANTS,
  INVENTORY_STAT_VARIANTS,
  PERFORMANCE_STAT_VARIANTS,
  ALL_STAT_VARIANTS,
  getStatCardVariant,
  getTransactionStatVariant,
  getInventoryStatVariant,
  getPerformanceStatVariant,
  type StatCardVariant,
  type StatCardVariantKey,
  type TransactionStatVariantKey,
  type InventoryStatVariantKey,
  type PerformanceStatVariantKey,
  type AllStatVariantKeys,
} from './stat-card-variants';
