/** Button variant — semantic role + visual treatment.
 *   - `primary`: primary action (accent / brand-700 greenscale). Per
 *     feedback_primary_action_tone_is_accent — Caitlin direct 2026-06-07.
 *   - `secondary`: neutral action (bordered surface). Cancel, "Not now."
 *   - `ghost`: transparent / chrome-light. Inline actions inside
 *     content areas where surface chrome would compete.
 *   - `danger`: destructive / irreversible (delete, discard). Use sparingly;
 *     pair with confirm dialog (modal) for non-trivial damage.
 *   - `add`: dashed-ghost "+ add X" affordance. Per 2026-06-07
 *     componentization audit: 3+ surfaces reimplement this pattern
 *     (sibling-projects__new-btn, right-rail-add-widget,
 *     project-notebook__add-cell). */
export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'add';

/** Button size — height / padding / font-size scale.
 *   - `sm`: compact (12.17px), tight rails, secondary controls
 *   - `md`: default (14px), most buttons
 *   - `lg`: hero / CTA (14px, taller height) */
export type Size = 'sm' | 'md' | 'lg';

/** Icon placement when an icon is provided. */
export type IconPosition = 'left' | 'right';

export type ButtonVariants = {
	variant: Variant;
	size: Size;
};

export interface ButtonOptions {
	variants?: Partial<ButtonVariants>;
	/** Button label (visible text). Required. */
	label: string;
	/** Optional icon element (left or right per iconPosition). */
	icon?: HTMLElement | SVGElement;
	iconPosition?: IconPosition;
	/** Disabled state — both visual + native disabled attr. */
	disabled?: boolean;
	/** Loading state — replaces label with inline spinner. */
	loading?: boolean;
	/** Full-width — width: 100% on parent. */
	fullWidth?: boolean;
	/** When set, root renders as <a href=...> instead of <button>. */
	href?: string;
	/** Button type attribute (button | submit | reset). Default 'button'. */
	type?: 'button' | 'submit' | 'reset';
	/** Click handler. Async handlers supported (button auto-disables until
	 * resolved if `awaitClick: true`). */
	onClick?: (ev: MouseEvent) => void | Promise<void>;
	/** When true and onClick returns a Promise, the button disables itself
	 * + shows loading state until the promise resolves. */
	awaitClick?: boolean;
	/** Root tag override (only useful if neither <button> nor <a> fits;
	 * the host is then responsible for keyboard accessibility). */
	tagName?: keyof HTMLElementTagNameMap;
	/** Extra classes on the root (surface hooks). */
	className?: string;
	/** Extra attributes on the root. */
	attributes?: Record<string, string>;
	/** Per-mount resolved token overrides. */
	styleOverrides?: Record<string, string>;
}

export interface ButtonHandle {
	readonly element: HTMLElement;
	render: () => HTMLElement;
	setVariants: (partial: Partial<ButtonVariants>) => void;
	setLabel: (label: string) => void;
	setIcon: (icon: HTMLElement | SVGElement | undefined) => void;
	setDisabled: (disabled: boolean) => void;
	setLoading: (loading: boolean) => void;
	destroy: () => void;
}
