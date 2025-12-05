# Theme System Documentation

## Introduction

The Turath Almandi theme system provides a comprehensive, scalable, and accessible design token architecture built on top of Tailwind CSS. It uses a three-tier token system (primitives, semantic, and component variants) to ensure consistency, maintainability, and flexibility across the entire application.

### Key Features

- **Three-tier token architecture**: Primitives → Semantic → Component variants
- **Brand-first color palette**: Gold (primary), Green (secondary), and Terracotta (accent)
- **Full dark mode support**: Automatic color inversion and adjustments
- **WCAG accessibility**: Built-in contrast checking and compliance utilities
- **Type-safe**: Full TypeScript support with type definitions
- **Scalable**: Easy to extend and customize

---

## Token System Overview

### Architecture

```
┌─────────────────────────────────────────────────────┐
│              Component Variants                     │
│  (Badge, StatCard, Alert - ready-to-use classes)   │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│            Semantic Tokens                          │
│  (success, warning, danger, text, background)       │
└────────────────────┬────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────┐
│           Primitive Color Scales                    │
│  (gold, green, terracotta, neutral - 50-950)        │
└─────────────────────────────────────────────────────┘
```

### 1. Primitive Colors

Low-level color scales (50-950) that should **not** be used directly in components.

**Location**: `/frontend/src/theme/tokens/colors/primitives.ts`

```typescript
import { gold, green, terracotta, neutral } from '@/theme/tokens/colors';

// Each color has 11 shades from 50 (lightest) to 950 (darkest)
gold[500]        // #b28b4c - Base gold
green[500]       // #67976b - Base green
terracotta[500]  // #c96d4f - Base terracotta
neutral[500]     // #78716c - Mid gray
```

### 2. Semantic Tokens

Mid-level tokens that map primitives to **meaning** and **intent**.

**Location**: `/frontend/src/theme/tokens/colors/semantic.ts`

```typescript
import { lightSemanticColors, darkSemanticColors } from '@/theme/tokens/colors';

// Status colors
lightSemanticColors.success    // For positive feedback
lightSemanticColors.warning    // For cautions
lightSemanticColors.danger     // For errors
lightSemanticColors.info       // For information

// UI element colors
lightSemanticColors.text       // Typography colors
lightSemanticColors.background // Surface colors
lightSemanticColors.border     // Border colors
lightSemanticColors.action     // Interactive states
```

### 3. Brand Colors

Brand-specific color definitions with light/dark mode support.

**Location**: `/frontend/src/theme/tokens/colors/brand.ts`

```typescript
import { primary, secondary, accent } from '@/theme/tokens/colors';

// Three-color brand palette
primary   // Gold - main brand color
secondary // Green - supporting brand color
accent    // Terracotta - accent/highlight color
```

### 4. Component Variants

High-level, ready-to-use Tailwind class strings for components.

**Location**: `/frontend/src/theme/variants/`

```typescript
import {
  SEMANTIC_BADGE_VARIANTS,
  STAT_CARD_VARIANTS
} from '@/theme/variants';

// Use directly in className
<Badge className={SEMANTIC_BADGE_VARIANTS.success}>Paid</Badge>
```

---

## Using Semantic Tokens

### In Tailwind CSS Classes

Semantic tokens are exposed as Tailwind CSS custom properties:

```tsx
// Text colors
<p className="text-success">Success message</p>
<p className="text-warning-700 dark:text-warning-400">Warning text</p>
<p className="text-destructive">Error message</p>

// Background colors
<div className="bg-success/10">Success background</div>
<div className="bg-warning-500/10">Warning background</div>
<div className="bg-accent/20">Accent background</div>

// Border colors
<div className="border border-success/20">Success border</div>
<div className="border-warning-500/50">Warning border</div>
```

### Common Patterns

#### Status Indicators

```tsx
// Success
className="bg-success/10 text-success border border-success/20"

// Warning
className="bg-warning-500/10 text-warning-700 dark:text-warning-400 border border-warning-500/20"

// Danger
className="bg-destructive/10 text-destructive border border-destructive/20"

// Info
className="bg-accent/10 text-accent border border-accent/20"
```

#### Interactive Elements

```tsx
// Primary button
className="bg-primary text-primary-foreground hover:bg-primary/90"

// Secondary button
className="bg-secondary text-secondary-foreground hover:bg-secondary/80"

// Destructive button
className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
```

---

## Component Variants

Component variants provide pre-built, consistent styling for common UI patterns.

### Badge Variants

**Location**: `/frontend/src/theme/variants/badge-variants.ts`

#### Semantic Badge Variants

```tsx
import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';

// General purpose badges
<Badge className={SEMANTIC_BADGE_VARIANTS.success}>Success</Badge>
<Badge className={SEMANTIC_BADGE_VARIANTS.warning}>Warning</Badge>
<Badge className={SEMANTIC_BADGE_VARIANTS.danger}>Danger</Badge>
<Badge className={SEMANTIC_BADGE_VARIANTS.info}>Info</Badge>
<Badge className={SEMANTIC_BADGE_VARIANTS.primary}>Primary</Badge>
<Badge className={SEMANTIC_BADGE_VARIANTS.default}>Default</Badge>
```

#### Payment Status Badges

```tsx
import { PAYMENT_STATUS_BADGES } from '@/theme/variants';

<Badge className={PAYMENT_STATUS_BADGES.paid}>Paid</Badge>
<Badge className={PAYMENT_STATUS_BADGES.partial}>Partial</Badge>
<Badge className={PAYMENT_STATUS_BADGES.unpaid}>Unpaid</Badge>
<Badge className={PAYMENT_STATUS_BADGES.pending}>Pending</Badge>
<Badge className={PAYMENT_STATUS_BADGES.overdue}>Overdue</Badge>
```

#### Transaction Type Badges

```tsx
import { TRANSACTION_TYPE_BADGES } from '@/theme/variants';

<Badge className={TRANSACTION_TYPE_BADGES.income}>Income</Badge>
<Badge className={TRANSACTION_TYPE_BADGES.expense}>Expense</Badge>
<Badge className={TRANSACTION_TYPE_BADGES.transfer}>Transfer</Badge>
```

#### Other Badge Categories

```tsx
import {
  ENTITY_TYPE_BADGES,
  ACTIVITY_STATUS_BADGES,
  INVENTORY_STATUS_BADGES
} from '@/theme/variants';

// Entity types
<Badge className={ENTITY_TYPE_BADGES.customer}>Customer</Badge>
<Badge className={ENTITY_TYPE_BADGES.supplier}>Supplier</Badge>

// Activity status
<Badge className={ACTIVITY_STATUS_BADGES.active}>Active</Badge>
<Badge className={ACTIVITY_STATUS_BADGES.inactive}>Inactive</Badge>

// Inventory status
<Badge className={INVENTORY_STATUS_BADGES.inStock}>In Stock</Badge>
<Badge className={INVENTORY_STATUS_BADGES.lowStock}>Low Stock</Badge>
```

### Stat Card Variants

**Location**: `/frontend/src/theme/variants/stat-card-variants.ts`

Each variant includes coordinated colors for background, border, icon, and text.

```tsx
import { STAT_CARD_VARIANTS, type StatCardVariant } from '@/theme/variants';

const revenueVariant: StatCardVariant = STAT_CARD_VARIANTS.revenue;

<Card className={revenueVariant.background}>
  <div className={revenueVariant.border}>
    <TrendingUp className={revenueVariant.icon} />
    <p className={revenueVariant.label}>Revenue</p>
    <h3 className={revenueVariant.value}>$45,231</h3>
  </div>
</Card>
```

#### Financial Metrics

```tsx
import { STAT_CARD_VARIANTS } from '@/theme/variants';

STAT_CARD_VARIANTS.revenue   // Green - for income/sales
STAT_CARD_VARIANTS.expenses  // Red - for costs/expenses
STAT_CARD_VARIANTS.profit    // Gold - for net profit
STAT_CARD_VARIANTS.growth    // Secondary green - for growth metrics
```

#### Transaction Stats

```tsx
import { TRANSACTION_STAT_VARIANTS } from '@/theme/variants';

TRANSACTION_STAT_VARIANTS.income    // For income summaries
TRANSACTION_STAT_VARIANTS.expense   // For expense summaries
TRANSACTION_STAT_VARIANTS.balance   // For balance displays
TRANSACTION_STAT_VARIANTS.transfer  // For transfer summaries
```

#### Inventory Stats

```tsx
import { INVENTORY_STAT_VARIANTS } from '@/theme/variants';

INVENTORY_STAT_VARIANTS.totalValue  // Total inventory value
INVENTORY_STAT_VARIANTS.inStock     // In stock items
INVENTORY_STAT_VARIANTS.lowStock    // Low stock warnings
INVENTORY_STAT_VARIANTS.outOfStock  // Out of stock alerts
```

#### Performance Metrics

```tsx
import { PERFORMANCE_STAT_VARIANTS } from '@/theme/variants';

PERFORMANCE_STAT_VARIANTS.achieved    // Target achieved
PERFORMANCE_STAT_VARIANTS.inProgress  // Target in progress
PERFORMANCE_STAT_VARIANTS.atRisk      // Target at risk
PERFORMANCE_STAT_VARIANTS.missed      // Target missed
```

---

## Dark Mode

The theme system automatically handles dark mode through Tailwind's `dark:` variant.

### How It Works

1. **Automatic color inversion**: Semantic tokens automatically switch based on theme
2. **Manual overrides**: Use `dark:` prefix for specific dark mode styles
3. **Preserved intent**: Colors maintain their semantic meaning in both modes

### Examples

```tsx
// Automatically adapts
<p className="text-success">Success text</p>

// Manual dark mode override
<p className="text-warning-700 dark:text-warning-400">Warning text</p>

// Background with dark mode
<div className="bg-card dark:bg-neutral-900">Card content</div>

// Border with dark mode
<div className="border-neutral-300 dark:border-neutral-700">Border</div>
```

### Dark Mode Color Adjustments

- **Text colors**: Inverted (800 → 100, 600 → 300)
- **Backgrounds**: Darker base colors (#0a0a0a, neutral-900)
- **Borders**: Adjusted for visibility (800, 700, 600)
- **Status colors**: Maintained vibrancy with adjusted contrast
- **Overlays**: Inverted opacity (black → white overlays)

---

## Accessibility

### WCAG Compliance

All semantic colors are designed to meet **WCAG AA** standards for contrast.

**Utilities**: `/frontend/src/theme/utils/contrast-checker.ts`

```typescript
import { checkContrast, isCompliant, findBestTextColor } from '@/theme/utils/contrast-checker';

// Check contrast ratio
const result = checkContrast('#b28b4c', '#ffffff');
// Returns: { ratio: 4.8, AA: true, AAA: false, AALarge: true, AAALarge: true }

// Check compliance
const isOk = isCompliant('#b28b4c', '#ffffff', WCAGLevel.AA);
// Returns: true

// Find best text color
const textColor = findBestTextColor('#b28b4c');
// Returns: '#09090B' (dark text for light background)
```

### Accessibility Guidelines

1. **Use semantic tokens**: Automatically ensures proper contrast
2. **Test custom combinations**: Use contrast checker utilities
3. **Provide text alternatives**: Don't rely on color alone
4. **Maintain focus indicators**: Use `focus:ring` utilities
5. **Large text**: 18px+ can use lower contrast ratios

### Color Contrast Requirements

| Level | Normal Text | Large Text |
|-------|-------------|------------|
| AA    | 4.5:1       | 3:1        |
| AAA   | 7:1         | 4.5:1      |

**Large text** = 18pt (24px) or 14pt (18.66px) bold

---

## Examples

### Creating a Custom Badge

```tsx
import { Badge } from '@/components/ui/badge';
import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';

function PaymentBadge({ status }: { status: string }) {
  const variants = {
    paid: SEMANTIC_BADGE_VARIANTS.success,
    pending: SEMANTIC_BADGE_VARIANTS.warning,
    failed: SEMANTIC_BADGE_VARIANTS.danger,
  };

  return (
    <Badge className={variants[status] || SEMANTIC_BADGE_VARIANTS.default}>
      {status}
    </Badge>
  );
}
```

### Creating a Stat Card

```tsx
import { Card, CardContent } from '@/components/ui/card';
import { STAT_CARD_VARIANTS } from '@/theme/variants';
import { TrendingUp } from 'lucide-react';

function RevenueCard({ amount }: { amount: number }) {
  const variant = STAT_CARD_VARIANTS.revenue;

  return (
    <Card className={variant.background}>
      <CardContent className={variant.border}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${variant.icon}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className={variant.label}>Total Revenue</p>
            <h3 className={variant.value}>${amount.toLocaleString()}</h3>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Creating an Alert

```tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

function WarningAlert({ title, message }: { title: string; message: string }) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
```

### Using Transaction Colors

```tsx
import { lightTransactionColors, darkTransactionColors } from '@/theme/tokens/colors';
import { useTheme } from '@/theme/hooks/use-theme';

function TransactionBadge({ type }: { type: 'income' | 'expense' | 'transfer' }) {
  const { mode } = useTheme();
  const colors = mode === 'light' ? lightTransactionColors : darkTransactionColors;

  return (
    <span
      className="px-2 py-1 rounded-md text-xs font-semibold"
      style={{
        backgroundColor: colors[type].lighter,
        color: colors[type].main,
      }}
    >
      {type}
    </span>
  );
}
```

---

## Import Patterns

### Recommended Imports

```typescript
// Component variants (most common)
import {
  SEMANTIC_BADGE_VARIANTS,
  STAT_CARD_VARIANTS,
  PAYMENT_STATUS_BADGES
} from '@/theme/variants';

// Semantic colors (when you need programmatic access)
import {
  lightSemanticColors,
  darkSemanticColors,
  getSemanticColors
} from '@/theme/tokens/colors';

// Brand colors
import {
  primary,
  secondary,
  accent,
  getBrandColors
} from '@/theme/tokens/colors';

// Utilities
import {
  checkContrast,
  isCompliant,
  getContrastColor
} from '@/theme/utils/contrast-checker';

import {
  hexToRgb,
  lighten,
  darken,
  addOpacity
} from '@/theme/utils/color-helpers';
```

### Import by Use Case

**For UI components:**
```typescript
import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';
```

**For dynamic styling:**
```typescript
import { getSemanticColors } from '@/theme/tokens/colors';
```

**For color manipulation:**
```typescript
import { lighten, darken, addOpacity } from '@/theme/utils/color-helpers';
```

**For accessibility checking:**
```typescript
import { checkContrast, isCompliant } from '@/theme/utils/contrast-checker';
```

---

## Adding New Colors

### 1. Add Primitive Scale

```typescript
// In /theme/tokens/colors/primitives.ts
export const purple = {
  50: '#faf5ff',
  100: '#f3e8ff',
  // ... 200-900
  950: '#3b0764',
} as const;
```

### 2. Map to Semantic Token

```typescript
// In /theme/tokens/colors/semantic.ts
export const lightSemanticColors = {
  // ... existing tokens
  premium: {
    lighter: purple[100],
    light: purple[300],
    main: purple[500],
    dark: purple[700],
    darker: purple[900],
    contrast: common.white,
  },
};
```

### 3. Export from Index

```typescript
// In /theme/tokens/colors/index.ts
export { purple } from './primitives';
```

### 4. Create Component Variant (Optional)

```typescript
// In /theme/variants/badge-variants.ts
export const SEMANTIC_BADGE_VARIANTS = {
  // ... existing variants
  premium: 'bg-purple-500/10 text-purple-700 border border-purple-500/20 hover:bg-purple-500/20',
};
```

---

## Adding New Variants

### Badge Variant

```typescript
// In /theme/variants/badge-variants.ts
export const MY_CUSTOM_BADGES = {
  special: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',
  vip: 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20',
} as const;

export type MyCustomBadge = keyof typeof MY_CUSTOM_BADGES;

export function getMyCustomBadge(type: MyCustomBadge): string {
  return MY_CUSTOM_BADGES[type];
}
```

### Stat Card Variant

```typescript
// In /theme/variants/stat-card-variants.ts
export const MY_STAT_VARIANTS = {
  custom: {
    background: 'bg-primary/5 hover:bg-primary/10 transition-colors',
    border: 'border border-primary/20',
    icon: 'text-primary',
    text: 'text-primary',
    label: 'text-primary/80',
    value: 'text-primary font-semibold',
  },
} as const;
```

---

## Future Enhancements

### Planned Features

- [ ] Animation tokens (durations, easing functions)
- [ ] Spacing scale refinement
- [ ] Typography scale improvements
- [ ] Component-specific shadows
- [ ] Motion preferences (reduced motion support)
- [ ] High contrast mode
- [ ] Color blindness simulation tools

### Contribution Guidelines

When adding to the theme system:

1. **Follow the hierarchy**: Primitive → Semantic → Component
2. **Maintain accessibility**: Check WCAG compliance
3. **Support dark mode**: Test both light and dark variants
4. **Document thoroughly**: Add JSDoc comments and examples
5. **Type everything**: Include TypeScript types
6. **Test widely**: Verify across components

---

## Troubleshooting

### Colors not applying

1. Check import path: `@/theme/...`
2. Verify Tailwind CSS is configured
3. Ensure dark mode is properly set up
4. Check for class name typos

### Dark mode not working

1. Verify theme provider is wrapping your app
2. Check `dark:` prefix usage
3. Ensure `darkSemanticColors` is being used
4. Test theme toggle functionality

### Contrast issues

1. Use contrast checker utilities
2. Test with browser DevTools
3. Run accessibility audits
4. Verify WCAG compliance levels

### Type errors

1. Import types from appropriate files
2. Check for missing type exports
3. Verify TypeScript configuration
4. Update IDE/editor types

---

## Resources

- **Color Palette**: See [color-palette.md](./color-palette.md)
- **Tailwind CSS**: [tailwindcss.com](https://tailwindcss.com)
- **WCAG Guidelines**: [w3.org/WAI/WCAG21](https://www.w3.org/WAI/WCAG21)
- **Class Variance Authority**: [cva.style](https://cva.style)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Frontend Team
