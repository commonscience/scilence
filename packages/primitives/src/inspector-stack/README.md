# InspectorStack

`createInspectorStack` owns section card chrome, collapse/reorder, menus, focus,
per-surface order/collapse persistence and teardown. Consumers provide typed
section bodies, actions and callbacks; scientific data and save policy stay with
their domain owner.

Use `presentation: 'tray'` for a full-height Inspector rail. Notebook, Whiteboard,
Models and the local molecular preview use this same option and the same
`guide/shell/css/inspector-stack.css` tray/card/grip rules. Hosts supply available
width and height; they must not override the tray's padding, ground, scrolling,
card spacing or grip. `rootClass` is an optional host hook, not a styling fork.

`presentation: 'embedded'` is the default and preserves compositions such as
Library's entity card and the CAS scientific viewport without adding tray
padding/ground. Content-specific layout belongs to declared body components.
Changing presentation does not change section IDs or persistence namespaces.

Shared `attachInspectorResize` provides optional session-only explicit sizing;
fresh mounts fit content. Reuse the same controller rather than reimplementing
pointer/keyboard resizing in each consumer.

Behavior tests live in GUIDE's `js/shared/inspector-stack-presentation.test.mjs`,
`inspector-stack-lifecycle.test.mjs` and real Notebook/Models/MME/Whiteboard tests.
Visual acceptance also requires computed-style checks in the served branch
across these hosts, themes, text sizes and narrow/wide rails; DOM class equality
alone is not evidence that CSS cascades correctly.
