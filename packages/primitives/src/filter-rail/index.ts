/**
 * FilterRail — orchestrator + public API.
 *
 * Builds a dense filter-rich left rail (HF register) from a config:
 *   header   ("Filters · N active" + "Clear all" when active)
 *   search   (free-text)
 *   prompt   (zero-state nudge — "Pick a filter below")
 *   groups   (collapsible mono-caps sections)
 *
 * **Per-surface invocation principle.** Each surface chooses its own
 * dimensions; this component does NOT prescribe a universal filter set.
 * See `./types.ts` for the contract and a libraries-surface sketch.
 *
 * @see ./types.ts
 * @see ../../../research/flywheel/handoffs/briefs/guide-shell-v5-section-state-left-rail.md
 */

import {
	createFilterGroup,
	type FilterGroupHandle,
	type FilterGroupSelection,
} from './filter-group.js';
import {
	createFilterSearch,
	type FilterSearchHandle,
} from './filter-search.js';
import type { DatePickerFactory } from './range-picker.js';
import type {
	FilterRailConfig,
	FilterRailHandle,
	FilterSelection,
} from './types.js';

export type {
	FilterGroupConfig,
	FilterOption,
	FilterRailConfig,
	FilterRailHandle,
	FilterRailSearch,
	FilterSelection,
	FilterSelectionMode,
	RangeConfig,
} from './types.js';
export type { DatePickerFactory, RangeSelection } from './range-picker.js';
export type { FilterGroupSelection } from './filter-group.js';

const DEFAULT_EMPTY_PROMPT = 'Pick a filter below';

interface InternalOptions extends FilterRailConfig {
	/**
	 * Optional date-picker factory the rail forwards to its range groups.
	 * Surfaces that have the date-picker primitive available wire it
	 * through this slot.
	 */
	datePickerFactory?: DatePickerFactory;
}

/**
 * Mount a FilterRail into the given container.
 *
 * @param container — the host element. Existing children are cleared.
 * @param config    — the rail configuration (see `FilterRailConfig`).
 * @returns a handle with `destroy` / `update` / `getSelectedFilters` etc.
 */
export function createFilterRail(
	container: HTMLElement,
	config: InternalOptions,
): FilterRailHandle {
	let currentConfig: InternalOptions = config;
	const selection: FilterSelection = {
		...(config.initialSelection ?? {}),
	};

	container.replaceChildren();
	container.classList.add('s-filter-rail');
	container.dataset.filterRailSurface = config.surface;

	// ── Header (filters count + clear all) ────────────────────────────────
	const headerEl = document.createElement('div');
	headerEl.className = 's-filter-rail__header';

	const countEl = document.createElement('span');
	countEl.className = 's-filter-rail__count';

	const clearAllBtn = document.createElement('button');
	clearAllBtn.type = 'button';
	clearAllBtn.className = 's-filter-rail__clear-all';
	clearAllBtn.textContent = 'Clear all';
	clearAllBtn.hidden = true;
	clearAllBtn.addEventListener('click', () => {
		for (const id of Object.keys(selection)) delete selection[id];
		for (const g of groupHandles) g.setSelection(null);
		syncHeader();
		config.onFiltersChange({ ...selection });
	});

	headerEl.append(countEl, clearAllBtn);

	// ── Search ────────────────────────────────────────────────────────────
	const searchHandle: FilterSearchHandle = createFilterSearch(config.search);

	// ── Empty-state prompt ────────────────────────────────────────────────
	const promptEl = document.createElement('div');
	promptEl.className = 's-filter-rail__prompt';
	promptEl.textContent = config.emptyStatePrompt ?? DEFAULT_EMPTY_PROMPT;

	// ── Groups ────────────────────────────────────────────────────────────
	const groupsEl = document.createElement('div');
	groupsEl.className = 's-filter-rail__groups';

	const groupHandles: FilterGroupHandle[] = [];

	function mountGroups(): void {
		groupsEl.replaceChildren();
		for (const h of groupHandles) h.destroy();
		groupHandles.length = 0;

		for (const groupConfig of currentConfig.groups) {
			const initial = (selection[groupConfig.id] ?? null) as FilterGroupSelection;
			const handle = createFilterGroup({
				config: groupConfig,
				selection: initial,
				onSelectionChange: (next) => {
					if (next == null || (Array.isArray(next) && next.length === 0)) {
						delete selection[groupConfig.id];
					} else {
						selection[groupConfig.id] =
							next as FilterSelection[string];
					}
					syncHeader();
					currentConfig.onFiltersChange({ ...selection });
				},
				datePickerFactory: currentConfig.datePickerFactory,
			});
			groupHandles.push(handle);
			groupsEl.appendChild(handle.element);
		}
	}

	function activeCount(): number {
		let n = 0;
		for (const v of Object.values(selection)) {
			if (v == null) continue;
			if (Array.isArray(v)) {
				if (v.length > 0 && (v[0] != null || v[1] != null)) n++;
			} else if (typeof v === 'object') {
				n++;
			} else if (typeof v === 'string' && v.length) {
				n++;
			}
		}
		return n;
	}

	function syncHeader(): void {
		const n = activeCount();
		if (currentConfig.showActiveCountInHeader !== false) {
			countEl.textContent = `Filters · ${n} active`;
		} else {
			countEl.textContent = '';
		}
		clearAllBtn.hidden = n === 0;
		// Hide the entire header when zero filters active so search reads
		// as the first visible element (Brief 103 PART B + PART D).
		headerEl.hidden = n === 0;
		promptEl.hidden = n !== 0;
	}

	// ── Assemble ──────────────────────────────────────────────────────────
	// Search input is the FIRST child of the container (Brief 103 PART B).
	// The "Filters · N active" + "Clear all" header sits ABOVE search ONLY
	// when at least one filter is active (PART D) — otherwise it stays
	// hidden so the empty-state prompt + groups read as the primary surface.
	container.append(searchHandle.element, headerEl, promptEl, groupsEl);
	mountGroups();
	syncHeader();

	return {
		destroy(): void {
			for (const h of groupHandles) h.destroy();
			searchHandle.destroy();
			container.replaceChildren();
			container.classList.remove('s-filter-rail');
			delete container.dataset.filterRailSurface;
		},
		update(patch: Partial<FilterRailConfig>): void {
			currentConfig = { ...currentConfig, ...patch };
			if (patch.search) {
				searchHandle.setPlaceholder(patch.search.placeholder);
			}
			if (patch.emptyStatePrompt) {
				promptEl.textContent = patch.emptyStatePrompt;
			}
			if (patch.groups) {
				mountGroups();
			}
			syncHeader();
		},
		getSelectedFilters(): FilterSelection {
			return { ...selection };
		},
		setSelectedFilters(next: FilterSelection): void {
			for (const id of Object.keys(selection)) delete selection[id];
			Object.assign(selection, next);
			for (const handle of groupHandles) {
				const gid = handle.element.dataset.groupId || '';
				const v = (selection[gid] ?? null) as FilterGroupSelection;
				handle.setSelection(v);
			}
			syncHeader();
		},
		getQuery(): string {
			return searchHandle.getValue();
		},
		setQuery(query: string): void {
			searchHandle.setValue(query);
		},
		focusSearch(): void {
			searchHandle.focus();
		},
	};
}
