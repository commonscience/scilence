# Button (`@scilence/primitives`)

Pan-app **button** primitive — variant × size resolve to a single token lookup on the root element (no CSS cascade wars between surfaces).

Per the 2026-06-07 componentization audit, ~17+ surfaces today reimplement button styling with subtle drift; this primitive is the consolidation target.

## Variants

| Axis | Values | Role |
|---|---|---|
| `variant` | `primary` \| `secondary` \| `ghost` \| `danger` \| `add` | Semantic role + visual treatment |
| `size` | `sm` \| `md` \| `lg` | Height / padding / font-size |

### Variant semantics (locked 2026-06-07)

- **`primary`** — primary action (accent / brand-700 greenscale). Per [`feedback_primary_action_tone_is_accent`](../../../../../research/memory-drops/feedback_primary_action_tone_is_accent.md).
- **`secondary`** — neutral action (bordered surface). Cancel, "Not now."
- **`ghost`** — transparent / chrome-light. Inline actions inside content areas where surface chrome would compete.
- **`danger`** — destructive / irreversible (delete, discard). Use sparingly; pair with confirm dialog.
- **`add`** — dashed-ghost "+ add X" affordance. Replaces 3+ surface reimplementations per the audit (sibling-projects__new-btn, right-rail-add-widget, project-notebook__add-cell).

### Size guidance

- **`sm`** — compact (12.17px font, ~32px height). Tight rails, secondary controls.
- **`md`** — default (14px font, ~36px height). Most buttons.
- **`lg`** — hero / CTA (14px font, ~44px height). Primary call-to-action in marketing or onboarding surfaces.

Tokens live in `@scilence/tokens` (`_button.css`) as `--s-button-{axis}-{value}-*`. `Button.ts` sets resolved `--s-button-*` props on the root.

## Usage

```typescript
import { createButton } from '@scilence/primitives';

const btn = createButton({
  label: 'Save',
  variants: { variant: 'primary', size: 'md' },
  onClick: async () => { await save(); },
  awaitClick: true,            // disables + spins until promise resolves
});

container.appendChild(btn.element);
```

Link `Button.css` once per surface (GUIDE mirror: `/admin/css/button.css`).

## Options beyond variants

- `icon` + `iconPosition` (`'left' | 'right'`) — optional leading or trailing icon
- `disabled` — sets native disabled + visual treatment
- `loading` — replaces label with inline spinner, disables input
- `fullWidth` — `width: 100%`
- `href` — when set, renders as `<a href=...>` (cannot use `type` together)
- `type` — `'button' | 'submit' | 'reset'`. Default `'button'`. (Ignored when `href` is set.)
- `awaitClick` — when `onClick` returns a Promise, button auto-disables + shows loading until resolved
- `className`, `attributes`, `styleOverrides` — surface hooks (mirror Card / Chip pattern)

## Handle API

```typescript
btn.element                 // the rendered <button> or <a>
btn.setVariants({ size: 'lg' })
btn.setLabel('Saving…')
btn.setIcon(iconEl)
btn.setDisabled(true)
btn.setLoading(true)
btn.destroy()
```

## Reduced motion

The loading spinner animation drops to a slower 2s rotation under `prefers-reduced-motion: reduce` per [`feedback_reduced_motion_important_required`](../../../../../research/memory-drops/feedback_reduced_motion_important_required.md).

## Parallel to existing `button.js`

`guide/shell/js/components/button.js` is the pre-existing admin-shell convenience wrapper (4 variants — `prominent | primary | secondary | ghost`, 5 sizes `xs | sm | md | lg | xl`, color-override option). It remains in place for backwards compatibility; consumers migrate to this primitive incrementally as they touch buttons.

**Don't add new consumers to the legacy `button.js`** — use `createButton` from this primitive.

## Out of scope (v1)

- **`prominent` / `hero` variant** — the existing `button.js` has `prominent` as a separate depth tier; this primitive collapses `prominent` and `primary` into `primary` per the primary-tone lock. If a true `prominent` is needed beyond accent, raise as a v1.1 candidate.
- **xs / xl sizes** — existing `button.js` has these; collapsed to `sm / md / lg` here per the audit. If a real consumer needs xs (or xl), raise as a v1.1 size addition.
- **Color override** — existing `button.js` has `color: 'success'` etc. that overrides the variant background. Not in v1; if a real consumer needs this, raise as a v1.1 modifier axis.
- **Loading-text override** — currently the spinner replaces the label entirely. If a consumer needs "Saving…" instead, use `setLabel('Saving…')` + `setLoading(true)` together.

## Spec

- 2026-06-07 componentization audit `research/handoffs/2026-06-07-componentization-audit.md` § "Secondary consolidation candidates" #2

## Doctrine

- [`feedback_primary_action_tone_is_accent`](../../../../../research/memory-drops/feedback_primary_action_tone_is_accent.md) — primary = accent (brand-700)
- [`feedback_box_shadow_carveouts`](../../../../../research/memory-drops/feedback_box_shadow_carveouts.md) — buttons are in-plane; no shadow (this primitive has none)
- [`feedback_always_vanilla_ts_globally`](../../../../../research/memory-drops/feedback_always_vanilla_ts_globally.md) — vanilla TS
- [`project_plugin_ecosystem_strategy`](../../../../../research/memory-drops/project_plugin_ecosystem_strategy.md) — pan-app primitive home (scilence) for vendor consumption
