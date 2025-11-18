/**
 * Reusable Prisma include objects to maintain consistency across services
 * and reduce code duplication
 */

/**
 * Standard branch select object
 * Used when including branch relations
 */
export const BRANCH_SELECT = {
  id: true,
  name: true,
  location: true,
};

/**
 * Standard user select object
 * Used when including user relations (creator, recordedBy, etc.)
 */
export const USER_SELECT = {
  id: true,
  username: true,
  role: true,
};

/**
 * Standard includes for entities with branch and creator
 */
export const STANDARD_INCLUDES = {
  branch: {
    select: BRANCH_SELECT,
  },
  creator: {
    select: USER_SELECT,
  },
};

/**
 * Include object for inventory item in transactions
 */
export const INVENTORY_ITEM_SELECT = {
  id: true,
  name: true,
  quantity: true,
  unit: true,
};

/**
 * Extended inventory item select including cost per unit
 */
export const INVENTORY_ITEM_EXTENDED_SELECT = {
  ...INVENTORY_ITEM_SELECT,
  costPerUnit: true,
};

/**
 * Include object for transactions in inventory items
 */
export const TRANSACTION_SELECT_FOR_INVENTORY = {
  id: true,
  amount: true,
  date: true,
  employeeVendorName: true,
  category: true,
};

/**
 * Minimal transaction select
 */
export const TRANSACTION_SELECT_MINIMAL = {
  id: true,
  amount: true,
  date: true,
  employeeVendorName: true,
};
