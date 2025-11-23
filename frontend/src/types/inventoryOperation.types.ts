/**
 * Inventory Operation Types
 * Defines types for inventory purchase and consumption operations
 */

export enum InventoryOperationType {
  PURCHASE = 'PURCHASE',
  CONSUMPTION = 'CONSUMPTION',
}

export interface InventoryItemOperation {
  itemId: string;
  quantity: number;
  operationType: InventoryOperationType;
  unitPrice?: number;
}

export interface TransactionWithInventoryRequest {
  type: 'INCOME' | 'EXPENSE';
  totalAmount: number;
  paidAmount?: number;
  category?: string;
  paymentMethod?: 'CASH' | 'MASTER';
  employeeVendorName: string;
  date: string;
  notes?: string;
  branchId?: string;
  inventoryItems?: InventoryItemOperation[];
  createDebtForRemaining?: boolean;
  debtCreditorName?: string;
  debtDueDate?: string;
  debtNotes?: string;
}

export interface TransactionInventoryItem {
  id: string;
  transactionId: string;
  inventoryItemId: string;
  quantity: number;
  operationType: InventoryOperationType;
  unitPrice: number | null;
  createdAt: string;
  updatedAt: string;
  inventoryItem?: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  };
}
