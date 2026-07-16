/**
 * FilterRail · filter-group — collapsible mono-caps section.
 *
 * Each group renders:
 *   - header   (label + chevron + active-count chip)
 *   - body
 *     - chip strip (single / multi / toggle-pair) OR range picker
 *     - +N more affordance when option count > collapsedShowCount
 *     - "Show <Hidden>" toggle for `hiddenByDefaultIds`
 *
 * Selection mode determines body shape; the group owns its local
 * selection state and emits `onSelectionChange` upward to FilterRail.
 */

import { createFilterChip, type FilterChipHandle } from './filter-chip.js';
import {
	createRangePicker,
	type DatePickerFactory,
	type RangePickerHandle,
	type RangeSelection,
} from './range-picker.js';
import type { FilterGroupConfig } from './types.js';

const DEFAULT_SHOW_COUNT = 6;

export type FilterGroupSelection =
	| string
	| string[]
	| RangeSelection
	| null;

export interface FilterGroupOptions {
	config: FilterGroupConfig;
	selection: FilterGroupSelection;
	onSelectionChange: (next: FilterGroupSelection) => void;
	/**
	 * Called when the user toggles this group's expand/collapse chevron.
	 * Receives the group id and its new expanded state. FilterRail threads
	 * this up to `FilterRailConfig.onGroupExpandedChange`.
	 */
	onExpandedChange?: (groupId: string, expanded: boolean) => void;
	datePickerFactory?: DatePickerFactory;
}

export interface FilterGroupHandle {
	element: HTMLElement;
	destroy: () => void;
	setSelection: (next: FilterGroupSelection) => void;
	getSelection: () => FilterGroupSelection;
	/** Update the rendered counts on options (live data refresh). */
	updateConfig: (config: FilterGroupConfig) => void;
}

/**
 * Mount a single filter group inside the rail.
 */
export function createFilterGroup(opts: FilterGroupOptions): FilterGroupHandle {
	let config: FilterGroupConfig = opts.config;
	let selection: FilterGroupSelection = opts.selection;
	// `config.expanded` (an explicit per-group override, e.g. a persisted
	// collapse state restored by the host) wins over `defaultExpanded`.
	let expanded =
		typeof config.expanded === 'boolean'
			? config.expanded
			: !!config.defaultExpanded;
	let showHidden = false;
	let showAllOverflow = false;

	const section = document.createElement('section');
	section.className = 's-filter-rail__group';
	section.dataset.groupId = config.id;
	section.setAttribute('role', 'region');

	const headerId = `s-filter-rail__group-label-${config.id}`;
	section.setAttribute('aria-labelledby', headerId);

	// ── Header ────────────────────────────────────────────────────────────
	const header = document.createElement('button');
	header.type = 'button';
	header.className = 's-filter-rail__group-header';
	header.setAttribute('aria-expanded', String(expanded));

	const chevron = document.createElement('span');
	chevron.className = 's-filter-rail__group-chevron';
	chevron.setAttribute('aria-hidden', 'true');
	chevron.innerHTML =
		'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" ' +
		'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
		'stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';

	const labelSpan = document.createElement('span');
	labelSpan.id = headerId;
	labelSpan.className = 's-filter-rail__group-label';
	labelSpan.textContent = config.label;

	const activeBadge = document.createElement('span');
	activeBadge.className = 's-filter-rail__group-active-badge';
	activeBadge.setAttribute('aria-hidden', 'true');

	header.append(chevron, labelSpan, activeBadge);

	// ── Body ──────────────────────────────────────────────────────────────
	const body = document.createElement('div');
	body.className = 's-filter-rail__group-body';
	body.hidden = !expanded;

	const chipStrip = document.createElement('div');
	chipStrip.className = 's-filter-rail__group-chips';

	// List layout (opt-in via config.layout === 'list'): one scannable row per
	// option — leading checkbox/radio + label + right-aligned count. Renders
	// into this container instead of the chip strip. Both are always in the DOM;
	// renderOptions() shows exactly one.
	const optionList = document.createElement('div');
	optionList.className = 's-filter-rail__group-list';
	optionList.hidden = true;

	const moreBtn = document.createElement('button');
	moreBtn.type = 'button';
	moreBtn.className = 's-filter-rail__group-more';
	moreBtn.hidden = true;

	const showHiddenBtn = document.createElement('button');
	showHiddenBtn.type = 'button';
	showHiddenBtn.className = 's-filter-rail__group-show-hidden';
	showHiddenBtn.hidden = true;

	body.append(chipStrip, optionList, moreBtn, showHiddenBtn);

	let chipHandles: FilterChipHandle[] = [];
	/** Row handles for the `list` layout (parallel to chipHandles). */
	let rowHandles: Array<{
		element: HTMLElement;
		id: string;
		setSelected: (selected: boolean) => void;
		destroy: () => void;
	}> = [];
	let rangeHandle: RangePickerHandle | null = null;

	function usesListLayout(): boolean {
		return config.layout === 'list' && config.selectionMode !== 'range';
	}

	// ── Selection helpers ─────────────────────────────────────────────────
	function isMulti(): boolean {
		return (
			config.selectionMode === 'multi' || config.selectionMode === 'toggle-pair'
		);
	}

	function selectedIds(): string[] {
		if (config.selectionMode === 'range') return [];
		if (Array.isArray(selection)) return selection as string[];
		if (typeof selection === 'string') return [selection];
		return [];
	}

	function activeCount(): number {
		if (config.selectionMode === 'range') {
			if (
				selection &&
				typeof selection === 'object' &&
				'presetId' in selection
			)
				return 1;
			if (Array.isArray(selection) && (selection[0] || selection[1])) return 1;
			return 0;
		}
		return selectedIds().length;
	}

	function applyHeaderState(): void {
		header.setAttribute('aria-expanded', String(expanded));
		body.hidden = !expanded;
		section.classList.toggle('s-filter-rail__group--expanded', expanded);
		const n = activeCount();
		activeBadge.textContent = n > 0 ? String(n) : '';
		activeBadge.hidden = n === 0;
	}

	function applyChipSelectionState(): void {
		if (config.selectionMode === 'range') return;
		const active = new Set(selectedIds());
		for (const handle of chipHandles) {
			const id = handle.element.dataset.id || '';
			handle.setSelected(active.has(id));
		}
		for (const row of rowHandles) {
			row.setSelected(active.has(row.id));
		}
	}

	/**
	 * Dispatch to the configured option presentation. `list` layout renders
	 * scannable checkbox/radio rows; everything else renders the chip strip
	 * (which also owns the `range` picker path).
	 */
	function renderOptions(): void {
		if (usesListLayout()) renderListRows();
		else renderChips();
	}

	/**
	 * Build a single option row for the `list` layout: a `<label>` wrapping a
	 * checkbox (multi) or radio (single), the option label, and a right-aligned
	 * count. The label element makes the whole row a native click target; the
	 * input's `change` routes through the same toggle handler as chips.
	 */
	function createOptionRow(
		option: { id: string; label: string; count?: number },
		selected: boolean,
		isRadio: boolean,
	): {
		element: HTMLElement;
		id: string;
		setSelected: (s: boolean) => void;
		destroy: () => void;
	} {
		const row = document.createElement('label');
		row.className = 's-filter-rail__option-row';
		row.dataset.id = option.id;
		row.dataset.tagDimension = config.id;
		row.dataset.tagValue = option.id;
		row.dataset.selected = selected ? 'true' : 'false';

		const input = document.createElement('input');
		input.type = isRadio ? 'radio' : 'checkbox';
		input.className = 's-filter-rail__option-check';
		if (isRadio) input.name = `s-filter-rail__radio-${config.id}`;
		input.checked = selected;
		input.setAttribute('aria-label', option.label);

		const labelEl = document.createElement('span');
		labelEl.className = 's-filter-rail__option-label';
		labelEl.textContent = option.label;

		row.append(input, labelEl);

		if (option.count != null) {
			const countEl = document.createElement('span');
			countEl.className = 's-filter-rail__option-count';
			countEl.textContent = String(option.count);
			row.appendChild(countEl);
		}

		const onChange = () => handleChipToggle(option.id);
		input.addEventListener('change', onChange);

		return {
			element: row,
			id: option.id,
			setSelected(s: boolean): void {
				input.checked = s;
				row.dataset.selected = s ? 'true' : 'false';
			},
			destroy(): void {
				input.removeEventListener('change', onChange);
				row.remove();
			},
		};
	}

	/**
	 * Render the `list` layout — checkbox/radio rows with the same overflow
	 * (`+N more`) and hidden-by-default affordances as the chip strip.
	 */
	function renderListRows(): void {
		chipStrip.hidden = true;
		// Tear down any chip strip left over from a prior layout so only one
		// presentation is live at a time (mirror of renderChips()'s optionList
		// teardown — keeps `updateConfig` layout swaps leak-free).
		chipStrip.replaceChildren();
		for (const h of chipHandles) h.destroy();
		chipHandles = [];
		optionList.hidden = false;
		optionList.replaceChildren();
		for (const h of rowHandles) h.destroy();
		rowHandles = [];

		const hiddenSet = new Set(config.hiddenByDefaultIds ?? []);
		const allOptions = config.options ?? [];
		const visiblePool = allOptions.filter(
			(o) => !hiddenSet.has(o.id) || showHidden,
		);
		const showCount = config.collapsedShowCount ?? DEFAULT_SHOW_COUNT;
		const overflow = visiblePool.length > showCount && !showAllOverflow;
		const rendered = overflow ? visiblePool.slice(0, showCount) : visiblePool;

		const active = new Set(selectedIds());
		const isRadio = config.selectionMode === 'single';
		for (const option of rendered) {
			const handle = createOptionRow(option, active.has(option.id), isRadio);
			optionList.appendChild(handle.element);
			rowHandles.push(handle);
		}

		// "+N more" affordance (shared button, re-dispatches through renderOptions)
		moreBtn.hidden = !overflow;
		moreBtn.textContent = overflow
			? `+${visiblePool.length - showCount} more`
			: '';
		moreBtn.onclick = () => {
			showAllOverflow = true;
			renderOptions();
		};

		// "Show <Hidden>" toggle
		const hasHidden = (config.hiddenByDefaultIds ?? []).length > 0;
		showHiddenBtn.hidden = !hasHidden;
		if (hasHidden) {
			const labels = (config.hiddenByDefaultIds || [])
				.map((id) => allOptions.find((o) => o.id === id)?.label || id)
				.join(' / ');
			showHiddenBtn.textContent = showHidden
				? `Hide ${labels}`
				: `Show ${labels}`;
			showHiddenBtn.onclick = () => {
				showHidden = !showHidden;
				renderOptions();
			};
		}
	}

	// ── Render chip strip ─────────────────────────────────────────────────
	function renderChips(): void {
		chipStrip.replaceChildren();
		for (const h of chipHandles) h.destroy();
		chipHandles = [];
		// Tear down any list rows left over from a prior layout so only one
		// presentation is live at a time.
		optionList.hidden = true;
		optionList.replaceChildren();
		for (const h of rowHandles) h.destroy();
		rowHandles = [];

		if (config.selectionMode === 'range') {
			chipStrip.hidden = true;
			renderRange();
			return;
		}
		chipStrip.hidden = false;

		const hiddenSet = new Set(config.hiddenByDefaultIds ?? []);
		const allOptions = config.options ?? [];
		const visiblePool = allOptions.filter(
			(o) => !hiddenSet.has(o.id) || showHidden,
		);
		const showCount = config.collapsedShowCount ?? DEFAULT_SHOW_COUNT;
		const overflow = visiblePool.length > showCount && !showAllOverflow;
		const rendered = overflow ? visiblePool.slice(0, showCount) : visiblePool;

		const active = new Set(selectedIds());
		for (const option of rendered) {
			const chip = createFilterChip({
				option,
				selected: active.has(option.id),
				role: config.selectionMode === 'single' ? 'radio' : 'toggle',
				onToggle: handleChipToggle,
			});
			chipStrip.appendChild(chip.element);
			chipHandles.push(chip);
		}

		// "+N more" affordance
		moreBtn.hidden = !overflow;
		moreBtn.textContent = overflow
			? `+${visiblePool.length - showCount} more`
			: '';
		moreBtn.onclick = () => {
			showAllOverflow = true;
			renderOptions();
		};

		// "Show <Hidden>" toggle
		const hasHidden = (config.hiddenByDefaultIds ?? []).length > 0;
		showHiddenBtn.hidden = !hasHidden;
		if (hasHidden) {
			const labels = (config.hiddenByDefaultIds || [])
				.map((id) => allOptions.find((o) => o.id === id)?.label || id)
				.join(' / ');
			showHiddenBtn.textContent = showHidden
				? `Hide ${labels}`
				: `Show ${labels}`;
			showHiddenBtn.onclick = () => {
				showHidden = !showHidden;
				renderOptions();
			};
		}
	}

	function renderRange(): void {
		if (rangeHandle) rangeHandle.destroy();
		rangeHandle = null;
		if (!config.range) return;
		rangeHandle = createRangePicker({
			range: config.range,
			selection: (selection as RangeSelection) ?? null,
			onChange: (next: RangeSelection) => {
				selection = next;
				applyHeaderState();
				opts.onSelectionChange(selection);
			},
			datePickerFactory: opts.datePickerFactory,
		});
		body.insertBefore(rangeHandle.element, moreBtn);
	}

	// ── Chip click handler ────────────────────────────────────────────────
	function handleChipToggle(id: string): void {
		if (config.selectionMode === 'single') {
			selection = selection === id ? null : id;
		} else {
			const arr = Array.isArray(selection) ? [...(selection as string[])] : [];
			const idx = arr.indexOf(id);
			if (idx >= 0) arr.splice(idx, 1);
			else arr.push(id);
			selection = arr;
		}
		applyChipSelectionState();
		applyHeaderState();
		opts.onSelectionChange(selection);
	}

	// ── Header click → toggle expand ──────────────────────────────────────
	header.addEventListener('click', () => {
		expanded = !expanded;
		applyHeaderState();
		opts.onExpandedChange?.(config.id, expanded);
	});

	section.append(header, body);

	renderOptions();
	applyHeaderState();

	return {
		element: section,
		destroy(): void {
			for (const h of chipHandles) h.destroy();
			for (const h of rowHandles) h.destroy();
			rangeHandle?.destroy();
			section.remove();
		},
		setSelection(next: FilterGroupSelection): void {
			selection = next;
			if (config.selectionMode === 'range') {
				rangeHandle?.setSelection((next as RangeSelection) ?? null);
			} else {
				applyChipSelectionState();
			}
			applyHeaderState();
		},
		getSelection(): FilterGroupSelection {
			return selection;
		},
		updateConfig(nextConfig: FilterGroupConfig): void {
			config = nextConfig;
			labelSpan.textContent = config.label;
			renderOptions();
			applyHeaderState();
		},
	};
}
