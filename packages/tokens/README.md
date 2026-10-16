# @scilence/tokens

Foundation design tokens for all STEAMCO products. These are the canonical source of truth — all product-specific token files (admin-tokens.css, site.css) should derive from or align with these values.

## Not only tokens: one base reset

`_reset.css` owns platform invariants, and the barrel imports it first.
Component rules such as links, buttons and forms live in their named members. It contains
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

## Readable links and quantitative plot ink

`_link.css` is the canonical text-link member, loaded by the foundation barrel.
Its zero-specificity anchor defaults cover otherwise unstyled links (including
Notebook downloads); component navigation and buttons may override them. The
explicit `s-link` class uses the same defaults. Underlines remain a non-color cue.

Use `--s-color-link`, `--s-color-link-hover` and `--s-color-link-visited`.
Light/dark values follow `--brand-hue-secondary`, independent of the structural
chroma multiplier. This keeps a brand's calm canvas from desaturating its links
into unreadable text.

Quantitative plots use `--s-color-plot-surface`, `--s-color-plot-grid`,
`--s-color-plot-axis`, `--s-color-plot-data` and
`--s-color-plot-data-selected`. Their hue follows `--brand-hue`; their lightness
is theme-specific. These do not replace categorical/sequential scientific color
scales. Labels, range readouts and selection markers must still communicate state.

GUIDE's `test/plot-link-contrast.test.mjs` evaluates actual declarations over six
brand hues and three chroma multipliers: text ink at least4.5:1 against app/subtle
surfaces, data/axis ink at least3:1 and reference grids at least2:1. This is a
computed-token check, not a claim of complete visual/accessibility acceptance.


### Droplist indicator spacing

`_forms.css` owns the single-value select baseline. Native selects and GUIDE's
custom Select share `--s-select-indicator-edge` (14px visible inset),
`--s-select-indicator-size` (12px SVG box / 6px chevron) and
`--s-select-text-clearance` (36px). Keep the indicator vertically centred and
reserve the trailing text area even for compact controls. In RTL the indicator
moves to the left. Multi-selects and expanded native listboxes are excluded;
forced-colours mode restores the native arrow. Surfaces own the control's height,
colour and border; they should not add a second chevron or edge-spacing override.
