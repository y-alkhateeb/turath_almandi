import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes using clsx and tailwind-merge
 * This is shadcn/ui's utility for combining class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * NOTE: All currency and date formatting functions have been moved to @/utils/format.ts
 * This file now only contains the cn() utility for class name merging.
 * 
 * Please import formatting functions from @/utils/format instead:
 * - formatCurrency
 * - formatDate
 * - formatNumber
 * - etc.
 */
