/**
 * @scilence/primitives — IconButton (vanilla TS).
 *
 * Square (or round) button containing JUST an icon. Distinct from
 * Button (which is label-first). 24+ consumers across notebook /
 * admin-shell / studio / cas / project-workspace / operations
 * reimplement this pattern with subtle drift per 2026-06-07
 * componentization audit; this primitive is the consolidation target.
 *
 * Variant axes (tone × size × shape) resolve to a single token lookup.
 *
 * Parallel to the existing guide/shell/js/components/icon-button.js
 * (admin-shell legacy); consumers migrate incrementally as they touch.
 */

import { mergeIconButtonVariants, resolveIconButtonTokens } from './resolve-iconbutton-tokens.js';
import type { IconButtonHandle, IconButtonOptions, IconButtonVariants } from './types.js';

export class IconButton implements IconButtonHandle {
	readonly element: HTMLElement;
	private variants: IconButtonVariants;
	private opts: IconButtonOptions;

	private iconEl: HTMLElement | SVGElement;
	private readonly iconWrap: HTMLSpanElement;
	private readonly badgeEl: HTMLSpanElement;
	private styleOverrides: Record<string, string> | undefined;
	private clickHandler: ((ev: MouseEvent) => void) | null = null;

	constructor(opts: IconButtonOptions) {
		this.opts = opts;
		this.variants = mergeIconButtonVariants(opts.variants);
		this.iconEl = opts.icon;
		this.styleOverrides = opts.styleOverrides;

		const tag = opts.tagName ?? 'button';
		this.element = document.createElement(tag);
		this.element.classList.add('s-icon-button');
		if (tag === 'button') {
			(this.element as HTMLButtonElement).type = 'button';
		}
		this.element.setAttribute('aria-label', opts.label);
		if (opts.disabled) this.applyDisabled(true);
		if (opts.pressed != null) this.element.setAttribute('aria-pressed', opts.pressed ? 'true' : 'false');
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

		this.iconWrap = document.createElement('span');
		this.iconWrap.className = 's-icon-button__icon';
		this.iconWrap.setAttribute('aria-hidden', 'true');
		this.iconWrap.append(this.iconEl);

		this.badgeEl = document.createElement('span');
		this.badgeEl.className = 's-icon-button__badge';
		this.badgeEl.setAttribute('aria-hidden', 'true');
		this.badgeEl.hidden = true;
		if (opts.badge != null) {
			this.badgeEl.textContent = String(opts.badge);
			this.badgeEl.hidden = false;
		}

		this.applyVariantDataset();
		this.applyTokens();
		this.element.append(this.iconWrap, this.badgeEl);
		this.wireClick();
	}

	private applyVariantDataset(): void {
		this.element.dataset.tone = this.variants.tone;
		this.element.dataset.size = this.variants.size;
		this.element.dataset.shape = this.variants.shape;
	}

	private applyTokens(): void {
		const resolved = resolveIconButtonTokens(this.variants);
		for (const [prop, val] of Object.entries(resolved)) {
			this.element.style.setProperty(prop, val);
		}
		if (this.styleOverrides) {
			for (const [prop, val] of Object.entries(this.styleOverrides)) {
				this.element.style.setProperty(prop, val);
			}
		}
	}

	private wireClick(): void {
		if (!this.opts.onClick) return;
		this.clickHandler = (ev) => {
			if (this.isDisabled()) return;
			this.opts.onClick!(ev);
		};
		this.element.addEventListener('click', this.clickHandler);
	}

	private isDisabled(): boolean {
		if ('disabled' in this.element) {
			return !!(this.element as HTMLButtonElement).disabled;
		}
		return this.element.getAttribute('aria-disabled') === 'true';
	}

	private applyDisabled(disabled: boolean): void {
		if ('disabled' in this.element) {
			(this.element as HTMLButtonElement).disabled = disabled;
		} else {
			if (disabled) this.element.setAttribute('aria-disabled', 'true');
			else this.element.removeAttribute('aria-disabled');
		}
	}

	setVariants(partial: Partial<IconButtonVariants>): void {
		this.variants = mergeIconButtonVariants({ ...this.variants, ...partial });
		this.applyVariantDataset();
		this.applyTokens();
	}

	setIcon(icon: HTMLElement | SVGElement): void {
		this.iconEl = icon;
		this.iconWrap.replaceChildren(icon);
		this.opts = { ...this.opts, icon };
	}

	render(): HTMLElement {
		return this.element;
	}

	setLabel(label: string): void {
		this.element.setAttribute('aria-label', label);
		this.opts = { ...this.opts, label };
	}

	setDisabled(disabled: boolean): void {
		this.applyDisabled(disabled);
	}

	setPressed(pressed: boolean): void {
		this.element.setAttribute('aria-pressed', pressed ? 'true' : 'false');
	}

	setBadge(badge: string | number | undefined): void {
		if (badge == null) {
			this.badgeEl.hidden = true;
			this.badgeEl.textContent = '';
		} else {
			this.badgeEl.hidden = false;
			this.badgeEl.textContent = String(badge);
		}
	}

	destroy(): void {
		if (this.clickHandler) {
			this.element.removeEventListener('click', this.clickHandler);
			this.clickHandler = null;
		}
		this.element.remove();
	}
}

/** Factory — preferred entry. */
export function createIconButton(opts: IconButtonOptions): IconButton {
	return new IconButton(opts);
}

export type { IconButtonHandle, IconButtonOptions, IconButtonVariants } from './types.js';
