/**
 * Card — pan-app shell primitive (vanilla TS).
 *
 * Variant axes (elevation, tone, tier, density) resolve to a single token lookup
 * on the root element. Slot API mounts head / body / footer regions.
 */

import { mergeCardVariants, resolveCardTokens } from './resolve-card-tokens.js';
import type {
	AlwaysVisibleChromeId,
	CardHandle,
	CardOptions,
	CardSlotName,
	CardVariants,
} from './types.js';
import { ALWAYS_VISIBLE_CHROME_IDS } from './types.js';

export class Card implements CardHandle {
	readonly element: HTMLElement;
	private readonly variants: CardVariants;
	private readonly slots: Record<CardSlotName, HTMLElement>;
	private readonly alwaysVisibleSet = new Set<string>(ALWAYS_VISIBLE_CHROME_IDS);

	constructor(opts: CardOptions = {}) {
		this.variants = mergeCardVariants(opts.variants);
		const tag = opts.tagName ?? 'div';
		this.element = document.createElement(tag);
		this.element.classList.add('s-card');
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
		this.element.dataset.elevation = this.variants.elevation;
		this.element.dataset.tone = this.variants.tone;
		this.element.dataset.tier = this.variants.tier;
		this.element.dataset.density = this.variants.density;

		const resolved = resolveCardTokens(this.variants);
		for (const [prop, val] of Object.entries(resolved)) {
			this.element.style.setProperty(prop, val);
		}
		if (opts.styleOverrides) {
			for (const [prop, val] of Object.entries(opts.styleOverrides)) {
				this.element.style.setProperty(prop, val);
			}
		}

		this.slots = {
			head: this.makeSlot('head'),
			body: this.makeSlot('body'),
			footer: this.makeSlot('footer'),
		};
		for (const slotEl of Object.values(this.slots)) {
			this.element.appendChild(slotEl);
		}
	}

	private makeSlot(name: CardSlotName): HTMLElement {
		const wrap = document.createElement('div');
		wrap.className = `s-card__slot s-card__slot--${name}`;
		wrap.dataset.cardSlot = name;
		return wrap;
	}

	slot(name: CardSlotName, content: HTMLElement): void {
		const region = this.slots[name];
		region.replaceChildren(content);
	}

	alwaysVisible(keys: readonly string[]): void {
		for (const id of keys) this.alwaysVisibleSet.add(id);
		this.element.dataset.alwaysVisible = 'true';
	}

	isAlwaysVisibleChrome(id: string): boolean {
		return this.alwaysVisibleSet.has(id);
	}

	render(): HTMLElement {
		return this.element;
	}

	/** Mark a chrome node as load-bearing (primitive contract). */
	markChromeElement(el: HTMLElement, chromeId: string): void {
		el.dataset.chromeId = chromeId;
		if (this.isAlwaysVisibleChrome(chromeId)) {
			el.dataset.alwaysVisibleChrome = 'true';
		}
	}
}

/** Factory — preferred entry for surfaces. */
export function createCard(opts: CardOptions = {}): Card {
	return new Card(opts);
}

export type { CardHandle, CardOptions, CardSlotName, CardVariants, AlwaysVisibleChromeId };
export { ALWAYS_VISIBLE_CHROME_IDS };
