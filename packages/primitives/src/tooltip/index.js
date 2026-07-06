/**
 * Tooltip primitive — pan-app barrel.
 *
 * Touch-gated, dictionary-driven tooltip primitive + its keyed registry
 * resolver. Per research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md
 * (LOCKED 2026-06-29).
 *
 * Canonical source: scilence/packages/primitives/src/tooltip/.
 * The GUIDE shell consumes a byte-identical mirror at
 * guide/shell/js/components/tooltip/ (importmap + bootstrap target); the two
 * copies are kept in sync — the known scilence<->guide primitives duplication.
 */

export {
  createTooltip,
  attachTooltip,
  attachTooltips,
  supportsHoverPointer,
} from "./tooltip.js";

export {
  resolveTooltip,
  resolveTooltipText,
  setTooltipRegistry,
  hasTooltipRegistry,
  loadTooltipRegistry,
} from "./dictionary.js";
