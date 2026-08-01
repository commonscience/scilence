/**
 * FilterRail · filter-chip — composite chip with optional count badge.
 *
 * Wraps the `@scilence/primitives` Chip atom for filter-rail selection UX.
 */

import { createChip } from '../components/Chip/index.js';
import type { FilterOption } from './types.js';

/**
 * Public chip options.
 */
export interface FilterChipOptions {
	option: FilterOption;
	/** Tag dimension slug for `[data-tag-dimension]` / `[data-tag-value]` selectors. */
	tagDimension?: string;
	/** Whether the chip is currently selected. */
	selected: boolean;
	/** Greyed reverse-progressive-disclosure state (still clickable). */
	greyed?: boolean;
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
	setGreyed: (greyed: boolean) => void;
	setCount: (count: number | undefined) => void;
	destroy: () => void;
}

/**
 * Build a single chip button with optional count badge via Chip primitive.
 */
export function createFilterChip(opts: FilterChipOptions): FilterChipHandle {
	const hasCount = opts.option.count != null;
	const chip = createChip({
		text: opts.option.label,
		number: hasCount ? opts.option.count : undefined,
		variants: {
			shape: 'round',
			slot: hasCount ? 'number-right' : 'text-only',
			tone: 'muted',
			size: 'sm',
		},
		tagName: 'button',
		className: 's-filter-rail__chip s-filter-chip',
		attributes: {
			tabindex: '0',
		},
	});

	const btn = chip.element as HTMLButtonElement;
	btn.type = 'button';
	btn.dataset.id = opts.option.id;
	if (opts.tagDimension) {
		btn.dataset.tagDimension = opts.tagDimension;
		btn.dataset.tagValue = opts.option.id;
	}

	if (opts.role === 'radio') {
		btn.setAttribute('role', 'radio');
	} else {
		btn.setAttribute('role', 'button');
	}

	function applySelected(selected: boolean): void {
		btn.dataset.selected = selected ? 'true' : 'false';
		if (opts.role === 'radio') {
			btn.setAttribute('aria-checked', String(selected));
		} else {
			btn.setAttribute('aria-pressed', String(selected));
		}
	}

	function applyGreyed(greyed: boolean): void {
		btn.classList.toggle('s-filter-rail__chip--greyed', !!greyed);
	}

	function applyCount(count: number | undefined): void {
		chip.setNumber(count);
		chip.setVariants({ slot: count != null ? 'number-right' : 'text-only' });
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
	applyGreyed(!!opts.greyed);
	applyCount(opts.option.count);

	btn.addEventListener('click', onClick);
	btn.addEventListener('keydown', onKeydown);

	return {
		element: btn,
		setSelected: applySelected,
		setGreyed: applyGreyed,
		setCount: applyCount,
		destroy(): void {
			btn.removeEventListener('click', onClick);
			btn.removeEventListener('keydown', onKeydown);
			btn.remove();
		},
	};
}
