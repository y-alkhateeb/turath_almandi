/**
 * Storage utility functions for localStorage and sessionStorage
 */

export enum StorageType {
  Local = 'localStorage',
  Session = 'sessionStorage',
}

class StorageManager {
  private storage: Storage;

  constructor(type: StorageType = StorageType.Local) {
    this.storage = type === StorageType.Local ? localStorage : sessionStorage;
  }

  /**
   * Get item from storage
   */
  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error getting item ${key} from storage:`, error);
      return null;
    }
  }

  /**
   * Set item in storage
   */
  set<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting item ${key} in storage:`, error);
    }
  }

  /**
   * Remove item from storage
   */
  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from storage:`, error);
    }
  }

  /**
   * Clear all items from storage
   */
  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  /**
   * Check if key exists in storage
   */
  has(key: string): boolean {
    return this.storage.getItem(key) !== null;
  }

  /**
   * Get all keys from storage
   */
  keys(): string[] {
    return Object.keys(this.storage);
  }

  /**
   * Get storage size in bytes
   */
  size(): number {
    let size = 0;
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        const item = this.storage.getItem(key);
        if (item) {
          size += key.length + item.length;
        }
      }
    }
    return size;
  }
}

// Create singleton instances
export const localStorageManager = new StorageManager(StorageType.Local);
export const sessionStorageManager = new StorageManager(StorageType.Session);

// Convenience functions
export const getLocal = <T>(key: string) => localStorageManager.get<T>(key);
export const setLocal = <T>(key: string, value: T) => localStorageManager.set(key, value);
export const removeLocal = (key: string) => localStorageManager.remove(key);
export const clearLocal = () => localStorageManager.clear();

export const getSession = <T>(key: string) => sessionStorageManager.get<T>(key);
export const setSession = <T>(key: string, value: T) => sessionStorageManager.set(key, value);
export const removeSession = (key: string) => sessionStorageManager.remove(key);
export const clearSession = () => sessionStorageManager.clear();
