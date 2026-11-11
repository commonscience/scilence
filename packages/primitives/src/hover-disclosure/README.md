# HoverDisclosure

Behavior-only TypeScript controller for an existing native popover and button.
It does not render a menu, clone DOM, move either node, style or position the
surface, persist a preference, or replace the consumer's menu actions.

```ts
import { attachHoverDisclosure, createMenu } from '@scilence/primitives';

const menu = createMenu({ entries, onSelect: selectAction });
popover.append(menu.element); // popover already has popover="auto"
const disclosure = attachHoverDisclosure({
  trigger: button,
  popover,
  previewGroup: toolbar,
  beforeOpen: refreshMenuEntries,
  position: positionFromTrigger,
  focusFirst: () => menu.focusFirst(),
});
// After selecting an action:
disclosure.close({ restoreFocus: true });
// Consumer teardown:
disclosure.destroy();
```

## Interaction contract

- Fine-pointer hover previews after 180ms; leaving both trigger and panel closes
  only a transient preview after 260ms. The gap is traversable without closing.
- Hover never calls `focusFirst`. Clicking the trigger promotes a preview to
  `open`, focuses the menu, and keeps it open through pointer departure. Another
  trigger click closes it. These are session interaction states, not stored pins.
- Enter/Space use the real button's native click. ArrowDown explicitly opens
  and focuses. Existing Menu Arrow/Home/End and disabled-item handling are intact.
- Focus entering a preview makes it explicit. Escape closes and restores the
  trigger only when focus was inside the panel. Outside/native dismissal never
  manually steals focus. Dismissal cancels pending reveal work; pointer exit and
  re-entry are required before another preview while still over the trigger.
- Touch is click-only. `data-tip-hover-preview="true"` is present only when fine
  hover is supported, so the shared Tooltip can defer to the actual disclosure.
- Another open native popover or dialog blocks opening. `canOpen` can also
  protect consumer-specific overlays. Opening another native overlay dismisses
  this disclosure without stealing that overlay's focus.
- Related triggers can opt into the same `previewGroup` element. A new preview
  dismisses sibling **previews** before checking overlay blockers, so the
  260ms departure bridge does not swallow the next trigger's 180ms reveal.
  Activated menus, pinned drawers, unrelated groups and other overlays are
  never dismissed by a hover claim. Group membership ends on teardown.
- `aria-expanded` and `data-hover-disclosure="closed|preview|open"` reflect actual
  disclosure state, including external/native close. Teardown cancels timers,
  removes listeners, and restores the attributes it owned.

The consumer supplies the native popover element/ID, accessible trigger name,
`aria-haspopup`/`aria-controls`, placement, and content. Only one controller may
own a trigger; do not wire a second click toggle or native `popovertarget` action.

## Existing non-popover controllers

A drawer/preview state machine can participate in the same local group without
being replaced by this controller:

```ts
import { joinHoverDisclosureGroup } from '@scilence/primitives';

const previewPeer = joinHoverDisclosureGroup(toolbar, {
  isPreview: () => navigationState === 'preview',
  closePreview: () => closeNavigationPreview(), // no focus change or unpinning
});
// After hover intent matures, immediately before checking overlay blockers:
previewPeer.claimPreview();
if (canPreviewNavigation()) showNavigationPreview();
// Consumer teardown (does not itself alter the consumer's state):
previewPeer.destroy();
```

Call `claimPreview` only for a real hover-preview intent, not on pointer entry,
click activation or pinning. The group element is an identity/scope boundary;
it need not contain every panel, and the helper does not query or mutate DOM.
The owning controller remains responsible for its own preview timers and cleanup.

Focused consumer-side tests (use the existing GUIDE Happy DOM dependency):

```sh
node --test guide/shell/js/components/hover-disclosure-primitive.test.mjs
```

Browser tests remain responsible for native light-dismiss, real Enter/Space
activation, pointer hit geometry, and menu placement across the inter-element gap.
