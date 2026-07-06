/**
 * Tooltip dictionary — the keyed registry.
 *
 * Maps a stable key -> resolved tooltip content. The registry data lives in
 * `guide/shell/data/tooltips.json` (78+ entries, voice-reviewed); a
 * dictionary entry MAY carry a `glossaryRef` that resolves into the shared
 * product glossary (`js/data/glossary-data.js`) for the deeper concept
 * definition + a "more in glossary" deep-link.
 *
 * Per research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md (LOCKED 2026-06-29):
 *   key -> { label, summary, glossaryRef? }   (the standard's shape)
 *
 * The on-disk registry uses the established `tooltips.json` schema
 * (`text` / `extended` / `voice` / `scope` / `status`) per
 * research/specs/TOOLTIP_DICTIONARY_SPEC.md. This resolver normalizes BOTH
 * shapes into one `ResolvedTooltip` so authors never re-key existing entries:
 *
 *   text     -> label   (the short single-line name)
 *   extended -> summary  (the longer plain-language explanation), falling
 *               back to `text` when no `extended` is present
 *   glossaryRef passes through (new optional field on registry entries)
 *
 * Enforcement (declare-or-warn): resolving an unknown key returns a
 * structured miss and emits a single dev `console.warn` per key. A keyed
 * indicator therefore cannot silently render with no copy — the miss is
 * visible. (The structural default; the `tooltip-audit.mjs` gate is the
 * backstop scan.)
 */

import { lookupGlossaryTerm, glossaryHref } from "../../data/glossary-data.js";

/**
 * @typedef {Object} ResolvedTooltip
 * @property {string} key
 * @property {string} label             short single-line name
 * @property {string} summary           plain-language explanation (1-2 sentences)
 * @property {string|undefined} glossaryRef   optional glossary term key
 * @property {string|undefined} glossaryTerm  resolved glossary term name (if glossaryRef hit)
 * @property {string|undefined} glossaryDefinition  resolved glossary definition
 * @property {string|undefined} glossaryHref  deep-link into the glossary page
 * @property {boolean} found            false when the key is missing from the registry
 */

let REGISTRY = null;
const warnedKeys = new Set();

/**
 * Detect a dev (non-production) context for the declare-or-warn behavior.
 * Production builds set window.__GUIDE_ENV__ = "production" (see shell boot).
 * @returns {boolean}
 */
function isDev() {
  try {
    if (typeof window !== "undefined" && window.__GUIDE_ENV__) {
      return window.__GUIDE_ENV__ !== "production";
    }
  } catch {
    /* no window */
  }
  return true;
}

/**
 * Install the registry (the parsed contents of tooltips.json). Strips
 * `$`-prefixed meta keys. Idempotent; the most recent install wins.
 * @param {Record<string, unknown>} raw
 */
export function setTooltipRegistry(raw) {
  const entries = {};
  if (raw && typeof raw === "object") {
    for (const k of Object.keys(raw)) {
      if (k.startsWith("$")) continue;
      entries[k] = raw[k];
    }
  }
  REGISTRY = entries;
  warnedKeys.clear();
}

/**
 * Whether a registry has been installed yet.
 * @returns {boolean}
 */
export function hasTooltipRegistry() {
  return REGISTRY !== null;
}

/**
 * Fetch + install the registry from the shipped JSON. Safe to call more than
 * once; subsequent calls no-op once installed. Returns the entry count.
 * @param {string} [url]
 * @returns {Promise<number>}
 */
export async function loadTooltipRegistry(url = "/admin/data/tooltips.json") {
  if (REGISTRY !== null) return Object.keys(REGISTRY).length;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`tooltip registry fetch failed: ${res.status} ${url}`);
  }
  const raw = await res.json();
  setTooltipRegistry(raw);
  return Object.keys(REGISTRY).length;
}

/**
 * Resolve a key into normalized tooltip content. Missing keys return
 * `{ found: false }` and warn once (dev only) — declare-or-warn.
 *
 * @param {string} key
 * @returns {ResolvedTooltip}
 */
export function resolveTooltip(key) {
  const registry = REGISTRY || {};
  const raw = registry[key];

  if (!raw || typeof raw !== "object") {
    if (isDev() && !warnedKeys.has(key)) {
      warnedKeys.add(key);
      // eslint-disable-next-line no-console
      console.warn(
        `[tooltip] missing dictionary entry for data-tip="${key}". ` +
          `Add it to guide/shell/data/tooltips.json ` +
          `(per research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md).`,
      );
    }
    return {
      key,
      label: key,
      summary: "",
      glossaryRef: undefined,
      glossaryTerm: undefined,
      glossaryDefinition: undefined,
      glossaryHref: undefined,
      found: false,
    };
  }

  // Normalize both schema shapes into { label, summary }.
  const label =
    typeof raw.label === "string" && raw.label
      ? raw.label
      : typeof raw.text === "string"
        ? raw.text
        : key;
  const summary =
    typeof raw.summary === "string" && raw.summary
      ? raw.summary
      : typeof raw.extended === "string" && raw.extended
        ? raw.extended
        : "";

  const glossaryRef =
    typeof raw.glossaryRef === "string" && raw.glossaryRef
      ? raw.glossaryRef
      : undefined;

  let glossaryTerm;
  let glossaryDefinition;
  let href;
  if (glossaryRef) {
    const term = lookupGlossaryTerm(glossaryRef);
    if (term) {
      glossaryTerm = term.term;
      glossaryDefinition = term.definition;
      href = glossaryHref(term.key);
    } else if (isDev() && !warnedKeys.has(`gref:${glossaryRef}`)) {
      warnedKeys.add(`gref:${glossaryRef}`);
      // eslint-disable-next-line no-console
      console.warn(
        `[tooltip] data-tip="${key}" references unknown glossary term ` +
          `"${glossaryRef}". Add it to js/data/glossary-data.js or remove the ref.`,
      );
    }
  }

  return {
    key,
    label,
    summary,
    glossaryRef,
    glossaryTerm,
    glossaryDefinition,
    glossaryHref: href,
    found: true,
  };
}

/**
 * Resolve to a single plain-text string suitable for a bare tooltip / a
 * `title`-style fallback. Combines label + summary when distinct.
 * @param {string} key
 * @returns {string}
 */
export function resolveTooltipText(key) {
  const r = resolveTooltip(key);
  if (!r.found) return "";
  if (r.summary && r.summary !== r.label) {
    return `${r.label} — ${r.summary}`;
  }
  return r.label;
}
