/**
 * Centralized error messages for consistent messaging across the application
 */

export const ERROR_MESSAGES = {
  // Branch-related errors
  BRANCH: {
    NOT_FOUND: 'الفرع غير موجود',
    REQUIRED: 'يجب تحديد الفرع',
    REQUIRED_FOR_ACCOUNTANT: 'يجب تعيين فرع للمستخدم',
    ACCOUNTANT_NOT_ASSIGNED: 'Accountant must be assigned to a branch',
    ACCOUNTANT_NO_ACCESS: 'Accountant not assigned to any branch',
    CANNOT_ACCESS_OTHER: 'Cannot access other branches',
    CANNOT_DELETE_OTHER: 'Cannot delete from other branches',
    BRANCH_ID_REQUIRED: 'branchId required',
    BRANCH_ID_REQUIRED_BODY: 'branchId required in request body',
  },

  // User-related errors
  USER: {
    NOT_FOUND: (id: string) => `User with ID ${id} not found`,
    NOT_AUTHENTICATED: 'User not authenticated',
  },

  // Transaction-related errors
  TRANSACTION: {
    NOT_FOUND: (id: string) => `Transaction with ID ${id} not found`,
    NO_ACCESS: 'You do not have access to this transaction',
    BRANCH_REQUIRED: 'يجب تعيين فرع للمستخدم لإنشاء المعاملات',
    PAYMENT_METHOD_INVALID: 'Payment method must be either CASH or MASTER for income transactions',
  },

  // Debt-related errors
  DEBT: {
    NOT_FOUND: 'Debt not found',
    BRANCH_REQUIRED_CREATE: 'يجب تعيين فرع للمستخدم لإنشاء الديون',
    BRANCH_REQUIRED_PAY: 'يجب تعيين فرع للمستخدم لسداد الديون',
    DUE_DATE_INVALID: 'Due date must be greater than or equal to date',
    PAYMENT_EXCEEDS_REMAINING: (paid: number, remaining: number) =>
      `Payment amount (${paid}) cannot exceed remaining amount (${remaining})`,
    ONLY_PAY_OWN_BRANCH: 'You can only pay debts from your branch',
  },

  // Inventory-related errors
  INVENTORY: {
    NOT_FOUND: (id: string) => `Inventory item with ID ${id} not found`,
    NO_ACCESS: 'You do not have access to this inventory item',
    BRANCH_REQUIRED: 'يجب تعيين فرع للمستخدم لإنشاء عناصر المخزون',
    DUPLICATE_ITEM: 'An inventory item with the same name and unit already exists in this branch',
    LINKED_TRANSACTIONS: 'Cannot delete inventory item with linked transactions. Unlink transactions first or set quantity to 0.',
    ITEM_NAME_REQUIRED: 'Item name is required when adding to inventory',
    UNIT_REQUIRED: 'Unit is required when adding to inventory',
  },

  // Validation errors
  VALIDATION: {
    AMOUNT_POSITIVE: 'Amount must be greater than 0',
    QUANTITY_POSITIVE: 'Quantity must be greater than 0 when adding to inventory',
    QUANTITY_NON_NEGATIVE: 'Quantity must be greater than or equal to 0',
    COST_NON_NEGATIVE: 'Cost per unit must be greater than or equal to 0',
    PAYMENT_POSITIVE: 'Payment amount must be greater than 0',
  },
} as const;
