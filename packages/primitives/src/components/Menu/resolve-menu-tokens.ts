import type { MenuChrome, MenuSize, MenuVariants } from './types.js';

const DEFAULT_VARIANTS: MenuVariants = {
	size: 'sm',
	chrome: 'surface',
};

export function mergeMenuVariants(partial?: Partial<MenuVariants>): MenuVariants {
	return { ...DEFAULT_VARIANTS, ...partial };
}

/**
 * Single token lookup for a variant combination — sets resolved `--s-menu-*`
 * custom properties on the root element (no competing CSS selectors).
 * Item tones (danger / disabled / active) are per-item data attributes
 * handled in Menu.css, not variant axes.
 */
export function resolveMenuTokens(vars: MenuVariants): Record<string, string> {
	const size = vars.size;

	return {
		'--s-menu-font-size': `var(--s-menu-size-${size}-font-size)`,
		'--s-menu-item-padding-block': `var(--s-menu-size-${size}-item-padding-block)`,
		'--s-menu-item-padding-inline': `var(--s-menu-size-${size}-item-padding-inline)`,
		'--s-menu-item-gap': `var(--s-menu-size-${size}-item-gap)`,
		'--s-menu-icon-size': `var(--s-menu-size-${size}-icon-size)`,
	};
}

export { DEFAULT_VARIANTS };
export type { MenuChrome, MenuSize, MenuVariants };
