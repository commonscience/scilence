# Chip (`@scilence/primitives`)

Pan-app **chip** primitive — shape, slot, tone, and size variants resolve to a
single token lookup on the root element (no CSS cascade wars between surfaces).

## Variants

| Axis | Values | Role |
|------|--------|------|
| `shape` | `square` \| `round` | Corner radius (`--s-radius-1` vs pill) |
| `slot` | `text-only` \| `icon-left` \| `icon-right` \| `number-left` \| `number-right` | Content layout |
| `tone` | `default` \| `accent` \| `warning` \| `success` \| `muted` | Background / border / fg |
| `size` | `sm` \| `md` | Font size + padding (`condensed` / `0`) |

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
