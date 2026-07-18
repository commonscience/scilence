/**
 * @scilence/primitives — Button (vanilla TS).
 *
 * Variant axes (variant × size) resolve to a single token lookup on the
 * root element. Matches Card / Chip pattern.
 *
 * Primary tone = accent (brand-700 greenscale) per
 * feedback_primary_action_tone_is_accent (Caitlin direct 2026-06-07).
 *
 * Parallel to the existing guide/shell/js/components/button.js
 * (admin-only legacy with 5 sizes + 4 variants + color overrides);
 * consumers migrate incrementally as they touch buttons.
 */

import { mergeButtonVariants, resolveButtonTokens } from './resolve-button-tokens.js';
import type { ButtonHandle, ButtonOptions, ButtonVariants } from './types.js';

export class Button implements ButtonHandle {
	readonly element: HTMLElement;
	private variants: ButtonVariants;
	private opts: ButtonOptions;

	private readonly iconWrap: HTMLSpanElement;
	private readonly labelEl: HTMLSpanElement;
	private readonly spinnerEl: HTMLSpanElement;
	private iconEl: HTMLElement | SVGElement | undefined;

	private styleOverrides: Record<string, string> | undefined;
	private clickHandler: ((ev: MouseEvent) => void) | null = null;

	constructor(opts: ButtonOptions) {
		this.opts = opts;
		this.variants = mergeButtonVariants(opts.variants);
		this.iconEl = opts.icon;
		this.styleOverrides = opts.styleOverrides;

		const tag = opts.tagName ?? (opts.href ? 'a' : 'button');
		this.element = document.createElement(tag);
		this.element.classList.add('s-button');

		if (tag === 'button') {
			(this.element as HTMLButtonElement).type = opts.type ?? 'button';
		}
		if (opts.href) {
			this.element.setAttribute('href', opts.href);
		}
		if (opts.disabled) {
			this.applyDisabled(true);
		}
		if (opts.fullWidth) {
			this.element.classList.add('s-button--full-width');
		}
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
		this.iconWrap.className = 's-button__icon';
		this.iconWrap.setAttribute('aria-hidden', 'true');

		this.labelEl = document.createElement('span');
		this.labelEl.className = 's-button__label';
		this.labelEl.textContent = opts.label;

		this.spinnerEl = document.createElement('span');
		this.spinnerEl.className = 's-button__spinner';
		this.spinnerEl.setAttribute('aria-hidden', 'true');
		this.spinnerEl.hidden = true;

		this.applyVariantDataset();
		this.applyTokens();
		this.mountChildren();
		this.wireClick();

		if (opts.loading) this.setLoading(true);
	}

	private applyVariantDataset(): void {
		this.element.dataset.variant = this.variants.variant;
		this.element.dataset.size = this.variants.size;
	}

	private applyTokens(): void {
		const resolved = resolveButtonTokens(this.variants);
		for (const [prop, val] of Object.entries(resolved)) {
			this.element.style.setProperty(prop, val);
		}
		if (this.styleOverrides) {
			for (const [prop, val] of Object.entries(this.styleOverrides)) {
				this.element.style.setProperty(prop, val);
			}
		}
	}

	private mountChildren(): void {
		const iconPosition = this.opts.iconPosition ?? 'left';
		this.element.replaceChildren();
		const parts: Node[] = [];

		if (this.iconEl && iconPosition === 'left') {
			this.iconWrap.replaceChildren(this.iconEl);
			parts.push(this.iconWrap);
		}
		parts.push(this.labelEl);
		if (this.iconEl && iconPosition === 'right') {
			this.iconWrap.replaceChildren(this.iconEl);
			parts.push(this.iconWrap);
		}
		parts.push(this.spinnerEl);

		this.element.append(...parts);
	}

	private wireClick(): void {
		if (!this.opts.onClick) return;
		this.clickHandler = (ev) => {
			if (this.isDisabled()) return;
			const result = this.opts.onClick!(ev);
			if (result instanceof Promise && this.opts.awaitClick) {
				this.setLoading(true);
				result.finally(() => this.setLoading(false));
			}
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

	setVariants(partial: Partial<ButtonVariants>): void {
		this.variants = mergeButtonVariants({ ...this.variants, ...partial });
		this.applyVariantDataset();
		this.applyTokens();
	}

	setLabel(label: string): void {
		this.labelEl.textContent = label;
		this.opts = { ...this.opts, label };
	}

	setIcon(icon: HTMLElement | SVGElement | undefined): void {
		this.iconEl = icon;
		this.opts = { ...this.opts, icon };
		this.mountChildren();
	}

	render(): HTMLElement {
		return this.element;
	}

	setDisabled(disabled: boolean): void {
		this.applyDisabled(disabled);
	}

	setLoading(loading: boolean): void {
		if (loading) {
			this.element.classList.add('s-button--loading');
			this.applyDisabled(true);
			this.labelEl.hidden = true;
			this.spinnerEl.hidden = false;
		} else {
			this.element.classList.remove('s-button--loading');
			if (!this.opts.disabled) this.applyDisabled(false);
			this.labelEl.hidden = false;
			this.spinnerEl.hidden = true;
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
export function createButton(opts: ButtonOptions): Button {
	return new Button(opts);
}

export type { ButtonHandle, ButtonOptions, ButtonVariants } from './types.js';
