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

	const moreBtn = document.createElement('button');
	moreBtn.type = 'button';
	moreBtn.className = 's-filter-rail__group-more';
	moreBtn.hidden = true;

	const showHiddenBtn = document.createElement('button');
	showHiddenBtn.type = 'button';
	showHiddenBtn.className = 's-filter-rail__group-show-hidden';
	showHiddenBtn.hidden = true;

	body.append(chipStrip, moreBtn, showHiddenBtn);

	let chipHandles: FilterChipHandle[] = [];
	let rangeHandle: RangePickerHandle | null = null;

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
	}

	// ── Render chip strip ─────────────────────────────────────────────────
	function renderChips(): void {
		chipStrip.replaceChildren();
		for (const h of chipHandles) h.destroy();
		chipHandles = [];

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
			renderChips();
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
				renderChips();
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

	renderChips();
	applyHeaderState();

	return {
		element: section,
		destroy(): void {
			for (const h of chipHandles) h.destroy();
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
			renderChips();
			applyHeaderState();
		},
	};
}
