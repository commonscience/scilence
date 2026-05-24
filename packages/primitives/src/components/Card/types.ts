/** Card shell elevation — shadow depth. */
export type Elevation = 'hairline' | 'raised' | 'float';

/** Card shell tone — background / border treatment. */
export type Tone = 'default' | 'admin' | 'product' | 'warning' | 'success';

/** Card prominence tier (doctrine tier-A surfaces). */
export type Tier = 'A' | 'B';

/** Card internal padding density. */
export type Density = 'compact' | 'regular';

export type CardVariants = {
	elevation: Elevation;
	tone: Tone;
	tier: Tier;
	density: Density;
};

export type CardSlotName = 'head' | 'body' | 'footer';

/** Chrome ids that must stay visible regardless of surface eye-toggle prefs. */
export const ALWAYS_VISIBLE_CHROME_IDS = [
	'substate-exception',
	'prototype',
	'lens-bg',
] as const;

export type AlwaysVisibleChromeId = (typeof ALWAYS_VISIBLE_CHROME_IDS)[number];

export interface CardOptions {
	variants?: Partial<CardVariants>;
	/** Root tag (kanban uses `button`). Default `div`. */
	tagName?: keyof HTMLElementTagNameMap;
	/** Extra classes on the root (e.g. `oar-phasecard` for legacy selectors). */
	className?: string;
	/** Extra attributes on the root element. */
	attributes?: Record<string, string>;
	/** Surface-specific resolved token overrides (e.g. kanban hover mix). */
	styleOverrides?: Record<string, string>;
}

export interface CardHandle {
	readonly element: HTMLElement;
	/** Mount content into a named slot region. */
	slot(name: CardSlotName, content: HTMLElement): void;
	/** Declare load-bearing chrome ids this card enforces as always visible. */
	alwaysVisible(keys: readonly string[]): void;
	/** Returns the root element (idempotent). */
	render(): HTMLElement;
	/** Whether a chrome id is in the always-visible contract. */
	isAlwaysVisibleChrome(id: string): boolean;
}
