# @scilence/primitives

Canonical home for **pan-app vanilla TS/JS design system primitives** in the
STEAMCO design system. Atoms and composite primitives that are framework-agnostic
and consumable from any STEAMCO surface (admin shell, marketing site, public
docs, future surfaces).

> **Doctrine lock (2026-05-15):** the package is named `primitives` — not
> `components` — per design-system tradition (Radix Primitives, etc.) and per
> the locked 2026-05-15 doctrine in
> [`research/memory-drops/feedback_scilence_components_dir_should_exist.md`](../../../research/memory-drops/feedback_scilence_components_dir_should_exist.md).
> When a new pan-app DS part needs a home, it lands here. Defaulting new
> components to `guide/shell/js/components/` is wrong-direction migration —
> see the doctrine memory for why.

This package is the components-half companion to
[`@scilence/tokens`](../tokens/README.md) (the tokens-half foundation —
palettes, spacing, typography, motion, status colors).

## What belongs here

- **Vanilla TS/JS atoms** — primitives with no framework dependency (no Svelte,
  no React, no Vue). Plain DOM + TypeScript.
- **Composite primitives** — small compositions of atoms that any surface might
  want (e.g. `FilterRail`, dropdown, segmented-control, popover anchoring).
- **Tokens-only styling** — every CSS custom property referenced must resolve
  to an `@scilence/tokens` value. No hardcoded hex / px / shadow values; no
  defensive fallbacks like `var(--s-color-text, #333)` (per the 2026-05-07
  defensive-fallback ban).
- **Consumable from any STEAMCO surface** — admin shell, marketing site,
  public docs, future surfaces (libraries, lab-tools, alumni community, etc.).
  The "would a future surface plausibly want this?" test from the doctrine
  memory is the gate.

## What does NOT belong here

- **Admin-only components** — anything admin-namespaced (`oar-*`,
  `surface-tag-*`, admin-shell-only state references) stays in
  `guide/shell/js/components/` with admin-tokens overrides.
- **Svelte-specific adapters** — wrappers that exist only to make a primitive
  feel native in Svelte stay in `@scilence/svelte` (sibling package). The
  pan-app primitive itself ships from here; the Svelte adapter wraps it.
- **Page-specific compositions** — the kanban page's particular column layout,
  the project hub's specific event timeline strip, etc. stay in their consuming
  surface (typically `guide/shell/js/pages/*`).

## Consumer pattern

Once a primitive lands in this package, surfaces import from the package root:

```typescript
import { FilterRail } from "@scilence/primitives";
```

(`FilterRail` is the upcoming first occupant per
[Brief 103](../../../research/flywheel/handoffs/briefs/guide-shell-v5-section-state-left-rail.md).
At scaffold time the barrel is empty — `export {};`.)

## Build + dev

```bash
# from this directory
pnpm run build       # tsc -p tsconfig.json → dist/index.{js,d.ts}
pnpm run dev         # tsc --watch
pnpm run clean       # rm -rf dist
pnpm run test        # placeholder until first primitive ships real tests
```

The package emits ES modules (`type: module`) targeting ES2022 with full
`.d.ts` + source-map output. `noUncheckedIndexedAccess`, `strict`, and
`verbatimModuleSyntax` are on — primitives must compile under those rules.

## Versioning + publishing

- `version: 0.1.0` — unpublished. Consumed via the scilence pnpm workspace
  link until the first primitive lands and we decide the publish cadence.
- License: **MIT** (matches `@scilence/tokens` and the workspace-wide
  Apache-2.0/MIT-only policy locked 2026-05-10).
- `publishConfig.access: public` — when we do publish, npm publish ships
  the public scope.

## References

- Doctrine memory:
  [`research/memory-drops/feedback_scilence_components_dir_should_exist.md`](../../../research/memory-drops/feedback_scilence_components_dir_should_exist.md)
  (2026-05-15)
- Foundation ADR:
  [`research/handoffs/decisions/2026-05-08-scilence-foundation-admin-overrides.md`](../../../research/handoffs/decisions/2026-05-08-scilence-foundation-admin-overrides.md)
  (the scilence/admin split that prevents the DS from forking)
- Tokens precedent: [`@scilence/tokens`](../tokens/README.md)
- Scaffold brief:
  [`research/flywheel/handoffs/briefs/scilence-primitives-scaffold.md`](../../../research/flywheel/handoffs/briefs/scilence-primitives-scaffold.md)
- First-occupant brief:
  [`research/flywheel/handoffs/briefs/guide-shell-v5-section-state-left-rail.md`](../../../research/flywheel/handoffs/briefs/guide-shell-v5-section-state-left-rail.md)
  (FilterRail TS variant)
