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

// Single inventory item with display information
export interface SingleInventoryItem {
  itemId: string;
  itemName: string; // For display
  quantity: number;
  unitPrice: number;
  unit: string; // For display
}

export interface TransactionWithInventoryRequest {
  type: 'INCOME' | 'EXPENSE';
  totalAmount: number;
  paidAmount?: number;
  category?: string;
  paymentMethod: 'CASH' | 'MASTER'; // Now required
  date: string;
  notes?: string;
  branchId?: string;
  // Single inventory item (not array)
  inventoryItem?: {
    itemId: string;
    quantity: number;
    operationType: 'PURCHASE' | 'CONSUMPTION';
    unitPrice: number;
  };
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
