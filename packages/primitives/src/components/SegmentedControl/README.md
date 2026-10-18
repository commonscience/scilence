# SegmentedControl (`@scilence/primitives`)

One choice among a few, side by side: view mode (grid / list / table), density, sort order, visibility. A WAI-ARIA **radiogroup**.

- **Keyboard:** the group is one tab stop. Arrow keys move focus *and* selection, wrapping and skipping disabled items; Home/End jump to the ends.
- **State:** `aria-checked` on each item. No state classes.
- **Look:** the GUIDE Library rail segment recipe. Joined segments sit in a `border-strong` frame at `--s-radius-control`, and the chosen segment uses the system selected pair (`--s-color-selected-bg` / `-fg`), never an accent fill. Tokens are in `@scilence/tokens` `_segmented.css`.

```typescript
import { createSegmentedControl } from '@scilence/primitives';

const view = createSegmentedControl({
  ariaLabel: 'View mode',
  options: [
    { id: 'grid', label: 'Grid', icon: gridSvg },
    { id: 'list', label: 'List', icon: listSvg },
    { id: 'table', label: 'Table', icon: tableSvg },
  ],
  value: 'grid',
  size: 'md',              // 'sm' (22px) | 'md' (28px, the toolbar line)
  onChange: (id) => setView(id),
});
host.append(view.element);
view.setValue('list');     // programmatic; does not fire onChange
```

Link `SegmentedControl.css` once per surface (GUIDE: `frame/index.html`).

`className` and `itemClassName` add consumer **hooks**, never style. The primitive's selectors include the ARIA role, so they outrank a one-class legacy class kept on the same element during a migration.
