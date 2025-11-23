/**
 * Centralized error message keys for consistent messaging across the application
 * These keys are used with the translation system in arabic-errors.ts
 *
 * Usage:
 * - Use these keys in services: throw new BadRequestException(ERROR_MESSAGES.BRANCH.NOT_FOUND)
 * - The exception filter will translate the key based on Accept-Language header
 */

export const ERROR_MESSAGES = {
  // Branch-related errors
  BRANCH: {
    NOT_FOUND: 'branchNotFound',
    REQUIRED: 'branchRequired',
    REQUIRED_FOR_ACCOUNTANT: 'userMustBeAssignedToBranch',
    ACCOUNTANT_NOT_ASSIGNED: 'accountantMustBeAssignedToBranch',
    ACCOUNTANT_NO_ACCESS: 'accountantNotAssignedToAnyBranch',
    CANNOT_ACCESS_OTHER: 'cannotAccessOtherBranches',
    CANNOT_DELETE_OTHER: 'cannotDeleteFromOtherBranches',
    BRANCH_ID_REQUIRED: 'branchIdRequired',
    BRANCH_ID_REQUIRED_BODY: 'branchIdRequiredInRequestBody',
  },

  // User-related errors
  USER: {
    NOT_FOUND: (id: string) => `userWithId${id}NotFound`,
    NOT_AUTHENTICATED: 'userNotAuthenticated',
  },

  // Transaction-related errors
  TRANSACTION: {
    NOT_FOUND: (id: string) => `transactionWithId${id}NotFound`,
    NO_ACCESS: 'noAccessToTransaction',
    BRANCH_REQUIRED: 'userMustBeAssignedToBranchToCreateTransactions',
    PAYMENT_METHOD_INVALID: 'paymentMethodMustBeCashOrMasterForIncome',
  },

  // Debt-related errors
  DEBT: {
    NOT_FOUND: 'debtNotFound',
    BRANCH_REQUIRED_CREATE: 'userMustBeAssignedToBranchToCreateDebts',
    BRANCH_REQUIRED_PAY: 'userMustBeAssignedToBranchToPayDebts',
    DUE_DATE_INVALID: 'dueDateMustBeGreaterThanOrEqualToDate',
    PAYMENT_EXCEEDS_REMAINING: (paid: number, remaining: number) =>
      `paymentAmount${paid}CannotExceedRemainingAmount${remaining}`,
    ONLY_PAY_OWN_BRANCH: 'canOnlyPayDebtsFromYourBranch',
  },

  // Inventory-related errors
  INVENTORY: {
    NOT_FOUND: (id: string) => `inventoryItemWithId${id}NotFound`,
    NO_ACCESS: 'noAccessToInventoryItem',
    BRANCH_REQUIRED: 'userMustBeAssignedToBranchToCreateInventoryItems',
    DUPLICATE_ITEM: 'inventoryItemWithSameNameAndUnitAlreadyExists',
    LINKED_TRANSACTIONS: 'cannotDeleteInventoryItemWithLinkedTransactions',
    ITEM_NAME_REQUIRED: 'itemNameRequiredWhenAddingToInventory',
    UNIT_REQUIRED: 'unitRequiredWhenAddingToInventory',
  },

  // Employee-related errors
  EMPLOYEE: {
    NOT_FOUND: 'employeeNotFound',
    BRANCH_REQUIRED: 'adminMustSpecifyBranchIdForEmployee',
    ACCOUNTANT_NO_BRANCH: 'accountantMustBeAssignedToBranch',
    SALARY_POSITIVE: 'baseSalaryMustBeGreaterThan0',
    ALLOWANCE_POSITIVE: 'allowanceMustBeGreaterThanOrEqualTo0',
    ALREADY_RESIGNED: 'employeeAlreadyResigned',
  },

  // Salary Payment-related errors
  SALARY_PAYMENT: {
    NOT_FOUND: 'salaryPaymentNotFound',
    EMPLOYEE_NOT_FOUND: 'employeeNotFoundForSalaryPayment',
    AMOUNT_POSITIVE: 'salaryPaymentAmountMustBeGreaterThan0',
    TRANSACTION_CREATION_FAILED: 'failedToCreateTransactionForSalaryPayment',
  },

  // Salary Increase-related errors
  SALARY_INCREASE: {
    NOT_FOUND: 'salaryIncreaseNotFound',
    EMPLOYEE_NOT_FOUND: 'employeeNotFoundForSalaryIncrease',
    NEW_SALARY_POSITIVE: 'newSalaryMustBeGreaterThan0',
    NEW_SALARY_LESS_THAN_OLD: 'newSalaryCannotBeLessThanOldSalary',
  },

  // Bonus-related errors
  BONUS: {
    NOT_FOUND: 'bonusNotFound',
    EMPLOYEE_NOT_FOUND: 'employeeNotFoundForBonus',
    AMOUNT_POSITIVE: 'bonusAmountMustBeGreaterThan0',
    TRANSACTION_CREATION_FAILED: 'failedToCreateTransactionForBonus',
  },

  // Permission errors
  PERMISSION: {
    BRANCH_ACCESS: 'cannotAccessOtherBranches',
    ADMIN_ONLY: 'onlyAdminsCanPerformThisAction',
  },

  // Validation errors
  VALIDATION: {
    AMOUNT_POSITIVE: 'amountMustBeGreaterThan0',
    QUANTITY_POSITIVE: 'quantityMustBeGreaterThan0WhenAddingToInventory',
    QUANTITY_NON_NEGATIVE: 'quantityMustBeGreaterThanOrEqualTo0',
    COST_NON_NEGATIVE: 'costPerUnitMustBeGreaterThanOrEqualTo0',
    PAYMENT_POSITIVE: 'paymentAmountMustBeGreaterThan0',
  },

  // Currency errors
  CURRENCY: {
    ONLY_USD_ALLOWED: 'onlyUSDCurrencyIsAllowed',
    INVALID: 'invalidCurrency',
  },

  // Database errors
  DATABASE: {
    RECORD_NOT_FOUND: 'recordNotFound',
    UNEXPECTED_ERROR: 'unexpectedDatabaseError',
    USERNAME_EXISTS: 'recordWithThisUsernameAlreadyExists',
    EMAIL_EXISTS: 'recordWithThisEmailAlreadyExists',
    FOREIGN_KEY_CONSTRAINT: 'foreignKeyConstraintViolation',
    INVALID_BRANCH_REFERENCE: 'invalidBranchReference',
    INVALID_USER_REFERENCE: 'invalidUserReference',
    INVALID_INVENTORY_REFERENCE: 'invalidInventoryItemReference',
    INVALID_DEBT_REFERENCE: 'invalidDebtReference',
  },

  // HTTP errors
  HTTP: {
    BAD_REQUEST: 'badRequest',
    UNAUTHORIZED: 'unauthorized',
    FORBIDDEN: 'forbidden',
    NOT_FOUND: 'notFound',
    CONFLICT: 'conflict',
    INTERNAL_SERVER_ERROR: 'internalServerError',
    SERVICE_UNAVAILABLE: 'serviceUnavailable',
  },
} as const;
