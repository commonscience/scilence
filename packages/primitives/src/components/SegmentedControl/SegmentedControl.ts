/**
 * SegmentedControl — one choice among a few, shown side by side (vanilla TS).
 *
 * Pattern: WAI-ARIA radiogroup. The group is one tab stop (roving tabindex on
 * the selected, else first enabled, item); Arrow keys move focus AND
 * selection, wrapping and skipping disabled items; Home/End jump to the ends.
 * State is `aria-checked` only — no state classes.
 *
 * Visual recipe: the Library rail segment group (GUIDE library.css
 * .library-rail__segment-group) — joined segments in a border-strong frame at
 * control radius, the chosen one on the system selected pair. Tokens:
 * @scilence/tokens `_segmented.css`. GUIDE DS consolidation U8, 2026-10-18.
 */

import type { SegmentedControlHandle, SegmentedControlOptions, SegmentedOption } from './types.js';

const KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

export function createSegmentedControl(opts: SegmentedControlOptions): SegmentedControlHandle {
	const doc = globalThis.document;
	const group = doc.createElement('div');
	group.className = ['s-segmented', opts.className].filter(Boolean).join(' ');
	group.setAttribute('role', 'radiogroup');
	group.setAttribute('aria-label', opts.ariaLabel);
	group.dataset.size = opts.size ?? 'md';

	const items: HTMLButtonElement[] = [];
	const enabled = () => items.filter((b) => !b.disabled);
	const firstEnabled = (opts.options.find((o) => !o.disabled) ?? opts.options[0])?.id;
	let value = opts.options.some((o) => o.id === opts.value) ? opts.value : firstEnabled;

	function sync() {
		const selected = items.find((b) => b.dataset.value === value && !b.disabled);
		const stop = selected ?? enabled()[0];
		for (const b of items) {
			b.setAttribute('aria-checked', String(b.dataset.value === value));
			b.tabIndex = b === stop ? 0 : -1;
		}
	}

	function choose(id: string, focus: HTMLButtonElement | undefined) {
		const changed = value !== id;
		value = id;
		sync();
		focus?.focus();
		if (changed) opts.onChange?.(id);
	}

	function renderItem(option: SegmentedOption) {
		const b = doc.createElement('button');
		b.type = 'button';
		b.className = ['s-segmented__item', opts.itemClassName].filter(Boolean).join(' ');
		b.setAttribute('role', 'radio');
		b.dataset.value = option.id;
		for (const [k, v] of Object.entries(option.data ?? {})) b.dataset[k] = v;
		b.disabled = option.disabled === true;
		b.setAttribute('aria-label', option.label);
		if (option.tooltipKey) b.dataset.tip = option.tooltipKey;
		else b.title = option.label;
		if (option.icon == null) b.textContent = option.label;
		else if (typeof option.icon === 'string') b.innerHTML = option.icon;
		else b.append(option.icon);
		b.addEventListener('click', () => {
			if (!b.disabled) choose(option.id, b);
		});
		return b;
	}

	for (const option of opts.options) {
		const b = renderItem(option);
		items.push(b);
		group.append(b);
	}
	sync();

	const onKey = (e: KeyboardEvent) => {
		if (!KEYS.includes(e.key)) return;
		const list = enabled();
		if (!list.length) return;
		e.preventDefault();
		const focused = list.findIndex((b) => b === doc.activeElement);
		const current = focused >= 0 ? focused : list.findIndex((b) => b.dataset.value === value);
		const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
		const next =
			e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : ((current < 0 ? 0 : current) + step + list.length) % list.length;
		const target = list[next];
		if (target?.dataset.value) choose(target.dataset.value, target);
	};
	group.addEventListener('keydown', onKey);

	return {
		element: group,
		getValue: () => value,
		setValue(id: string) {
			if (!items.some((b) => b.dataset.value === id)) return;
			value = id;
			sync();
		},
		destroy() {
			group.removeEventListener('keydown', onKey);
			group.remove();
		},
	};
}
