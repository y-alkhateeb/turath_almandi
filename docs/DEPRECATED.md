# Deprecated Files and Migration Guide

This document tracks deprecated files in the Turath Almandi codebase and provides migration paths.

## Theme System

### Deprecated: `/frontend/src/theme/tokens/color.ts`

**Status**: ⚠️ Deprecated (Not in use)
**Replacement**: `/frontend/src/theme/tokens/colors/` directory
**Last Verified**: December 2024

#### Why Deprecated

The old `color.ts` file used a simpler, less structured approach to color tokens that:
- Lacked clear semantic meaning
- Had limited dark mode support
- Didn't follow a consistent token hierarchy
- Mixed different concerns (brand, semantic, palette colors)
- Had limited TypeScript type safety
- Lacked comprehensive documentation

#### What Replaced It

The new three-tier token architecture in the `colors/` directory:

```
tokens/colors/
├── primitives.ts   # Base color scales (50-950)
├── semantic.ts     # Semantic token mappings
├── brand.ts        # Brand color definitions
└── index.ts        # Barrel exports
```

#### Migration Path

**Before (Deprecated):**
```typescript
import {
  paletteColors,
  lightColorTokens,
  darkColorTokens,
  presetsColors,
  actionColors
} from '@/theme/tokens/color';

// Using old palette colors
const primaryColor = paletteColors.primary.default;
const successColor = paletteColors.success.default;

// Using old token structure
const textColor = lightColorTokens.text.primary;
const bgColor = lightColorTokens.background.default;
```

**After (Current):**
```typescript
// For primitive colors (rarely needed directly)
import { gold, green, neutral } from '@/theme/tokens/colors';

// For brand colors
import {
  primary,
  secondary,
  accent,
  getBrandColors
} from '@/theme/tokens/colors';

// For semantic tokens (recommended)
import {
  lightSemanticColors,
  darkSemanticColors,
  getSemanticColors
} from '@/theme/tokens/colors';

// For component variants (most common)
import {
  SEMANTIC_BADGE_VARIANTS,
  STAT_CARD_VARIANTS
} from '@/theme/variants';

// Usage examples:
const primaryMain = primary[500];  // or getBrandColors('light').primary.main
const textPrimary = lightSemanticColors.text.primary;
const badgeClass = SEMANTIC_BADGE_VARIANTS.success;
```

#### Specific Replacements

| Old (color.ts) | New (colors/) | Notes |
|----------------|---------------|-------|
| `paletteColors.primary` | `primary` from `brand.ts` | Now includes full scale + semantic tokens |
| `paletteColors.brand` | `primary` from `brand.ts` | Brand and primary unified as gold |
| `paletteColors.success` | `success` from `primitives.ts` | Now part of semantic system |
| `paletteColors.warning` | `warning` from `primitives.ts` | Now part of semantic system |
| `paletteColors.error` | `danger` from `primitives.ts` | Renamed to 'danger' |
| `paletteColors.info` | `info` from `primitives.ts` | Now part of semantic system |
| `paletteColors.gray` | `neutral` from `primitives.ts` | Renamed to 'neutral' |
| `lightColorTokens.text` | `lightSemanticColors.text` | Enhanced with more variants |
| `lightColorTokens.background` | `lightSemanticColors.background` | Enhanced with more variants |
| `lightColorTokens.action` | `lightSemanticColors.action` | Same structure, new location |
| `darkColorTokens.*` | `darkSemanticColors.*` | Same structure, enhanced support |
| `presetsColors.default` | `primary` | Simplified to single brand color |
| `commonColors.white` | `common.white` | Now in primitives.ts |
| `commonColors.black` | `common.black` | Now in primitives.ts |
| `grayColors[*]` | `neutral[*]` | Renamed to 'neutral' |

#### Helper Functions

| Old | New | Notes |
|-----|-----|-------|
| `getThemeTokens(mode)` | `getSemanticColors(mode)` | More specific naming |
| `hexToRgb(hex)` | `hexToRgb(hex)` from `color-helpers.ts` | Moved to utils |
| `addColorChannels(colors)` | Not needed | Use semantic tokens directly |

#### Code Example: Full Migration

**Before:**
```typescript
import { paletteColors, lightColorTokens, getThemeTokens } from '@/theme/tokens/color';

function MyComponent() {
  const tokens = getThemeTokens('light');

  return (
    <div style={{
      backgroundColor: tokens.background.default,
      color: tokens.text.primary
    }}>
      <button style={{
        backgroundColor: paletteColors.primary.default,
        color: paletteColors.primary.darker
      }}>
        Primary Button
      </button>

      <span style={{ color: paletteColors.success.default }}>
        Success
      </span>
    </div>
  );
}
```

**After:**
```typescript
import { useThemeTokens } from '@/theme/hooks/use-theme-tokens';
import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';

function MyComponent() {
  const { semantic, brand } = useThemeTokens();

  return (
    <div style={{
      backgroundColor: semantic.background.default,
      color: semantic.text.primary
    }}>
      <button style={{
        backgroundColor: brand.primary.main,
        color: brand.primary.contrast
      }}>
        Primary Button
      </button>

      <span className={SEMANTIC_BADGE_VARIANTS.success}>
        Success
      </span>
    </div>
  );
}
```

**Or even better (using Tailwind classes):**
```typescript
import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';

function MyComponent() {
  return (
    <div className="bg-background text-foreground">
      <button className="bg-primary text-primary-foreground hover:bg-primary/90">
        Primary Button
      </button>

      <span className={SEMANTIC_BADGE_VARIANTS.success}>
        Success
      </span>
    </div>
  );
}
```

## Can It Be Deleted?

**Short Answer**: Yes, but document first.

**Analysis**:
- ✅ No active imports found in codebase (verified via grep)
- ✅ Functionality fully replaced by new system
- ✅ No components reference old exports
- ✅ Migration path documented

**Recommendation**:
1. Keep file for one release cycle with deprecation notice
2. Add warning comment at top of file
3. Remove in next major version

**To Add Deprecation Warning:**

```typescript
/**
 * @deprecated This file is deprecated and will be removed in v2.0.0
 *
 * Please migrate to the new token system:
 * - Use `/theme/tokens/colors/` directory instead
 * - See /docs/DEPRECATED.md for migration guide
 * - Import from `@/theme/tokens/colors` or `@/theme/variants`
 *
 * Old: import { paletteColors } from '@/theme/tokens/color';
 * New: import { primary, secondary } from '@/theme/tokens/colors';
 *
 * For component variants:
 * import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';
 */

// Rest of file...
```

## Future Deprecations

No other files are currently marked for deprecation. The theme system is stable.

## Questions?

See:
- [Theme System Documentation](./theme-system.md)
- [Color Palette Reference](./color-palette.md)
- [README](./README.md)

---

**Last Updated**: December 2024
**Next Review**: Before v2.0.0 release
