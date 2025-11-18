/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Formats a date string or Date object for database storage
 * @param date - Date string (ISO format) or Date object
 * @returns Date object suitable for Prisma
 */
export function formatDateForDB(date: string | Date): Date {
  return new Date(date);
}

/**
 * Returns the current timestamp
 * @returns Current Date object
 */
export function getCurrentTimestamp(): Date {
  return new Date();
}

/**
 * Gets the start of day (00:00:00.000) for a given date
 * @param date - Date string or Date object
 * @returns Date object set to start of day
 */
export function getStartOfDay(date: string | Date): Date {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate;
}

/**
 * Gets the end of day (23:59:59.999) for a given date
 * @param date - Date string or Date object
 * @returns Date object set to end of day
 */
export function getEndOfDay(date: string | Date): Date {
  const targetDate = new Date(date);
  targetDate.setHours(23, 59, 59, 999);
  return targetDate;
}

/**
 * Gets the start of month (1st day, 00:00:00.000) for a given date
 * @param date - Date object
 * @returns Date object set to start of month
 */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Gets the end of month (last day, 23:59:59.999) for a given date
 * @param date - Date object
 * @returns Date object set to end of month
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Formats a Date object to ISO date string (YYYY-MM-DD)
 * @param date - Date object
 * @returns ISO date string
 */
export function formatToISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}
