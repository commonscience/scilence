/**
 * FilterRail · filter-search — the search input rendered at the top of
 * the rail (section-aware placeholder, × clear when non-empty).
 */

import type { FilterRailSearch } from './types.js';

/**
 * Handle for a mounted search input.
 */
export interface FilterSearchHandle {
	element: HTMLElement;
	destroy: () => void;
	getValue: () => string;
	setValue: (value: string) => void;
	focus: () => void;
	setPlaceholder: (placeholder: string) => void;
}

/**
 * Create the search input subcomponent.
 *
 * Renders inside the rail's own container — surfaces should NOT wrap this
 * in a separate `<form>` or `<label>`. Emits `onSearch` on every keystroke
 * (debouncing is up to the surface).
 */
export function createFilterSearch(config: FilterRailSearch): FilterSearchHandle {
	const wrap = document.createElement('div');
	wrap.className = 's-filter-rail__search';

	const iconSpan = document.createElement('span');
	iconSpan.className = 's-filter-rail__search-icon';
	iconSpan.setAttribute('aria-hidden', 'true');
	iconSpan.innerHTML =
		'<svg width="13" height="13" viewBox="0 0 24 24" fill="none" ' +
		'stroke="currentColor" stroke-width="2" stroke-linecap="round" ' +
		'stroke-linejoin="round"><circle cx="11" cy="11" r="8"/>' +
		'<path d="m21 21-4.3-4.3"/></svg>';

	const input = document.createElement('input');
	input.type = 'search';
	input.className = 's-filter-rail__search-input';
	input.placeholder = config.placeholder;
	input.value = config.value ?? '';
	input.autocomplete = 'off';
	input.setAttribute('aria-label', config.placeholder);
	input.setAttribute('data-filter-rail-search-input', '');

	const clearBtn = document.createElement('button');
	clearBtn.type = 'button';
	clearBtn.className = 's-filter-rail__search-clear';
	clearBtn.setAttribute('aria-label', 'Clear search');
	clearBtn.tabIndex = -1;
	clearBtn.innerHTML =
		'<svg width="10" height="10" viewBox="0 0 24 24" fill="none" ' +
		'stroke="currentColor" stroke-width="2.4" stroke-linecap="round" ' +
		'stroke-linejoin="round" aria-hidden="true">' +
		'<path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
	clearBtn.hidden = !input.value;

	function emit(): void {
		clearBtn.hidden = !input.value;
		config.onSearch(input.value);
	}

	function onInput(): void {
		emit();
	}

	function onClear(): void {
		input.value = '';
		emit();
		input.focus();
	}

	input.addEventListener('input', onInput);
	clearBtn.addEventListener('click', onClear);

	wrap.appendChild(iconSpan);
	wrap.appendChild(input);
	wrap.appendChild(clearBtn);

	return {
		element: wrap,
		destroy(): void {
			input.removeEventListener('input', onInput);
			clearBtn.removeEventListener('click', onClear);
			wrap.replaceChildren();
		},
		getValue(): string {
			return input.value;
		},
		setValue(value: string): void {
			input.value = value;
			clearBtn.hidden = !value;
		},
		focus(): void {
			input.focus();
			input.select();
		},
		setPlaceholder(placeholder: string): void {
			input.placeholder = placeholder;
			input.setAttribute('aria-label', placeholder);
		},
	};
}
