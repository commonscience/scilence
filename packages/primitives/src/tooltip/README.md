# Tooltip (`@scilence/primitives`)

Pan-app **touch-gated, dictionary-driven** tooltip primitive. The canonical
pan-app home for the tooltip per the consuming workspace's
`research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md` (LOCKED 2026-06-29): _every
on-surface affordance or indicator that is not plain readable prose exposes a
hover tooltip, wherever the user has a fine cursor + hover._

Authored as vanilla JS (production origin:
`guide/shell/js/components/tooltip/`, PR #572) and maintained here as the
canonical reference. GUIDE consumes its runnable local mirror via the importmap
and bootstrap. The mirrors currently differ in two-tier/familiarity behavior;
the lifecycle fixes below are applied narrowly to both, not a claim of complete
source parity or reconciliation.

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

### Handle lifecycle

`attachTooltip()` and `createTooltip()` return `{ update, dismiss, destroy }`.
`dismiss()` immediately cancels pending show/hide/depth/press work and removes
the visible tooltip while retaining the trigger, description and event wiring.
The next genuine hover or focus may reveal it again. A group of related controls
can dismiss its other handles on pointer/focus entry and dismiss all handles on
Escape, activation or a semantic state change, without recreating controls.
`attachTooltip.update()` updates the description/copy in place; use `dismiss()`
when an already-visible tooltip describes a state that no longer applies.
Wrapper-mode `createTooltip.update()` first dismisses pending visual work and
then rebuilds its wrapper content. Only `dismiss()` guarantees preservation of
both modes' trigger/description nodes. `destroy()` permanently stops the
instance, including late work, and removes its owned description.

Repeated hover/focus events replace the prior show timer; a destroyed instance
cannot paint. These additive lifecycle guarantees are maintained in both the
GUIDE runtime and the older canonical reference, without reconciling their
unrelated two-tier/familiarity differences.

### Richer-preview trigger policy (`attachTooltip`)

Set `data-tip-hover-preview="true"` on a trigger whose hover already opens a
richer menu or preview. Only the exact, case-sensitive string `true` opts in;
absence, `false`, an empty attribute or `1` preserve ordinary tooltip behavior.
Declarative `attachTooltips(root)` uses this policy automatically.

While opted in, mouse hover, pointer-induced focus, q-while-hovering and
long-press do not show a competing tooltip. Keyboard-origin focus may show its
hint only while the pointer is outside the trigger and `aria-expanded` is not
`true`. Leaving the trigger does not reveal a hint automatically; a new
keyboard-focus interaction is required. Programmatic/assistive focus is
treated as keyboard-like unless the preceding input was a pointer. Opening the
preview or pinning it must set `aria-expanded="true"`; attribute changes cancel
visible and pending tooltips immediately at the mutation checkpoint. Delayed
reveals also recheck current attributes before painting. Closing never creates
a tooltip by itself; a subsequent permitted focus interaction can reveal it.

The accessible description, action name and actual preview behavior are not
removed or replaced. Policy changes are supported at runtime, and destroy
removes policy listeners/observers. This policy is maintained in the small
TypeScript `tooltip-trigger-policy.ts` helper in both source trees. It does not
change legacy `createTooltip()` wrapper behavior.

### Popover surface (`attachTooltip`)

Set `data-tip-surface="popover"` for controls whose tooltip should visually
match adjacent menus. The DS portal class pairs `--s-surface-elevation-2-bg`
with `--s-color-fg-primary`, following the active light/dark theme. Other values
retain the default inverse foreground/background treatment. This is independent
of hover-preview ownership; neither option requires consumer CSS or a renderer
fork. Changing the surface attribute dismisses old visual work so the next reveal
uses the current surface.

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
