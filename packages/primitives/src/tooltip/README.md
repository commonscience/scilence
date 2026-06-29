# Tooltip (`@scilence/primitives`)

Pan-app **touch-gated, dictionary-driven** tooltip primitive. The canonical
pan-app home for the tooltip per the consuming workspace's
`research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md` (LOCKED 2026-06-29): _every
on-surface affordance or indicator that is not plain readable prose exposes a
hover tooltip, wherever the user has a fine cursor + hover._

Authored as vanilla JS (production origin:
`guide/shell/js/components/tooltip/`, PR #572) and mirrored here **byte-for-byte**
as the canonical source. The GUIDE shell consumes a byte-identical copy
guide-locally via the importmap + bootstrap; the two are kept in sync (the known
scilence↔guide primitives duplication — a DS drift gate diffs them).

## API

```js
import {
  createTooltip,       // wrapper-mode tooltip (back-compat): wraps container content
  attachTooltip,       // in-place: wire a tooltip onto an existing element (no wrapper)
  attachTooltips,      // scan a subtree for [data-tip] and wire each (idempotent)
  supportsHoverPointer, // JS pointer-capability check mirroring the CSS gate
  resolveTooltip,      // key -> normalized { label, summary, glossary* , found }
  resolveTooltipText,  // key -> single plain-text string
  setTooltipRegistry,  // install a parsed registry object
  hasTooltipRegistry,  // whether a registry is installed
  loadTooltipRegistry, // fetch + install the registry JSON (once)
} from "./index.js";
```

### Touch gating

Tooltips activate **only** under `@media (hover: hover) and (pointer: fine)`
plus a JS `supportsHoverPointer()` check. On touch-only devices nothing paints
(the CSS gate suppresses paint even if a stray event fires); the same content
stays reachable via the glossary page + tap-to-detail. Tooltips also show on
**keyboard focus** on cursor devices.

### a11y — `aria-describedby`

`attachTooltip` / `createTooltip` install a hidden, glossary-aware description
node referenced via `aria-describedby`, so screen-reader and keyboard users get
the same content (including the linked glossary definition) even when the visual
tooltip is gated off.

### Dictionary-driven attach

Any element carrying `data-tip="<key>"` is auto-wired by `attachTooltips(root)`;
authors set a **stable key**, not bespoke markup. `resolveTooltip(key)`
normalizes both registry schema shapes (`text`/`extended` and `label`/`summary`)
into one `ResolvedTooltip`, and resolves an optional `glossaryRef` into the
shared product glossary (definition + a "more in glossary" deep-link). Resolving
an unknown key returns a structured miss and warns once in dev (declare-or-warn)
— a keyed indicator cannot silently render with no copy.

## Consumer-supplied data (stays guide-local)

This primitive is the canonical **code**. Its two data sources are **authored
under the consuming surface** (the GUIDE shell), per the consuming workspace's
`research/specs/TOOLTIP_DICTIONARY_SPEC.md` — "authored under the `guide` repo
because that's the consuming surface; later lifted to `@scilence/primitives` if
cross-app demand emerges." Until then the consuming surface provides, as
siblings of the primitive:

| Dependency | What the consumer supplies | GUIDE source |
|---|---|---|
| `../../data/glossary-data.js` | a module exporting `lookupGlossaryTerm(key)` + `glossaryHref(key)` | `guide/shell/js/data/glossary-data.js` |
| tooltips registry JSON | fetchable at the bootstrap URL (`loadTooltipRegistry(url)`, default `/admin/data/tooltips.json`) | `guide/shell/data/tooltips.json` |

Because `dictionary.js` imports the glossary adapter at the fixed relative path
`../../data/glossary-data.js` and `loadTooltipRegistry` fetches a runtime URL,
this scilence copy is a **canonical reference mirror** — the live, runnable copy
is the consumer's (GUIDE) mirror with those data siblings in place. The primitive
is therefore **not** re-exported through the typed `@scilence/primitives` barrel
(`src/index.ts`); it ships as JS reference source under `src/tooltip/`.

## Tokens

Portal + inline styles reference `@scilence/tokens` (`--s-color-fg-primary`,
`--s-color-bg-surface`, `--s-space-*`, `--s-radius-1`, `--s-font-*`). No
component-specific token additions.

## Tests

The canonical behavioral tests live with the consuming-surface mirror
(`guide/shell/js/components/tooltip/{dictionary,tooltip}.test.mjs`) because they
exercise the data wiring. They run under `node --test`.

## Out of scope

- The dictionary registry + glossary data (consumer-owned; see above).
- The `flywheel:check` tooltip-completeness gate (backstop scan; lives in the
  consuming surface's gate set).
