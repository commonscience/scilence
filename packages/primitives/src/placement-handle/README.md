# PlacementHandle

`createPlacementHandle` is the reusable single-pointer and keyboard alternative
for an item that can also be dragged. It renders a native grip button named
`Place {item}\u2026` and shows a concise `Place` helper beside its grip; the consumer
owns the location chooser, validation and final mutation.

```ts
import { createPlacementHandle } from '@scilence/primitives';

const row = document.createElement('div');
row.className = 's-placement-item';
const item = document.createElement('button');
item.draggable = true;
const place = createPlacementHandle({
  itemLabel: 'Text',
  onActivate: () => beginLocationChoice(),
});
row.append(item, place.element); // siblings: never nest interactive controls
```

Load `placement-handle.css` alongside the primitive. Fine pointers reveal the
handle when the row is hovered or focus enters either control. Coarse pointers
keep a touch-sized handle visible. The canonical focus recipe remains visible.

## Standing interaction pattern

- Name a reusable DS owner for drag affordances.
- Keep the grip/action and primary item as sibling native controls.
- Preserve the item's primary click behavior; drag is additive.
- Offer a single-pointer click/tap path as well as native Enter/Space.
- Carry target identity through the transient placement state.
- Persist only after the target and complete item choice are both validated.

The handle deliberately does not serialize drag payloads, choose targets,
manage overlays, or write application data.
