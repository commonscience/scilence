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
// Canonical filter-rail event name (domain:action). Kept as a local
// constant so @scilence/primitives stays free of GUIDE's event-dictionary
// dependency; GUIDE's FILTER_RAIL_VISIBILITY_CHANGED resolves to
// the same on-wire spelling.
const FILTER_RAIL_VISIBILITY_CHANGED = 'filter-rail:visibility-changed';
import type {
	FilterRailConfig,
	FilterRailFooterAction,
	FilterRailFooterConfig,
	FilterRailFooterContext,
	FilterRailFooterShowWhen,
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
	FilterRailFooterAction,
	FilterRailFooterConfig,
	FilterRailFooterContext,
	FilterRailFooterShowWhen,
	RangeConfig,
	TagDimension,
	TagFilterRailConfig,
} from './types.js';
export type { DatePickerFactory, RangeSelection } from './range-picker.js';
export type { FilterGroupSelection } from './filter-group.js';

const DEFAULT_EMPTY_PROMPT = 'Pick a filter below';

function actionVisible(
	action: FilterRailFooterAction,
	selectionCount: number,
): boolean {
	const when: FilterRailFooterShowWhen = action.showWhen ?? 'always';
	if (when === 'selection') return selectionCount > 0;
	if (when === 'no-selection') return selectionCount === 0;
	return true;
}

function actionDisabled(
	action: FilterRailFooterAction,
	ctx: FilterRailFooterContext,
): boolean {
	if (typeof action.disabled === 'function') return action.disabled(ctx);
	return action.disabled === true;
}

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
	let selectionCount = 0;
	const selection: FilterSelection = {
		...(config.initialSelection ?? {}),
	};
	const chromeVisibility: Record<string, boolean> = {
		...(config.initialChromeVisibility ?? {}),
	};

	function chromeVisibleForGroup(groupId: string): boolean {
		return chromeVisibility[groupId] !== false;
	}

	function notifyChromeVisibilityChange(groupId: string, visible: boolean): void {
		chromeVisibility[groupId] = visible;
		container.dispatchEvent(
			new CustomEvent(FILTER_RAIL_VISIBILITY_CHANGED, {
				detail: { groupId, visible },
				bubbles: true,
			}),
		);
		currentConfig.onChromeVisibilityChange?.(groupId, visible, {
			...chromeVisibility,
		});
	}

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

	// ── Empty-state prompt (optional — internal-ops rail omits per A.3) ───
	const promptEl = document.createElement('div');
	promptEl.className = 's-filter-rail__prompt';
	const promptText = config.emptyStatePrompt ?? DEFAULT_EMPTY_PROMPT;
	promptEl.textContent = promptText;
	if (!promptText) promptEl.hidden = true;

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
				chromeVisible: chromeVisibleForGroup(groupConfig.id),
				onChromeVisibilityChange: (visible) => {
					notifyChromeVisibilityChange(groupConfig.id, visible);
				},
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
				onExpandedChange: (groupId, expanded) => {
					currentConfig.onGroupExpandedChange?.(groupId, expanded);
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
		const hideHeader = currentConfig.hideHeader === true;
		const promptText = currentConfig.emptyStatePrompt ?? DEFAULT_EMPTY_PROMPT;
		if (hideHeader) {
			headerEl.hidden = true;
		} else if (currentConfig.showActiveCountInHeader !== false) {
			countEl.textContent = `Filters · ${n} active`;
			clearAllBtn.hidden = n === 0;
			// Hide the entire header when zero filters active so search reads
			// as the first visible element (Brief 103 PART B + PART D).
			headerEl.hidden = n === 0;
		} else {
			countEl.textContent = '';
			clearAllBtn.hidden = n === 0;
			headerEl.hidden = n === 0;
		}
		// Empty prompt string = permanently omit (Library / internal-ops A.3).
		promptEl.hidden = !promptText || n !== 0;
	}

	// ── Scrollable body + footer action zone ──────────────────────────────
	const bodyEl = document.createElement('div');
	bodyEl.className = 's-filter-rail__body';

	const footerEl = document.createElement('div');
	footerEl.className = 's-filter-rail__footer';
	footerEl.hidden = true;

	const footerSummaryEl = document.createElement('div');
	footerSummaryEl.className = 's-filter-rail__footer-summary';

	const footerActionsEl = document.createElement('div');
	footerActionsEl.className = 's-filter-rail__footer-actions';
	footerActionsEl.setAttribute('role', 'toolbar');

	footerEl.append(footerSummaryEl, footerActionsEl);

	function footerContext(): FilterRailFooterContext {
		return { selectionCount };
	}

	function syncFooter(): void {
		const footerCfg: FilterRailFooterConfig | undefined = currentConfig.footer;
		if (!footerCfg?.actions?.length) {
			footerEl.hidden = true;
			return;
		}

		const ctx = footerContext();
		const visible = footerCfg.actions.filter((a) => actionVisible(a, selectionCount));

		// Hide the footer entirely when nothing would render — no currently-visible
		// actions and no selection summary — so a rail whose footer holds only
		// selection-scoped actions doesn't show an empty bordered bar at rest.
		if (visible.length === 0 && selectionCount === 0) {
			footerEl.hidden = true;
			return;
		}
		footerEl.hidden = false;

		footerSummaryEl.replaceChildren();
		if (selectionCount > 0) {
			const summaryText =
				footerCfg.selectionSummary?.(selectionCount) ??
				`${selectionCount.toLocaleString()} selected`;
			const summary = document.createElement('span');
			summary.className = 's-filter-rail__footer-count';
			summary.textContent = summaryText;
			footerSummaryEl.appendChild(summary);

			if (footerCfg.clearSelection) {
				const clearBtn = document.createElement('button');
				clearBtn.type = 'button';
				clearBtn.className = 's-filter-rail__footer-clear';
				clearBtn.textContent = footerCfg.clearSelection.label ?? 'Clear';
				clearBtn.addEventListener('click', () => footerCfg.clearSelection?.onClick());
				footerSummaryEl.appendChild(clearBtn);
			}
			footerSummaryEl.hidden = false;
		} else {
			footerSummaryEl.hidden = true;
		}

		footerActionsEl.replaceChildren();
		for (const action of visible) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 's-filter-rail__footer-action';
			btn.dataset.footerActionId = action.id;
			btn.textContent = action.label;
			btn.disabled = actionDisabled(action, ctx);
			btn.addEventListener('click', () => action.onClick(ctx));
			footerActionsEl.appendChild(btn);
		}
	}

	// ── Assemble ──────────────────────────────────────────────────────────
	// Search input is the FIRST child of the body (Brief 103 PART B).
	bodyEl.append(searchHandle.element, headerEl, promptEl, groupsEl);
	container.append(bodyEl, footerEl);
	mountGroups();
	syncHeader();
	syncFooter();

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
			if (patch.emptyStatePrompt !== undefined) {
				promptEl.textContent = patch.emptyStatePrompt;
			}
			if (patch.groups) {
				mountGroups();
			}
			if (patch.footer) {
				syncFooter();
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
		getChromeVisibility(): Record<string, boolean> {
			const out: Record<string, boolean> = {};
			for (const handle of groupHandles) {
				const gid = handle.element.dataset.groupId || '';
				if (gid) out[gid] = handle.getChromeVisible();
			}
			return out;
		},
		setChromeVisibility(map: Record<string, boolean>): void {
			for (const handle of groupHandles) {
				const gid = handle.element.dataset.groupId || '';
				if (!gid || !(gid in map)) continue;
				const visible = map[gid] !== false;
				chromeVisibility[gid] = visible;
				handle.setChromeVisible(visible);
			}
		},
		setSelectionCount(count: number): void {
			selectionCount = Math.max(0, Number(count) || 0);
			syncFooter();
		},
		getSelectionCount(): number {
			return selectionCount;
		},
	};
}
