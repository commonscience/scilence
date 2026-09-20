# @scilence/tokens

Foundation design tokens for all STEAMCO products. These are the canonical source of truth — all product-specific token files (admin-tokens.css, site.css) should derive from or align with these values.

## Not only tokens: one base reset

`_reset.css` is the single file here that declares a RULE rather than custom
properties, and the barrel imports it first. It contains
`[hidden] { display: none !important }`, because the user-agent's own
`[hidden] { display: none }` is an attribute selector that loses to any author
class setting a display value — so `el.hidden = true` silently leaves flex and
grid elements painted, and every consumer otherwise re-states the guarantee (or
ships the defect; the GUIDE shell shipped it five times).

The bar for anything else landing in that file is stated in the file itself and
is deliberately narrow: a rule earns a place only where the platform's own
behaviour is losing to author CSS by construction. This is not a normalize
sheet and the design system does not want one.

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

## Reduced-motion behavior

The effective appearance preference sets `data-reduce-motion="true"` on the
document root. `_reduced-motion.css` then removes transition duration and delay,
including on pseudo-elements, without creating motion on otherwise static
elements. Do not replace the zero transition duration with a small positive
value: `transition-property` defaults to `all`, so doing so can animate inherited
visibility and make a just-revealed input temporarily unfocusable.

Intentional named CSS animations retain one near-instant iteration, without a
start delay, so their `animationend` cleanup still occurs. Functional state and
focus must not depend solely on `transitionend`: reduced motion legitimately
removes the transition, and zero-duration transitions do not emit that event.
Normal-motion timing remains owned by the authored component/tokens.

## Design Principles

- **Commons foundation** — light-theme surfaces, neutrals, and default type alias `--s-commons-*` so GUIDE, Motif, Commons, and marketing feel related
- **OKLCH color space** for perceptual uniformity (legacy creamscale ramps remain for gradual migration; semantics prefer Commons)
- **Fibonacci spacing** with density multiplier for instrument packing (public section rhythm may use `--s-commons-space-*`)
- **Proportional radius/borders** derived from active font size; semantic control radii follow Commons
- **Brand-hue parameterization** for interactive/status accents: override `--brand-hue` and `--brand-hue-secondary` to shift accent ramps
