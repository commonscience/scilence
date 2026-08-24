# Datavis 2D (`@scilence/datavis-2d`)

Shared 2D charts. Provenance and CAS consume the same `createChart`.

**Kinds:** `heatmap` (equal bins), `mosaic` (variable tiles), and `strip`
(shared time / beeswarm). Densities: `pictogram | rail | portal | band`.
GUIDE provenance mounts `strip` on the rail. Mosaic stays in the kit.
`band` is the wide, short published strip (1100x80, ~14:1); pass `width` /
`height` to override any density's box, which keeps its mark sizes.

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

## Strip x-scale

A strip is **ordinal** by default: one even slot per mark, `gapBefore` buying a
wider one. Ordinal spacing is a reading order, not a time axis — captioning it
with real endpoint years claims more than it draws.

Opt into real spacing with `xScale: "time"`, which puts each mark at its share
of the span:

```js
createChart(host, {
  kind: "strip",
  density: "band",
  xScale: "time",
  data: { marks },
});
```

Each mark's `at` may be epoch ms, an ISO string, or a `Date`. Time spacing is
only honoured when it can be honest — every mark needs an instant, and the span
needs width. A single mark, marks that all share one timestamp, or one
unparseable `at` fall back to ordinal.

That fallback is silent in the drawing, so the resolved scale is published on
the root as `data-s-chart-xscale="time|ordinal"`. **Read that attribute, not
your own request, when writing a caption** — asking for time is not proof you
got it. `gapBefore` is ignored under time spacing: elapsed time is the drought.

Real spans cluster. Eight Haber-Bosch events across 1909-2026 put seven marks in
the left 20% and leave one long empty run — true, and the reason time spacing
wants `band` rather than `rail`. The beeswarm resolver handles the crowding,
including same-instant marks, which share an x and separate vertically.
