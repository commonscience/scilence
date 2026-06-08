# Chip (`@scilence/primitives`)

Pan-app **chip** primitive — shape, slot, tone, and size variants resolve to a
single token lookup on the root element (no CSS cascade wars between surfaces).

## Variants

| Axis | Values | Role |
|------|--------|------|
| `shape` | `square` \| `round` | Corner radius (`--s-radius-1` vs pill) |
| `slot` | `text-only` \| `icon-left` \| `icon-right` \| `number-left` \| `number-right` \| `label-value` | Content layout |
| `tone` | `default` \| `accent` \| `info` \| `warning` \| `success` \| `muted` | Background / border / fg |
| `size` | `xs` \| `sm` \| `md` | Font size + padding (`min` / `condensed` / `0`) |

### Tone semantics (locked 2026-06-07 per `feedback_primary_action_tone_is_accent`)

- **`accent`** — primary action / chosen state (brand-700 greenscale).
- **`info`** — status communication (loading / in-progress / async pending). **NOT** primary action.
- **`warning`** — stale / draft / override.
- **`success`** — shipped / fresh / passing.
- **`muted`** — inert metadata.
- **`default`** — neutral subtle (most chips).

### Size guidance

- **`xs`** — micro-size (10px). For kbd hints, H-level badges, `wb-region__kind` tags, count bubbles in dense rails. Use sparingly.
- **`sm`** — default everywhere. ~11.7px.
- **`md`** — standard non-condensed. ~12.17px. For breadcrumb pills, prototype chips, larger CTAs.

### `label-value` slot

Composite slot for `TIER: A` / `ASSAY: pIC50` / `OWNER: cae` patterns. Requires `microLabel` in options:

```typescript
createChip({
  text: 'A',
  microLabel: 'TIER',
  variants: { slot: 'label-value', shape: 'round', tone: 'muted', size: 'sm' },
});
// renders as: TIER: A (uppercase mono microLabel + value)
```

When `slot: 'label-value'` is set but `microLabel` is omitted, the chip falls back to `text-only` rendering (permissive).

Tokens live in `@scilence/tokens` (`_chip.css`) as `--s-chip-{axis}-{value}-*`.
`Chip.ts` sets resolved `--s-chip-font-size`, `--s-chip-bg`, etc. on the root.

## Usage

```typescript
import { createChip } from '@scilence/primitives';

const chip = createChip({
  text: 'Engineering',
  variants: { shape: 'square', tone: 'muted', size: 'md' },
});

container.appendChild(chip.render());
```

Link `Chip.css` once per surface (GUIDE: `/admin/css/chip.css`).

## Filter rail

`createFilterChip` wraps `createChip` with `tagName: 'button'`, `shape: 'round'`,
`size: 'sm'`, and `slot: 'number-right'` when a count badge is present.
Selected state toggles `data-selected="true"` (accent tone).

## Kanban + drawer

Card discipline chips, substate exception chips, and brief drawer chips all
render via `createChip` with shared default tokens so card faces and drawer
headers read as one vocabulary.

## Out of scope

- Hover/focus polish beyond existing button focus ring
- Drag/drop chip reordering (saved-views territory)
- `chrome: 'default' | 'none'` modifier (v1.1 candidate — borderless treatment for `sg-footer-tag` family; not v1)
- `variant: 'filled' | 'outline'` modifier (v1.1 candidate — `sg-ep-vocab-tag`, `sg-card-badge--primitive`)
- `dismissable: boolean` option (v1.1 candidate — auto-renders × in icon-right)
- `tone: 'danger'` (v1.1 candidate — retired/cancelled; currently piggybacks on `warning`)

## Known gaps (followup briefs)

- `--s-color-status-{warning,success,info}-{bg,fg,border}` token variants are NOT defined in `@scilence/tokens` — `_chip.css` references them but they're dead refs. `info` tone is defined via `color-mix` on the existing `--s-color-status-info` to avoid the dead-ref pattern; `warning` and `success` chip tones currently render via cascade fallback. A followup brief lifts all 3 status tones to concrete defs.
