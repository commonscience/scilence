# Card (`@scilence/primitives`)

Pan-app card **shell** primitive — elevation, tone, tier, and density variants
resolve to a single token lookup on the root element (no CSS cascade wars between
tier-A and lens treatments).

## Variants

| Axis | Values | Role |
|------|--------|------|
| `elevation` | `hairline` \| `raised` \| `float` | Shadow depth |
| `tone` | `default` \| `admin` \| `product` \| `warning` \| `success` | Background / border |
| `tier` | `A` \| `B` | Tier-A hairline when tone is default |
| `density` | `compact` \| `regular` | Padding + internal gap |

Tokens live in `@scilence/tokens` (`_card.css`) as `--s-card-{axis}-{value}-*`.
`Card.ts` sets resolved `--s-card-bg`, `--s-card-shadow`, etc. on the root.

## Usage

```typescript
import { createCard } from '@scilence/primitives';

const card = createCard({
  tagName: 'button',
  className: 'oar-phasecard',
  variants: {
    tone: 'admin',
    tier: 'A',
    elevation: 'hairline',
    density: 'regular',
  },
  styleOverrides: {
  },
});

card.slot('head', headEl);
card.slot('body', titleEl);
card.slot('footer', footerEl);

container.appendChild(card.render());
```

Link `Card.css` once per surface (GUIDE: `/admin/css/card.css`).

## Slot API

- `head` — iter, substate exception, discipline chips, prototype chip, agent chip
- `body` — title, tags, prose
- `footer` — owner, last-touched, iteration

```typescript
card.slot('head', element);
card.slot('body', element);
card.slot('footer', element);
```

## ALWAYS_VISIBLE chrome contract

Load-bearing identity chrome must **not** be gated behind filter-rail eye toggles.
The primitive documents and exports the contract:

| Chrome id | What it is |
|-----------|------------|
| `substate-exception` | Substate chip when column default differs |
| `prototype` | `prototype: true` frontmatter chip |
| `lens-bg` | Admin / product lens shell (tone variant) |

```typescript
card.alwaysVisible(['substate-exception', 'prototype', 'lens-bg']);
```

Surfaces use `card.isAlwaysVisibleChrome(id)` or import `ALWAYS_VISIBLE_CHROME_IDS`
when wiring `shouldRenderChrome` — **do not** hide these groups behind eye toggles.

## Kanban (operations-admin-roadmap)

`renderPhaseCardReal` constructs `createCard` with:

- `tone`: `admin` \| `product` from brief `lens` (else `default`)
- `tier`: `A` when brief `tier: A`
- Inner layout classes remain `oar-phasecard-*` (surface chrome only)

Shell rules must not return to `operations-admin-roadmap.css` for
`.oar-phasecard--lens-*` / `[data-tier]` / base hover — use Card variants.

## Out of scope

- Marketing / docs adoption (separate briefs)
- Inner chip typography (`oar-phasecard-sub`, discipline chips) — stays on surface
