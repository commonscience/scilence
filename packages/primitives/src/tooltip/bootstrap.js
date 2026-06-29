/**
 * Tooltip registry bootstrap.
 *
 * Loads the shipped dictionary (guide/shell/data/tooltips.json) into the
 * resolver once, at shell boot, so any `data-tip="<key>"` rendered by a
 * surface resolves to copy. Imported as a module script from index.html.
 *
 * Idempotent — loadTooltipRegistry() no-ops once installed. A fetch failure
 * is logged but non-fatal: keyed indicators degrade to their bare key + the
 * declare-or-warn dev notice, never a hard crash.
 *
 * Per research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md (LOCKED 2026-06-29).
 */

import { loadTooltipRegistry, attachTooltips } from "./index.js";

loadTooltipRegistry()
  .then(() => {
    // Wire any already-rendered [data-tip] elements, then keep wiring new ones
    // as surfaces mount (page-loader swaps content under #app).
    attachTooltips(document);
    observeTooltips();
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.warn("[tooltip] registry bootstrap failed (non-fatal):", err);
  });

/**
 * Observe the document for newly-inserted [data-tip] nodes and wire them.
 * Debounced via microtask batching so a burst of DOM writes triggers a single
 * scan. attachTooltips() is idempotent per element (data-tip-wired marker).
 */
function observeTooltips() {
  if (typeof MutationObserver === "undefined") return;
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      attachTooltips(document);
    });
  };
  const obs = new MutationObserver((records) => {
    for (const rec of records) {
      if (rec.addedNodes && rec.addedNodes.length) {
        schedule();
        return;
      }
    }
  });
  obs.observe(document.body, { childList: true, subtree: true });
}
