# @scilence/primitives — Modal

Pure modal substrate. Native `<dialog>` based, vanilla TS, framework-agnostic.

The GUIDE-side plugin-contract wiring (`ModalMountContract` from `research/specs/GUIDE_MODAL_CONTRACT.md`) consumes this primitive. Pan-app surfaces (marketing, public docs, future vendor plugins per `project_plugin_ecosystem_strategy`) consume it directly.

## Quick start

```ts
import { createModal } from '@scilence/primitives';

const modal = createModal({
  variants: { size: 'md' },
  modifiers: ['animated'],
  slots: {
    header: { title: 'Confirm', close: true },
    body: {
      render: (host) => {
        host.innerHTML = '<p>Save your changes?</p>';
        return () => { /* cleanup */ };
      },
    },
    footer: {
      actions: [
        { id: 'cancel', label: 'Cancel', variant: 'cancel',
          onClick: () => modal.close() },
        { id: 'save', label: 'Save', variant: 'primary',
          onClick: async () => { await save(); },
          closeOnSuccess: true },
      ],
      primaryActionId: 'save',
    },
  },
});

modal.open();
```

Link `Modal.css` once per surface (GUIDE mirror: `/admin/css/components/modal.css`).

## Variant axes

| Axis | Values | Default |
|---|---|---|
| `size` | `sm` / `md` / `lg` / `xl` / `xxl` / `cas` / `full` / `lightbox` / `contained` | `md` |
| `mode` | `docked` / `popout` | `docked` |
| `modifiers` | `animated` | `[]` |

`mode: 'popout'` is interface-only in v1 — constructor throws if used. Mechanics deferred to a separate brief.

## Slots

Body is required. All others optional. CSS for each slot is in `Modal.css`; consumer fills via the slot interface.

| Slot | Interface |
|---|---|
| `header` | `{ title, subtitle?, actions?, close? }` |
| `body` | `{ render: (host) => Cleanup, padded? }` |
| `footer` | `{ actions: FooterAction[], primaryActionId? }` |
| `sidebar` | `{ items: SidebarItem[], defaultActiveId?, onChange? }` |
| `toolbar` | `{ tools: ToolbarTool[], segmented? }` |
| `statusBar` | `{ items: StatusItem[] }` |
| `breadcrumb` | `{ items: BreadcrumbItem[], onNavigate? }` |

Slot inventory locked at 7 (v1). Adding a new slot is a spec amendment + primitive change, not a per-surface invention.

## Lifecycle

```ts
modal.open();                     // showModal() + onOpen()
modal.close('programmatic');      // onClose(reason) → cleanup → dialog.close() → focus return
modal.destroy();                  // unmount entirely
modal.isOpen();                   // current state
modal.updateSlots({ footer });    // hot-swap a slot (e.g., loading state)
```

`onClose` can return `false` to abort the close (e.g., unsaved-changes confirm).

Native `<dialog>.showModal()` provides:
- Top-layer rendering (above z-indexed siblings)
- ESC dismissal (intercepted via `cancel` event → routed to `close('esc-key')`)
- Focus trap
- Focus return after close (best-effort augmented by primitive)
- `::backdrop` pseudo-element for scrim styling

Scrim click → close(`'scrim-click'`).
Header X button → close(`'close-button'`).
Footer action with `closeOnSuccess: true` → close(`'commit-success'`) on resolved promise.

## What this primitive does NOT do

- Plugin contract validation — GUIDE wiring layer (`guide/shell/js/components/modal-host/`)
- Commit gate integration — GUIDE wiring layer
- Multi-monitor popout — separate brief
- Bumper-car multi-modal navigation animation — separate brief (breadcrumb slot is the integration surface)

## Spec

- `research/specs/GUIDE_MODAL_CONTRACT.md` — the GUIDE-side `ModalMountContract` that wraps this primitive
- `research/flywheel/handoffs/briefs/canonical-modal-primitive-architecture.md` — the parent design brief

## Doctrine

- `feedback_box_shadow_carveouts` — modals are raised-on-z-axis; always carry shadow
- `feedback_always_vanilla_ts_globally` — vanilla TS; no JSX/React/Svelte
- `feedback_reduced_motion_important_required` — `prefers-reduced-motion` drops animation duration
- `project_plugin_ecosystem_strategy` — pan-app primitives land in scilence for third-party vendor consumption (Orion, MOE, etc.)
