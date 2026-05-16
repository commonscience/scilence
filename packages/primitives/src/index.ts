// @scilence/primitives — public API barrel
//
// Pan-app vanilla TS/JS design system primitives.
// Atoms + composite primitives consumable from any STEAMCO surface
// (admin shell, marketing site, public docs, future surfaces).
//
// First occupant: FilterRail (see Brief 103 — guide-shell-v5-section-state-left-rail.md).

// ── FilterRail (Brief 103) ──────────────────────────────────────────────
export { createFilterRail } from './filter-rail/index.js';
export type {
	DatePickerFactory,
	FilterGroupConfig,
	FilterGroupSelection,
	FilterOption,
	FilterRailConfig,
	FilterRailHandle,
	FilterRailSearch,
	FilterSelection,
	FilterSelectionMode,
	RangeConfig,
	RangeSelection,
} from './filter-rail/index.js';
