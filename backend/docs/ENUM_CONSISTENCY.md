# Enum Consistency Documentation

## Overview

This document describes the enum strategy used across the Turath Al-Mandi system, ensuring consistency between database schema (Prisma), backend DTOs (NestJS), and frontend types (React/TypeScript).

## Enum Source of Truth

**PostgreSQL Database Schema (`prisma/schema.prisma`)** is the single source of truth for all business domain enums.

## Enum Definitions

### 1. UserRole

**Location:** `prisma/schema.prisma` (line 17-22)

```prisma
enum UserRole {
  ADMIN
  ACCOUNTANT

  @@map("user_role")
}
```

**Values:**
- `ADMIN` - Administrator with full system access
- `ACCOUNTANT` - Accountant with branch-specific access

**Usage:**
- Backend: `import { UserRole } from '@prisma/client'`
- Frontend: `import { UserRole } from '@/types/enum'`

**Models Using This Enum:**
- `User.role`

---

### 2. TransactionType

**Location:** `prisma/schema.prisma` (line 24-29)

```prisma
enum TransactionType {
  INCOME
  EXPENSE

  @@map("transaction_type")
}
```

**Values:**
- `INCOME` - Money received (sales, revenue)
- `EXPENSE` - Money spent (purchases, salaries, utilities)

**Usage:**
- Backend: `import { TransactionType } from '@prisma/client'`
- Frontend: `import { TransactionType } from '@/types/enum'`

**Models Using This Enum:**
- `Transaction.type`

---

### 3. PaymentMethod

**Location:** `prisma/schema.prisma` (line 31-36)

```prisma
enum PaymentMethod {
  CASH
  MASTER

  @@map("payment_method")
}
```

**Values:**
- `CASH` - Cash payment
- `MASTER` - MasterCard payment

**Usage:**
- Backend: `import { PaymentMethod } from '@prisma/client'`
- Frontend: `import { PaymentMethod } from '@/types/enum'`

**Models Using This Enum:**
- `Transaction.paymentMethod` (nullable, only for INCOME transactions)

---

### 4. Currency

**Location:** `prisma/schema.prisma` (line 38-43)

```prisma
enum Currency {
  USD
  IQD

  @@map("currency")
}
```

**Values:**
- `USD` - US Dollar (default)
- `IQD` - Iraqi Dinar

**Usage:**
- Backend: `import { Currency } from '@prisma/client'`
- Frontend: `import { Currency } from '@/types/enum'`

**Models Using This Enum:**
- `Transaction.currency` (default: USD)
- `Debt.currency` (default: USD)
- `DebtPayment.currency` (default: USD)

**Note:** The system supports USD and IQD currencies. USD is enforced as the default via the `@IsAllowedCurrency()` decorator (configurable).

---

### 5. DebtStatus

**Location:** `prisma/schema.prisma` (line 48-54)

```prisma
enum DebtStatus {
  ACTIVE
  PAID
  PARTIAL

  @@map("debt_status")
}
```

**Values:**
- `ACTIVE` - Debt is active, no payments made
- `PAID` - Debt is fully paid
- `PARTIAL` - Debt has been partially paid

**Usage:**
- Backend: `import { DebtStatus } from '@prisma/client'`
- Frontend: `import { DebtStatus } from '@/types/enum'`

**Models Using This Enum:**
- `Debt.status` (default: ACTIVE)

**Business Logic:**
- Status automatically updates when payments are recorded
- `remainingAmount === 0` → Status becomes `PAID`
- `remainingAmount < originalAmount` → Status becomes `PARTIAL`
- `remainingAmount === originalAmount` → Status remains `ACTIVE`

---

### 6. InventoryUnit

**Location:** `prisma/schema.prisma` (line 56-63)

```prisma
enum InventoryUnit {
  KG
  PIECE
  LITER
  OTHER

  @@map("inventory_unit")
}
```

**Values:**
- `KG` - Kilograms (weight)
- `PIECE` - Individual pieces/items
- `LITER` - Liters (volume)
- `OTHER` - Other units not categorized above

**Usage:**
- Backend: `import { InventoryUnit } from '@prisma/client'`
- Frontend: `import { InventoryUnit } from '@/types/enum'`

**Models Using This Enum:**
- `InventoryItem.unit`
- `InventoryConsumption.unit`

---

### 7. NotificationSeverity

**Location:** `prisma/schema.prisma` (line 65-72)

```prisma
enum NotificationSeverity {
  INFO
  WARNING
  ERROR
  CRITICAL

  @@map("notification_severity")
}
```

**Values:**
- `INFO` - Informational notification (default)
- `WARNING` - Warning that requires attention
- `ERROR` - Error that occurred
- `CRITICAL` - Critical issue requiring immediate action

**Usage:**
- Backend: `import { NotificationSeverity } from '@prisma/client'`
- Frontend: `import { NotificationSeverity } from '@/types/enum'`

**Models Using This Enum:**
- `Notification.severity` (default: INFO)

---

### 8. DisplayMethod

**Location:** `prisma/schema.prisma` (line 74-81)

```prisma
enum DisplayMethod {
  POPUP
  TOAST
  EMAIL
  SMS

  @@map("display_method")
}
```

**Values:**
- `POPUP` - Display as modal/popup (default)
- `TOAST` - Display as toast/snackbar notification
- `EMAIL` - Send via email
- `SMS` - Send via SMS

**Usage:**
- Backend: `import { DisplayMethod } from '@prisma/client'`
- Frontend: `import { DisplayMethod } from '@/types/enum'`

**Models Using This Enum:**
- `NotificationSetting.displayMethod` (default: POPUP)

---

## Consistency Audit Results

### ✅ Backend (NestJS)

**All DTOs correctly import enums from Prisma:**

| DTO File | Imported Enums | Status |
|----------|----------------|--------|
| `src/auth/dto/register.dto.ts` | `UserRole` | ✅ Fixed (was duplicated) |
| `src/users/dto/create-user.dto.ts` | `UserRole` | ✅ Correct |
| `src/users/dto/update-user.dto.ts` | `UserRole` | ✅ Correct |
| `src/transactions/dto/create-transaction.dto.ts` | `TransactionType, PaymentMethod, Currency` | ✅ Correct |
| `src/transactions/dto/update-transaction.dto.ts` | `TransactionType, PaymentMethod` | ✅ Correct |
| `src/transactions/dto/create-purchase-expense.dto.ts` | `InventoryUnit, Currency` | ✅ Correct |
| `src/debts/dto/create-debt.dto.ts` | `Currency` | ✅ Correct |
| `src/debts/dto/pay-debt.dto.ts` | `Currency` | ✅ Correct |
| `src/inventory/dto/create-inventory.dto.ts` | `InventoryUnit` | ✅ Correct |
| `src/inventory/dto/update-inventory.dto.ts` | `InventoryUnit` | ✅ Correct |
| `src/inventory/dto/record-consumption.dto.ts` | `InventoryUnit` | ✅ Correct |
| `src/notifications/dto/update-notification-settings.dto.ts` | `DisplayMethod` | ✅ Correct |

**Total:** 12 DTOs using Prisma enums ✅

---

### ✅ Frontend (React/TypeScript)

**All enums defined in `frontend/src/types/enum.ts`:**

| Enum | Values | Status |
|------|--------|--------|
| `UserRole` | ADMIN, ACCOUNTANT | ✅ Matches Prisma |
| `TransactionType` | INCOME, EXPENSE | ✅ Matches Prisma |
| `PaymentMethod` | CASH, MASTER | ✅ Matches Prisma |
| `DebtStatus` | ACTIVE, PAID, PARTIAL | ✅ Matches Prisma |
| `InventoryUnit` | KG, PIECE, LITER, OTHER | ✅ Matches Prisma |
| `Currency` | USD, IQD | ✅ Matches Prisma |
| `NotificationSeverity` | INFO, WARNING, ERROR, CRITICAL | ✅ Added (was missing) |
| `DisplayMethod` | POPUP, TOAST, EMAIL, SMS | ✅ Added (was missing) |

**Total:** 8 enums matching Prisma schema 100% ✅

**Additional frontend-only enums:**
- `BasicStatus` - UI-specific (ENABLE, DISABLE) - not in schema
- `ResultStatus` - API response status (SUCCESS, ERROR, TIMEOUT) - not in schema

These are frontend-specific and don't need to match the database schema.

---

## Best Practices

### ✅ DO

1. **Always import from Prisma in backend**
   ```typescript
   import { UserRole, TransactionType } from '@prisma/client';
   ```

2. **Keep frontend enums in sync with Prisma**
   - Update `frontend/src/types/enum.ts` when schema enums change
   - Use the same values and naming

3. **Use @IsEnum() validation in DTOs**
   ```typescript
   @IsEnum(UserRole, { message: 'Invalid user role' })
   role: UserRole;
   ```

4. **Document enum values and their meaning**
   - Add comments explaining each enum value
   - Explain business rules (e.g., DebtStatus transitions)

5. **Use TypeScript enums (not string unions)**
   ```typescript
   // ✅ Good
   export enum UserRole {
     ADMIN = 'ADMIN',
     ACCOUNTANT = 'ACCOUNTANT',
   }

   // ❌ Bad
   export type UserRole = 'ADMIN' | 'ACCOUNTANT';
   ```

### ❌ DON'T

1. **Don't duplicate enum definitions**
   ```typescript
   // ❌ Bad - duplicates Prisma enum
   export enum UserRole {
     ADMIN = 'ADMIN',
     ACCOUNTANT = 'ACCOUNTANT',
   }

   // ✅ Good - import from Prisma
   import { UserRole } from '@prisma/client';
   ```

2. **Don't use magic strings**
   ```typescript
   // ❌ Bad
   if (user.role === 'ADMIN') { ... }

   // ✅ Good
   if (user.role === UserRole.ADMIN) { ... }
   ```

3. **Don't modify enum values directly in DTOs**
   - Update schema.prisma first
   - Run migration
   - Update frontend enums
   - DTOs will automatically get the new values from Prisma

4. **Don't skip validation**
   ```typescript
   // ❌ Bad - no validation
   @IsString()
   type: string;

   // ✅ Good - enum validation
   @IsEnum(TransactionType)
   type: TransactionType;
   ```

---

## Enum Modification Workflow

When adding or modifying enums:

1. **Update Prisma Schema**
   ```prisma
   enum UserRole {
     ADMIN
     ACCOUNTANT
     MANAGER  // New value
   }
   ```

2. **Create Migration**
   ```bash
   npx prisma migrate dev --name add_manager_role
   ```

3. **Update Frontend Enums**
   ```typescript
   // frontend/src/types/enum.ts
   export enum UserRole {
     ADMIN = 'ADMIN',
     ACCOUNTANT = 'ACCOUNTANT',
     MANAGER = 'MANAGER',  // Add new value
   }
   ```

4. **Update Validation Messages (if needed)**
   ```typescript
   @IsEnum(UserRole, { message: 'الدور يجب أن يكون: ADMIN أو ACCOUNTANT أو MANAGER' })
   ```

5. **Test Both Backend and Frontend**
   - Backend: `npm test`
   - Frontend: `npm run type-check`

6. **Commit Changes**
   ```bash
   git add prisma/schema.prisma prisma/migrations/... frontend/src/types/enum.ts
   git commit -m "feat: Add MANAGER role to UserRole enum"
   ```

---

## Migration Strategy

### For New Enum Values (Backward Compatible)

✅ **Safe - No breaking changes**

```prisma
enum DebtStatus {
  ACTIVE
  PAID
  PARTIAL
  OVERDUE  // New value
}
```

**Steps:**
1. Add new value to schema
2. Create migration
3. Update frontend enum
4. Deploy (no downtime required)

---

### For Removing Enum Values (Breaking Change)

⚠️ **Requires careful migration**

```prisma
enum PaymentMethod {
  CASH
  MASTER
  // VISA - Removing this value
}
```

**Steps:**
1. Check for existing usage:
   ```sql
   SELECT COUNT(*) FROM transactions WHERE payment_method = 'VISA';
   ```
2. If records exist, migrate data first:
   ```sql
   UPDATE transactions SET payment_method = 'MASTER' WHERE payment_method = 'VISA';
   ```
3. Then update schema and create migration
4. Update frontend enum
5. Deploy with downtime window (if needed)

---

### For Renaming Enum Values (Breaking Change)

⚠️ **Requires data migration**

**Don't do this!** Instead:
1. Add new value
2. Migrate data
3. Remove old value

---

## Testing Enum Consistency

### Automated Tests

```typescript
// backend/test/enum-consistency.spec.ts
import { UserRole as PrismaUserRole } from '@prisma/client';
import { UserRole as FrontendUserRole } from '../frontend/src/types/enum';

describe('Enum Consistency', () => {
  it('UserRole enums should match', () => {
    expect(Object.values(PrismaUserRole)).toEqual(Object.values(FrontendUserRole));
  });
});
```

### Manual Verification Checklist

- [ ] All Prisma enums have corresponding frontend enums
- [ ] All frontend enums match Prisma values exactly
- [ ] All backend DTOs import from `@prisma/client`
- [ ] No duplicate enum definitions in backend
- [ ] Enum validation messages are up to date
- [ ] Database migrations are created for enum changes

---

## Troubleshooting

### Issue: "Type 'string' is not assignable to type 'UserRole'"

**Cause:** Trying to assign a string to an enum type

**Solution:**
```typescript
// ❌ Bad
const role: UserRole = 'ADMIN';

// ✅ Good
const role: UserRole = UserRole.ADMIN;
```

---

### Issue: "Enum value not found in schema"

**Cause:** Frontend enum has value not in Prisma schema

**Solution:**
1. Check `prisma/schema.prisma`
2. Update frontend enum to match
3. Or add value to Prisma schema and migrate

---

### Issue: "Cannot find name 'UserRole'"

**Cause:** Missing import statement

**Solution:**
```typescript
// Backend
import { UserRole } from '@prisma/client';

// Frontend
import { UserRole } from '@/types/enum';
```

---

## Conclusion

**Enum consistency is maintained through:**

1. ✅ **Single source of truth:** PostgreSQL schema (via Prisma)
2. ✅ **Backend imports:** All DTOs import from `@prisma/client`
3. ✅ **Frontend mirror:** `frontend/src/types/enum.ts` mirrors schema enums
4. ✅ **100% coverage:** All 8 schema enums defined in backend and frontend
5. ✅ **No duplicates:** All duplicate enum definitions removed

**Benefits:**
- Type safety across full stack
- Compile-time error detection
- Automatic synchronization via Prisma
- Clear modification workflow
- No magic strings in codebase

---

**Last Updated:** 2025-11-18
**Prisma Version:** 6.19.0
**Total Enums:** 8 (all synchronized)
