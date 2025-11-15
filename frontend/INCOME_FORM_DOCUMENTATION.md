# Income Form Implementation Documentation

## Overview

This document describes the complete implementation of the "Add Income" form for the React restaurant accounting system. The implementation follows all existing patterns in the codebase and includes full RTL/Arabic support.

## Files Created

### 1. Type Definitions
**File:** `src/types/transactions.types.ts`

Defines all TypeScript interfaces and enums for transactions:
- `TransactionType` enum (INCOME | EXPENSE)
- `PaymentMethod` enum (CASH | MASTER)
- `Transaction` interface (complete transaction object)
- `CreateTransactionInput` interface (API request format)
- `CreateIncomeInput` interface (income-specific input)
- `IncomeFormData` interface (form state)
- `TransactionFilters` interface (query filters)

### 2. API Service Layer
**File:** `src/services/transactions.service.ts`

Provides all transaction-related API calls:
- `getAll(filters?)` - Fetch all transactions with optional filters
- `getOne(id)` - Fetch single transaction
- `create(data)` - Create new transaction (auto-fills branchId)
- `update(id, data)` - Update existing transaction
- `delete(id)` - Delete transaction

All methods use typed requests/responses and the configured axios instance.

### 3. TanStack Query Hooks
**File:** `src/hooks/useTransactions.ts`

Custom React hooks for data fetching and mutations:

**Query Hooks:**
- `useTransactions(filters?)` - Fetch transactions with optional filters
- `useTransaction(id)` - Fetch single transaction

**Mutation Hooks:**
- `useCreateTransaction()` - Create transaction with optimistic updates
- `useUpdateTransaction()` - Update transaction with optimistic updates
- `useDeleteTransaction()` - Delete transaction with optimistic updates

**Features:**
- Optimistic UI updates
- Automatic rollback on error
- Cache invalidation on success
- Arabic toast notifications
- Query key management

### 4. Income Form Component
**File:** `src/components/IncomeForm.tsx`

Complete form component with all required features:

**Fields:**
- ✅ Date picker (default: today)
- ✅ Amount input (number, required, > 0)
- ✅ Payment method radio: نقدي / ماستر كارد
- ✅ Category input (text, optional)
- ✅ Notes textarea (optional)
- ✅ Branch auto-filled from user (read-only)

**Features:**
- ✅ Real-time validation (React Hook Form + Zod)
- ✅ Arabic labels and placeholders
- ✅ Submit button with loading state
- ✅ Success message after submit
- ✅ Clear form on success
- ✅ Error handling with Arabic messages
- ✅ RTL-compatible layout
- ✅ TailwindCSS styling
- ✅ Disabled state during submission
- ✅ Optimistic UI updates

**Validation Schema:**
```typescript
const incomeSchema = z.object({
  date: z.date({ required_error: 'التاريخ مطلوب' }),
  amount: z.string()
    .min(1, { message: 'المبلغ مطلوب' })
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      { message: 'المبلغ يجب أن يكون رقم أكبر من صفر' }
    ),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    required_error: 'طريقة الدفع مطلوبة'
  }),
  category: z.string().optional(),
  notes: z.string().optional(),
});
```

### 5. Example Usage Page
**File:** `src/pages/transactions/IncomePage.tsx`

Demonstrates complete usage of the IncomeForm:
- Income transactions list with filters
- Add income button with modal
- Loading, error, and empty states
- Transaction table with RTL support
- Summary card showing total income
- Arabic date formatting with date-fns

## API Integration

### Backend Endpoint
```
POST /api/v1/transactions
```

### Request Format
```typescript
{
  type: "INCOME",
  amount: 50000,
  paymentMethod: "CASH",
  category: "مبيعات",
  date: "2024-01-15",
  notes: "بيع منتجات..."
}
```

### Response Format
```typescript
{
  id: "uuid",
  branchId: "uuid",
  type: "INCOME",
  amount: 50000,
  currency: "IQD",
  paymentMethod: "CASH",
  category: "مبيعات",
  date: "2024-01-15",
  notes: "بيع منتجات...",
  createdBy: "user-uuid",
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:30:00Z",
  branch: { id: "...", name: "...", location: "..." },
  creator: { id: "...", username: "...", role: "..." }
}
```

### Auto-filled Fields
- `branchId` - Automatically filled from authenticated user's branch
- `currency` - Defaults to "IQD" on backend
- `createdBy` - Automatically filled from authenticated user ID

## Usage Examples

### Basic Usage (Standalone)
```tsx
import { IncomeForm } from '../components/IncomeForm';

function MyPage() {
  return (
    <div>
      <h1>إضافة إيراد</h1>
      <IncomeForm />
    </div>
  );
}
```

### Usage with Modal
```tsx
import { useState } from 'react';
import { IncomeForm } from '../components/IncomeForm';
import { Modal } from '../components/Modal';

function MyPage() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        إضافة إيراد
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="إضافة إيراد جديد"
        size="lg"
      >
        <IncomeForm
          onSuccess={() => setIsOpen(false)}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
}
```

### Usage with Callbacks
```tsx
function MyPage() {
  const handleSuccess = () => {
    console.log('Income added successfully!');
    // Navigate, close modal, show notification, etc.
  };

  const handleCancel = () => {
    console.log('User cancelled');
  };

  return (
    <IncomeForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
```

## Form Validation

### Required Fields
1. **Date** (التاريخ)
   - Must be a valid date
   - Defaults to today
   - Error: "التاريخ مطلوب" or "التاريخ غير صحيح"

2. **Amount** (المبلغ)
   - Must be a number > 0
   - Shows with IQD currency indicator
   - LTR direction for numeric input
   - Error: "المبلغ مطلوب" or "المبلغ يجب أن يكون رقم أكبر من صفر"

3. **Payment Method** (طريقة الدفع)
   - Required radio selection
   - Options: نقدي (CASH) or ماستر كارد (MASTER)
   - Error: "طريقة الدفع مطلوبة"

### Optional Fields
1. **Category** (الفئة)
   - Text input for categorizing income
   - Examples: مبيعات، خدمات، إيجار

2. **Notes** (ملاحظات)
   - Textarea for additional details
   - 4 rows, resizable

### Read-Only Fields
1. **Branch** (الفرع)
   - Auto-filled from user.branch.name
   - Gray background to indicate read-only
   - Helper text: "يتم تعبئة الفرع تلقائيًا من حسابك"

## Styling & RTL Support

### TailwindCSS Classes Used
- Form containers: `space-y-6`
- Labels: `text-sm font-medium text-gray-700 mb-2`
- Inputs: `w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500`
- Error states: `border-red-500`, `text-red-600`
- Disabled states: `disabled:bg-gray-400 disabled:cursor-not-allowed`
- Loading spinner: `animate-spin`
- Success messages: `bg-green-50 border-green-200 text-green-800`

### RTL Considerations
- All text in Arabic
- `dir="rtl"` applied at app level
- Numeric inputs use `dir="ltr"` for proper number display
- Radio buttons aligned right with label on the right
- Buttons aligned right (primary on right, cancel on left)
- Currency indicator positioned on left side
- Spacing uses `mr-` (margin-right) instead of `ml-`

## State Management

### Form State (React Hook Form)
```typescript
{
  date: Date,           // Date object
  amount: string,       // String for input, converted to number on submit
  paymentMethod: PaymentMethod,  // CASH | MASTER
  category: string,     // Optional text
  notes: string,        // Optional text
}
```

### Submission Flow
1. User fills form
2. Client-side validation (Zod)
3. If valid → Convert to API format
4. Optimistic update (add temp transaction to cache)
5. API call to POST /api/transactions
6. On success:
   - Show toast: "تم إضافة الإيراد بنجاح"
   - Reset form to defaults
   - Call `onSuccess()` callback
   - Invalidate queries to refetch data
7. On error:
   - Rollback optimistic update
   - Show error toast with Arabic message
   - Keep form data for user to retry

### Query Invalidation
After successful creation, the following queries are invalidated:
- `['transactions', 'list']` - Refetch all transaction lists
- Any filtered transaction queries

## Error Handling

### Client-Side Errors (Validation)
- Displayed inline below each field
- Red border on invalid fields
- Arabic error messages from Zod schema

### Server-Side Errors
- Caught by mutation `onError` handler
- Displayed via toast notification
- Generic message: "حدث خطأ أثناء إضافة العملية"
- Specific message from API if available: `error.response?.data?.message`

### Network Errors
- Handled by axios interceptor
- Toast notification with generic message
- Form remains intact for user to retry

## Accessibility

### Form Accessibility
- Labels properly associated with inputs via `htmlFor`
- Required fields marked with red asterisk (*)
- Error messages use `aria-invalid` semantics
- Focus states clearly visible
- Disabled states properly indicated
- Loading states announced

### Keyboard Navigation
- Tab order follows logical flow
- Radio buttons navigable with arrow keys
- Submit with Enter key
- Cancel with Escape (via Modal)

## Performance Optimizations

### Optimistic Updates
- Transaction appears in list immediately
- Provides instant feedback
- Automatically rolled back if API fails

### Query Caching
- 5-minute stale time for transaction queries
- Prevents unnecessary refetches
- Background refetch on window focus disabled

### Form Reset
- Efficient reset to default values
- Preserves date picker at "today"
- No unnecessary re-renders

## Testing Checklist

### Manual Testing
- [ ] Form loads with today's date
- [ ] Amount validation works (required, > 0)
- [ ] Payment method selection works
- [ ] Category input accepts text
- [ ] Notes textarea accepts text
- [ ] Branch displays user's branch (read-only)
- [ ] Submit button shows loading state
- [ ] Success toast appears on successful submit
- [ ] Form resets after successful submit
- [ ] Error toast appears on failed submit
- [ ] Form data persists after failed submit
- [ ] Validation messages in Arabic
- [ ] RTL layout correct
- [ ] Works in modal and standalone
- [ ] Optimistic update visible in transaction list
- [ ] Query invalidation refetches data

### Integration Testing
- [ ] POST request sent to correct endpoint
- [ ] Request body matches expected format
- [ ] branchId auto-filled by backend
- [ ] Response data correctly typed
- [ ] Transaction appears in transactions list
- [ ] Filters work correctly

## Dependencies

### Required Packages
All dependencies already installed in project:
- `react-hook-form` (v7.66.0) - Form state management
- `zod` (v4.1.12) - Schema validation
- `@hookform/resolvers` - Zod integration
- `@tanstack/react-query` (v5.90.9) - Data fetching
- `axios` - HTTP client

### Date Formatting
The implementation uses native JavaScript date methods:
- `Date.toISOString().split('T')[0]` - For API format (YYYY-MM-DD)
- `Date.toLocaleDateString('ar-IQ', options)` - For Arabic display

### No Additional Installations Required
All code uses existing dependencies and patterns from your codebase.

## Common Issues & Solutions

### Issue: Date picker not working
**Solution:** Ensure browser supports `type="date"` input. All modern browsers do.

### Issue: Amount shows incorrect decimal places
**Solution:** Use `step="0.01"` attribute (already included).

### Issue: Form doesn't reset after submit
**Solution:** Check that `onSuccess` is called and `reset()` is invoked.

### Issue: Branch not showing
**Solution:** Ensure user object has `branch` property. Check auth state.

### Issue: Validation messages not in Arabic
**Solution:** Verify Zod schema messages (already in Arabic).

### Issue: RTL layout broken
**Solution:** Check that `dir="rtl"` is set on app root element.

## Future Enhancements

### Potential Additions
1. **Date Range Validation**
   - Prevent future dates
   - Configurable date ranges

2. **Category Autocomplete**
   - Suggest categories from previous transactions
   - Predefined category list

3. **Receipt Upload**
   - Add file upload field
   - Image preview

4. **Duplicate Detection**
   - Warn if similar transaction exists
   - Prevent accidental duplicates

5. **Bulk Import**
   - CSV/Excel import
   - Batch transaction creation

6. **Print Support**
   - Print receipt after creation
   - PDF generation

7. **Advanced Filters**
   - Filter by date range
   - Filter by payment method
   - Filter by category

## Support & Maintenance

### Code Locations
- Types: `/frontend/src/types/transactions.types.ts`
- Service: `/frontend/src/services/transactions.service.ts`
- Hooks: `/frontend/src/hooks/useTransactions.ts`
- Component: `/frontend/src/components/IncomeForm.tsx`
- Example: `/frontend/src/pages/transactions/IncomePage.tsx`

### Related Backend Files
- Controller: `/backend/src/transactions/transactions.controller.ts`
- Service: `/backend/src/transactions/transactions.service.ts`
- DTO: `/backend/src/transactions/dto/create-transaction.dto.ts`
- Schema: `/backend/prisma/schema.prisma`

### Contact
For issues or questions, refer to the main project documentation or create an issue in the repository.

---

**Version:** 1.0.0
**Last Updated:** 2024-01-15
**Author:** Claude Code Agent
