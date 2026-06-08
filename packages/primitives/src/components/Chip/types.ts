/** Chip corner treatment. */
export type Shape = 'square' | 'round';

/** Content layout — icon/number/microLabel placement relative to value.
 * `label-value` is a composite slot: uppercase microLabel + mono value
 * (e.g., "TIER: A", "ASSAY: pIC50") — requires `microLabel` in options. */
export type Slot =
	| 'text-only'
	| 'icon-left'
	| 'icon-right'
	| 'number-left'
	| 'number-right'
	| 'label-value';

/** Semantic color treatment — use sparingly beyond categorization.
 *   - `accent`: primary action / chosen state (brand-700 greenscale)
 *   - `info`: status communication (loading / pending / async).
 *     NOT primary action — see feedback_primary_action_tone_is_accent.
 *   - `warning`: stale / draft / override
 *   - `success`: shipped / fresh / passing
 *   - `muted`: inert metadata
 *   - `default`: neutral subtle (most chips) */
export type Tone = 'default' | 'accent' | 'info' | 'warning' | 'success' | 'muted';

/** Chip density / type scale.
 *   - `xs`: micro-size (kbd hints, H-level badges, wb-region__kind)
 *   - `sm`: default everywhere
 *   - `md`: standard non-condensed (breadcrumb pills, prototype chips) */
export type Size = 'xs' | 'sm' | 'md';

export type ChipVariants = {
	shape: Shape;
	slot: Slot;
	tone: Tone;
	size: Size;
};

export interface ChipOptions {
	variants?: Partial<ChipVariants>;
	/** Primary label text (or the VALUE half of a label-value slot). */
	text: string;
	/** Uppercase micro-label (label-value slot only — the "TIER" in
	 * "TIER: A"). Required when slot === 'label-value'; ignored
	 * otherwise. Without it on label-value, chip falls back to text-only. */
	microLabel?: string;
	/** Lucide or custom SVG/icon element (icon-left / icon-right slots). */
	icon?: HTMLElement | SVGElement;
	/** Count or badge value (number-left / number-right slots). */
	number?: string | number;
	/** Root tag. Default `span`. Filter rail uses `button`. */
	tagName?: keyof HTMLElementTagNameMap;
	/** Extra classes on the root (surface hooks, e.g. `oar-disc-chip--ux`). */
	className?: string;
	/** Extra attributes on the root element. */
	attributes?: Record<string, string>;
	/** Surface-specific resolved token overrides (e.g. substate bg). */
	styleOverrides?: Record<string, string>;
}

export interface ChipHandle {
	readonly element: HTMLElement;
	/** Update variant axes and re-resolve tokens. */
	setVariants: (partial: Partial<ChipVariants>) => void;
	setText: (text: string) => void;
	setMicroLabel: (microLabel: string | undefined) => void;
	setNumber: (value: string | number | undefined) => void;
	setIcon: (icon: HTMLElement | SVGElement | undefined) => void;
	render: () => HTMLElement;
}
