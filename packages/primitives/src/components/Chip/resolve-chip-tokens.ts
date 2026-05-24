import type { ChipVariants, Shape, Size, Slot, Tone } from './types.js';

const DEFAULT_VARIANTS: ChipVariants = {
	shape: 'square',
	slot: 'text-only',
	tone: 'default',
	size: 'md',
};

export function mergeChipVariants(partial?: Partial<ChipVariants>): ChipVariants {
	return { ...DEFAULT_VARIANTS, ...partial };
}

/**
 * Single token lookup for a variant combination — sets resolved `--s-chip-*`
 * custom properties on the element (no competing CSS selectors).
 */
export function resolveChipTokens(vars: ChipVariants): Record<string, string> {
	const size = vars.size;
	const shape = vars.shape;
	const tone = vars.tone;

	return {
		'--s-chip-font-size': `var(--s-chip-size-${size}-font-size)`,
		'--s-chip-line-height': `var(--s-chip-size-${size}-line-height)`,
		'--s-chip-padding-block': `var(--s-chip-size-${size}-padding-block)`,
		'--s-chip-padding-inline': `var(--s-chip-size-${size}-padding-inline)`,
		'--s-chip-gap': `var(--s-chip-size-${size}-gap)`,
		'--s-chip-radius': `var(--s-chip-shape-${shape}-radius)`,
		'--s-chip-bg': `var(--s-chip-tone-${tone}-bg)`,
		'--s-chip-fg': `var(--s-chip-tone-${tone}-fg)`,
		'--s-chip-border-width': `var(--s-chip-tone-${tone}-border-width)`,
		'--s-chip-border-color': `var(--s-chip-tone-${tone}-border-color)`,
	};
}

export { DEFAULT_VARIANTS };
export type { ChipVariants, Shape, Size, Slot, Tone };
