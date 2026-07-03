/**
 * FilterRail — public types.
 *
 * `FilterRail` is the canonical pan-app DS primitive for a dense, grouped,
 * left-rail filter UI in the Hugging Face register (search-at-top,
 * mono-caps grouped sections, chip multi-select with counts, +more for
 * long sets, range picker for date dimensions).
 *
 * ## Per-surface invocation principle
 *
 * **Each surface chooses its own dimensions; this component does NOT
 * prescribe a universal filter set.** Operations admin uses
 * workstream/status/tier/age/effort/class/owner/iteration/dependency.
 * A future Libraries surface might use type/version/owner/last-modified.
 * A future Lab-tools surface might use category/integration-status/owner.
 * Same `<FilterRail>` component, different `FilterRailConfig`. Pick what
 * makes sense for the surface; don't carry over what doesn't apply.
 *
 * @see ../../../research/flywheel/handoffs/briefs/guide-shell-v5-section-state-left-rail.md
 * @see ../../../research/memory-drops/feedback_scilence_components_dir_should_exist.md
 */

// ── Selection-mode taxonomy ────────────────────────────────────────────────

/**
 * How a single filter group resolves selection.
 *
 * - `single`       — one value selected at a time (radiogroup semantics)
 * - `multi`        — zero-or-more values; chips toggle independently
 * - `range`        — date / numeric range; composes a RangePicker
 * - `toggle-pair`  — exactly two booleans (e.g. "Has unmet deps" /
 *                    "Blocks others"); each toggle is independent
 */
export type FilterSelectionMode = 'single' | 'multi' | 'range' | 'toggle-pair';

// ── Option + range data shapes ─────────────────────────────────────────────

/**
 * A single chip option inside a `single` / `multi` / `toggle-pair` group.
 *
 * `count` (optional) renders as a subtle badge inside the chip — e.g. a
 * Workstream chip might read `provenance · 16`.
 */
export interface FilterOption {
	/** Stable id used for selection state + onFiltersChange payloads. */
	id: string;
	/** Human-readable label rendered inside the chip. */
	label: string;
	/** Optional count badge — surface-supplied; not auto-derived. */
	count?: number;
}

/**
 * Configuration for a `range`-mode group.
 *
 * Two flavours:
 * - `absolute` — composes two `@scilence/primitives` (or admin-side)
 *   date-picker instances for explicit start/end dates.
 * - `relative` — chip-style preset selection (e.g. "Last 7d", "Last 30d",
 *   "Older than 30d", "All time"). Falls back to this when the absolute
 *   date-picker primitive isn't yet wired into the calling surface.
 */
export interface RangeConfig {
	/** Whether the range exposes presets, absolute dates, or both. */
	kind: 'relative' | 'absolute';
	/**
	 * Optional preset chips for `relative` (and the quick-select strip
	 * shown above the absolute date-pickers when `kind: 'absolute'`).
	 */
	presets?: Array<{
		id: string;
		label: string;
		/** Inclusive [start, end] — either side may be null for open-ended. */
		value: [Date | null, Date | null];
	}>;
}

// ── Group + rail shapes ────────────────────────────────────────────────────

/**
 * A single filter group (collapsible section in the rail).
 *
 * Visual register: mono-caps label, `--s-color-fg-muted`, tight padding
 * from the `--s-space-tight-*` scale. Matches the SAR-sheet typographic
 * register drawn from Brief 102 — drawn-from-precedent, not parallel
 * invention.
 */
export interface FilterGroupConfig {
	/** Stable id used in `onFiltersChange` payloads + state persistence. */
	id: string;
	/** Mono-caps display label (rendered uppercased via CSS). */
	label: string;
	/**
	 * Whether the group renders open on initial mount.
	 *
	 * - `true`  → `aria-expanded="true"` and body visible.
	 * - `false` → collapsed with chevron; user click expands.
	 *
	 * Per the operations-admin directive, Workstream / Status / Tier
	 * default to expanded; Effort / Class / Owner / Iteration / Dependency
	 * default to collapsed.
	 */
	defaultExpanded: boolean;
	/** Selection mode for this group. */
	selectionMode: FilterSelectionMode;
	/**
	 * Option presentation for `single` / `multi` / `toggle-pair` groups.
	 *
	 * - `chips` (default) — dense inline chip strip with count badges.
	 *   Best when the rail is short and the option labels are terse.
	 * - `list`  — one scannable row per option: a leading checkbox (multi)
	 *   or radio (single), the label, and a right-aligned count. Best when
	 *   the group is the daily working axis and the user scans/toggles many
	 *   options (e.g. a biological-target facet where the user scans a column
	 *   of targets rather than a wrapping chip cloud).
	 *
	 * `range` groups ignore this (they always render the range picker).
	 */
	layout?: 'chips' | 'list';
	/** Options for `single` / `multi` / `toggle-pair` modes. */
	options?: FilterOption[];
	/** Range configuration for `range` mode. */
	range?: RangeConfig;
	/**
	 * `+N more` threshold. Groups with more than this many visible chips
	 * collapse the overflow behind a "+N more" button. Default 6.
	 */
	collapsedShowCount?: number;
	/**
	 * Ids hidden from the default rendered set (e.g. `["SHIPPED"]`).
	 *
	 * Chips for these ids exist in the group's option list but are NOT
	 * surfaced in the main chip row. A subtle `Show <label>` toggle at
	 * the bottom of the group reveals them. Used by operations-admin to
	 * hide SHIPPED briefs from the default Status view.
	 */
	hiddenByDefaultIds?: string[];
}

/**
 * Search-input configuration (always at the top of the rail).
 */
export interface FilterRailSearch {
	/**
	 * Placeholder text. Surfaces typically include a live count, e.g.
	 * `"Search 303 briefs..."`. The rail does NOT compute this — pass
	 * the rendered string in.
	 */
	placeholder: string;
	/** Initial query value (optional). */
	value?: string;
	/** Called on every keystroke (debouncing is the surface's choice). */
	onSearch: (query: string) => void;
}

/**
 * Selection payload shape passed to `onFiltersChange`.
 *
 * Keys are group ids; values depend on the group's `selectionMode`:
 * - `single`       → string | null
 * - `multi`        → string[]
 * - `range`        → [Date | null, Date | null] | null  (or a preset id)
 * - `toggle-pair`  → string[] (subset of the two option ids)
 */
export type FilterSelection = Record<
	string,
	string | string[] | [Date | null, Date | null] | null
>;

/**
 * Top-level FilterRail configuration.
 *
 * @example Operations-admin invocation (real)
 * ```ts
 * const config: FilterRailConfig = {
 *   surface: 'operations-admin-roadmap',
 *   search: {
 *     placeholder: 'Search 303 briefs...',
 *     onSearch: (q) => state.searchQuery = q,
 *   },
 *   groups: [
 *     { id: 'workstream', label: 'Workstream', defaultExpanded: true,
 *       selectionMode: 'multi', options: workstreamOptions },
 *     { id: 'status', label: 'Status', defaultExpanded: true,
 *       selectionMode: 'multi', options: statusOptions,
 *       hiddenByDefaultIds: ['SHIPPED'] },
 *     { id: 'tier', label: 'Tier', defaultExpanded: true,
 *       selectionMode: 'multi', options: [{id:'A',label:'A'},{id:'B',label:'B'}] },
 *     { id: 'age', label: 'Age', defaultExpanded: true,
 *       selectionMode: 'range',
 *       range: { kind: 'relative',
 *         presets: [
 *           { id: '7d',  label: 'Last 7d',       value: [new Date(Date.now() - 7*864e5), null] },
 *           { id: '30d', label: 'Last 30d',      value: [new Date(Date.now() - 30*864e5), null] },
 *           { id: 'old', label: 'Older than 30d',value: [null, new Date(Date.now() - 30*864e5)] },
 *           { id: 'all', label: 'All time',      value: [null, null] },
 *         ] } },
 *     { id: 'effort', label: 'Effort', defaultExpanded: false,
 *       selectionMode: 'multi', options: effortOptions },
 *     // ... class, owner, iteration, dependency
 *   ],
 *   onFiltersChange: (sel) => applySectionFilterState(sel),
 * };
 * ```
 *
 * @example Future libraries-surface invocation (sketch only)
 * ```ts
 * const librariesConfig: FilterRailConfig = {
 *   surface: 'libraries',
 *   search: { placeholder: 'Search libraries...', onSearch: applyQuery },
 *   groups: [
 *     { id: 'type',          label: 'Type',          defaultExpanded: true,  selectionMode: 'multi', options: typeOptions },
 *     { id: 'version',       label: 'Version',       defaultExpanded: true,  selectionMode: 'multi', options: versionOptions },
 *     { id: 'owner',         label: 'Owner',         defaultExpanded: false, selectionMode: 'multi', options: ownerOptions },
 *     { id: 'last-modified', label: 'Last modified', defaultExpanded: true,  selectionMode: 'range',
 *       range: { kind: 'relative', presets: relativePresets } },
 *   ],
 *   onFiltersChange: (sel) => applyLibrariesFilter(sel),
 * };
 * ```
 *
 * Note how Libraries chooses DIFFERENT dimensions (`type`, `version`,
 * `last-modified`) — not the operations dimensions copy-pasted. That is
 * the per-surface invocation principle in action.
 */
export interface FilterRailConfig {
	/**
	 * Surface identifier — used as the localStorage namespace for state
	 * persistence and as the memory key for cross-session restore. Must be
	 * stable across sessions for a given surface (e.g.
	 * `"operations-admin-roadmap"`).
	 */
	surface: string;
	/** Free-text search input — always rendered as the first child. */
	search: FilterRailSearch;
	/**
	 * Ordered list of filter groups. Order is preserved exactly; the rail
	 * does not re-sort.
	 */
	groups: FilterGroupConfig[];
	/**
	 * Prompt rendered below the search input when zero filters are active.
	 * Default: `"Pick a filter below"`.
	 */
	emptyStatePrompt?: string;
	/**
	 * Whether to render the "Filters · N active" header above the search.
	 * Default `true`.
	 */
	showActiveCountInHeader?: boolean;
	/**
	 * Optional initial selection state (e.g. restored from localStorage by
	 * the calling surface). If unset the rail starts empty.
	 */
	initialSelection?: FilterSelection;
	/**
	 * Called whenever the user changes any filter — including chip toggles,
	 * range edits, search-input typing is NOT funneled through this (use
	 * `search.onSearch` for that). Receives the full current selection.
	 */
	onFiltersChange: (selection: FilterSelection) => void;
}

/**
 * Handle returned by `createFilterRail`.
 *
 * Surfaces typically retain the handle to:
 * - call `destroy()` on page unmount
 * - call `update(partial)` when a live data refresh changes available
 *   option counts (`update({ groups: nextGroups })`)
 * - call `getSelectedFilters()` / `getQuery()` when persisting to URL
 * - call `setSelectedFilters(...)` to restore from a saved view
 */
export interface FilterRailHandle {
	/** Detach all listeners and clear the container. */
	destroy: () => void;
	/** Patch the config (most commonly used to refresh option counts). */
	update: (config: Partial<FilterRailConfig>) => void;
	/** Snapshot of the current selection. */
	getSelectedFilters: () => FilterSelection;
	/** Programmatically apply a selection (does NOT fire onFiltersChange). */
	setSelectedFilters: (filters: FilterSelection) => void;
	/** Current search-input value. */
	getQuery: () => string;
	/** Programmatically set the search query (does NOT fire search.onSearch). */
	setQuery: (query: string) => void;
	/** Focus the search input (called by the `⌘F` shortcut handler). */
	focusSearch: () => void;
}
