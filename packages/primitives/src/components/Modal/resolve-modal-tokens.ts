import type { ModalVariants } from './types.js';

const DEFAULT_VARIANTS: ModalVariants = {
	size: 'md',
	mode: 'docked',
};

export function mergeModalVariants(
	partial?: Partial<ModalVariants>,
): ModalVariants {
	return { ...DEFAULT_VARIANTS, ...partial };
}

/**
 * Modal variants resolve via CSS classes (one selector per size variant)
 * rather than via custom-property lookup — sizes are sufficiently
 * structural that class-based selectors are clearer than property
 * indirection. resolveModalTokens is kept for symmetry with the Card /
 * Chip pattern + future surface-level overrides.
 */
export function resolveModalTokens(_vars: ModalVariants): Record<string, string> {
	return {};
}
