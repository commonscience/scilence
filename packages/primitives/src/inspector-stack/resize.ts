/** Shared inspector-body sizing. Pointer cancellation never commits a partial
 * drag; layout persistence belongs to the host, not the scientific document. */
export const INSPECTOR_MIN_HEIGHT = 88;
export const INSPECTOR_MAX_HEIGHT = 720;
export function clampInspectorHeight(value: unknown, fallback: number): number {
  return Math.max(INSPECTOR_MIN_HEIGHT, Math.min(INSPECTOR_MAX_HEIGHT, Math.round(typeof value === 'number' && Number.isFinite(value) ? value : fallback)));
}
export function attachInspectorResize(options: {
  card: HTMLElement; body: HTMLElement; moduleId: string; title: string;
  defaultHeightPx: number; onCommit?: (id: string, height: number) => void;
}) {
  const { card, body, moduleId, title, defaultHeightPx } = options;
  const doc = card.ownerDocument, win = doc.defaultView!;
  const handle = doc.createElement('div'); handle.className = 'rail-module__resize';
  handle.dataset.railModuleResize = moduleId; handle.tabIndex = 0;
  handle.setAttribute('role', 'separator'); handle.setAttribute('aria-orientation', 'horizontal');
  handle.setAttribute('aria-label', `Resize ${title}`);
  handle.setAttribute('aria-description', 'Drag or use Up and Down to resize. Escape cancels a drag. Double-click resets.');
  handle.setAttribute('aria-valuemin', String(INSPECTOR_MIN_HEIGHT)); handle.setAttribute('aria-valuemax', String(INSPECTOR_MAX_HEIGHT));
  card.append(handle);
  let height = clampInspectorHeight(defaultHeightPx, 260);
  let drag: { pointer: number; y: number; height: number; previous: number; sized: boolean } | null = null;
  function paint() { body.style.setProperty('--rail-module-h', `${height}px`); handle.setAttribute('aria-valuenow', String(height)); }
  function setHeight(px: number, opts: { commit?: boolean } = {}) {
    height = clampInspectorHeight(px, defaultHeightPx); body.dataset.userSized = 'true'; paint();
    if (opts.commit) options.onCommit?.(moduleId, height);
  }
  function finish(commit: boolean) {
    if (!drag) return;
    const start = drag; drag = null; delete handle.dataset.dragging;
    doc.documentElement.classList.remove('inspector-is-resizing');
    win.removeEventListener('pointermove', move); win.removeEventListener('pointerup', up); win.removeEventListener('pointercancel', cancel);
    doc.removeEventListener('keydown', escape, true);
    try { handle.releasePointerCapture(start.pointer); } catch { /* detached pointer */ }
    if (commit) options.onCommit?.(moduleId, height);
    else { height = start.previous; if (!start.sized) delete body.dataset.userSized; paint(); }
  }
  function move(event: PointerEvent) { if (drag && drag.pointer === event.pointerId) setHeight(drag.height + event.clientY - drag.y); }
  function up(event: PointerEvent) { if (drag?.pointer === event.pointerId) finish(true); }
  function cancel(event: PointerEvent) { if (drag?.pointer === event.pointerId) finish(false); }
  function escape(event: KeyboardEvent) { if (event.key === 'Escape' && drag) { event.preventDefault(); event.stopImmediatePropagation(); finish(false); handle.focus(); } }
  function down(event: PointerEvent) {
    if (event.button !== 0 || drag) return;
    event.preventDefault(); event.stopPropagation(); handle.focus({ preventScroll: true });
    drag = { pointer: event.pointerId, y: event.clientY, height: body.getBoundingClientRect().height || height, previous: height, sized: body.dataset.userSized === 'true' };
    handle.dataset.dragging = 'true'; doc.documentElement.classList.add('inspector-is-resizing');
    try { handle.setPointerCapture(event.pointerId); } catch { /* window listeners still own the gesture */ }
    win.addEventListener('pointermove', move); win.addEventListener('pointerup', up); win.addEventListener('pointercancel', cancel);
    doc.addEventListener('keydown', escape, true);
  }
  function key(event: KeyboardEvent) {
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    setHeight(event.key === 'Home' ? INSPECTOR_MIN_HEIGHT : event.key === 'End' ? INSPECTOR_MAX_HEIGHT : (body.getBoundingClientRect().height || height) + (event.key === 'ArrowDown' ? 8 : -8), { commit: true });
  }
  function reset() { setHeight(defaultHeightPx, { commit: true }); }
  function lost() { finish(false); }
  handle.addEventListener('pointerdown', down); handle.addEventListener('lostpointercapture', lost);
  handle.addEventListener('keydown', key); handle.addEventListener('dblclick', reset); paint();
  return { setHeight, getHeight: () => height, destroy() {
    finish(false); handle.removeEventListener('pointerdown', down); handle.removeEventListener('lostpointercapture', lost);
    handle.removeEventListener('keydown', key); handle.removeEventListener('dblclick', reset); handle.remove();
  } };
}
