# Cell picker geometry

`computeCellPickerGeometry` is the pan-app placement owner for a floating picker
whose controls must retain their intrinsic row height at narrow widths, short
windows and browser zoom. It accepts visual-viewport, anchor/pointer and measured
panel geometry and returns bounded coordinates plus the maximum internal-scroll
height.

It deliberately does not create DOM, choose modal versus popover semantics, trap
focus, serialize application drag payloads or mutate application data. Those
remain consumer responsibilities. GUIDE's notebook adapter keeps its native
popover and overlay stack, uses this geometry for fit, and uses its own typed
cell-blueprint decorator for modal/rail drag identity.

The consumer should:

1. Apply the returned `width` and `maxHeight` before measuring the panel.
2. Recompute with the measured panel height and apply `left`/`top`.
3. Recompute on visual-viewport resize/scroll while open.
4. Give scrolling to the picker's choice region and keep choice rows
   nonshrinking; geometry cannot repair a compressed inner flex layout.
