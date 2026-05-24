/**
 * Chip — pan-app label / badge primitive (vanilla TS).
 *
 * Variant axes (shape, slot, tone, size) resolve to a single token lookup
 * on the root element.
 */

import { mergeChipVariants, resolveChipTokens } from './resolve-chip-tokens.js';
import type { ChipHandle, ChipOptions, ChipVariants } from './types.js';

function effectiveSlot(
	variants: ChipVariants,
	icon?: HTMLElement | SVGElement,
	number?: string | number,
): ChipVariants['slot'] {
	if (variants.slot !== 'text-only') return variants.slot;
	if (icon) return 'icon-left';
	if (number != null) return 'number-right';
	return 'text-only';
}

export class Chip implements ChipHandle {
	readonly element: HTMLElement;
	private variants: ChipVariants;
	private iconEl: HTMLElement | SVGElement | undefined;
	private numberValue: string | number | undefined;
	private readonly labelEl: HTMLSpanElement;
	private readonly numberEl: HTMLSpanElement;
	private readonly iconWrap: HTMLSpanElement;
	private styleOverrides: Record<string, string> | undefined;

	constructor(opts: ChipOptions) {
		this.variants = mergeChipVariants(opts.variants);
		this.iconEl = opts.icon;
		this.numberValue = opts.number;
		this.styleOverrides = opts.styleOverrides;
		this.variants.slot = effectiveSlot(this.variants, this.iconEl, this.numberValue);

		const tag = opts.tagName ?? 'span';
		this.element = document.createElement(tag);
		this.element.classList.add('s-chip');
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
		this.iconWrap.className = 's-chip__icon';
		this.iconWrap.setAttribute('aria-hidden', 'true');

		this.labelEl = document.createElement('span');
		this.labelEl.className = 's-chip__label';

		this.numberEl = document.createElement('span');
		this.numberEl.className = 's-chip__number';
		this.numberEl.setAttribute('aria-hidden', 'true');

		this.labelEl.textContent = opts.text;
		this.applyVariantDataset();
		this.applyTokens();
		this.mountChildren();
	}

	private applyVariantDataset(): void {
		this.element.dataset.shape = this.variants.shape;
		this.element.dataset.slot = this.variants.slot;
		this.element.dataset.tone = this.variants.tone;
		this.element.dataset.size = this.variants.size;
	}

	private applyTokens(): void {
		const resolved = resolveChipTokens(this.variants);
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
		this.element.replaceChildren();
		const slot = this.variants.slot;
		const parts: Node[] = [];

		if (slot === 'number-left' && this.numberValue != null) {
			this.numberEl.textContent = String(this.numberValue);
			this.numberEl.hidden = false;
			parts.push(this.numberEl);
		}

		if (slot === 'icon-left' && this.iconEl) {
			this.iconWrap.replaceChildren(this.iconEl);
			this.iconWrap.hidden = false;
			parts.push(this.iconWrap);
		}

		parts.push(this.labelEl);

		if (slot === 'icon-right' && this.iconEl) {
			this.iconWrap.replaceChildren(this.iconEl);
			this.iconWrap.hidden = false;
			parts.push(this.iconWrap);
		}

		if (slot === 'number-right' && this.numberValue != null) {
			this.numberEl.textContent = String(this.numberValue);
			this.numberEl.hidden = false;
			parts.push(this.numberEl);
		}

		this.element.append(...parts);
	}

	setVariants(partial: Partial<ChipVariants>): void {
		this.variants = mergeChipVariants({ ...this.variants, ...partial });
		this.variants.slot = effectiveSlot(this.variants, this.iconEl, this.numberValue);
		this.applyVariantDataset();
		this.applyTokens();
		this.mountChildren();
	}

	setText(text: string): void {
		this.labelEl.textContent = text;
	}

	setNumber(value: string | number | undefined): void {
		this.numberValue = value;
		if (value == null) {
			this.numberEl.hidden = true;
			this.numberEl.textContent = '';
		} else {
			this.numberEl.hidden = false;
			this.numberEl.textContent = String(value);
		}
		this.variants.slot = effectiveSlot(this.variants, this.iconEl, this.numberValue);
		this.applyVariantDataset();
		this.mountChildren();
	}

	setIcon(icon: HTMLElement | SVGElement | undefined): void {
		this.iconEl = icon;
		this.variants.slot = effectiveSlot(this.variants, this.iconEl, this.numberValue);
		this.applyVariantDataset();
		this.mountChildren();
	}

	render(): HTMLElement {
		return this.element;
	}
}

/** Factory — preferred entry for surfaces. */
export function createChip(opts: ChipOptions): Chip {
	return new Chip(opts);
}

export type { ChipHandle, ChipOptions, ChipVariants };
