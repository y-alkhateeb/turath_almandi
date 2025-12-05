# Turath Almandi Documentation

Welcome to the Turath Almandi documentation. This directory contains comprehensive guides for the project's systems and architecture.

## Documentation Index

### Theme System

- **[Theme System Documentation](./theme-system.md)** - Complete guide to the theme system architecture
  - Token system overview (primitives, semantic, component variants)
  - How to use semantic tokens in components
  - Component variant patterns (Badge, Alert, StatCard)
  - Dark mode best practices
  - Accessibility guidelines
  - Import patterns and code examples

- **[Color Palette Reference](./color-palette.md)** - Comprehensive color palette guide
  - 3-color brand palette (Gold, Green, Terracotta)
  - Complete color scales (50-950) for each color
  - Semantic token mappings
  - Usage guidelines and recommendations
  - Dark mode color adjustments
  - WCAG contrast ratios and accessibility

## Quick Links

### For Developers

**Getting Started:**
1. Read [Theme System Documentation](./theme-system.md#token-system-overview) to understand the architecture
2. Review [Import Patterns](./theme-system.md#import-patterns) for correct usage
3. Check [Color Palette Reference](./color-palette.md#quick-reference) for Tailwind classes

**Common Tasks:**
- [Using Semantic Tokens](./theme-system.md#using-semantic-tokens)
- [Creating Badges](./theme-system.md#badge-variants)
- [Creating Stat Cards](./theme-system.md#stat-card-variants)
- [Adding New Colors](./theme-system.md#adding-new-colors)
- [Dark Mode Guidelines](./theme-system.md#dark-mode)

### For Designers

**Design Resources:**
- [Color Palette Overview](./color-palette.md#overview)
- [Brand Colors](./color-palette.md#primary-color-gold)
- [Usage Recommendations](./color-palette.md#usage-recommendations)
- [Contrast Ratios](./color-palette.md#contrast-ratios)
- [Accessibility Checklist](./color-palette.md#accessibility-checklist)

## Theme System Files

### Token Files (Location: `/frontend/src/theme/tokens/colors/`)

| File | Description | Status |
|------|-------------|--------|
| `primitives.ts` | Base color scales (50-950) for all colors | ✅ Active |
| `semantic.ts` | Semantic mappings (success, warning, danger, etc.) | ✅ Active |
| `brand.ts` | Brand color definitions (primary, secondary, accent) | ✅ Active |
| `index.ts` | Barrel export for all color tokens | ✅ Active |

### Variant Files (Location: `/frontend/src/theme/variants/`)

| File | Description | Status |
|------|-------------|--------|
| `badge-variants.ts` | Badge component variant styles | ✅ Active |
| `stat-card-variants.ts` | Stat card component variant styles | ✅ Active |
| `index.ts` | Barrel export for all variants | ✅ Active |

### Utility Files (Location: `/frontend/src/theme/utils/`)

| File | Description | Status |
|------|-------------|--------|
| `color-helpers.ts` | Color manipulation utilities | ✅ Active |
| `contrast-checker.ts` | WCAG contrast compliance utilities | ✅ Active |
| `accessibility-audit.ts` | Accessibility audit script | ✅ Active |

### Other Files (Location: `/frontend/src/theme/`)

| File | Description | Status |
|------|-------------|--------|
| `tokens/base.ts` | Spacing, radius, shadows, z-index tokens | ✅ Active |
| `tokens/typography.ts` | Typography tokens | ✅ Active |
| `hooks/use-theme.ts` | Theme mode hook | ✅ Active |
| `hooks/use-theme-tokens.ts` | Theme color tokens hook | ✅ Active |
| `theme-provider.tsx` | Theme context provider | ✅ Active |
| `type.ts` | TypeScript type definitions | ✅ Active |

### Deprecated Files

| File | Status | Replacement | Notes |
|------|--------|-------------|-------|
| `tokens/color.ts` | ⚠️ Deprecated | `tokens/colors/` directory | Old color system. Replaced by new three-tier token architecture. Not imported anywhere. Safe to remove in future cleanup. |

## Migration Notes

### From Old Color System to New

The old color system (`tokens/color.ts`) has been replaced with a more robust three-tier architecture:

**Old System:**
```typescript
// ❌ Old approach (deprecated)
import { paletteColors, lightColorTokens } from '@/theme/tokens/color';
```

**New System:**
```typescript
// ✅ New approach (recommended)
import {
  primary, secondary, accent,           // Brand colors
  lightSemanticColors, darkSemanticColors  // Semantic tokens
} from '@/theme/tokens/colors';

// Or for components:
import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';
```

**Benefits of New System:**
- Clear three-tier hierarchy (primitives → semantic → component)
- Better dark mode support
- Type-safe with full TypeScript definitions
- Component-level variants for consistency
- Comprehensive JSDoc documentation
- WCAG accessibility built-in

## Usage Examples

### Basic Badge

```tsx
import { Badge } from '@/components/ui/badge';
import { SEMANTIC_BADGE_VARIANTS } from '@/theme/variants';

<Badge className={SEMANTIC_BADGE_VARIANTS.success}>
  Paid
</Badge>
```

### Stat Card

```tsx
import { STAT_CARD_VARIANTS } from '@/theme/variants';

const variant = STAT_CARD_VARIANTS.revenue;

<Card className={variant.background}>
  <div className={variant.border}>
    <TrendingUp className={variant.icon} />
    <p className={variant.label}>Revenue</p>
    <h3 className={variant.value}>$45,231</h3>
  </div>
</Card>
```

### Custom Styling with Semantic Tokens

```tsx
// Using Tailwind classes with semantic tokens
<div className="bg-success/10 text-success border border-success/20">
  Success message
</div>

// Dark mode support
<p className="text-warning-700 dark:text-warning-400">
  Warning text
</p>
```

## Accessibility

All color combinations in the theme system are designed to meet **WCAG AA** standards. For detailed contrast information, see:

- [Contrast Ratios](./color-palette.md#contrast-ratios)
- [Accessibility Guidelines](./theme-system.md#accessibility)
- [Usage Recommendations](./color-palette.md#usage-recommendations)

### Testing Accessibility

Run the accessibility audit script:

```bash
npx tsx src/theme/utils/accessibility-audit.ts
```

This generates a comprehensive report of all color combinations and their WCAG compliance.

## Contributing

When contributing to the theme system:

1. **Follow the hierarchy**: Primitive → Semantic → Component
2. **Maintain accessibility**: Check WCAG compliance using contrast utilities
3. **Support dark mode**: Test both light and dark variants
4. **Document thoroughly**: Add JSDoc comments and update docs
5. **Type everything**: Include TypeScript types and exports
6. **Test widely**: Verify across different components and use cases

See [Adding New Colors](./theme-system.md#adding-new-colors) and [Adding New Variants](./theme-system.md#adding-new-variants) for detailed guides.

## Resources

### Internal Documentation
- [Theme System](./theme-system.md)
- [Color Palette](./color-palette.md)

### External Resources
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Class Variance Authority](https://cva.style)
- [Zustand State Management](https://zustand-demo.pmnd.rs/)

### Design Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [Accessible Colors](https://accessible-colors.com/)

## Troubleshooting

### Common Issues

**Colors not applying:**
- Check import path uses `@/theme/...`
- Verify Tailwind CSS configuration
- Ensure theme provider wraps app
- Check for class name typos

**Dark mode not working:**
- Verify theme provider is configured
- Check `dark:` prefix usage
- Test theme toggle functionality
- Ensure semantic tokens are used

**Type errors:**
- Import types from correct files
- Check for missing type exports
- Update TypeScript/IDE cache
- Verify tsconfig.json paths

See [Troubleshooting](./theme-system.md#troubleshooting) for more details.

## Support

For questions or issues:
1. Check the documentation first
2. Review code examples in docs
3. Run accessibility audit for color issues
4. Contact the frontend team

---

**Last Updated**: December 2024
**Documentation Version**: 1.0.0
**Theme System Version**: 1.0.0
