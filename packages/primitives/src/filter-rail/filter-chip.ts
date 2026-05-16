/**
 * FilterRail · filter-chip — composite chip with optional count badge.
 *
 * This module is the bridge to the existing `pill-filter.js` primitive in
 * `guide/shell/js/components/pill-filter.js` (admin-side, extended
 * additively to render count badges). When `@scilence/primitives` ships
 * its own chip atom, this file is the swap point: the rest of FilterRail
 * never reaches into pill-filter directly.
 *
 * Until then, FilterRail's admin-side mirror in
 * `guide/shell/js/components/filter-rail/` substitutes its own thin chip
 * implementation that wraps `createPillFilter` (or renders a single chip
 * via the same DOM classes). This file documents the contract.
 */

import type { FilterOption } from './types.js';

/**
 * Public chip options.
 */
export interface FilterChipOptions {
	option: FilterOption;
	/** Whether the chip is currently selected. */
	selected: boolean;
	/** Multi-select group → `aria-pressed`; single → `aria-checked` (role=radio). */
	role: 'toggle' | 'radio';
	/** Called when the user clicks / Space / Enter. */
	onToggle: (id: string) => void;
}

/**
 * Handle for a mounted chip.
 */
export interface FilterChipHandle {
	element: HTMLButtonElement;
	setSelected: (selected: boolean) => void;
	setCount: (count: number | undefined) => void;
	destroy: () => void;
}

/**
 * Build a single chip button with optional count badge.
 *
 * Visual register: uses the same DOM classes as the admin `pill-filter`
 * primitive (`.s-pill-filter__pill` + variants) so the existing CSS picks
 * it up; adds a `.s-filter-chip__count` badge child when `count != null`.
 *
 * This implementation is intentionally tiny + framework-free. The
 * authoritative selection logic lives in the parent `filter-group`; this
 * is a thin DOM helper.
 */
export function createFilterChip(opts: FilterChipOptions): FilterChipHandle {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 's-pill-filter__pill s-filter-chip';
	btn.dataset.id = opts.option.id;
	btn.setAttribute('tabindex', '0');

	const labelSpan = document.createElement('span');
	labelSpan.className = 's-filter-chip__label';
	labelSpan.textContent = opts.option.label;

	const countSpan = document.createElement('span');
	countSpan.className = 's-filter-chip__count';
	countSpan.setAttribute('aria-hidden', 'true');

	btn.append(labelSpan, countSpan);

	if (opts.role === 'radio') {
		btn.setAttribute('role', 'radio');
	} else {
		// `toolbar` multi-select — pill-filter parity: aria-pressed.
		btn.setAttribute('role', 'button');
	}

	function applySelected(selected: boolean): void {
		btn.classList.toggle('s-pill-filter__pill--active', selected);
		btn.classList.toggle('s-pill-filter__pill--prominent', selected);
		if (opts.role === 'radio') {
			btn.setAttribute('aria-checked', String(selected));
		} else {
			btn.setAttribute('aria-pressed', String(selected));
		}
	}

	function applyCount(count: number | undefined): void {
		if (count == null) {
			countSpan.hidden = true;
			countSpan.textContent = '';
		} else {
			countSpan.hidden = false;
			countSpan.textContent = String(count);
		}
	}

	function onClick(): void {
		opts.onToggle(opts.option.id);
	}

	function onKeydown(e: KeyboardEvent): void {
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			opts.onToggle(opts.option.id);
		}
	}

	applySelected(opts.selected);
	applyCount(opts.option.count);

	btn.addEventListener('click', onClick);
	btn.addEventListener('keydown', onKeydown);

	return {
		element: btn,
		setSelected: applySelected,
		setCount: applyCount,
		destroy(): void {
			btn.removeEventListener('click', onClick);
			btn.removeEventListener('keydown', onKeydown);
			btn.remove();
		},
	};
}
