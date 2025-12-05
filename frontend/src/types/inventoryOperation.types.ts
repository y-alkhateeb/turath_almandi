import { InventoryOperationType, DiscountType, TransactionType, PaymentMethod } from './enum';

export interface TransactionItemDto {
  inventoryItemId: string;
  /** معرف الوحدة الفرعية - يستخدم عند البيع بوحدة فرعية مثل نصف فروج */
  inventorySubUnitId?: string;
  quantity: number;
  unitPrice: number;
  operationType: InventoryOperationType;
  discountType?: DiscountType;
  discountValue?: number;
  /** ملاحظات إضافية للصنف */
  notes?: string;
}

export interface TransactionWithInventoryRequest {
  // Transaction type and category
  type?: TransactionType;
  category?: string;

  // Transaction details
  date: string;
  items: TransactionItemDto[];
  notes?: string;

  // Payment details
  paymentAmount?: number;
  paymentMethod?: PaymentMethod | string; // 'CASH' | 'MASTER'

  branchId?: string;

  // Partial payment (creates Payable for EXPENSE or Receivable for INCOME)
  isPartialPayment?: boolean;
  paidAmount?: number;
  contactId?: string; // Supplier for EXPENSE, Customer for INCOME

  // Discount fields (for INCOME categories that support discount)
  discountType?: DiscountType;
  discountValue?: number;
  discountReason?: string;
}
