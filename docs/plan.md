# Transaction Service Cleanup & Testing Plan

## Overview
1. Fix syntax errors and code quality issues in transactions.service.ts
3. Replace hardcoded values with constants
4. Write comprehensive unit tests for transactions service/controller (100% coverage)

---

## Phase 3: Replace Hardcoded Values with Constants

### 3.1 Add new constants to ARABIC_ERRORS
**File:** [arabic-errors.ts](backend/src/common/constants/arabic-errors.ts)

```typescript
export const ARABIC_ERRORS = {
  // ... existing errors

  // Transaction validation errors
  categoryNotSupportMultiItem: (category: string) =>
    `الفئة ${category} لا تدعم إضافة عدة أصناف. الفئات المدعومة: INVENTORY_SALES, APP_PURCHASES, INVENTORY`,
  categoryNotSupportDiscount: (category: string) =>
    `الفئة ${category} لا تدعم الخصم. الفئات المدعومة: INVENTORY_SALES, APP_PURCHASES`,
  paidAmountNegative: 'المبلغ المدفوع لا يمكن أن يكون سالباً',
  paidAmountExceedsTotal: 'المبلغ المدفوع لا يمكن أن يتجاوز المبلغ الإجمالي',
  contactIdRequiredForPartialPayment: 'معرف جهة الاتصال مطلوب عند الدفع الجزئي للمصروفات',
  autoDebtDescription: (category: string) => `دين تلقائي من معاملة ${category}`,
  remainingAmountNote: 'المبلغ المتبقي من المعاملة',
  insufficientQuantity: (name: string, available: number, requested: number) =>
    `كمية غير كافية للصنف ${name}. المتوفر: ${available}, المطلوب: ${requested}`,
  inventoryItemNotFoundInBranch: (itemId: string) =>
    `صنف المخزون ${itemId} غير موجود في هذا الفرع`,
};
```

### 3.2 Use DebtStatus enum instead of hardcoded 'ACTIVE'
**File:** transactions.service.ts (Line 435)
```typescript
// Import:
import { DebtStatus } from '../common/types/prisma-enums';

// Use:
status: DebtStatus.ACTIVE,  // instead of 'ACTIVE'
```

### 3.3 Update service to use ARABIC_ERRORS constants
Replace all hardcoded Arabic strings with constants

---

## Phase 4: Code Quality Improvements

### 4.1 Fix type casting in getExpensesByCategory (Line 1014)
```typescript
// Before:
transactions.map((t: any) => ({

// After (with proper type):
transactions.map((t) => ({
```
The type is already inferred from Prisma query

---

## Phase 5: Unit Tests for Transactions Module

### 5.1 Create test file structure
```
backend/src/transactions/
├── transactions.service.spec.ts
├── transactions.controller.spec.ts
└── helpers/
    └── helpers.spec.ts
```

### 5.2 Test coverage requirements
- **Target:** 100% coverage for all scenarios
- **Framework:** Jest with @nestjs/testing
- **Pattern:** Follow existing patterns from auth.service.spec.ts

### 5.3 Service test scenarios

#### createIncome tests:
- [ ] Create income with amount only
- [ ] Create income with multi-item (items[])
- [ ] Create income with discount (PERCENTAGE)
- [ ] Create income with discount (FIXED)
- [ ] Reject income with invalid category for multi-item
- [ ] Reject income with invalid category for discount
- [ ] Reject income with no amount and no items
- [ ] Reject income with invalid payment method
- [ ] Admin creates income with branchId
- [ ] Accountant creates income (auto-resolve branchId)
- [ ] Accountant without branch throws error

#### createExpense tests:
- [ ] Create expense with amount only
- [ ] Create expense with multi-item (items[])
- [ ] Create expense for EMPLOYEE_SALARIES with employeeId
- [ ] Create expense with partial payment (creates debt)
- [ ] Create expense with full payment (no debt)
- [ ] Reject expense with invalid category for multi-item
- [ ] Reject expense with no amount and no items
- [ ] Reject expense with negative paidAmount
- [ ] Reject expense with paidAmount > amount
- [ ] Reject partial payment without contactId
- [ ] Reject EMPLOYEE_SALARIES without employeeId
- [ ] Reject salary for resigned employee
- [ ] Admin creates expense with branchId
- [ ] Accountant creates expense (auto-resolve branchId)

#### Inventory operations tests:
- [ ] CONSUMPTION deducts from inventory
- [ ] CONSUMPTION rejects insufficient quantity
- [ ] PURCHASE adds to inventory with weighted average cost
- [ ] Create transactionInventoryItem records

#### findAll tests:
- [ ] Return paginated transactions
- [ ] Filter by type
- [ ] Filter by category
- [ ] Filter by paymentMethod
- [ ] Filter by branchId (admin)
- [ ] Filter by date range
- [ ] Filter by search term
- [ ] Exclude soft-deleted transactions
- [ ] Accountant sees only their branch

#### findOne tests:
- [ ] Return transaction by ID
- [ ] Throw NotFoundException for non-existent
- [ ] Throw NotFoundException for soft-deleted
- [ ] Accountant can only access their branch
- [ ] Throw ForbiddenException for wrong branch

#### update tests:
- [ ] Update transaction fields
- [ ] Reject invalid amount
- [ ] Reject invalid payment method for income
- [ ] Accountant can only update their branch

#### remove tests:
- [ ] Soft delete transaction
- [ ] Throw NotFoundException for non-existent
- [ ] Accountant can only delete their branch

#### getSummary tests:
- [ ] Return summary for date
- [ ] Filter by branchId (admin)
- [ ] Accountant sees only their branch
- [ ] Calculate income_cash, income_master correctly
- [ ] Calculate total_expense correctly
- [ ] Calculate net correctly

### 5.4 Controller test scenarios

- [ ] POST /transactions/income - valid request
- [ ] POST /transactions/income - invalid request (validation error)
- [ ] POST /transactions/expense - valid request
- [ ] POST /transactions/expense - invalid request
- [ ] GET /transactions - with filters
- [ ] GET /transactions/:id - found
- [ ] GET /transactions/:id - not found
- [ ] PUT /transactions/:id - valid update
- [ ] DELETE /transactions/:id - success
- [ ] GET /transactions/summary - with params

### 5.5 Helper function tests

#### resolveBranchId tests:
- [ ] Admin with branchId returns branchId
- [ ] Admin without branchId throws error
- [ ] Accountant returns user.branchId
- [ ] Accountant without branch throws error

#### calculateDiscount tests:
- [ ] PERCENTAGE discount calculation
- [ ] FIXED discount calculation
- [ ] No discount returns original
- [ ] Zero discount value returns original

#### calculateItemTotal tests:
- [ ] Calculate subtotal (quantity * price)
- [ ] Apply PERCENTAGE discount
- [ ] Apply FIXED discount
- [ ] No discount returns subtotal

---

## Files to Modify

### Backend:
- `backend/src/common/constants/arabic-errors.ts` - Add new constants

### New Test Files:
- `backend/src/transactions/transactions.service.spec.ts`
- `backend/src/transactions/transactions.controller.spec.ts`
- `backend/src/transactions/helpers/helpers.spec.ts`

---

## Execution Order

1. Fix critical syntax errors (Phase 1) - **BLOCKING**
3. Add ARABIC_ERRORS constants (Phase 3.1)
4. Update service to use constants (Phase 3.2-3.3)
5. Code quality fixes (Phase 4)
6. Write unit tests (Phase 5)

---

## Phase 1: Backend - DTO Refactoring

### 1.1 Update `CreateExpenseDto` to use `items[]`
**File:** [create-expense.dto.ts](backend/src/transactions/dto/create-expense.dto.ts)

Changes:
- [ ] Replace `inventoryItem?: InventoryItemOperationDto` with `items?: TransactionItemDto[]`
- [ ] Update validation: `amount` required if no items
- [ ] Keep employee salary fields (`employeeId`)
- [ ] Keep partial payment fields (`paidAmount`, `createDebtForRemaining`, `contactId`, `payableDueDate`)

```typescript
// Before
inventoryItem?: InventoryItemOperationDto;

// After
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => TransactionItemDto)
items?: TransactionItemDto[];
```

### 1.2 Delete Deprecated DTOs
- [ ] Delete [create-transaction.dto.ts](backend/src/transactions/dto/create-transaction.dto.ts)
- [ ] Delete [create-purchase-expense.dto.ts](backend/src/transactions/dto/create-purchase-expense.dto.ts)
- [ ] Delete [create-transaction-with-inventory.dto.ts](backend/src/transactions/dto/create-transaction-with-inventory.dto.ts)
- [ ] Delete [inventory-item-operation.dto.ts](backend/src/transactions/dto/inventory-item-operation.dto.ts) (replaced by TransactionItemDto)

### 1.3 Update DTO index exports
**File:** `backend/src/transactions/dto/index.ts`
- [ ] Remove exports for deleted DTOs
- [ ] Ensure new DTOs are exported

---

## Phase 2: Backend - Service Refactoring

### 2.1 Create `_createTransactionCore()` private method
**File:** [transactions.service.ts](backend/src/transactions/transactions.service.ts)

Extract shared logic into private method:
```typescript
private async _createTransactionCore(params: {
  type: TransactionType;
  category: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  date: string;
  branchId: string;
  creatorId: string;
  notes?: string;
  items?: TransactionItemDto[];
  discount?: { type: DiscountType; value: number; reason?: string };
  partialPayment?: { paidAmount: number; contactId: string; dueDate?: string };
  employeeId?: string;
}): Promise<TransactionWithBranchAndCreator>
```

### 2.2 Refactor `createIncome()`
- [ ] Validate income-specific rules (payment method required)
- [ ] Calculate total from items or use amount
- [ ] Apply discount if provided
- [ ] Call `_createTransactionCore()`

### 2.3 Refactor `createExpense()`
- [ ] Validate expense-specific rules
- [ ] Calculate total from items or use amount
- [ ] Handle inventory operations for items
- [ ] Handle partial payment / debt creation
- [ ] Handle employee salary (if category = EMPLOYEE_SALARIES)
- [ ] Call `_createTransactionCore()`

### 2.4 Delete deprecated service methods
- [ ] Remove `create()` method (lines 241-551)
- [ ] Remove `createPurchaseWithInventory()` method
- [ ] Remove `createTransactionWithInventory()` method

---

## Phase 3: Backend - Controller Cleanup

### 3.1 Remove deprecated endpoints
**File:** [transactions.controller.ts](backend/src/transactions/transactions.controller.ts)

- [ ] Remove `POST /transactions` (lines 47-53)
- [ ] Remove `POST /transactions/purchase` (lines 55-64)
- [ ] Remove `POST /transactions/with-inventory` (lines 66-75)

### 3.2 Keep only new endpoints
```typescript
@Post('income')
createIncome(@Body() dto: CreateIncomeDto, @CurrentUser() user: RequestUser)

@Post('expense')
createExpense(@Body() dto: CreateExpenseDto, @CurrentUser() user: RequestUser)
```

---

## Phase 4: Frontend - Service Layer

### 4.1 Add new methods to transactionService
**File:** [transactionService.ts](frontend/src/api/services/transactionService.ts)

```typescript
// New methods
export const createIncome = (data: CreateIncomeInput): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: '/transactions/income',
    data,
  });
};

export const createExpense = (data: CreateExpenseInput): Promise<Transaction> => {
  return apiClient.post<Transaction>({
    url: '/transactions/expense',
    data,
  });
};
```

### 4.2 Add type definitions
**File:** [entity.ts](frontend/src/types/entity.ts) or new file

```typescript
export interface CreateIncomeInput {
  date: string;
  category: IncomeCategory;
  paymentMethod: PaymentMethod;
  amount?: number;
  items?: TransactionItemDto[];
  discountType?: DiscountType;
  discountValue?: number;
  discountReason?: string;
  branchId?: string;
  notes?: string;
}

export interface CreateExpenseInput {
  date: string;
  category: ExpenseCategory;
  paymentMethod?: PaymentMethod;
  amount?: number;
  items?: TransactionItemDto[];
  employeeId?: string;
  paidAmount?: number;
  createDebtForRemaining?: boolean;
  contactId?: string;
  payableDueDate?: string;
  branchId?: string;
  notes?: string;
}
```

### 4.3 Remove deprecated methods
- [ ] Remove `create()` method
- [ ] Remove `createPurchase()` method
- [ ] Remove `createWithInventory()` method

---

## Phase 5: Frontend - Page Updates

### 5.1 Update CreateIncomePage
**File:** [CreateIncomePage.tsx](frontend/src/pages/transactions/CreateIncomePage.tsx)

- [ ] Import `createIncome` from transactionService
- [ ] Update form submission to call `transactionService.createIncome()`
- [ ] Simplify data transformation (already uses items[] pattern)

### 5.2 Update CreateExpensePage
**File:** [CreateExpensePage.tsx](frontend/src/pages/transactions/CreateExpensePage.tsx)

- [ ] Import `createExpense` from transactionService
- [ ] Update form to use `items[]` array pattern (like income)
- [ ] Update form submission to call `transactionService.createExpense()`
- [ ] For single inventory item: wrap in array `[item]`

---

## Phase 6: Cleanup & Testing

### 6.1 Remove unused files
- [ ] Delete deprecated DTO files from backend
- [ ] Remove unused type imports
- [ ] Clean up helper functions if no longer needed

### 6.2 Testing checklist
- [ ] Test income with single amount
- [ ] Test income with multiple items
- [ ] Test income with discount
- [ ] Test expense with single amount
- [ ] Test expense with single inventory item (as array)
- [ ] Test expense with multiple inventory items
- [ ] Test expense with partial payment
- [ ] Test expense with employee salary
- [ ] Test branch access restrictions

---

## Files to Modify

### Backend (Delete):
- `backend/src/transactions/dto/create-transaction.dto.ts`
- `backend/src/transactions/dto/create-purchase-expense.dto.ts`
- `backend/src/transactions/dto/create-transaction-with-inventory.dto.ts`
- `backend/src/transactions/dto/inventory-item-operation.dto.ts`

### Backend (Modify):
- `backend/src/transactions/dto/create-expense.dto.ts` - Add items[]
- `backend/src/transactions/transactions.service.ts` - Refactor to _createTransactionCore
- `backend/src/transactions/transactions.controller.ts` - Remove deprecated endpoints

### Frontend (Modify):
- `frontend/src/api/services/transactionService.ts` - Add new methods, remove old
- `frontend/src/types/entity.ts` - Add new input types
- `frontend/src/pages/transactions/CreateIncomePage.tsx` - Use createIncome
- `frontend/src/pages/transactions/CreateExpensePage.tsx` - Use createExpense with items[]
