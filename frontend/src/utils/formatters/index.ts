/**
 * Formatting utility functions
 */

import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/ar';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('en');

/**
 * Format number as Iraqi Dinar currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ar-IQ', {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date in English (DD/MM/YYYY format)
 */
export function formatDate(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY');
}

/**
 * Format date as short format (DD/MM/YYYY)
 */
export function formatDateShort(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY');
}

/**
 * Format date and time (DD/MM/YYYY h:mm A)
 */
export function formatDateTime(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY h:mm A');
}

/**
 * Format time only
 */
export function formatTime(date: string | Date): string {
  return dayjs(date).format('h:mm A');
}

/**
 * Format date relative to now (e.g., "منذ ساعتين")
 */
export function formatRelativeTime(date: string | Date): string {
  return dayjs(date).locale('ar').fromNow();
}

/**
 * Format number with Arabic numerals
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ar-IQ').format(num);
}

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)} مليار`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)} مليون`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)} ألف`;
  }
  return formatNumber(num);
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت';

  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX for 10 digits
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  // Format as +XX XXX XXX XXXX for international numbers
  if (cleaned.length === 12) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }

  // Return as is if doesn't match expected length
  return phone;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Convert date to input value format (YYYY-MM-DD)
 */
export function toInputDate(date: string | Date): string {
  return dayjs(date).format('YYYY-MM-DD');
}

/**
 * Get day of week in Arabic
 */
export function getDayOfWeek(date: string | Date): string {
  return dayjs(date).format('dddd');
}

/**
 * Get month name in Arabic
 */
export function getMonthName(date: string | Date): string {
  return dayjs(date).format('MMMM');
}

/**
 * Check if date is today
 */
export function isToday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: string | Date): boolean {
  return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
}

/**
 * Get start of day
 */
export function startOfDay(date: string | Date): Date {
  return dayjs(date).startOf('day').toDate();
}

/**
 * Get end of day
 */
export function endOfDay(date: string | Date): Date {
  return dayjs(date).endOf('day').toDate();
}

/**
 * Get start of month
 */
export function startOfMonth(date: string | Date): Date {
  return dayjs(date).startOf('month').toDate();
}

/**
 * Get end of month
 */
export function endOfMonth(date: string | Date): Date {
  return dayjs(date).endOf('month').toDate();
}
