# @scilence/primitives

The public package for pan-app, framework-agnostic DOM primitives in Scilence.
It contains vanilla TypeScript/JavaScript atoms and small composite behaviors
that can be consumed by different product surfaces without adopting a UI
framework.

This package complements [`@scilence/tokens`](../tokens/README.md), which owns
the shared visual coordinate system.

## Package boundary

Good fits include:

- reusable DOM atoms and small compositions;
- interaction behavior with an explicit, typed lifecycle;
- token-driven styling that is not tied to one application route; and
- accessibility behavior shared by more than one surface.

Application-only chrome, page-specific composition, and framework adapters do
not become primitives merely because they are reusable inside one application.

## Public API in this checkout

At the current `HEAD`, the root barrel exports:

- Filter rail and chip: `createFilterRail`, `createFilterChip`
- Card: `Card`, `createCard`, `ALWAYS_VISIBLE_CHROME_IDS`, variant/token helpers
- Chip: `Chip`, `createChip`, variant/token helpers
- Button: `Button`, `createButton`, variant/token helpers
- Icon button: `IconButton`, `createIconButton`, variant/token helpers
- Modal: `Modal`, `createModal`, variant/token helpers
- Menu: `Menu`, `createMenu`, `isMenuItemDescriptor`, variant/token helpers
- Inspector stack: `createInspectorStack`

The current working tree additionally exports navigation-tree rows,
context-menu buttons, hover disclosure, cell-picker geometry, placement
handles, and inspector resizing. Those additions are available in this
checkout but are not part of the current committed package barrel. See
[`src/index.ts`](src/index.ts) for the exact current value and type exports, and
the repository-level [package/API discovery map](../../COMPONENT_REGISTRY.md)
for the committed/current-checkout distinction.

The tooltip implementation under [`src/tooltip/`](src/tooltip/) is reference
source rather than package API. It intentionally remains outside the root
barrel because its dictionary and glossary adapters are supplied by the
consumer.

## Consumer pattern

Import public values from the package root:

```typescript
import { createFilterRail } from '@scilence/primitives';

const rail = createFilterRail(host, config);
// Later, follow the returned handle's lifecycle contract.
rail.destroy();
```

The package manifest exposes ESM runtime and type declarations from
`dist/index.js` and `dist/index.d.ts`. Build the package before running a
consumer that resolves the built package entry point:

```bash
npm run build
```

Component CSS is maintained beside component source and may be staged by the
consumer's build. Consult the component README for any required stylesheet;
the JavaScript package-root export does not imply that CSS was loaded.

## Validation

The source tree contains focused tests for individual primitives, and consumer
repositories exercise package integrations. The package's current `npm test`
script is still a scaffold message, so it must not be treated as a complete
package gate. A package-level test aggregation command remains a maintenance
decision.

## Version and publication

The manifest currently declares version `0.1.0`, ESM output, MIT licensing, and
public publish configuration. This README makes no claim that the package has
been published to npm or included in a product release.
