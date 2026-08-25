# Chrome (`@scilence/chrome`)

Application chrome — navigation rails, headers, footers, and wayfinding.

**Expected components:** sidebar-rail, page-tools-strip, header, footer, navbar, breadcrumb.

First occupant: the **module-host contract** (`src/module-host.ts`, F0 / GH #1482).
Locked module ids: `module.monitor`, `module.editor`. Painters live in GUIDE
and register here. Do not put a terminal UI in `@scilence/status` (that
package is a status-code registry).

Host vocabulary: Cell · Scene · Board · Book — see
`research/memory-drops/project_cell_scene_board_book.md`.
