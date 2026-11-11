const modalities = /* @__PURE__ */ new WeakMap();
function retainModality(doc) {
  const existing = modalities.get(doc);
  if (existing) {
    existing.users++;
    return existing;
  }
  const state = { pointer: false, users: 1, destroy };
  const onPointer = () => {
    state.pointer = true;
  };
  const onKey = () => {
    state.pointer = false;
  };
  doc.addEventListener("pointerdown", onPointer, true);
  doc.addEventListener("mousedown", onPointer, true);
  doc.addEventListener("keydown", onKey, true);
  function destroy() {
    if (--state.users > 0) return;
    doc.removeEventListener("pointerdown", onPointer, true);
    doc.removeEventListener("mousedown", onPointer, true);
    doc.removeEventListener("keydown", onKey, true);
    modalities.delete(doc);
  }
  modalities.set(doc, state);
  return state;
}
function createTooltipTriggerPolicy(element, onInvalidate) {
  const doc = element.ownerDocument;
  const modality = retainModality(doc);
  let disposed = false;
  let keyboardFocus = false;
  let pointerInside = element.matches(":hover");
  const enabled = () => element.getAttribute("data-tip-hover-preview") === "true";
  const canReveal = () => !disposed && (!enabled() || keyboardFocus && !pointerInside && element.contains(doc.activeElement) && element.getAttribute("aria-expanded") !== "true");
  const onPointerEnter = () => {
    pointerInside = true;
    keyboardFocus = false;
    if (enabled()) onInvalidate();
  };
  const onPointerLeave = () => {
    pointerInside = false;
    keyboardFocus = false;
  };
  const onPointerDown = () => {
    pointerInside = true;
    keyboardFocus = false;
    if (enabled()) onInvalidate();
  };
  element.addEventListener("pointerenter", onPointerEnter, true);
  element.addEventListener("mouseenter", onPointerEnter, true);
  element.addEventListener("pointerleave", onPointerLeave, true);
  element.addEventListener("mouseleave", onPointerLeave, true);
  element.addEventListener("pointerdown", onPointerDown, true);
  const Observer = doc.defaultView.MutationObserver;
  const observer = new Observer((records) => {
    if (!disposed && records.some((record) => record.attributeName !== "aria-expanded" || enabled())) onInvalidate();
  });
  observer.observe(element, { attributes: true, attributeFilter: ["data-tip-hover-preview", "aria-expanded", "data-tip-surface"] });
  return {
    /** Call before scheduling pointer/focus reveals. Keyboard-like programmatic
     * or assistive focus is supported unless the preceding input was a pointer.
     */
    allows(event) {
      if (disposed) return false;
      if (event.type === "focusin") keyboardFocus = !modality.pointer;
      else if (event.type === "mouseenter" || event.type === "pointerdown") {
        pointerInside = true;
        keyboardFocus = false;
      }
      if (!enabled()) return true;
      return event.type === "focusin" && canReveal();
    },
    /** Recheck immediately before delayed, q-key, or long-press painting. */
    canReveal,
    destroy() {
      if (disposed) return;
      disposed = true;
      observer.disconnect();
      modality.destroy();
      element.removeEventListener("pointerdown", onPointerDown, true);
      element.removeEventListener("pointerenter", onPointerEnter, true);
      element.removeEventListener("mouseenter", onPointerEnter, true);
      element.removeEventListener("pointerleave", onPointerLeave, true);
      element.removeEventListener("mouseleave", onPointerLeave, true);
    }
  };
}
export {
  createTooltipTriggerPolicy
};
