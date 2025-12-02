/**
 * Validation utility functions
 * Client-side validation helpers for forms and inputs
 */

/**
 * Check if a date string is valid
 * @param date - Date string to validate
 * @returns true if valid date, false otherwise
 */
export function isValidDate(date: string | null | undefined): boolean {
  if (!date) return false;

  // Try to parse as Date
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return false;

  // Check for reasonable date range (1900-2100)
  const year = parsed.getFullYear();
  if (year < 1900 || year > 2100) return false;

  return true;
}
/**
 * Validate password strength
 * Requirements:
 * - At least 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one digit
 *
 * @param password - Password to validate
 * @returns true if password meets strength requirements, false otherwise
 */
export function isStrongPassword(password: string | null | undefined): boolean {
  if (!password) return false;

  // Minimum length
  if (password.length < 8) return false;

  // Has lowercase
  if (!/[a-z]/.test(password)) return false;

  // Has uppercase
  if (!/[A-Z]/.test(password)) return false;

  // Has digit
  if (!/\d/.test(password)) return false;

  // Optional: Has special character (uncomment if needed)
  // if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

  return true;
}

/**
 * Validate amount is positive and within reasonable range
 * @param amount - Amount to validate
 * @returns true if valid amount (positive number <= 1 trillion), false otherwise
 */
export function isValidAmount(amount: number | null | undefined): boolean {
  if (amount === null || amount === undefined) return false;

  // Must be a valid number
  if (isNaN(amount)) return false;

  // Must be positive
  if (amount <= 0) return false;

  // Reasonable upper limit (1 trillion IQD)
  if (amount > 1_000_000_000_000) return false;

  return true;
}

/**
 * Validate email address format
 * @param email - Email to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  // RFC 5322 compliant regex (simplified)
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return emailPattern.test(email);
}

/**
 * Validate username format
 * Requirements:
 * - 3-20 characters
 * - Alphanumeric, underscore, and hyphen only
 * - Must start with letter
 *
 * @param username - Username to validate
 * @returns true if valid username format, false otherwise
 */
export function isValidUsername(username: string | null | undefined): boolean {
  if (!username) return false;

  // Length check
  if (username.length < 3 || username.length > 20) return false;

  // Format check: starts with letter, contains only alphanumeric, underscore, hyphen
  const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

  return usernamePattern.test(username);
}

/**
 * Validate Iraqi national ID format
 * @param nationalId - National ID to validate
 * @returns true if valid format (12 digits), false otherwise
 */
export function isValidNationalId(nationalId: string | null | undefined): boolean {
  if (!nationalId) return false;

  // Remove spaces and dashes
  const cleaned = nationalId.replace(/[\s-]/g, '');

  // Iraqi national ID is typically 12 digits
  return /^\d{12}$/.test(cleaned);
}

/**
 * Validate percentage value (0-100)
 * @param percentage - Percentage to validate
 * @returns true if valid percentage (0-100), false otherwise
 */
export function isValidPercentage(percentage: number | null | undefined): boolean {
  if (percentage === null || percentage === undefined) return false;

  if (isNaN(percentage)) return false;

  return percentage >= 0 && percentage <= 100;
}

/**
 * Validate quantity (positive integer)
 * @param quantity - Quantity to validate
 * @returns true if valid quantity (positive integer), false otherwise
 */
export function isValidQuantity(quantity: number | null | undefined): boolean {
  if (quantity === null || quantity === undefined) return false;

  if (isNaN(quantity)) return false;

  // Must be positive integer
  return Number.isInteger(quantity) && quantity > 0;
}