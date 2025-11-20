/**
 * Formatting utility functions
 */

import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';

// Configure dayjs
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale('ar');

/**
 * Format number as Iraqi Dinar currency
 * @param amount - Number to format (returns '0 د.ع' if null/undefined)
 * @param locale - Locale string (default: 'ar-IQ')
 */
export function formatCurrency(
  amount: number | null | undefined,
  locale: string = 'ar-IQ'
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(0);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'IQD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date in Arabic (long format)
 * @param date - Date to format (returns '-' if null/undefined)
 * @param locale - Locale string (default: 'ar-IQ')
 */
export function formatDate(
  date: string | Date | null | undefined,
  locale: string = 'ar-IQ'
): string {
  if (!date) return '-';
  const dayjsDate = dayjs(date);
  if (!dayjsDate.isValid()) return '-';

  // Set locale for this specific formatting
  return dayjsDate.locale(locale === 'ar-IQ' ? 'ar' : locale).format('D MMMM YYYY');
}

/**
 * Format date as short format (DD/MM/YYYY)
 */
export function formatDateShort(date: string | Date): string {
  return dayjs(date).format('DD/MM/YYYY');
}

/**
 * Format date for table display (YYYY/MM/DD in Arabic numerals)
 * Used in tables and lists for consistent date display
 */
export function formatDateTable(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const dayjsDate = dayjs(dateString);
  if (!dayjsDate.isValid()) return '-';

  return new Date(dateString).toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Format date and time
 * @param date - Date to format (returns '-' if null/undefined)
 * @param locale - Locale string (default: 'ar-IQ')
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale: string = 'ar-IQ'
): string {
  if (!date) return '-';
  const dayjsDate = dayjs(date);
  if (!dayjsDate.isValid()) return '-';

  return dayjsDate.locale(locale === 'ar-IQ' ? 'ar' : locale).format('D MMMM YYYY، h:mm A');
}

/**
 * Format time only
 */
export function formatTime(date: string | Date): string {
  return dayjs(date).format('h:mm A');
}

/**
 * Format date relative to now (e.g., "منذ ساعتين")
 * @param date - Date to format (returns '-' if null/undefined)
 * @param locale - Locale string (default: 'ar')
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  locale: string = 'ar'
): string {
  if (!date) return '-';
  const dayjsDate = dayjs(date);
  if (!dayjsDate.isValid()) return '-';

  return dayjsDate.locale(locale).fromNow();
}

/**
 * Format number with specified decimals
 * @param value - Number to format (returns '0' if null/undefined)
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatNumber(value: number | null | undefined, decimals: number = 2): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return new Intl.NumberFormat('ar-IQ', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format amount for table display (without currency symbol)
 * Used in tables where currency is shown separately
 */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return amount.toLocaleString('ar-IQ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Parse decimal from string or number, handling Arabic numerals
 * @param value - Value to parse
 * @returns Parsed number (0 if invalid)
 */
export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }

  // Convert Arabic numerals to Western numerals
  const arabicToWestern: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  };

  let normalized = value;
  Object.entries(arabicToWestern).forEach(([arabic, western]) => {
    normalized = normalized.replace(new RegExp(arabic, 'g'), western);
  });

  // Remove any non-numeric characters except decimal point and minus sign
  normalized = normalized.replace(/[^\d.-]/g, '');

  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
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
