# @scilence/tokens

Foundation design tokens for all STEAMCO products. These are the canonical source of truth — all product-specific token files (admin-tokens.css, site.css) should derive from or align with these values.

## Token Categories

| File | Contents |
|------|----------|
| `_palettes.css` | Color primitives: tealscale, greenscale, creamscale, brandscale (dynamic), brand-secondary, accent colors |
| `_spacing.css` | Fibonacci spacing scale (3-55px), density multiplier, semantic layout tokens |
| `_typography.css` | Font families, modular size scale, weights, line heights, density modes |
| `_radius-borders.css` | Proportional radius (font-size derived) and border width system |
| `_z-index.css` | Z-index ladder (base through max) |
| `_shadows.css` | Shadow scale (sm-xl), icon size tokens |
| `_transitions.css` | Duration, easing, transition shorthands, component-specific transitions |
| `_status-colors.css` | Success, warning, danger, info with bg/border/fg variations |
| `_prominent.css` | Prominent action colors and on-color foregrounds |
| `_alpha-overlays.css` | White (lift) and black (dark) alpha overlay tokens |
| `_commons-public.css` | Commons foundation — pan-app neutrals, type stacks, calm radii (`--s-commons-*`); light theme aliases into these |

## Usage

```css
@import '@scilence/tokens/src/index.css';
```

Or import individual categories:

```css
@import '@scilence/tokens/src/_palettes.css';
@import '@scilence/tokens/src/_spacing.css';
```

## Design Principles

- **Commons foundation** — light-theme surfaces, neutrals, and default type alias `--s-commons-*` so GUIDE, Motif, Commons, and marketing feel related
- **OKLCH color space** for perceptual uniformity (legacy creamscale ramps remain for gradual migration; semantics prefer Commons)
- **Fibonacci spacing** with density multiplier for instrument packing (public section rhythm may use `--s-commons-space-*`)
- **Proportional radius/borders** derived from active font size; semantic control radii follow Commons
- **Brand-hue parameterization** for interactive/status accents: override `--brand-hue` and `--brand-hue-secondary` to shift accent ramps
