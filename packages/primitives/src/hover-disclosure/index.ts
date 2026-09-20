export type HoverDisclosureState = 'closed' | 'preview' | 'open';

export interface HoverDisclosureGroupParticipant {
  /** Explicitly activated or pinned surfaces must return false. */
  isPreview: () => boolean;
  /** Dismiss only the transient preview; do not move focus. */
  closePreview: () => void;
}

export interface HoverDisclosureGroupHandle {
  claimPreview: () => void;
  destroy: () => void;
}

const previewGroups = new WeakMap<HTMLElement, Set<HoverDisclosureGroupParticipant>>();

/** Share transient hover intent within one toolbar (or another local scope).
 * External controllers can participate without adopting native-popover state.
 * A claim never dismisses explicitly activated or pinned siblings.
 */
export function joinHoverDisclosureGroup(
  group: HTMLElement,
  participant: HoverDisclosureGroupParticipant,
): HoverDisclosureGroupHandle {
  let members = previewGroups.get(group);
  if (!members) {
    members = new Set();
    previewGroups.set(group, members);
  }
  const peers = members;
  // Each registration owns its membership, even if a consumer reuses callbacks.
  const member = { ...participant };
  peers.add(member);
  let disposed = false;
  return {
    claimPreview() {
      if (disposed) return;
      for (const sibling of [...peers]) {
        if (sibling !== member && peers.has(sibling) && sibling.isPreview()) sibling.closePreview();
      }
    },
    destroy() {
      if (disposed) return;
      disposed = true;
      peers.delete(member);
      if (!peers.size) previewGroups.delete(group);
    },
  };
}

export interface HoverDisclosureOptions {
  /** A real button (or an equivalent keyboard-operable trigger). */
  trigger: HTMLElement;
  /** Existing native popover. Contents, styling and placement stay consumer-owned. */
  popover: HTMLElement;
  beforeOpen?: () => void;
  position?: () => void;
  focusFirst?: () => void;
  /** Additional application overlays can veto opening without being dismissed. */
  canOpen?: () => boolean;
  /** Related hover triggers hand off previews within this local scope. */
  previewGroup?: HTMLElement;
  enterDelay?: number;
  leaveDelay?: number;
  onStateChange?: (state: HoverDisclosureState) => void;
}

export interface HoverDisclosureHandle {
  readonly state: HoverDisclosureState;
  open: (options?: { focus?: boolean }) => boolean;
  close: (options?: { restoreFocus?: boolean }) => void;
  destroy: () => void;
}

/** Behavior-only disclosure: hover previews without focus theft; explicit
 * activation keeps the same native popover open. No cloning, styling, routing,
 * storage, Menu rendering or global focus trap is introduced.
 */
export function attachHoverDisclosure(options: HoverDisclosureOptions): HoverDisclosureHandle {
  const { trigger, popover } = options;
  const doc = trigger.ownerDocument;
  const win = doc.defaultView!;
  const hover = win.matchMedia('(hover: hover) and (pointer: fine)');
  const priorExpanded = trigger.getAttribute('aria-expanded');
  const priorPreview = trigger.getAttribute('data-tip-hover-preview');
  const priorState = popover.getAttribute('data-hover-disclosure');
  const cleanup: Array<() => void> = [];
  let state: HoverDisclosureState = 'closed';
  let disposed = false;
  let triggerInside = false;
  let panelInside = false;
  let suppressUntilLeave = false;
  let pointerActivationState: HoverDisclosureState | undefined;
  let enterTimer: ReturnType<typeof setTimeout> | undefined;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;
  const isOpen = () => popover.matches(':popover-open');
  const focusedInside = () => popover.contains(doc.activeElement);
  const clearTimers = () => { clearTimeout(enterTimer); clearTimeout(leaveTimer); };
  const previewGroup = options.previewGroup && joinHoverDisclosureGroup(options.previewGroup, {
    isPreview: () => state === 'preview',
    closePreview: () => { if (state === 'preview') close(); },
  });
  if (previewGroup) cleanup.push(() => previewGroup.destroy());

  function listen(target: EventTarget, type: string, listener: EventListener, capture = false) {
    target.addEventListener(type, listener, capture);
    cleanup.push(() => target.removeEventListener(type, listener, capture));
  }
  function sync(next: HoverDisclosureState) {
    const changed = state !== next;
    state = next;
    trigger.setAttribute('aria-expanded', String(next !== 'closed'));
    popover.setAttribute('data-hover-disclosure', next);
    if (changed) options.onStateChange?.(next);
  }
  function blocked() {
    return !trigger.isConnected || !popover.isConnected
      || trigger.hasAttribute('disabled') || trigger.getAttribute('aria-disabled') === 'true'
      || !!doc.querySelector('dialog[open]')
      || [...doc.querySelectorAll<HTMLElement>('[popover]')].some(other => other !== popover && other.matches(':popover-open'))
      || options.canOpen?.() === false;
  }
  function show(next: 'preview' | 'open', focus: boolean) {
    clearTimers();
    if (disposed) return false;
    // The sibling's departure bridge may still be running. Release only its
    // preview before checking overlay blockers, so intent can hand off once.
    if (next === 'preview') previewGroup?.claimPreview();
    if (blocked()) return false;
    if (!isOpen()) {
      options.beforeOpen?.();
      sync(next);
      try {
        // TS 5.x DOM typings omit the native source option. Keep this local:
        // older browsers ignore it; the pointerdown snapshot covers dismissal.
        (popover as HTMLElement & { showPopover(options?: { source?: HTMLElement }): void })
          .showPopover({ source: trigger });
      } catch { sync('closed'); return false; }
      if (!isOpen()) { sync('closed'); return false; }
      options.position?.();
    } else if (next === 'open') sync('open');
    if (focus) options.focusFirst?.();
    return true;
  }
  function closed() {
    clearTimers();
    suppressUntilLeave = triggerInside;
    panelInside = false;
    sync('closed');
  }
  function close({ restoreFocus = false } = {}) {
    if (disposed) return;
    const wasOpen = state !== 'closed' || isOpen();
    closed();
    if (isOpen()) popover.hidePopover();
    if (wasOpen && restoreFocus) trigger.focus({ preventScroll: true });
  }
  function scheduleLeave() {
    clearTimeout(leaveTimer);
    if (state !== 'preview') return;
    leaveTimer = setTimeout(() => {
      if (!triggerInside && !panelInside && !focusedInside()) close();
    }, options.leaveDelay ?? 260);
  }
  function refreshHover() {
    clearTimeout(enterTimer);
    if (hover.matches) trigger.setAttribute('data-tip-hover-preview', 'true');
    else {
      trigger.removeAttribute('data-tip-hover-preview');
      triggerInside = false;
      suppressUntilLeave = false;
      if (state === 'preview') close();
    }
  }

  listen(trigger, 'pointerenter', event => {
    if ((event as PointerEvent).pointerType !== 'mouse' || !hover.matches) return;
    triggerInside = true;
    clearTimeout(leaveTimer);
    if (state !== 'closed' || suppressUntilLeave) return;
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => {
      if (triggerInside && hover.matches && !suppressUntilLeave) show('preview', false);
    }, options.enterDelay ?? 180);
  });
  listen(trigger, 'pointerleave', () => {
    triggerInside = false;
    suppressUntilLeave = false;
    clearTimeout(enterTimer);
    scheduleLeave();
  });
  listen(popover, 'pointerenter', () => { panelInside = true; clearTimeout(leaveTimer); });
  listen(popover, 'pointerleave', () => { panelInside = false; scheduleLeave(); });
  listen(popover, 'focusin', () => {
    clearTimeout(leaveTimer);
    if (state === 'preview') sync('open');
  });
  listen(popover, 'focusout', () => queueMicrotask(() => { if (!disposed) scheduleLeave(); }));
  // Enter/Space use the button's native activation path. ArrowDown is the
  // additional menu-button shortcut; Menu keeps all in-panel keyboard handling.
  listen(trigger, 'keydown', event => {
    const key = event as KeyboardEvent;
    if (key.key !== 'ArrowDown' || key.defaultPrevented) return;
    key.preventDefault();
    show('open', true);
  });
  listen(trigger, 'pointerdown', () => {
    // Older native-popover implementations can light-dismiss on trigger
    // pointerup before click. Preserve the user's intended toggle either way.
    pointerActivationState = state;
    clearTimers();
  });
  listen(trigger, 'pointercancel', () => { pointerActivationState = undefined; });
  listen(trigger, 'click', event => {
    event.preventDefault();
    const previous = (event as MouseEvent).detail > 0 ? pointerActivationState ?? state : state;
    pointerActivationState = undefined;
    if (previous === 'open') close();
    else show('open', true);
  });
  listen(doc, 'keydown', event => {
    const key = event as KeyboardEvent;
    if (key.key !== 'Escape' || key.defaultPrevented || state === 'closed') return;
    if (doc.querySelector('dialog[open]')) return;
    const restoreFocus = focusedInside();
    key.preventDefault();
    key.stopImmediatePropagation();
    close({ restoreFocus });
  });
  listen(doc, 'pointerdown', event => {
    const target = event.target as Node | null;
    if (target && !trigger.contains(target) && !popover.contains(target)) {
      pointerActivationState = undefined;
      close();
    }
  }, true);
  listen(doc, 'beforetoggle', event => {
    const next = (event as Event & { newState?: string }).newState;
    if (event.target === popover) {
      if (next === 'closed') closed();
      else if (next === 'open' && state === 'closed') sync('open');
    } else if (next === 'open') close();
  }, true);
  listen(popover, 'toggle', () => {
    // Native light-dismiss and external hidePopover calls own their focus.
    // Read actual state: queued toggle events can be coalesced by the browser.
    if (!isOpen()) closed();
    else if (state === 'closed') sync('open');
  });
  listen(win, 'blur', () => close());
  listen(doc, 'visibilitychange', () => { if (doc.hidden) close(); });
  hover.addEventListener('change', refreshHover);
  cleanup.push(() => hover.removeEventListener('change', refreshHover));
  sync(isOpen() ? 'open' : 'closed');
  refreshHover();

  return {
    get state() { return state; },
    open: ({ focus = true } = {}) => show('open', focus),
    close,
    destroy() {
      if (disposed) return;
      close();
      disposed = true;
      clearTimers();
      for (const remove of cleanup) remove();
      for (const [element, name, value] of [
        [trigger, 'aria-expanded', priorExpanded],
        [trigger, 'data-tip-hover-preview', priorPreview],
        [popover, 'data-hover-disclosure', priorState],
      ] as const) {
        if (value === null) element.removeAttribute(name); else element.setAttribute(name, value);
      }
    },
  };
}
