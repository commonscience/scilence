/**
 * FilterRail · range-picker — composes the date-picker primitive (when
 * available) or falls back to a relative-preset chip strip.
 *
 * The "Age" group on operations-admin uses this in `relative` mode with
 * presets like "Last 7d", "Last 30d", "Older than 30d", "All time".
 *
 * When `kind: 'absolute'`, this module composes TWO date-picker
 * instances (start + end). The DatePicker primitive shape it imports is
 * declared as a structural type so this file does not hard-depend on a
 * specific module path — surfaces inject their date-picker factory via
 * the `datePickerFactory` option.
 */

import type { RangeConfig } from './types.js';

/**
 * Range selection payload — `[startDate | null, endDate | null]` or a
 * preset id string. Surfaces resolve preset ids to dates via the
 * `RangeConfig.presets` lookup.
 */
export type RangeSelection =
	| [Date | null, Date | null]
	| { presetId: string }
	| null;

/**
 * Minimal date-picker factory contract — matches the in-flight
 * `component-port-date-picker.md` primitive without importing it.
 */
export interface DatePickerFactory {
	(container: HTMLElement, options: {
		value?: string;
		placeholder?: string;
		onChange?: (detail: { value: string }) => void;
	}): {
		destroy: () => void;
		getValue: () => string;
	};
}

export interface RangePickerOptions {
	range: RangeConfig;
	selection: RangeSelection;
	onChange: (next: RangeSelection) => void;
	/**
	 * Optional date-picker factory. When provided and `range.kind === 'absolute'`,
	 * the rail composes two instances for start/end. When absent, the rail
	 * gracefully falls back to relative-preset chips.
	 */
	datePickerFactory?: DatePickerFactory;
}

export interface RangePickerHandle {
	element: HTMLElement;
	destroy: () => void;
	setSelection: (selection: RangeSelection) => void;
}

function fmtDate(d: Date | null): string {
	if (!d) return '';
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${dd}`;
}

/**
 * Mount a range picker — chip strip for relative presets, optionally
 * paired with two date-picker instances for absolute ranges.
 */
export function createRangePicker(opts: RangePickerOptions): RangePickerHandle {
	const wrap = document.createElement('div');
	wrap.className = 's-filter-rail__range';
	wrap.setAttribute('role', 'group');
	wrap.setAttribute(
		'aria-label',
		opts.range.kind === 'absolute' ? 'Date range' : 'Relative date range',
	);

	let currentSelection: RangeSelection = opts.selection;

	// ── Relative preset strip ────────────────────────────────────────────
	const presets = opts.range.presets ?? [];
	const chipRow = document.createElement('div');
	chipRow.className = 's-filter-rail__range-presets';

	const presetChips: HTMLButtonElement[] = [];
	for (const preset of presets) {
		const chip = document.createElement('button');
		chip.type = 'button';
		chip.className = 's-pill-filter__pill s-filter-rail__range-preset';
		chip.dataset.id = preset.id;
		chip.textContent = preset.label;
		chip.setAttribute('tabindex', '0');
		chip.setAttribute('aria-pressed', 'false');
		chip.addEventListener('click', () => {
			currentSelection = { presetId: preset.id };
			syncPresetChips();
			opts.onChange(currentSelection);
		});
		presetChips.push(chip);
		chipRow.appendChild(chip);
	}
	if (presets.length) wrap.appendChild(chipRow);

	function syncPresetChips(): void {
		const activeId =
			currentSelection && 'presetId' in currentSelection
				? currentSelection.presetId
				: null;
		for (const chip of presetChips) {
			const active = chip.dataset.id === activeId;
			chip.classList.toggle('s-pill-filter__pill--active', active);
			chip.classList.toggle('s-pill-filter__pill--prominent', active);
			chip.setAttribute('aria-pressed', String(active));
		}
	}
	syncPresetChips();

	// ── Absolute date-picker pair (optional) ─────────────────────────────
	let dpStartHandle: ReturnType<DatePickerFactory> | null = null;
	let dpEndHandle: ReturnType<DatePickerFactory> | null = null;

	if (opts.range.kind === 'absolute' && opts.datePickerFactory) {
		const absRow = document.createElement('div');
		absRow.className = 's-filter-rail__range-absolute';

		const startMount = document.createElement('div');
		startMount.className = 's-filter-rail__range-date';
		const endMount = document.createElement('div');
		endMount.className = 's-filter-rail__range-date';

		const sep = document.createElement('span');
		sep.className = 's-filter-rail__range-sep';
		sep.textContent = '→';
		sep.setAttribute('aria-hidden', 'true');

		absRow.append(startMount, sep, endMount);
		wrap.appendChild(absRow);

		const [startInit, endInit] = Array.isArray(currentSelection)
			? currentSelection
			: [null, null];

		function emitAbsolute(): void {
			const startStr = dpStartHandle?.getValue() || '';
			const endStr = dpEndHandle?.getValue() || '';
			const start = startStr ? new Date(`${startStr}T00:00:00`) : null;
			const end = endStr ? new Date(`${endStr}T00:00:00`) : null;
			currentSelection = [start, end];
			syncPresetChips();
			opts.onChange(currentSelection);
		}

		dpStartHandle = opts.datePickerFactory(startMount, {
			value: fmtDate(startInit),
			placeholder: 'Start',
			onChange: emitAbsolute,
		});
		dpEndHandle = opts.datePickerFactory(endMount, {
			value: fmtDate(endInit),
			placeholder: 'End',
			onChange: emitAbsolute,
		});
	} else if (opts.range.kind === 'absolute') {
		// No date-picker factory injected — graceful fallback to a notice
		// (still shows preset chips above).
		const note = document.createElement('div');
		note.className = 's-filter-rail__range-fallback';
		note.textContent =
			'Pick a preset above (absolute date picker not yet wired in for this surface).';
		wrap.appendChild(note);
	}

	return {
		element: wrap,
		destroy(): void {
			dpStartHandle?.destroy();
			dpEndHandle?.destroy();
			wrap.replaceChildren();
		},
		setSelection(next: RangeSelection): void {
			currentSelection = next;
			syncPresetChips();
		},
	};
}
