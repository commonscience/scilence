/** IconButton tone — visual treatment.
 *   - `default`: subtle bg + muted fg, hover lifts to active surface.
 *     The dominant treatment across surfaces.
 *   - `ghost`: transparent bg, hover-bg overlay on interaction. For
 *     inline content surfaces where chrome would compete.
 *   - `outlined`: bordered surface, used when icon-button sits against
 *     a busy background that needs visual separation. */
export type Tone = 'default' | 'ghost' | 'outlined';

/** IconButton size — icon container dimensions.
 *   - `sm`: 22px container, 14px icon. Tight rails.
 *   - `md`: 28px container, 16px icon. Default.
 *   - `lg`: 36px container, 20px icon. Toolbar / modal close. */
export type Size = 'sm' | 'md' | 'lg';

/** IconButton shape — corner treatment.
 *   - `square`: rounded-rect (radius-1). Default; matches calm chrome.
 *   - `round`: circle (radius-pill). Use for one-off floating affordances. */
export type Shape = 'square' | 'round';

export type IconButtonVariants = {
	tone: Tone;
	size: Size;
	shape: Shape;
};

export interface IconButtonOptions {
	variants?: Partial<IconButtonVariants>;
	/** Icon element (required — this IS an icon button). */
	icon: HTMLElement | SVGElement;
	/** Accessible label (required for a11y; rendered as aria-label). */
	label: string;
	/** Disabled state — both visual + native disabled attr. */
	disabled?: boolean;
	/** Active state — `aria-pressed='true'` for toggle-style icon buttons. */
	pressed?: boolean;
	/** Optional count badge (renders as small overlay top-right). */
	badge?: string | number;
	/** Root tag override. Default `button`. Use `a` for nav affordances
	 * (set href via attributes). */
	tagName?: keyof HTMLElementTagNameMap;
	/** Click handler. */
	onClick?: (ev: MouseEvent) => void;
	/** Extra classes on the root (surface hooks). */
	className?: string;
	/** Extra attributes on the root. */
	attributes?: Record<string, string>;
	/** Per-mount resolved token overrides. */
	styleOverrides?: Record<string, string>;
}

export interface IconButtonHandle {
	readonly element: HTMLElement;
	render: () => HTMLElement;
	setVariants: (partial: Partial<IconButtonVariants>) => void;
	setIcon: (icon: HTMLElement | SVGElement) => void;
	setLabel: (label: string) => void;
	setDisabled: (disabled: boolean) => void;
	setPressed: (pressed: boolean) => void;
	setBadge: (badge: string | number | undefined) => void;
	destroy: () => void;
}
