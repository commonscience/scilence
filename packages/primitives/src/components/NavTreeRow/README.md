# NavTreeRow

Canonical navigation disclosure row with a primary label target and sibling
action controls. The row owns disclosure semantics, keyboard intent, stable
action-slot geometry, and coarse-pointer visibility. Consumers own the external
controlled panel, persistence, ordering, routing, and action-handle cleanup.

Use distinct closed/open leading glyphs when the icon can communicate expansion
without a trailing chevron. Section rows may omit `leading` and use `trailing`
for a chevron immediately after the label. Both slots are decorative;
`aria-expanded` remains the state contract. Never nest action buttons inside the
disclosure.
