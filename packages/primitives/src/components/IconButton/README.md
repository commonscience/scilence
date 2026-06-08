# IconButton (`@scilence/primitives`)

Pan-app **icon-only button** primitive — distinct from `Button` (which is label-first). Square or round button containing just an icon, with optional toggle (`aria-pressed`) + optional count badge.

Per the 2026-06-07 componentization audit, **24+ surfaces** reimplement this pattern with subtle drift — the biggest non-chip cleanup. Includes byte-for-byte duplicates (`sg-toolbar-btn` ≡ `sg-editor-icon-btn`) and 4+ modal close-buttons that should consolidate.

## Variants

| Axis | Values | Role |
|---|---|---|
| `tone` | `default` \| `ghost` \| `outlined` | Visual treatment |
| `size` | `sm` \| `md` \| `lg` | Container + icon dimensions |
| `shape` | `square` \| `round` | Corner treatment (rounded-rect vs circle) |

### Tone semantics

- **`default`** — subtle bg + muted fg, hover lifts to active surface. The dominant treatment.
- **`ghost`** — transparent bg, hover-bg overlay on interaction. For inline content surfaces where chrome would compete.
- **`outlined`** — bordered surface. When the button sits against a busy background that needs visual separation.

### Sizes

| | Container | Icon |
|---|---|---|
| `sm` | 22px | 14px |
| `md` | 28px | 16px |
| `lg` | 36px | 20px |

## Usage

```typescript
import { createIconButton } from '@scilence/primitives';

const close = createIconButton({
  icon: closeIconSvg,
  label: 'Close',                              // required for a11y
  variants: { tone: 'ghost', size: 'md' },
  onClick: () => modal.close(),
});

container.append(close.element);
```

Link `IconButton.css` once per surface (GUIDE mirror: `/admin/css/icon-button.css`).

## Toggle pattern (aria-pressed)

For icon buttons that toggle on/off (filter pills, view-mode switchers, mute):

```typescript
const toggle = createIconButton({
  icon: muteIcon,
  label: 'Mute',
  pressed: state.muted,
  variants: { tone: 'ghost' },
  onClick: () => {
    state.muted = !state.muted;
    toggle.setPressed(state.muted);
  },
});
```

`aria-pressed='true'` gets the brand-alpha-5 overlay treatment (same as nav active state).

## Badge

Optional count badge overlays the top-right:

```typescript
const inbox = createIconButton({
  icon: inboxIcon,
  label: 'Inbox',
  badge: 5,
  variants: { tone: 'default' },
});
inbox.setBadge(0);  // hides
inbox.setBadge(12); // updates
```

## Handle API

```typescript
btn.element                 // the rendered <button>
btn.setVariants({ size: 'lg' })
btn.setIcon(newIcon)
btn.setLabel('Save')
btn.setDisabled(true)
btn.setPressed(true)
btn.setBadge(3)
btn.destroy()
```

## Parallel to existing `icon-button.js`

`guide/shell/js/components/icon-button.js` is the pre-existing admin-shell wrapper. New consumers should use `createIconButton` from this primitive; existing `icon-button.js` consumers migrate incrementally as they touch icon buttons.

**Don't add new consumers to the legacy `icon-button.js`** — use `createIconButton` from this primitive.

## Out of scope (v1.1 candidates)

- **Color override** (`tone: 'success'` / `tone: 'danger'`) — for status-tinted icon buttons. Raise if a real consumer needs it.
- **Loading state** — Button has it; IconButton currently doesn't. Add when a consumer needs in-place async state.
- **Floating shadow** — for fixed-position icon-button affordances (per `feedback_box_shadow_carveouts` — floating raised surfaces get shadow). Raise as a modifier when needed.

## Spec

- 2026-06-07 componentization audit `research/handoffs/2026-06-07-componentization-audit.md` § "Secondary consolidation candidates" #1 (highest-leverage non-chip)

## Doctrine

- [`feedback_box_shadow_carveouts`](../../../../../research/memory-drops/feedback_box_shadow_carveouts.md) — icon buttons are in-plane; no shadow (this primitive has none)
- [`feedback_always_vanilla_ts_globally`](../../../../../research/memory-drops/feedback_always_vanilla_ts_globally.md) — vanilla TS
- [`project_plugin_ecosystem_strategy`](../../../../../research/memory-drops/project_plugin_ecosystem_strategy.md) — pan-app primitive home (scilence) for vendor consumption
