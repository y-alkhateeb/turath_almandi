/**
 * Utility functions for sanitizing sensitive data before logging or returning to clients
 */

/**
 * Sanitize user object by removing sensitive fields
 * Removes: passwordHash, password, and any other sensitive authentication data
 *
 * @param user - User object to sanitize (can be any object with user data)
 * @returns Sanitized user object without sensitive fields
 *
 * @example
 * const user = { id: '123', username: 'john', passwordHash: 'hash123', role: 'ADMIN' };
 * const safe = sanitizeUser(user);
 * // Returns: { id: '123', username: 'john', role: 'ADMIN' }
 */
export function sanitizeUser<T extends Record<string, unknown>>(user: T | null | undefined): Partial<T> | null {
  if (!user) {
    return null;
  }

  // Create a shallow copy to avoid mutating the original object
  const sanitized = { ...user };

  // Remove sensitive fields
  const sensitiveFields = ['password', 'passwordHash', 'password_hash'];

  sensitiveFields.forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * Sanitize array of user objects
 *
 * @param users - Array of user objects to sanitize
 * @returns Array of sanitized user objects
 *
 * @example
 * const users = [
 *   { id: '1', username: 'john', passwordHash: 'hash1' },
 *   { id: '2', username: 'jane', passwordHash: 'hash2' }
 * ];
 * const safe = sanitizeUsers(users);
 * // Returns: [{ id: '1', username: 'john' }, { id: '2', username: 'jane' }]
 */
export function sanitizeUsers<T extends Record<string, unknown>>(users: T[] | null | undefined): Partial<T>[] {
  if (!users || !Array.isArray(users)) {
    return [];
  }

  return users.map((user) => sanitizeUser(user)).filter((user): user is Partial<T> => user !== null);
}

/**
 * Generic function to remove specified fields from an object
 *
 * @param obj - Object to sanitize
 * @param fieldsToRemove - Array of field names to remove
 * @returns Sanitized object without specified fields
 *
 * @example
 * const data = { id: '1', name: 'John', secret: 'confidential' };
 * const safe = omitFields(data, ['secret']);
 * // Returns: { id: '1', name: 'John' }
 */
export function omitFields<T extends Record<string, unknown>>(
  obj: T | null | undefined,
  fieldsToRemove: string[],
): Partial<T> | null {
  if (!obj) {
    return null;
  }

  const sanitized = { ...obj };

  fieldsToRemove.forEach((field) => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}
