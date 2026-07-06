/**
 * Tooltip — pan-app primitive (touch-gated, dictionary-driven).
 *
 * Canonical source: scilence/packages/primitives/src/tooltip/. The GUIDE shell
 * consumes a byte-identical mirror at guide/shell/js/components/tooltip/
 * (importmap + bootstrap target); the two copies are kept in sync — the known
 * scilence<->guide primitives duplication.
 *
 * Per research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md (LOCKED 2026-06-29).
 *
 * Capabilities:
 *   createTooltip(container, opts)  — hover + keyboard-focus + portal (existing),
 *                                     now touch-gated + aria-describedby wiring.
 *   attachTooltip(el, { key | text })  — wire a tooltip onto an existing element
 *                                     in place (no wrapper), resolving copy from
 *                                     the dictionary when `key`/`data-tip` is set.
 *   attachTooltips(root)            — scan a subtree for [data-tip] and wire each.
 *
 * Touch gating: tooltips activate only under
 *   @media (hover: hover) and (pointer: fine)
 * plus a JS pointer-capability check. On touch-only devices nothing fires;
 * the same content stays reachable via the glossary page.
 */

import { resolveTooltip, resolveTooltipText } from "./dictionary.js";

const STYLE_ID = "s-tooltip-styles";
const PORTAL_CLASS = "s-tooltip-portal";

let uidCounter = 0;
function nextTipId() {
  uidCounter += 1;
  return `s-tip-${uidCounter}`;
}

/**
 * JS pointer-capability check, mirroring the CSS gate. Returns true only when
 * the primary input is a fine cursor that can hover (desktop, trackpad,
 * stylus-with-hover). False on touch-only — and conservatively true when
 * matchMedia is unavailable (SSR / test harness) so behavior is wired but the
 * CSS gate still suppresses paint on touch.
 * @returns {boolean}
 */
export function supportsHoverPointer() {
  try {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  } catch {
    return true;
  }
}

function ensureStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;
  const styleEl = document.createElement("style");
  styleEl.id = STYLE_ID;
  styleEl.textContent = getStyles();
  document.head.appendChild(styleEl);
}

/**
 * Wire hover/focus tooltip behavior onto a single existing trigger element.
 * Does NOT replace or wrap the element. Resolves copy from the dictionary
 * when a `key` (or the element's `data-tip`) is provided; an explicit `text`
 * wins. Installs `aria-describedby` pointing at a hidden, glossary-aware
 * description node so screen readers and keyboard users get the same content.
 *
 * @param {HTMLElement} el
 * @param {Object} [options]
 * @param {string} [options.key]       dictionary key (else el.dataset.tip)
 * @param {string} [options.text]      explicit content (overrides dictionary)
 * @param {'top'|'bottom'|'left'|'right'} [options.position='top']
 * @param {number} [options.delay=200]
 * @returns {{ destroy: Function, update: Function }}
 */
export function attachTooltip(el, options = {}) {
  ensureStyles();

  let position = options.position || "top";
  let delay = typeof options.delay === "number" ? options.delay : 200;
  let timeout = null;
  let hideTimeout = null;
  let portalEl = null;

  // Resolve content: explicit text wins; else dictionary key; else data-tip.
  const key = options.key || (el.dataset ? el.dataset.tip : "");
  /** @type {import('./dictionary.js').ResolvedTooltip | null} */
  let resolved = key ? resolveTooltip(key) : null;
  let text =
    typeof options.text === "string" && options.text
      ? options.text
      : key
        ? resolveTooltipText(key)
        : "";

  // a11y: a hidden description node, referenced via aria-describedby. Reachable
  // by screen readers and touch users even when the visual tooltip is gated off.
  let descId = el.getAttribute("aria-describedby") || nextTipId();
  let descEl = document.getElementById(descId);
  if (!descEl && text) {
    descEl = document.createElement("span");
    descEl.id = descId;
    descEl.className = "s-tooltip-sr-only";
    descEl.textContent = ariaText(resolved, text);
    el.appendChild(descEl);
    el.setAttribute("aria-describedby", descId);
  }

  function show() {
    if (!supportsHoverPointer()) return; // touch-only: never paint
    if (!text) return;
    clearTimeout(hideTimeout);
    timeout = setTimeout(positionPortal, delay);
  }

  function cancelHide() {
    clearTimeout(hideTimeout);
  }

  function hide() {
    clearTimeout(timeout);
    // Grace period so the cursor can travel from the trigger into the portal
    // (a document.body child, not a descendant of the trigger) to reach the
    // "more in glossary" link before mouseleave tears it down.
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(removePortal, 140);
  }

  function positionPortal() {
    removePortal();
    const rect = el.getBoundingClientRect();
    const node = document.createElement("span");
    node.className = PORTAL_CLASS;
    node.setAttribute("role", "tooltip");
    renderPortalContent(node, resolved, text);

    Object.assign(node.style, portalBaseStyles());
    document.body.appendChild(node);
    portalEl = node;
    // Keep the portal alive while the cursor is over it, so a glossary link
    // inside it is clickable; leaving the portal dismisses it.
    node.addEventListener("mouseenter", cancelHide);
    node.addEventListener("mouseleave", hide);

    const tipRect = node.getBoundingClientRect();
    const gap = 6;
    let top;
    let left;
    switch (position) {
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tipRect.height / 2;
        left = rect.left - tipRect.width - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tipRect.height / 2;
        left = rect.right + gap;
        break;
      default:
        top = rect.top - tipRect.height - gap;
        left = rect.left + rect.width / 2 - tipRect.width / 2;
    }
    left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));
    top = Math.max(4, Math.min(top, window.innerHeight - tipRect.height - 4));
    node.style.top = `${top}px`;
    node.style.left = `${left}px`;
    requestAnimationFrame(() => {
      if (portalEl === node) node.style.opacity = "1";
    });
  }

  function removePortal() {
    if (portalEl) {
      portalEl.remove();
      portalEl = null;
    }
  }

  el.addEventListener("mouseenter", show);
  el.addEventListener("mouseleave", hide);
  el.addEventListener("focusin", show);
  el.addEventListener("focusout", hide);

  function update(newOptions = {}) {
    if (newOptions.position !== undefined) position = newOptions.position;
    if (newOptions.delay !== undefined) delay = newOptions.delay;
    const nextKey = newOptions.key !== undefined ? newOptions.key : key;
    if (typeof newOptions.text === "string") {
      text = newOptions.text;
      resolved = null;
    } else if (newOptions.key !== undefined) {
      resolved = nextKey ? resolveTooltip(nextKey) : null;
      text = nextKey ? resolveTooltipText(nextKey) : "";
    }
    if (descEl) descEl.textContent = ariaText(resolved, text);
  }

  function destroy() {
    clearTimeout(timeout);
    clearTimeout(hideTimeout);
    removePortal();
    el.removeEventListener("mouseenter", show);
    el.removeEventListener("mouseleave", hide);
    el.removeEventListener("focusin", show);
    el.removeEventListener("focusout", hide);
    if (descEl && descEl.parentNode === el) descEl.remove();
  }

  return { destroy, update };
}

/**
 * Scan a subtree for `[data-tip]` elements and wire each via attachTooltip.
 * Idempotent per element (marks `data-tip-wired`). Returns the handles so a
 * page can tear them down on unmount.
 *
 * @param {ParentNode} [root=document]
 * @param {Object} [options]
 * @param {'top'|'bottom'|'left'|'right'} [options.position]
 * @returns {{ destroy: Function }}
 */
export function attachTooltips(root = document, options = {}) {
  const handles = [];
  const scope = root || document;
  const nodes = scope.querySelectorAll
    ? scope.querySelectorAll("[data-tip]")
    : [];
  nodes.forEach((el) => {
    if (el.getAttribute("data-tip-wired") === "1") return;
    el.setAttribute("data-tip-wired", "1");
    const pos = el.dataset.tipPosition || options.position;
    handles.push(attachTooltip(el, pos ? { position: pos } : {}));
  });
  return {
    destroy() {
      handles.forEach((h) => h.destroy());
    },
  };
}

/**
 * Text used for the aria-describedby description node. Includes the glossary
 * definition when the entry links a concept, so non-visual users get the same
 * depth the hover tooltip shows.
 * @param {import('./dictionary.js').ResolvedTooltip | null} resolved
 * @param {string} fallback
 * @returns {string}
 */
function ariaText(resolved, fallback) {
  if (!resolved || !resolved.found) return fallback;
  const parts = [];
  if (resolved.label) parts.push(resolved.label);
  if (resolved.summary && resolved.summary !== resolved.label) {
    parts.push(resolved.summary);
  }
  if (resolved.glossaryDefinition) parts.push(resolved.glossaryDefinition);
  return parts.join(" — ") || fallback;
}

/**
 * Render the portal node content. Plain text by default; when the entry links
 * a glossary concept, append the definition + a "more in glossary" link.
 * @param {HTMLElement} node
 * @param {import('./dictionary.js').ResolvedTooltip | null} resolved
 * @param {string} fallback
 */
function renderPortalContent(node, resolved, fallback) {
  if (!resolved || !resolved.found || (!resolved.summary && !resolved.glossaryDefinition)) {
    node.textContent = resolved && resolved.found ? resolved.label : fallback;
    return;
  }
  node.classList.add("s-tooltip-portal--rich");
  const head = document.createElement("span");
  head.className = "s-tooltip-portal__label";
  head.textContent = resolved.summary || resolved.label;
  node.appendChild(head);

  if (resolved.glossaryDefinition) {
    const def = document.createElement("span");
    def.className = "s-tooltip-portal__def";
    def.textContent = resolved.glossaryDefinition;
    node.appendChild(def);

    if (resolved.glossaryHref) {
      const link = document.createElement("a");
      link.className = "s-tooltip-portal__link";
      link.href = resolved.glossaryHref;
      link.textContent = "more in glossary";
      node.appendChild(link);
    }
  }
}

function portalBaseStyles() {
  return {
    position: "fixed",
    zIndex: "9999",
    maxWidth: "min(20rem, 80vw)",
    padding: "var(--s-space-2) var(--s-space-3)",
    background: "var(--s-color-fg-primary)",
    color: "var(--s-color-bg-surface)",
    fontFamily: "var(--s-font-sans)",
    fontSize: "var(--s-font-size--1)",
    lineHeight: "1.35",
    borderRadius: "var(--s-radius-1)",
    pointerEvents: "auto",
    opacity: "0",
    transition: "opacity 80ms ease-out",
  };
}

/**
 * Existing wrapper-mode tooltip (back-compat). Wraps its container content in
 * a positioned wrapper. Now touch-gated + aria-describedby on the wrapper.
 *
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {string} [options.text]
 * @param {string} [options.key]        dictionary key (resolves text)
 * @param {'top'|'bottom'|'left'|'right'} [options.position='top']
 * @param {number} [options.delay=200]
 * @param {boolean} [options.portal=false]
 * @param {Function} [options.renderContent]
 * @returns {{ destroy: Function, update: Function }}
 */
export function createTooltip(container, options = {}) {
  let {
    text = "",
    key,
    position = "top",
    delay = 200,
    portal = false,
    renderContent,
  } = options;

  if (!text && key) text = resolveTooltipText(key);

  ensureStyles();

  let timeout = null;
  let portalEl = null;
  let wrapperEl = null;
  let descId = null;

  function show() {
    if (!supportsHoverPointer()) return;
    timeout = setTimeout(() => {
      if (portal) positionPortal();
      else renderInline();
    }, delay);
  }

  function hide() {
    clearTimeout(timeout);
    removePortal();
    if (wrapperEl) {
      const tip = wrapperEl.querySelector(".s-tooltip");
      if (tip) tip.remove();
    }
  }

  function positionPortal() {
    if (!wrapperEl || !text) return;
    removePortal();
    const rect = wrapperEl.getBoundingClientRect();
    const el = document.createElement("span");
    el.className = PORTAL_CLASS;
    el.setAttribute("role", "tooltip");
    el.textContent = text;
    Object.assign(el.style, { ...portalBaseStyles(), whiteSpace: "nowrap", pointerEvents: "none" });
    document.body.appendChild(el);
    portalEl = el;

    const tipRect = el.getBoundingClientRect();
    const gap = 6;
    let top;
    let left;
    switch (position) {
      case "bottom":
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tipRect.width / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tipRect.height / 2;
        left = rect.left - tipRect.width - gap;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tipRect.height / 2;
        left = rect.right + gap;
        break;
      default:
        top = rect.top - tipRect.height - gap;
        left = rect.left + rect.width / 2 - tipRect.width / 2;
    }
    left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));
    top = Math.max(4, Math.min(top, window.innerHeight - tipRect.height - 4));
    el.style.top = `${top}px`;
    el.style.left = `${left}px`;
    requestAnimationFrame(() => {
      if (portalEl === el) el.style.opacity = "1";
    });
  }

  function removePortal() {
    if (portalEl) {
      portalEl.remove();
      portalEl = null;
    }
  }

  function renderInline() {
    if (!wrapperEl || !text) return;
    if (wrapperEl.querySelector(".s-tooltip")) return;
    const tip = document.createElement("span");
    tip.className = `s-tooltip s-tooltip--${position}`;
    tip.setAttribute("role", "tooltip");
    tip.textContent = text;
    wrapperEl.appendChild(tip);
  }

  function render() {
    container.innerHTML = "";
    removePortal();
    wrapperEl = document.createElement("span");
    wrapperEl.className = "s-tooltip-wrapper";
    wrapperEl.addEventListener("mouseenter", show);
    wrapperEl.addEventListener("mouseleave", hide);
    wrapperEl.addEventListener("focusin", show);
    wrapperEl.addEventListener("focusout", hide);

    if (text) {
      descId = descId || nextTipId();
      const desc = document.createElement("span");
      desc.id = descId;
      desc.className = "s-tooltip-sr-only";
      desc.textContent = text;
      wrapperEl.appendChild(desc);
      wrapperEl.setAttribute("aria-describedby", descId);
    }

    if (renderContent) renderContent(wrapperEl);
    container.appendChild(wrapperEl);
  }

  function update(newOptions) {
    if (newOptions.text !== undefined) text = newOptions.text;
    if (newOptions.key !== undefined) text = resolveTooltipText(newOptions.key);
    if (newOptions.position !== undefined) position = newOptions.position;
    if (newOptions.delay !== undefined) delay = newOptions.delay;
    if (newOptions.portal !== undefined) portal = newOptions.portal;
    if (newOptions.renderContent !== undefined) renderContent = newOptions.renderContent;
    render();
  }

  function destroy() {
    clearTimeout(timeout);
    removePortal();
    container.innerHTML = "";
  }

  render();
  return { destroy, update };
}

function getStyles() {
  return `
    .s-tooltip-wrapper { position: relative; display: inline-flex; }

    .s-tooltip-sr-only {
      position: absolute;
      width: 1px; height: 1px;
      padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0 0 0 0);
      white-space: nowrap; border: 0;
    }

    .s-tooltip {
      position: absolute;
      z-index: 9999;
      padding: var(--s-space-2) var(--s-space-3);
      background: var(--s-color-fg-primary);
      color: var(--s-color-bg-surface);
      font-family: var(--s-font-sans);
      font-size: var(--s-font-size--1);
      line-height: 1.2;
      border-radius: var(--s-radius-1);
      white-space: nowrap;
      pointer-events: none;
      animation: s-tooltip-in 80ms ease-out;
    }

    .s-tooltip--top { bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
    .s-tooltip--bottom { top: calc(100% + 6px); left: 50%; transform: translateX(-50%); }
    .s-tooltip--left { right: calc(100% + 6px); top: 50%; transform: translateY(-50%); }
    .s-tooltip--right { left: calc(100% + 6px); top: 50%; transform: translateY(-50%); }

    .s-tooltip-portal--rich {
      display: flex;
      flex-direction: column;
      gap: var(--s-space-2);
      white-space: normal;
    }
    .s-tooltip-portal__label { font-weight: 600; }
    .s-tooltip-portal__def { opacity: 0.85; }
    .s-tooltip-portal__link {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
      font-size: var(--s-font-size--1);
    }

    /* Touch-only suppression: mirror the JS gate so nothing paints even if
       a stray event fires on a coarse-pointer device. */
    @media not all and (hover: hover) and (pointer: fine) {
      .s-tooltip, .s-tooltip-portal { display: none !important; }
    }

    @keyframes s-tooltip-in { from { opacity: 0; } to { opacity: 1; } }
  `;
}
