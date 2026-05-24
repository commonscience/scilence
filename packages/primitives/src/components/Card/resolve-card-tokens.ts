import type { CardVariants, Density, Elevation, Tier, Tone } from './types.js';

const DEFAULT_VARIANTS: CardVariants = {
	elevation: 'hairline',
	tone: 'default',
	tier: 'B',
	density: 'regular',
};

export function mergeCardVariants(
	partial?: Partial<CardVariants>,
): CardVariants {
	return { ...DEFAULT_VARIANTS, ...partial };
}

/**
 * Single token lookup for a variant combination — sets resolved `--s-card-*`
 * custom properties on the element (no competing CSS selectors).
 */
export function resolveCardTokens(vars: CardVariants): Record<string, string> {
	const tone = vars.tone;
	const tier = vars.tier;
	const density = vars.density;
	const elevation = vars.elevation;

	const toneBg = `var(--s-card-tone-${tone}-bg)`;
	const toneBorderWidth = `var(--s-card-tone-${tone}-border-width)`;
	const toneBorderColor = `var(--s-card-tone-${tone}-border-color)`;
	const toneBgHover = `var(--s-card-tone-${tone}-bg-hover)`;

	const elevationShadow = `var(--s-card-elevation-${elevation}-shadow)`;
	const tierShadow =
		tier === 'A' ? 'var(--s-card-tier-a-shadow)' : 'var(--s-card-tier-b-shadow)';

	// Tier-A hairline stacks with tone shell; lens tones already carry hairline via elevation.
	const boxShadow =
		tone !== 'default'
			? elevationShadow
			: tier === 'A'
				? tierShadow
				: elevation === 'hairline'
					? 'var(--s-card-elevation-none-shadow)'
					: elevationShadow;

	return {
		'--s-card-bg': toneBg,
		'--s-card-bg-hover': toneBgHover,
		'--s-card-border-width': toneBorderWidth,
		'--s-card-border-color': toneBorderColor,
		'--s-card-shadow': boxShadow,
		'--s-card-padding-block': `var(--s-card-density-${density}-padding-block)`,
		'--s-card-padding-inline': `var(--s-card-density-${density}-padding-inline)`,
		'--s-card-gap': `var(--s-card-density-${density}-gap)`,
	};
}

export { DEFAULT_VARIANTS };
export type { CardVariants, Density, Elevation, Tier, Tone };
