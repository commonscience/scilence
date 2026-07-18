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

// ── Card (kanban shell extraction) ──────────────────────────────────────
export { Card, createCard, ALWAYS_VISIBLE_CHROME_IDS } from './components/Card/index.js';
export { mergeCardVariants, resolveCardTokens } from './components/Card/index.js';
export type {
	AlwaysVisibleChromeId,
	CardHandle,
	CardOptions,
	CardSlotName,
	CardVariants,
	Density,
	Elevation,
	Tier,
	Tone,
} from './components/Card/index.js';

// ── Chip (unified chip vocabulary) ──────────────────────────────────────
export { Chip, createChip } from './components/Chip/index.js';
export { mergeChipVariants, resolveChipTokens } from './components/Chip/index.js';
export type {
	ChipHandle,
	ChipOptions,
	ChipVariants,
	Shape,
	Slot,
	Size,
	Tone as ChipTone,
} from './components/Chip/index.js';

// ── Button (pan-app action primitive) ───────────────────────────────────
export { Button, createButton } from './components/Button/index.js';
export { mergeButtonVariants, resolveButtonTokens } from './components/Button/index.js';
export type {
	ButtonHandle,
	ButtonOptions,
	ButtonVariants,
	IconPosition,
	Size as ButtonSize,
	Variant as ButtonVariant,
} from './components/Button/index.js';

// ── InspectorStack (Brief library-inspector-section-stack — Increment 1) ─
// Reusable ordered collapsible right-rail section list — drag + keyboard
// reorder + ARIA live announce + per-surface localStorage persistence.
// Generalized from the notebook inspector widget+stack.
export { createInspectorStack } from './inspector-stack/index.js';
export type {
	InspectorSectionDescriptor,
	InspectorSectionRender,
	InspectorStackHandle,
	InspectorStackOptions,
	InspectorStackStorage,
} from './inspector-stack/index.js';
