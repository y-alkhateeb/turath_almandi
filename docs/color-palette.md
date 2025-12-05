# Color Palette Reference

## Overview

Turath Almandi uses a carefully curated **3-color brand palette** derived from the company logo, complemented by semantic status colors for UI feedback. This palette creates a warm, earthy, and professional aesthetic that reflects the agricultural heritage and natural products the brand represents.

### Brand Colors

1. **Gold** (Primary) - `#b28b4c` - Represents harvest, prosperity, and tradition
2. **Green** (Secondary) - `#67976b` - Symbolizes growth, nature, and sustainability
3. **Terracotta** (Accent) - `#c96d4f` - Adds warmth, energy, and earthiness

### Design Philosophy

- **Warm and Earthy**: Colors evoke natural, agricultural themes
- **Accessible**: All combinations meet WCAG AA standards
- **Harmonious**: Colors complement each other without competing
- **Versatile**: Works across both light and dark themes

---

## Primary Color: Gold

The primary brand color representing prosperity, harvest, and traditional values.

### Color Scale

| Shade | Hex Code | RGB | HSL | Usage |
|-------|----------|-----|-----|-------|
| 50 | `#faf7f2` | 250, 247, 242 | 37°, 43%, 96% | Lightest backgrounds, subtle highlights |
| 100 | `#efe7db` | 239, 231, 219 | 37°, 43%, 90% | Light backgrounds, hover states |
| 200 | `#e0d2ba` | 224, 210, 186 | 37°, 43%, 80% | Borders, dividers |
| 300 | `#d0bb99` | 208, 187, 153 | 37°, 43%, 71% | Disabled states, muted elements |
| 400 | `#c1a270` | 193, 162, 112 | 37°, 43%, 60% | Secondary text, icons |
| **500** | **`#b28b4c`** | **178, 139, 76** | **37°, 43%, 50%** | **Base/Default - Main brand color** |
| 600 | `#997650` | 153, 118, 80 | 37°, 43%, 46% | Hover states, active elements |
| 700 | `#6a532e` | 106, 83, 46 | 37°, 43%, 30% | Text on light backgrounds |
| 800 | `#4a3920` | 74, 57, 32 | 37°, 43%, 21% | Dark text, strong emphasis |
| 900 | `#231b0f` | 35, 27, 15 | 37°, 43%, 10% | Darkest text, headers |
| 950 | `#120f08` | 18, 15, 8 | 37°, 43%, 5% | Near-black, maximum contrast |

### Usage Guidelines

**Primary Use Cases:**
- Primary action buttons and CTAs
- Active navigation items and links
- Focus indicators and selection states
- Headers and important section dividers
- Brand moments and key highlights

**Do's:**
- Use for primary buttons and important actions
- Apply to interactive elements that need attention
- Use for brand reinforcement in headers
- Pair with white or dark neutral text

**Don'ts:**
- Don't overuse - maintain visual hierarchy
- Don't use on low-contrast backgrounds
- Don't combine with similar warm tones
- Don't use for error or warning states

### Contrast Ratios (with White #FFFFFF)

| Shade | Ratio | WCAG AA (Normal) | WCAG AAA (Normal) | WCAG AA (Large) |
|-------|-------|------------------|-------------------|-----------------|
| 500 | 4.8:1 | ✅ Pass | ❌ Fail | ✅ Pass |
| 600 | 6.2:1 | ✅ Pass | ❌ Fail | ✅ Pass |
| 700 | 10.5:1 | ✅ Pass | ✅ Pass | ✅ Pass |
| 800 | 14.8:1 | ✅ Pass | ✅ Pass | ✅ Pass |

### Code Examples

```tsx
// Primary button
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Submit
</Button>

// Primary badge
<Badge className="bg-primary/10 text-primary border border-primary/20">
  Featured
</Badge>

// Focus indicator
<Input className="focus:ring-2 focus:ring-primary" />

// Gold text
<h2 className="text-primary">Important Heading</h2>
```

---

## Secondary Color: Green

The secondary brand color symbolizing growth, nature, and sustainability.

### Color Scale

| Shade | Hex Code | RGB | HSL | Usage |
|-------|----------|-----|-----|-------|
| 50 | `#f4f9f4` | 244, 249, 244 | 120°, 23%, 97% | Lightest backgrounds, success highlights |
| 100 | `#e6f2e7` | 230, 242, 231 | 121°, 23%, 93% | Light backgrounds, hover states |
| 200 | `#cee5d0` | 206, 229, 208 | 122°, 23%, 85% | Borders, subtle dividers |
| 300 | `#a8d0ab` | 168, 208, 171 | 124°, 23%, 74% | Disabled states |
| 400 | `#87b88c` | 135, 184, 140 | 126°, 23%, 63% | Secondary elements |
| **500** | **`#67976b`** | **103, 151, 107** | **125°, 19%, 50%** | **Base/Default - Main green** |
| 600 | `#52795b` | 82, 121, 91 | 134°, 19%, 40% | Hover states |
| 700 | `#3f5d47` | 63, 93, 71 | 136°, 19%, 31% | Text on light backgrounds |
| 800 | `#2e4434` | 46, 68, 52 | 136°, 19%, 22% | Dark text |
| 900 | `#1d2a21` | 29, 42, 33 | 138°, 19%, 14% | Darkest elements |
| 950 | `#0f1511` | 15, 21, 17 | 140°, 17%, 7% | Near-black |

### Usage Guidelines

**Primary Use Cases:**
- Secondary action buttons
- Success states and confirmations
- Income/revenue indicators
- Nature-related content
- Supporting UI elements

**Do's:**
- Use for success messages and positive feedback
- Apply to income/revenue stats
- Use for secondary CTAs
- Pair with nature/sustainability features

**Don'ts:**
- Don't use as a replacement for semantic success
- Don't mix with other greens without purpose
- Don't use for warnings or errors
- Don't overpower the primary gold

### Contrast Ratios (with White #FFFFFF)

| Shade | Ratio | WCAG AA (Normal) | WCAG AAA (Normal) | WCAG AA (Large) |
|-------|-------|------------------|-------------------|-----------------|
| 500 | 3.4:1 | ❌ Fail | ❌ Fail | ✅ Pass |
| 600 | 5.1:1 | ✅ Pass | ❌ Fail | ✅ Pass |
| 700 | 7.8:1 | ✅ Pass | ✅ Pass | ✅ Pass |
| 800 | 11.2:1 | ✅ Pass | ✅ Pass | ✅ Pass |

### Code Examples

```tsx
// Secondary button
<Button className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
  Learn More
</Button>

// Income badge
<Badge className="bg-success/10 text-success border border-success/20">
  +$1,234
</Badge>

// Success alert
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />
  <AlertDescription>Operation completed successfully</AlertDescription>
</Alert>

// Revenue stat card
<StatCard
  variant="revenue"
  label="Total Revenue"
  value="$45,231"
  icon={<TrendingUp />}
/>
```

---

## Accent Color: Terracotta

The accent brand color providing warmth, energy, and earthiness.

### Color Scale

| Shade | Hex Code | RGB | HSL | Usage |
|-------|----------|-----|-----|-------|
| 50 | `#faf5f3` | 250, 245, 243 | 17°, 32%, 97% | Lightest backgrounds |
| 100 | `#f5e8e3` | 245, 232, 227 | 17°, 32%, 93% | Light backgrounds |
| 200 | `#ead0c7` | 234, 208, 199 | 15°, 32%, 85% | Borders |
| 300 | `#dfb3a4` | 223, 179, 164 | 15°, 32%, 76% | Disabled states |
| 400 | `#d49078` | 212, 144, 120 | 16°, 32%, 65% | Secondary elements |
| **500** | **`#c96d4f`** | **201, 109, 79** | **15°, 52%, 55%** | **Base/Default - Main terracotta** |
| 600 | `#b45338` | 180, 83, 56 | 13°, 52%, 46% | Hover states |
| 700 | `#8e3f2a` | 142, 63, 42 | 13°, 54%, 36% | Text on light backgrounds |
| 800 | `#692e1f` | 105, 46, 31 | 12°, 54%, 27% | Dark text |
| 900 | `#441d14` | 68, 29, 20 | 11°, 54%, 17% | Darkest elements |
| 950 | `#1a0d0a` | 26, 13, 10 | 11°, 44%, 7% | Near-black |

### Usage Guidelines

**Primary Use Cases:**
- Highlights and special badges
- Informational messages
- Transfer/neutral transactions
- Attention-grabbing elements (use sparingly)
- Warm decorative accents

**Do's:**
- Use for special promotions or highlights
- Apply to info/neutral messages
- Use sparingly for maximum impact
- Pair with neutral backgrounds

**Don'ts:**
- Don't overuse - should remain an accent
- Don't use for success or error states
- Don't combine with primary gold excessively
- Don't use for large background areas

### Contrast Ratios (with White #FFFFFF)

| Shade | Ratio | WCAG AA (Normal) | WCAG AAA (Normal) | WCAG AA (Large) |
|-------|-------|------------------|-------------------|-----------------|
| 500 | 3.8:1 | ❌ Fail | ❌ Fail | ✅ Pass |
| 600 | 5.6:1 | ✅ Pass | ❌ Fail | ✅ Pass |
| 700 | 9.1:1 | ✅ Pass | ✅ Pass | ✅ Pass |
| 800 | 13.1:1 | ✅ Pass | ✅ Pass | ✅ Pass |

### Code Examples

```tsx
// Info badge
<Badge className="bg-accent/10 text-accent border border-accent/20">
  New
</Badge>

// Info alert
<Alert variant="info">
  <Info className="h-4 w-4" />
  <AlertDescription>This is an informational message</AlertDescription>
</Alert>

// Transfer badge
<Badge className={TRANSACTION_TYPE_BADGES.transfer}>
  Transfer
</Badge>

// Accent highlight
<div className="border-l-4 border-accent bg-accent/5 p-4">
  <p>Featured content</p>
</div>
```

---

## Neutral Colors

Grayscale palette for text, backgrounds, borders, and other neutral elements.

### Color Scale

| Shade | Hex Code | RGB | HSL | Usage |
|-------|----------|-----|-----|-------|
| 50 | `#fafaf9` | 250, 250, 249 | 60°, 9%, 98% | Lightest background |
| 100 | `#f5f5f4` | 245, 245, 244 | 60°, 5%, 96% | Light background, disabled |
| 200 | `#e7e5e4` | 231, 229, 228 | 30°, 6%, 90% | Borders, dividers |
| 300 | `#d6d3d1` | 214, 211, 209 | 30°, 6%, 83% | Strong borders |
| 400 | `#a8a29e` | 168, 162, 158 | 24°, 5%, 64% | Disabled text, placeholders |
| **500** | **`#78716c`** | **120, 113, 108** | **25°, 5%, 45%** | **Base/Default - Mid gray** |
| 600 | `#57534e` | 87, 83, 78 | 33°, 5%, 32% | Secondary text |
| 700 | `#44403c` | 68, 64, 60 | 30°, 6%, 25% | Primary text (light mode) |
| 800 | `#292524` | 41, 37, 36 | 12°, 7%, 15% | Strong text |
| 900 | `#1c1917` | 28, 25, 23 | 24°, 10%, 10% | Headers, dark surfaces |
| 950 | `#0c0a09` | 12, 10, 9 | 40°, 14%, 4% | Darkest elements |

### Usage Guidelines

**Primary Use Cases:**
- Text in various weights
- Background surfaces
- Borders and dividers
- Shadows and overlays
- Disabled states

**Semantic Mapping:**
- **50-200**: Backgrounds, subtle surfaces
- **300-400**: Borders, disabled states
- **500-700**: Text (secondary to primary)
- **800-950**: Strong text, headers

---

## Semantic Status Colors

Additional colors for UI feedback that complement the brand palette.

### Success (Distinct from Brand Green)

**Base**: `#22c55e` (Green-500)

```tsx
// Used for positive feedback
<Badge className={SEMANTIC_BADGE_VARIANTS.success}>Completed</Badge>
<Badge className={PAYMENT_STATUS_BADGES.paid}>Paid</Badge>
```

**When to use**: Confirmations, completed actions, paid status, active states

### Warning

**Base**: `#f59e0b` (Amber-500)

```tsx
// Used for cautions
<Badge className={SEMANTIC_BADGE_VARIANTS.warning}>Pending</Badge>
<Badge className={PAYMENT_STATUS_BADGES.partial}>Partial Payment</Badge>
```

**When to use**: Warnings, pending states, partial completions, thresholds

### Danger/Error

**Base**: `#ef4444` (Red-500)

```tsx
// Used for errors
<Badge className={SEMANTIC_BADGE_VARIANTS.danger}>Error</Badge>
<Badge className={PAYMENT_STATUS_BADGES.unpaid}>Unpaid</Badge>
```

**When to use**: Errors, failures, destructive actions, unpaid status

### Info

**Base**: Uses Terracotta accent

```tsx
// Used for information
<Badge className={SEMANTIC_BADGE_VARIANTS.info}>Info</Badge>
<Alert variant="info">Informational message</Alert>
```

**When to use**: Neutral information, transfers, general notifications

---

## Semantic Token Mappings

How primitive colors map to semantic meanings:

### Light Mode

| Semantic | Primitive | Usage |
|----------|-----------|-------|
| `success.main` | `success[500]` | Positive feedback |
| `warning.main` | `warning[500]` | Cautionary messages |
| `danger.main` | `danger[500]` | Errors, destructive |
| `info.main` | `accent[500]` (Terracotta) | Information |
| `text.primary` | `neutral[800]` | Main text |
| `text.secondary` | `neutral[600]` | Supporting text |
| `background.default` | `#FFFFFF` | Base background |
| `background.paper` | `#FFFFFF` | Card backgrounds |
| `border.main` | `neutral[300]` | Standard borders |

### Dark Mode

| Semantic | Primitive | Usage |
|----------|-----------|-------|
| `success.main` | `success[500]` | Positive feedback |
| `warning.main` | `warning[500]` | Cautionary messages |
| `danger.main` | `danger[500]` | Errors, destructive |
| `info.main` | `accent[500]` | Information |
| `text.primary` | `neutral[100]` | Main text (inverted) |
| `text.secondary` | `neutral[300]` | Supporting text |
| `background.default` | `#0a0a0a` | Base background |
| `background.paper` | `neutral[900]` | Card backgrounds |
| `border.main` | `neutral[700]` | Standard borders |

---

## Dark Mode Colors

### Key Adjustments

1. **Text Colors**: Inverted scale (100, 300, 400 instead of 800, 600, 500)
2. **Backgrounds**: Dark neutrals (#0a0a0a, neutral-900, neutral-800)
3. **Borders**: Adjusted for visibility (neutral-800, 700, 600)
4. **Status Colors**: Maintained for consistency
5. **Overlays**: White-based instead of black-based

### Dark Mode Examples

```tsx
// Automatically adapts
<p className="text-success">Success text</p>

// Manual dark mode control
<div className="bg-card dark:bg-neutral-900">
  <p className="text-neutral-700 dark:text-neutral-300">Adaptive text</p>
</div>

// Dark mode border
<div className="border-neutral-200 dark:border-neutral-800">
  Content
</div>
```

### Dark Mode Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `#FFFFFF` | `#0a0a0a` |
| Paper | `#FFFFFF` | `neutral[900]` |
| Text Primary | `neutral[800]` | `neutral[100]` |
| Text Secondary | `neutral[600]` | `neutral[300]` |
| Border Light | `neutral[200]` | `neutral[800]` |
| Border Main | `neutral[300]` | `neutral[700]` |
| Focus Ring | `gold[500]` | `gold[400]` |

---

## Contrast Ratios

### Brand Colors on White Background

| Color | Shade | Ratio | AA Normal | AAA Normal | AA Large |
|-------|-------|-------|-----------|------------|----------|
| Gold | 500 | 4.8:1 | ✅ | ❌ | ✅ |
| Gold | 600 | 6.2:1 | ✅ | ❌ | ✅ |
| Gold | 700 | 10.5:1 | ✅ | ✅ | ✅ |
| Green | 500 | 3.4:1 | ❌ | ❌ | ✅ |
| Green | 600 | 5.1:1 | ✅ | ❌ | ✅ |
| Green | 700 | 7.8:1 | ✅ | ✅ | ✅ |
| Terracotta | 500 | 3.8:1 | ❌ | ❌ | ✅ |
| Terracotta | 600 | 5.6:1 | ✅ | ❌ | ✅ |
| Terracotta | 700 | 9.1:1 | ✅ | ✅ | ✅ |

### Recommendations

- **For normal text (< 18px)**: Use 600+ shades for AA, 700+ for AAA
- **For large text (18px+)**: All 500+ shades meet AA
- **For backgrounds**: Lighter shades (50-200) with dark text
- **For buttons**: Any shade with proper contrast text

---

## Usage Recommendations

### Color Combinations

#### Excellent Contrast (AAA)
```tsx
// Gold
<div className="bg-white text-gold-700">Excellent</div>
<div className="bg-gold-700 text-white">Excellent</div>

// Green
<div className="bg-white text-green-700">Excellent</div>
<div className="bg-green-700 text-white">Excellent</div>

// Terracotta
<div className="bg-white text-terracotta-700">Excellent</div>
<div className="bg-terracotta-700 text-white">Excellent</div>
```

#### Good Contrast (AA)
```tsx
// Gold
<div className="bg-white text-gold-600">Good</div>
<div className="bg-gold-600 text-white">Good</div>

// Green
<div className="bg-white text-green-600">Good</div>
<div className="bg-green-600 text-white">Good</div>
```

#### Use with Caution (Large Text Only)
```tsx
// Base shades - only for large text (18px+)
<h1 className="text-3xl text-gold-500">Large Heading</h1>
<h1 className="text-3xl text-green-500">Large Heading</h1>
<h1 className="text-3xl text-terracotta-500">Large Heading</h1>
```

### When to Use Each Color

#### Gold (Primary)
- ✅ Primary CTAs and buttons
- ✅ Active navigation states
- ✅ Focus indicators
- ✅ Important headings
- ✅ Featured content
- ❌ Error messages
- ❌ Large background areas

#### Green (Secondary)
- ✅ Secondary actions
- ✅ Income/revenue displays
- ✅ Success indicators
- ✅ Nature-related content
- ✅ Positive growth metrics
- ❌ Warning messages
- ❌ Expense indicators

#### Terracotta (Accent)
- ✅ Informational badges
- ✅ Special highlights
- ✅ Transfer indicators
- ✅ Decorative accents
- ✅ Neutral notifications
- ❌ Primary actions
- ❌ Success/error states

---

## Color Psychology

### Gold
- **Emotion**: Trust, prosperity, tradition
- **Association**: Harvest, wheat, grain, abundance
- **Effect**: Warm, welcoming, established
- **Cultural**: Traditional, heritage, quality

### Green
- **Emotion**: Growth, health, sustainability
- **Association**: Nature, agriculture, freshness
- **Effect**: Calming, balanced, natural
- **Cultural**: Environmental, organic, life

### Terracotta
- **Emotion**: Warmth, earthiness, energy
- **Association**: Clay, pottery, earth
- **Effect**: Grounded, authentic, rustic
- **Cultural**: Handcrafted, traditional, natural

---

## Accessibility Checklist

### For Designers

- [ ] Use 600+ shades for normal text on white
- [ ] Use 700+ shades for AAA compliance
- [ ] Provide sufficient contrast ratios
- [ ] Don't rely on color alone for meaning
- [ ] Test in grayscale mode
- [ ] Verify in dark mode

### For Developers

```typescript
import { checkContrast, isCompliant } from '@/theme/utils/contrast-checker';

// Check contrast before applying
const result = checkContrast(textColor, backgroundColor);
if (!result.AA) {
  console.warn('Insufficient contrast!');
}

// Find best text color
const textColor = findBestTextColor(backgroundColor);
```

### Testing Tools

- **Chrome DevTools**: Contrast ratio in color picker
- **WAVE**: Web accessibility evaluation
- **axe DevTools**: Automated accessibility testing
- **Contrast Checker**: Built-in theme utility

---

## Quick Reference

### Tailwind Classes

```tsx
// Brand colors
className="text-primary"           // Gold text
className="bg-secondary"           // Green background
className="border-accent"          // Terracotta border

// Opacity variants
className="bg-primary/10"          // 10% opacity
className="text-success/80"        // 80% opacity

// Hover states
className="hover:bg-primary/90"    // Darker on hover
className="hover:border-accent/50" // Semi-transparent border

// Dark mode
className="dark:text-primary-foreground"
className="dark:bg-neutral-900"
```

### Common Patterns

```tsx
// Subtle background with border
className="bg-success/10 border border-success/20"

// Text with dark mode
className="text-warning-700 dark:text-warning-400"

// Interactive element
className="bg-primary hover:bg-primary/90 active:bg-primary/80"
```

---

## Resources

- **Theme System**: See [theme-system.md](./theme-system.md)
- **Color Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **WCAG Guidelines**: [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- **Tailwind CSS**: [Customizing Colors](https://tailwindcss.com/docs/customizing-colors)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Palette Designer**: Design Team
