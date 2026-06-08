import type { ButtonVariants, Size, Variant } from './types.js';

const DEFAULT_VARIANTS: ButtonVariants = {
	variant: 'primary',
	size: 'md',
};

export function mergeButtonVariants(partial?: Partial<ButtonVariants>): ButtonVariants {
	return { ...DEFAULT_VARIANTS, ...partial };
}

/**
 * Single token lookup for a variant combination — sets resolved
 * `--s-button-*` custom properties on the element (no competing CSS
 * selectors). Mirrors the Card / Chip pattern.
 */
export function resolveButtonTokens(vars: ButtonVariants): Record<string, string> {
	const v = vars.variant;
	const s = vars.size;
	return {
		'--s-button-font-size': `var(--s-button-size-${s}-font-size)`,
		'--s-button-padding-block': `var(--s-button-size-${s}-padding-block)`,
		'--s-button-padding-inline': `var(--s-button-size-${s}-padding-inline)`,
		'--s-button-gap': `var(--s-button-size-${s}-gap)`,
		'--s-button-height': `var(--s-button-size-${s}-height)`,
		'--s-button-bg': `var(--s-button-variant-${v}-bg)`,
		'--s-button-fg': `var(--s-button-variant-${v}-fg)`,
		'--s-button-border-color': `var(--s-button-variant-${v}-border-color)`,
	};
}

export { DEFAULT_VARIANTS };
export type { ButtonVariants, Size, Variant };
