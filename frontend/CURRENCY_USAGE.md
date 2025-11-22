# Currency System Usage Guide

## Overview

The currency system is designed for **frontend-only display**. The database stores only numeric amounts, and the frontend fetches the default currency to display symbols next to amounts.

## Architecture

```
┌─────────────────┐
│   Database      │  Stores: 1000 (just the number)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ CurrencySettings│  Admin manages: USD, IQD, EUR, SYP, etc.
│ Table           │  Sets ONE as default
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Frontend      │  Fetches default currency
│   Cache         │  Displays: "1000 د.ع" or "1000 $"
│   (1 hour TTL)  │
└─────────────────┘
```

## Quick Start

### 1. Using the CurrencyAmount Component (Recommended)

```tsx
import { CurrencyAmount } from '@/components/currency';

function TransactionRow({ transaction }) {
  return (
    <tr>
      <td>{transaction.date}</td>
      <td>
        {/* Simple usage */}
        <CurrencyAmount amount={transaction.amount} />
      </td>
    </tr>
  );
}
```

### 2. Using the Currency Store Directly

```tsx
import { useCurrencyStore } from '@/stores/currencyStore';
import { formatCurrency } from '@/utils/currency.utils';

function CustomDisplay() {
  const { currency, fetchCurrency } = useCurrencyStore();

  // Fetch on mount
  useEffect(() => {
    fetchCurrency();
  }, []);

  return (
    <div>
      {currency && formatCurrency(1000, currency)}
    </div>
  );
}
```

## Component Variants

### CurrencyAmount (Default)
```tsx
<CurrencyAmount amount={1000} />
// → "1,000 د.ع"
```

### CurrencyAmountCompact (For Tables)
```tsx
<CurrencyAmountCompact amount={1500.5} decimals={2} />
// → "1,500.50 د.ع" (tabular-nums font)
```

### CurrencyAmountLarge (For Highlights)
```tsx
<CurrencyAmountLarge amount={999} />
// → Large, bold text
```

### CurrencyAmountColored (Positive/Negative)
```tsx
<CurrencyAmountColored amount={100} />  // Green
<CurrencyAmountColored amount={-50} />  // Red
```

## Utility Functions

### formatCurrency
```typescript
import { formatCurrency } from '@/utils/currency.utils';

// Basic formatting
formatCurrency(1000, currency);
// → "1,000 د.ع"

// With decimals
formatCurrency(1500.5, currency, { decimals: 2 });
// → "1,500.50 د.ع"

// Symbol before amount
formatCurrency(999, currency, { position: 'before' });
// → "$ 999"
```

### formatCurrencyAuto
```typescript
import { formatCurrencyAuto } from '@/utils/currency.utils';

// Auto-detects symbol position based on currency code
formatCurrencyAuto(1000, { code: 'USD', symbol: '$' });
// → "$ 1,000"

formatCurrencyAuto(1000, { code: 'IQD', symbol: 'د.ع' });
// → "1,000 د.ع"
```

## Cache Management

### Auto-Refresh
Currency is cached for **1 hour**. After expiration, it auto-refreshes on next render.

### Manual Refresh
When admin changes currency, refresh manually:

```typescript
import { useCurrencyStore } from '@/stores/currencyStore';

function AdminCurrencySettings() {
  const { refreshCurrency } = useCurrencyStore();

  const handleSetDefault = async (code: string) => {
    await settingsService.setDefaultCurrency({ code });

    // Force refresh cached currency
    await refreshCurrency();

    toast.success('تم تغيير العملة الافتراضية');
  };
}
```

### Clear Cache
On logout or app reset:

```typescript
import { useCurrencyStore } from '@/stores/currencyStore';

function logout() {
  const { clearCurrency } = useCurrencyStore();
  clearCurrency();
}
```

## App Initialization

### Load Currency on App Start

```tsx
// App.tsx or main layout
import { useCurrencyStore } from '@/stores/currencyStore';

function App() {
  const { fetchCurrency } = useCurrencyStore();

  useEffect(() => {
    // Fetch currency on app load
    fetchCurrency().catch(console.error);
  }, []);

  return <RouterProvider />;
}
```

## Examples

### Transaction List
```tsx
import { CurrencyAmountCompact } from '@/components/currency';

function TransactionList({ transactions }) {
  return (
    <table>
      <tbody>
        {transactions.map(t => (
          <tr key={t.id}>
            <td>{t.date}</td>
            <td>{t.category}</td>
            <td>
              <CurrencyAmountCompact amount={t.amount} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### Dashboard Summary
```tsx
import { CurrencyAmountLarge } from '@/components/currency';

function DashboardCard({ title, amount }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <CurrencyAmountLarge amount={amount} decimals={2} />
    </div>
  );
}
```

### Income/Expense Display
```tsx
import { CurrencyAmountColored } from '@/components/currency';

function IncomeExpenseRow({ type, amount }) {
  const signedAmount = type === 'EXPENSE' ? -amount : amount;

  return (
    <div>
      <span>{type}</span>
      <CurrencyAmountColored amount={signedAmount} />
    </div>
  );
}
```

## Admin Currency Management

### Set Default Currency
```tsx
import settingsService from '@/api/services/settingsService';
import { useCurrencyStore } from '@/stores/currencyStore';

async function setDefaultCurrency(code: string) {
  // Update on backend
  await settingsService.setDefaultCurrency({ code });

  // Refresh frontend cache
  const { refreshCurrency } = useCurrencyStore.getState();
  await refreshCurrency();
}
```

### Add New Currency
```tsx
async function addCurrency(data) {
  await settingsService.createCurrency({
    code: 'EUR',
    nameAr: 'يورو',
    nameEn: 'Euro',
    symbol: '€',
  });
}
```

## How It Works

1. **Database**: Stores only numeric amounts (e.g., `1000`)
2. **Admin**: Manages currencies in CurrencySettings table
3. **Admin**: Sets ONE currency as default (e.g., IQD)
4. **Frontend**: Fetches default currency on app load
5. **Frontend**: Caches currency in localStorage (1 hour TTL)
6. **Frontend**: Displays amounts with currency symbol
7. **Result**: User sees "1000 د.ع" or "1000 $"

## Benefits

✅ **Simple Backend**: No currency logic in transaction tables
✅ **Dynamic Currencies**: Admin can add any currency without code changes
✅ **Fast Performance**: Currency cached for 1 hour
✅ **Consistent Display**: All amounts use same currency
✅ **Easy Switching**: Admin changes currency, all amounts update

## Notes

- Currency is **display-only**, never stored in transaction records
- Database amounts are **currency-agnostic**
- One default currency applies to **entire system**
- Cache TTL is **1 hour** (configurable in `currencyStore.ts`)
- Cache is **automatically refreshed** when expired
- Admin currency changes require **manual refresh** call
