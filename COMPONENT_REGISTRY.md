# Scilence package/API discovery map

This file answers a narrow question: **which package entry points and public
runtime values are available in this checkout?** It is not a second,
hand-maintained component catalog. Variant axes, props, slots, token wiring,
and marketing compositions must be derived from their source files by the
consumer that publishes the machine-readable design-system registry.

The inventory was checked on 2026-09-18. Because this checkout contains
uncommitted primitive work, the status column distinguishes the committed
package API from additions that are only available in the current working
tree. “Available” does not mean published to npm or released in a product.

## Status vocabulary

- **Committed API** — exported by the package root at the current `HEAD`.
- **Current-checkout addition** — exported by the working-tree barrel, but not
  present in the current `HEAD` of this checkout.
- **Available contract; routing limited** — built and tested package contract,
  but not evidence that every browser consumer can resolve the bare package
  specifier.
- **Reference source; not package API** — reusable source exists, but the
  package barrel intentionally does not export it.
- **Empty scaffold** — package metadata and an empty barrel exist; named
  members are candidates, not implemented or canonical components.

The table lists runtime values. Public TypeScript types are re-exported from
the same package barrels and remain the source of truth for signatures.

## Public APIs available in this checkout

| API concept | Package | Public runtime values | Status | Source |
| --- | --- | --- | --- | --- |
| Filter rail and chip | `@scilence/primitives` | `createFilterRail`, `createFilterChip` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Card | `@scilence/primitives` | `Card`, `createCard`, `ALWAYS_VISIBLE_CHROME_IDS`, `mergeCardVariants`, `resolveCardTokens` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Chip | `@scilence/primitives` | `Chip`, `createChip`, `mergeChipVariants`, `resolveChipTokens` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Button | `@scilence/primitives` | `Button`, `createButton`, `mergeButtonVariants`, `resolveButtonTokens` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Icon button | `@scilence/primitives` | `IconButton`, `createIconButton`, `mergeIconButtonVariants`, `resolveIconButtonTokens` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Modal | `@scilence/primitives` | `Modal`, `createModal`, `mergeModalVariants`, `resolveModalTokens` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Menu | `@scilence/primitives` | `Menu`, `createMenu`, `isMenuItemDescriptor`, `mergeMenuVariants`, `resolveMenuTokens` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Inspector stack | `@scilence/primitives` | `createInspectorStack` | Committed API | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Navigation tree row | `@scilence/primitives` | `NavTreeRow`, `createNavTreeRow` | Current-checkout addition | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Context-menu button | `@scilence/primitives` | `createContextMenuButton` | Current-checkout addition | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Hover disclosure | `@scilence/primitives` | `attachHoverDisclosure`, `joinHoverDisclosureGroup` | Current-checkout addition | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Cell-picker geometry | `@scilence/primitives` | `computeCellPickerGeometry` | Current-checkout addition | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Placement handle | `@scilence/primitives` | `createPlacementHandle`, `placementHandleLabel` | Current-checkout addition | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Inspector resize | `@scilence/primitives` | `attachInspectorResize`, `clampInspectorHeight`, `INSPECTOR_MIN_HEIGHT`, `INSPECTOR_MAX_HEIGHT` | Current-checkout addition | [`packages/primitives/src/index.ts`](packages/primitives/src/index.ts) |
| Module-host contract | `@scilence/chrome` | `LAYER_PREFIXES`, `HOST_IDS`, `DENSITIES`, `MODULE_IDS`, `LayerIdError`, `isLayerId`, `assertLayerId`, `isHostId`, `isDropPayload`, `createDropPayload`, `createModuleRegistry` | Available contract; routing limited | [`packages/chrome/src/index.ts`](packages/chrome/src/index.ts) |
| Two-dimensional charts | `@scilence/datavis-2d` | `attachStripBrush`, `eventIdsBetweenSvgX`, `createChart`, `renderHeatmapSvg`, `renderMosaicSvg`, `renderStripSvg` | Committed API | [`packages/datavis-2d/src/index.js`](packages/datavis-2d/src/index.js) |

The tooltip implementation under
[`packages/primitives/src/tooltip/`](packages/primitives/src/tooltip/) is
**reference source, not package API**. Its resolver depends on a
consumer-supplied dictionary and glossary adapter, so it is intentionally not
re-exported from `@scilence/primitives`.

`@scilence/primitives` and `@scilence/chrome` are ESM packages whose package
roots point at built `dist/index.js` files. `@scilence/datavis-2d` exposes its
source JavaScript entry point directly. A package entry in this map does not by
itself prove that a particular browser import map or deployment stages it.

## Empty family scaffolds

These packages currently contain `export {}` barrels. Their candidate members
describe possible family scope only. They do not supersede APIs already
available from `@scilence/primitives`.

| Package | Candidate family scope | Status |
| --- | --- | --- |
| `@scilence/forms` | Inputs, text areas, selects, comboboxes, typeahead, toggles, sliders | Empty scaffold |
| `@scilence/overlays` | Drawers, popovers, tooltips, toasts, sheets | Empty scaffold |
| `@scilence/data` | Tables, kanban cards, compact spark visualizations | Empty scaffold |
| `@scilence/layout` | Page shells, grids, panel containers, surface hosts, resize handles | Empty scaffold |
| `@scilence/timeline` | Timeline-specific presentation components | Empty scaffold |
| `@scilence/skills` | Reusable skill-surface components | Empty scaffold |
| `@scilence/voice` | Advisory voice UI | Empty scaffold |
| `@scilence/datavis-3d` | Three-dimensional scientific viewers | Empty scaffold |

Before moving an existing primitive into one of these families, make the
ownership and compatibility decision explicitly; an empty scaffold is not a
reason to create a duplicate implementation.
