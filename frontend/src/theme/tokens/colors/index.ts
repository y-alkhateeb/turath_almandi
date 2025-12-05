/**
 * Color Tokens - Single Source of Truth
 *
 * All colors are defined in CSS (index.css).
 * This file exports helpers to read colors from CSS variables.
 *
 * Usage:
 * ```ts
 * import { getBrandColors, getSemanticColors, getTransactionColors, getColorFromCSS } from '@/theme/tokens/colors';
 *
 * // Get brand colors (primary, secondary, accent)
 * const brand = getBrandColors();
 * console.log(brand.primary.main); // "#b28b4c" in light mode
 *
 * // Get semantic colors (success, warning, danger, info)
 * const semantic = getSemanticColors();
 * console.log(semantic.success.main); // "#527a56" in light mode
 *
 * // Get transaction colors (income, expense, transfer)
 * const transaction = getTransactionColors();
 * console.log(transaction.income.main); // "#527a56" (same as success)
 *
 * // Get any CSS variable directly
 * const primary = getColorFromCSS('primary');
 * ```
 */

// Export all color functions and types from semantic.ts
export {
  // Helper function to read CSS variables
  getColorFromCSS,

  // Color getter functions
  getBrandColors,
  getSemanticColors,
  getTransactionColors,

  // Type exports
  type ColorTokenSet,
  type BrandColorTokens,
  type BrandColors,
  type SemanticColors,
  type TransactionColorTokens,
  type TransactionColors,

  // Legacy exports (for backward compatibility)
  lightSemanticColors,
  darkSemanticColors,
  lightTransactionColors,
  darkTransactionColors,
  lightBrandColors,
  darkBrandColors,
} from './semantic';
