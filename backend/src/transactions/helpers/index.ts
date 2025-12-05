/**
 * Transaction Helpers - Barrel Export
 * Centralizes all transaction helper functions
 */

// Branch resolution helpers
export {
  resolveBranchId,
  validateBranchAccess,
  getEffectiveBranchFilter,
} from './branch-resolver';

// Discount calculation helpers
export {
  calculateDiscount,
  calculateItemTotal,
} from './discount-calculator';

// Partial payment helpers
export {
  processPartialPayment,
  type PartialPaymentInput,
  type PartialPaymentResult,
} from './partial-payment';

// Inventory operation helpers
export {
  processInventoryOperation,
  processConsumption,
  processPurchase,
  type InventoryOperationInput,
} from './inventory-operations';
