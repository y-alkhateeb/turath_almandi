import React from 'react';
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatCurrencyAuto } from '@/utils/currency.utils';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * CurrencyAmount Component Props
 */
interface CurrencyAmountProps {
  /** Numeric amount to display */
  amount: number;
  /** Number of decimal places (default: 0) */
  decimals?: number;
  /** Show loading skeleton while currency loads */
  showLoading?: boolean;
  /** CSS class name */
  className?: string;
  /** Render as span or div */
  as?: 'span' | 'div';
}

/**
 * CurrencyAmount Component
 *
 * Displays a numeric amount with the system's default currency symbol
 * Automatically fetches and caches currency from backend
 *
 * Features:
 * - Auto-fetches currency on first render
 * - Caches currency in localStorage (1 hour TTL)
 * - Shows loading skeleton while loading
 * - Handles missing currency gracefully
 * - RTL-aware formatting
 *
 * @example
 * ```tsx
 * // Simple usage
 * <CurrencyAmount amount={1000} />
 * // → "1,000 د.ع"
 *
 * // With decimals
 * <CurrencyAmount amount={1500.5} decimals={2} />
 * // → "1,500.50 د.ع"
 *
 * // With custom styling
 * <CurrencyAmount
 *   amount={999}
 *   className="text-green-600 font-bold"
 * />
 * ```
 */
export function CurrencyAmount({
  amount,
  decimals = 0,
  showLoading = true,
  className = '',
  as: Component = 'span',
}: CurrencyAmountProps) {
  const { currency, isLoading, fetchCurrency, shouldRefresh } = useCurrencyStore();

  // Auto-fetch currency if needed
  React.useEffect(() => {
    if (shouldRefresh()) {
      fetchCurrency().catch(console.error);
    }
  }, [fetchCurrency, shouldRefresh]);

  // Show loading skeleton
  if (isLoading && showLoading && !currency) {
    return <Skeleton className="h-5 w-24 inline-block" />;
  }

  // Format amount with currency
  const formattedAmount = formatCurrencyAuto(amount, currency, decimals);

  return (
    <Component className={className} dir="ltr">
      {formattedAmount}
    </Component>
  );
}

/**
 * Compact variant for table cells
 */
export function CurrencyAmountCompact(props: Omit<CurrencyAmountProps, 'showLoading'>) {
  return <CurrencyAmount {...props} showLoading={false} className={`tabular-nums ${props.className || ''}`} />;
}

/**
 * Large variant for highlights
 */
export function CurrencyAmountLarge(props: CurrencyAmountProps) {
  return <CurrencyAmount {...props} className={`text-2xl font-bold ${props.className || ''}`} />;
}

/**
 * Colored variant (green for positive, red for negative)
 */
export function CurrencyAmountColored(props: CurrencyAmountProps) {
  const colorClass = props.amount >= 0 ? 'text-green-600' : 'text-red-600';
  return <CurrencyAmount {...props} className={`${colorClass} ${props.className || ''}`} />;
}
