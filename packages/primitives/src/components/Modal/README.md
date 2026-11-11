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

Link `Modal.css` once per surface (GUIDE compatibility import: `/admin/css/components/modal.css`). It imports the canonical Button and IconButton CSS used by Modal chrome.

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
| `feedback` | `{ tone, title?, message, announcement? }` or `null` to clear |

The September 26 wizard composition adds semantic `feedback` to the original
seven slots. Header owns optional `stepper`; footer owns grouped actions. The
consumer must not add a second title, stepper, banner or footer inside the body.

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

### Wizard composition (September 26)

Use `presentation: 'wizard'` for a viewport-bounded frame whose height is
independent of the current step. `dismissal: { ignoreScrim: true }` retains X and
Escape while ignoring incidental backdrop clicks. `header.close: false` still
suppresses all three dismissal routes. The consumer's `onClose` can veto X/Escape
to present its own typed save/discard decision through the same chrome.

```ts
import { createModal } from '@scilence/primitives';

const modal = createModal({
  presentation: 'wizard',
  dismissal: { ignoreScrim: true },
  variants: { size: 'xl' },
  slots: {
    header: {
      title: 'Import data',
      stepper: {
        activeId: 'inspect',
        items: [
          { id: 'inspect', label: 'Inspect' },
          { id: 'review', label: 'Review', disabled: true },
        ],
        onSelect(id) { controller.requestStep(id); },
      },
    },
    body: { render: host => controller.mountBody(host) },
    feedback: { tone: 'warning', title: 'Review required', message: 'Confirm the source before continuing.' },
    footer: {
      actions: [
        { id: 'cancel', label: 'Cancel', variant: 'cancel', group: 'start',
          onClick: () => controller.requestClose() },
        { id: 'continue', label: 'Continue', variant: 'primary', group: 'end',
          onClick: () => controller.requestContinue() },
      ],
      primaryActionId: 'continue',
    },
  },
});
```

`controller` above is a consumer-owned boundary, not a Scilence implementation.
The same `stepper.items` can describe two steps (`inspect`, `review`), three
(`source`, `inspect`, `review`) or four (`source`, `map`, `validate`, `review`).
These are presentation examples, not declarations of supported import formats.
The controller owns readiness, invalidation, original bytes, draft compatibility,
retry identity and acknowledgement. Clicking a step only requests navigation;
resolving an action does not close the modal unless `closeOnSuccess` was explicitly
requested. There is no Enter-key default action.

Update `header`, `feedback` or `footer` with `updateSlots` to leave the mounted
body, input state and focus intact. `feedback: null` removes the message. Identical
messages are not reinserted into the live region. `announcement` is `polite` by
default; use `assertive` only for urgent feedback or `off` for a static summary.
Feedback always has a semantic icon and text label, so color is not its only cue.

### Shared chrome inside an existing dialog

`createModalChrome({ header, feedback, footer, onCloseRequest })` exposes
`headerElement`, `feedbackElement`, `footerElement`, `titleId`, `subtitleId`,
`update(partial)` and `destroy()`. These are Modal-owned parts, not new standalone
catalog components. The existing host places them around its preserved body,
with feedback immediately before the footer. Apply `.s-modal-frame--wizard` to
that host's flex frame; set the dialog's accessible title reference to `titleId`.
The host owns dismissal interception, prior-chrome restoration and focus return.
The helper does not install global handlers or create another dialog.

Partial updates leave omitted parts untouched; `null` clears a part. Destroy
disposes the owned Button/IconButton handlers and removes only these chrome
nodes. `getModalHandle(element)` identifies a native Modal handle; foreign hosts
return `null`. Do not infer native ownership from a CSS class.

### Component lineage and verification

- Header: Modal's semantic title/subtitle layout plus Button actions and an
  IconButton close action.
- Stepper: Modal-owned navigation/list composition plus Button atoms; the
  consumer supplies active state, labels, completion/error state and disabled
  state. It neither persists nor interprets workflow state.
- Feedback: Modal-owned semantic icon, label and wrapping text composition.
- Footer: Modal-owned start/end action groups plus Button atoms. `cancel` maps
  to Button's ghost variant; action loading, disabling and click handling remain
  in Button. Consumer `attributes` on actions/steps accept data-* instrumentation
  only; button semantics stay component-owned.
- Styling: `Modal.css` owns layout; imported Button/IconButton CSS owns atom
  treatment. The GUIDE CSS entry remains an import facade.

Executable consumer tests live in
`guide/shell/js/components/modal-wizard-chrome.test.mjs`: two/three/four-step
plans, source-text feedback, body/focus preservation, pending actions, dismissal
and cleanup. The existing dismissal, padding, sidebar and large-popover suites
also exercise compatibility. In an isolated worktree, verify that the test
resolver imports this worktree's built dependency, not a hub node_modules link.

### Responsibilities outside Modal

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
