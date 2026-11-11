# ContextMenuButton

Canonical composition of `IconButton`, `Menu`, `attachHoverDisclosure`, and a
native auto popover. Entries are regenerated before every open so contextual
state cannot become stale. The helper owns viewport-safe placement, focus entry
and restoration, dismissal, observers, and cleanup; consumers own labels,
commands, and application state.
