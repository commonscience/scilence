# Datavis 2D (`@scilence/datavis-2d`)

Shared 2D charts. Provenance and CAS consume the same `createChart`.

**Kinds:** `heatmap` (equal bins), `mosaic` (variable tiles), and `strip`
(shared time / beeswarm). Densities: `pictogram | rail | portal`.
GUIDE provenance mounts `strip` on the rail. Mosaic stays in the kit.

```js
import { createChart } from "@scilence/datavis-2d";

createChart(host, {
  kind: "heatmap",
  density: "rail",
  data: { rows, cols, cells },
  selection: { eventId },
  onHover,
  onSelect,
});
```

GUIDE adapts typed events into `data`. This package does not import notebook types.
