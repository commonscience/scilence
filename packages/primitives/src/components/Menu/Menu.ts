/**
 * Menu — pan-app dropdown/action-menu primitive (vanilla TS).
 *
 * Fills the confirmed NET-NEW Menu/MenuItem gap
 * (research/specs/DS_COMPONENTIZATION_CATALOG.md §A21 — 27+ hand-rolled
 * aria-haspopup/menu sites shell-wide; the GUIDE footer account menu is the
 * first consumer).
 *
 * Owns:
 *   - `role="menu"` semantics + roving-tabindex keyboard nav
 *     (Arrows / Home / End / Enter / Space)
 *   - Row rendering: items (icon / label / hint / trailing / danger /
 *     disabled / active), separators, group headers, custom presentation rows
 *   - Variant token resolution (`--s-menu-*`)
 *
 * Does NOT own:
 *   - Anchor positioning / portal / open-close lifecycle — the consumer's
 *     popover engine (or a future Popover primitive) owns placement and
 *     dismissal. Menu is the surface *contents*, embeddable anywhere.
 *   - Submenus / typeahead — deferred until a consumer needs them.
 */

import { mergeMenuVariants, resolveMenuTokens } from './resolve-menu-tokens.js';
import type {
	MenuConfig,
	MenuEntry,
	MenuHandle,
	MenuItemDescriptor,
	MenuVariants,
} from './types.js';

function isItem(entry: MenuEntry): entry is MenuItemDescriptor {
	return typeof (entry as MenuItemDescriptor).id === 'string';
}

export class Menu implements MenuHandle {
	readonly element: HTMLElement;
	private variants: MenuVariants;
	private entries: MenuEntry[];
	private readonly onSelect: MenuConfig['onSelect'];
	private itemEls: HTMLButtonElement[] = [];
	private focusIndex = 0;
	private readonly keydownHandler: (e: KeyboardEvent) => void;

	constructor(opts: MenuConfig) {
		this.variants = mergeMenuVariants(opts.variants);
		this.entries = opts.entries;
		this.onSelect = opts.onSelect;

		this.element = document.createElement('div');
		this.element.classList.add('s-menu');
		this.element.setAttribute('role', 'menu');
		this.element.setAttribute('aria-label', opts.ariaLabel);
		if (opts.className) {
			for (const part of opts.className.split(/\s+/)) {
				if (part) this.element.classList.add(part);
			}
		}
		if (opts.attributes) {
			for (const [key, val] of Object.entries(opts.attributes)) {
				this.element.setAttribute(key, val);
			}
		}

		this.keydownHandler = (e) => this.handleKeydown(e);
		this.element.addEventListener('keydown', this.keydownHandler);

		this.applyVariantDataset();
		this.applyTokens();
		this.mountEntries();
	}

	private applyVariantDataset(): void {
		this.element.dataset.size = this.variants.size;
		this.element.dataset.chrome = this.variants.chrome;
	}

	private applyTokens(): void {
		const resolved = resolveMenuTokens(this.variants);
		for (const [prop, val] of Object.entries(resolved)) {
			this.element.style.setProperty(prop, val);
		}
	}

	private mountEntries(): void {
		this.element.replaceChildren();
		this.itemEls = [];
		this.focusIndex = 0;

		for (const entry of this.entries) {
			if ('separator' in entry) {
				const sep = document.createElement('div');
				sep.className = 's-menu__separator';
				sep.setAttribute('role', 'separator');
				this.element.appendChild(sep);
				continue;
			}
			if ('header' in entry) {
				const header = document.createElement('div');
				header.className = 's-menu__header';
				header.setAttribute('role', 'presentation');
				header.textContent = entry.header;
				this.element.appendChild(header);
				continue;
			}
			if ('custom' in entry) {
				const row = document.createElement('div');
				row.className = 's-menu__custom';
				row.setAttribute('role', 'presentation');
				row.appendChild(entry.custom);
				this.element.appendChild(row);
				continue;
			}
			this.element.appendChild(this.buildItem(entry));
		}

		this.syncRovingTabindex();
	}

	private buildItem(item: MenuItemDescriptor): HTMLButtonElement {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 's-menu__item';
		btn.setAttribute('role', 'menuitem');
		btn.dataset.menuItemId = item.id;
		if (item.danger) btn.dataset.tone = 'danger';
		if (item.active) btn.setAttribute('aria-current', 'true');
		if (item.disabled) {
			btn.disabled = true;
			btn.setAttribute('aria-disabled', 'true');
		}
		if (item.attributes) {
			for (const [key, val] of Object.entries(item.attributes)) {
				btn.setAttribute(key, val);
			}
		}

		if (item.icon) {
			const iconWrap = document.createElement('span');
			iconWrap.className = 's-menu__icon';
			iconWrap.setAttribute('aria-hidden', 'true');
			iconWrap.appendChild(item.icon);
			btn.appendChild(iconWrap);
		}

		const label = document.createElement('span');
		label.className = 's-menu__label';
		label.textContent = item.label;
		btn.appendChild(label);

		if (item.hint) {
			const hint = document.createElement('span');
			hint.className = 's-menu__hint';
			hint.setAttribute('aria-hidden', 'true');
			hint.textContent = item.hint;
			btn.appendChild(hint);
		}

		if (item.trailing) {
			const trailing = document.createElement('span');
			trailing.className = 's-menu__trailing';
			trailing.setAttribute('aria-hidden', 'true');
			trailing.appendChild(item.trailing);
			btn.appendChild(trailing);
		}

		if (!item.disabled) {
			btn.addEventListener('click', (e) => {
				this.focusIndex = this.itemEls.indexOf(btn);
				this.syncRovingTabindex();
				this.onSelect(item.id, item, e);
			});
			this.itemEls.push(btn);
		}

		return btn;
	}

	private syncRovingTabindex(): void {
		this.itemEls.forEach((el, i) => {
			el.tabIndex = i === this.focusIndex ? 0 : -1;
		});
	}

	private moveFocus(index: number): void {
		if (this.itemEls.length === 0) return;
		const count = this.itemEls.length;
		this.focusIndex = ((index % count) + count) % count;
		this.syncRovingTabindex();
		this.itemEls[this.focusIndex]?.focus();
	}

	private handleKeydown(e: KeyboardEvent): void {
		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				this.moveFocus(this.focusIndex + 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				this.moveFocus(this.focusIndex - 1);
				break;
			case 'Home':
				e.preventDefault();
				this.moveFocus(0);
				break;
			case 'End':
				e.preventDefault();
				this.moveFocus(this.itemEls.length - 1);
				break;
			// Enter/Space activate natively on <button>; Escape is the
			// popover owner's dismissal concern — deliberately not handled.
		}
	}

	setEntries(entries: MenuEntry[]): void {
		this.entries = entries;
		this.mountEntries();
	}

	focusFirst(): void {
		this.moveFocus(0);
	}

	setVariants(partial: Partial<MenuVariants>): void {
		this.variants = mergeMenuVariants({ ...this.variants, ...partial });
		this.applyVariantDataset();
		this.applyTokens();
	}

	render(): HTMLElement {
		return this.element;
	}

	destroy(): void {
		this.element.removeEventListener('keydown', this.keydownHandler);
		this.element.remove();
	}
}

/** Factory — preferred entry for surfaces. */
export function createMenu(opts: MenuConfig): Menu {
	return new Menu(opts);
}

export type { MenuConfig, MenuEntry, MenuHandle, MenuItemDescriptor, MenuVariants };

export { isItem as isMenuItemDescriptor };
