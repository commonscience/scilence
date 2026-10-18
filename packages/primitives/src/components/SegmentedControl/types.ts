/** SegmentedControl size — sm for rails and dense toolbars, md default (28px, the toolbar control height). */
export type Size = 'sm' | 'md';

export interface SegmentedOption {
	/** Stable id written to `data-value`; never a display label. */
	id: string;
	/** Accessible name and default visible text. */
	label: string;
	/**
	 * Visible content instead of the label: a Node, or an HTML string the
	 * CALLER owns (icons). The label stays the accessible name.
	 */
	icon?: Node | string;
	disabled?: boolean;
	/** Tooltip dictionary key (`data-tip`); without it the label is the title. */
	tooltipKey?: string;
	/** Extra data-* attributes on the item (consumer hooks, e.g. `{ view: 'grid' }`). */
	data?: Record<string, string>;
}

export interface SegmentedControlOptions {
	options: SegmentedOption[];
	/** Selected id; falls back to the first enabled option. */
	value?: string;
	/** Fires on a user change (click or arrow key), not on setValue(). */
	onChange?: (id: string) => void;
	/** Accessible name of the radiogroup. */
	ariaLabel: string;
	size?: Size;
	/** Extra classes on the group / on every item (consumer hooks, never style). */
	className?: string;
	itemClassName?: string;
}

export interface SegmentedControlHandle {
	readonly element: HTMLElement;
	getValue(): string | undefined;
	/** Select programmatically; does not fire onChange. */
	setValue(id: string): void;
	destroy(): void;
}
