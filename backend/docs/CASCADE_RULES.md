# Prisma Schema Cascade Rules Documentation

This document outlines all `onDelete` cascade behaviors in the Prisma schema to ensure referential integrity and prevent data loss.

---

## Overview

The schema implements three main `onDelete` strategies:

1. **`Cascade`** - Automatically delete child records when parent is deleted
2. **`Restrict`** - Prevent deletion of parent if child records exist
3. **`SetNull`** - Set foreign key to NULL when parent is deleted

---

## Branch Relations (CASCADE)

When a **Branch** is deleted, all associated records are automatically deleted to maintain data integrity.

| Child Model | Relationship | Behavior | Rationale |
|------------|--------------|----------|-----------|
| `Transaction` | `branch` | CASCADE | Transactions belong to a branch; without the branch, they lose context |
| `Debt` | `branch` | CASCADE | Debts are branch-specific; deleting branch should remove its debts |
| `InventoryItem` | `branch` | CASCADE | Inventory items are stored at specific branches |
| `InventoryConsumption` | `branch` | CASCADE | Consumption records are branch-specific |
| `Notification` | `branch` | CASCADE | Notifications are scoped to branches |

### Example:
```typescript
// Deleting a branch will automatically delete:
// - All transactions for that branch
// - All debts for that branch
// - All inventory items for that branch
// - All inventory consumption records for that branch
// - All notifications for that branch
await prisma.branch.delete({ where: { id: branchId } });
```

---

## User Relations (RESTRICT)

Users who have created records **cannot be deleted** to preserve audit trails and data integrity.

| Child Model | Relationship | Behavior | Rationale |
|------------|--------------|----------|-----------|
| `Transaction` | `creator` | RESTRICT | Preserve creator information for audit trail |
| `Debt` | `creator` | RESTRICT | Maintain accountability for debt creation |
| `DebtPayment` | `recorder` | RESTRICT | Track who recorded each payment |
| `InventoryConsumption` | `recorder` | RESTRICT | Preserve consumption record history |
| `Notification` | `creator` | RESTRICT | Maintain notification creation history |
| `AuditLog` | `user` | RESTRICT | Audit logs must always reference valid users |

### Example:
```typescript
// This will FAIL if the user has created any transactions:
await prisma.user.delete({ where: { id: userId } });
// Error: Foreign key constraint violation

// Solution: Use soft delete (set isActive = false) instead:
await prisma.user.update({ 
  where: { id: userId }, 
  data: { isActive: false } 
});
```

### Why RESTRICT?

1. **Audit Compliance** - Maintains complete audit trail
2. **Data Integrity** - Prevents orphaned records
3. **Historical Accuracy** - Preserves "who did what" information
4. **Accountability** - Ensures actions are traceable

---

## User Deletion Strategy

Since users cannot be hard-deleted if they have created records, use **soft delete** instead:

```typescript
// Mark user as inactive (recommended)
await prisma.user.update({
  where: { id: userId },
  data: {
    isActive: false,
    username: `deleted_${userId}`, // Optional: free up username
  }
});
```

---

## Other Relations

### User ← Branch (SET NULL)

When a branch is deleted, users assigned to that branch have their `branchId` set to `NULL`:

```typescript
User.branch → onDelete: SetNull
```

**Rationale:** Users can exist without being assigned to a branch (e.g., admin users or temporarily unassigned accountants).

---

### User ← RefreshToken (CASCADE)

When a user is deleted, all their refresh tokens are automatically deleted:

```typescript
RefreshToken.user → onDelete: Cascade
```

**Rationale:** Refresh tokens are user-specific and have no purpose without the user.

---

### User ← NotificationSetting (CASCADE)

When a user is deleted, all their notification settings are automatically deleted:

```typescript
NotificationSetting.user → onDelete: Cascade
```

**Rationale:** Notification preferences are user-specific.

---

### InventoryItem ← Transaction (SET NULL)

When an inventory item is deleted, transactions referencing it set `inventoryItemId` to `NULL`:

```typescript
Transaction.inventoryItem → onDelete: SetNull
```

**Rationale:** Transactions should be preserved for accounting purposes even if the inventory item is removed.

---

### Debt ← DebtPayment (CASCADE)

When a debt is deleted, all associated payment records are automatically deleted:

```typescript
DebtPayment.debt → onDelete: Cascade
```

**Rationale:** Payment records have no meaning without the debt they reference.

---

### InventoryItem ← InventoryConsumption (CASCADE)

When an inventory item is deleted, all consumption records are automatically deleted:

```typescript
InventoryConsumption.inventoryItem → onDelete: Cascade
```

**Rationale:** Consumption records are specific to inventory items.

---

## Summary Table

| Parent Model | Child Model | Field | onDelete | Can Delete Parent? |
|--------------|-------------|-------|----------|-------------------|
| Branch | Transaction | `branchId` | CASCADE | Yes (deletes children) |
| Branch | Debt | `branchId` | CASCADE | Yes (deletes children) |
| Branch | InventoryItem | `branchId` | CASCADE | Yes (deletes children) |
| Branch | InventoryConsumption | `branchId` | CASCADE | Yes (deletes children) |
| Branch | Notification | `branchId` | CASCADE | Yes (deletes children) |
| Branch | User | `branchId` | SET NULL | Yes (nulls reference) |
| User | Transaction | `createdBy` | RESTRICT | **No** (if has transactions) |
| User | Debt | `createdBy` | RESTRICT | **No** (if has debts) |
| User | DebtPayment | `recordedBy` | RESTRICT | **No** (if has payments) |
| User | InventoryConsumption | `recordedBy` | RESTRICT | **No** (if has consumptions) |
| User | Notification | `createdBy` | RESTRICT | **No** (if has notifications) |
| User | AuditLog | `userId` | RESTRICT | **No** (if has audit logs) |
| User | RefreshToken | `userId` | CASCADE | Yes (deletes tokens) |
| User | NotificationSetting | `userId` | CASCADE | Yes (deletes settings) |
| InventoryItem | Transaction | `inventoryItemId` | SET NULL | Yes (nulls reference) |
| Debt | DebtPayment | `debtId` | CASCADE | Yes (deletes payments) |
| InventoryItem | InventoryConsumption | `inventoryItemId` | CASCADE | Yes (deletes consumptions) |

---

## Best Practices

### 1. Before Deleting a Branch
```typescript
// Option 1: Hard delete (cascades to all related records)
await prisma.branch.delete({ where: { id: branchId } });

// Option 2: Soft delete (preserves all data)
await prisma.branch.update({ 
  where: { id: branchId }, 
  data: { isActive: false } 
});
```

### 2. Before Deleting a User
```typescript
// Check if user can be deleted
const canDelete = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    _count: {
      select: {
        createdTransactions: true,
        createdDebts: true,
        recordedPayments: true,
        recordedConsumptions: true,
        createdNotifications: true,
        auditLogs: true,
      },
    },
  },
});

const totalRecords = 
  canDelete._count.createdTransactions +
  canDelete._count.createdDebts +
  canDelete._count.recordedPayments +
  canDelete._count.recordedConsumptions +
  canDelete._count.createdNotifications +
  canDelete._count.auditLogs;

if (totalRecords > 0) {
  // Use soft delete
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });
} else {
  // Can hard delete
  await prisma.user.delete({ where: { id: userId } });
}
```

### 3. Handling Soft-Deleted Records
```typescript
// Transactions, Debts, and InventoryItems support soft delete
// Always filter by deletedAt: null

const activeTransactions = await prisma.transaction.findMany({
  where: {
    deletedAt: null,
    // ... other filters
  },
});
```

---

## Migration History

1. **Initial Schema** - Established CASCADE rules for Branch relations
2. **Soft Delete** (20251118132550) - Added `deletedAt` field to Transaction, Debt, InventoryItem
3. **Cascade Fix** (20251118133215) - Added `onDelete: Restrict` to InventoryConsumption.recorder

---

## Testing Cascade Behavior

```typescript
// Test Branch CASCADE
const branch = await prisma.branch.create({ data: {...} });
const transaction = await prisma.transaction.create({ 
  data: { branchId: branch.id, ... } 
});
await prisma.branch.delete({ where: { id: branch.id } });
// Transaction should be automatically deleted

// Test User RESTRICT
const user = await prisma.user.create({ data: {...} });
const transaction = await prisma.transaction.create({ 
  data: { createdBy: user.id, ... } 
});
await prisma.user.delete({ where: { id: user.id } });
// Should throw: Foreign key constraint violation
```

---

## Troubleshooting

**Error: Foreign key constraint violation**
```
The change you are trying to make would violate the required relation 'TransactionToUser' between the `Transaction` and `User` models.
```

**Solution:** The user has created records. Use soft delete instead:
```typescript
await prisma.user.update({ 
  where: { id: userId }, 
  data: { isActive: false } 
});
```

---

**Built with data integrity in mind for Turath Al-Mandi Restaurant** 🔒
