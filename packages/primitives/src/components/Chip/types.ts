/** Chip corner treatment. */
export type Shape = 'square' | 'round';

/** Content layout — icon/number placement relative to label. */
export type Slot = 'text-only' | 'icon-left' | 'icon-right' | 'number-left' | 'number-right';

/** Semantic color treatment — use sparingly beyond categorization. */
export type Tone = 'default' | 'accent' | 'warning' | 'success' | 'muted';

/** Chip density / type scale. */
export type Size = 'sm' | 'md';

export type ChipVariants = {
	shape: Shape;
	slot: Slot;
	tone: Tone;
	size: Size;
};

export interface ChipOptions {
	variants?: Partial<ChipVariants>;
	/** Primary label text. */
	text: string;
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
	setNumber: (value: string | number | undefined) => void;
	setIcon: (icon: HTMLElement | SVGElement | undefined) => void;
	render: () => HTMLElement;
}
