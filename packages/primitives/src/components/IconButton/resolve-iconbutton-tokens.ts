import type { IconButtonVariants, Shape, Size, Tone } from './types.js';

const DEFAULT_VARIANTS: IconButtonVariants = {
	tone: 'default',
	size: 'md',
	shape: 'square',
};

export function mergeIconButtonVariants(
	partial?: Partial<IconButtonVariants>,
): IconButtonVariants {
	return { ...DEFAULT_VARIANTS, ...partial };
}

/**
 * Single token lookup for a variant combination — sets resolved
 * `--s-icon-button-*` custom properties on the element. Same pattern
 * as Card / Chip / Button.
 */
export function resolveIconButtonTokens(
	vars: IconButtonVariants,
): Record<string, string> {
	const s = vars.size;
	const t = vars.tone;
	const sh = vars.shape;
	return {
		'--s-icon-button-size': `var(--s-icon-button-size-${s}-container)`,
		'--s-icon-button-icon-size': `var(--s-icon-button-size-${s}-icon)`,
		'--s-icon-button-radius': `var(--s-icon-button-shape-${sh}-radius)`,
		'--s-icon-button-bg': `var(--s-icon-button-tone-${t}-bg)`,
		'--s-icon-button-fg': `var(--s-icon-button-tone-${t}-fg)`,
		'--s-icon-button-border-color': `var(--s-icon-button-tone-${t}-border-color)`,
		'--s-icon-button-hover-bg': `var(--s-icon-button-tone-${t}-hover-bg)`,
	};
}

export { DEFAULT_VARIANTS };
export type { IconButtonVariants, Shape, Size, Tone };
