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
	FilterRailFooterAction,
	FilterRailFooterConfig,
	FilterRailFooterContext,
	FilterRailFooterShowWhen,
	FilterRailHandle,
	FilterRailSearch,
	FilterSelection,
	FilterSelectionMode,
	RangeConfig,
	RangeSelection,
	TagDimension,
	TagFilterRailConfig,
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

// ── Button (pan-app action control) ─────────────────────────────────────
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

// ── IconButton (icon-only affordance) ───────────────────────────────────
export { IconButton, createIconButton } from './components/IconButton/index.js';
export { mergeIconButtonVariants, resolveIconButtonTokens } from './components/IconButton/index.js';
export type {
	IconButtonHandle,
	IconButtonOptions,
	IconButtonVariants,
	IconButtonShape,
	IconButtonSize,
	IconButtonTone,
} from './components/IconButton/index.js';

// ── Modal (native dialog substrate) ─────────────────────────────────────
export { Modal, createModal } from './components/Modal/index.js';
export { mergeModalVariants, resolveModalTokens } from './components/Modal/index.js';
export type {
	BodySlot,
	BreadcrumbItem,
	BreadcrumbSlot,
	CloseReason,
	FooterAction,
	FooterSlot,
	HeaderAction,
	HeaderSlot,
	ModalConfig,
	ModalHandle,
	ModalLifecycle,
	ModalMode,
	ModalModifier,
	ModalSize,
	ModalSlots,
	ModalVariants,
	SidebarItem,
	SidebarSlot,
	StatusBarSlot,
	StatusItem,
	ToolbarSlot,
	ToolbarTool,
} from './components/Modal/index.js';

// ── Menu (DS_COMPONENTIZATION_CATALOG §A21 — Menu/MenuItem net-new gap) ──
export { Menu, createMenu, isMenuItemDescriptor } from './components/Menu/index.js';
export { mergeMenuVariants, resolveMenuTokens } from './components/Menu/index.js';
export type {
	MenuChrome,
	MenuConfig,
	MenuCustomRow,
	MenuEntry,
	MenuHandle,
	MenuHeader,
	MenuItemDescriptor,
	MenuSeparator,
	MenuSize,
	MenuVariants,
} from './components/Menu/index.js';

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

// ── Tooltip (touch-gated, dictionary-driven) ────────────────────────────
// Canonical pan-app tooltip primitive per
// research/specs/TOOLTIP_AND_GLOSSARY_STANDARD.md (LOCKED 2026-06-29).
// Authored as vanilla JS (production origin: guide/shell/js/components/tooltip,
// PR #572) and mirrored byte-for-byte at ./tooltip as the canonical source; the
// GUIDE importmap + bootstrap consume the guide-local mirror.
//
// Intentionally NOT re-exported here: the resolver's dictionary registry
// (tooltips.json) and glossary adapter (../../data/glossary-data.js) are
// consumer-supplied and remain guide-local (TOOLTIP_DICTIONARY_SPEC.md), so the
// module is JS reference source rather than part of the typed
// @scilence/primitives public API. See ./tooltip/README.md.
