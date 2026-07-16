/** Menu density / type scale.
 *   - `sm`: compact chrome menus (shell footer account menu, breadcrumb switchers)
 *   - `md`: standard surface menus */
export type MenuSize = 'sm' | 'md';

/** Root surface treatment.
 *   - `surface`: menu paints its own raised-plane chrome (bg + border +
 *     shadow via `--s-shadow-*`, per feedback_box_shadow_carveouts) —
 *     standalone dropdown use.
 *   - `bare`: transparent root — for embedding inside an existing popover
 *     container that already owns the surface chrome. */
export type MenuChrome = 'surface' | 'bare';

export type MenuVariants = {
	size: MenuSize;
	chrome: MenuChrome;
};

/** An activatable row. */
export interface MenuItemDescriptor {
	id: string;
	label: string;
	/** Lucide or custom SVG/icon element. The primitive is icon-system-agnostic. */
	icon?: HTMLElement | SVGElement;
	/** Right-aligned hint (e.g. a kbd shortcut like "⌘K"). */
	hint?: string;
	/** Trailing element slot (chevron, badge). Rendered after label/hint. */
	trailing?: HTMLElement | SVGElement;
	/** Destructive tone (Sign out, Delete …) — fg switches to status-danger. */
	danger?: boolean;
	disabled?: boolean;
	/** Marks the current selection (`aria-current`), e.g. active project. */
	active?: boolean;
	/** Extra attributes on the item element (data hooks, title). */
	attributes?: Record<string, string>;
}

/** Non-interactive rows. */
export type MenuSeparator = { separator: true };
export type MenuHeader = { header: string };
/** Free-form presentation row (identity blocks, empty states). Never focusable. */
export type MenuCustomRow = { custom: HTMLElement };

export type MenuEntry = MenuItemDescriptor | MenuSeparator | MenuHeader | MenuCustomRow;

export interface MenuConfig {
	entries: MenuEntry[];
	/** Called on click / Enter / Space of an enabled item. The consumer owns
	 * what happens next (navigate, close popover, open submenu …). */
	onSelect: (id: string, item: MenuItemDescriptor, event: Event) => void;
	/** Accessible name for the `role="menu"` root. */
	ariaLabel: string;
	variants?: Partial<MenuVariants>;
	/** Extra classes on the root (surface hooks). */
	className?: string;
	/** Extra attributes on the root element. */
	attributes?: Record<string, string>;
}

export interface MenuHandle {
	readonly element: HTMLElement;
	/** Replace all entries and re-render. */
	setEntries: (entries: MenuEntry[]) => void;
	/** Move roving focus to the first enabled item (call after opening). */
	focusFirst: () => void;
	setVariants: (partial: Partial<MenuVariants>) => void;
	render: () => HTMLElement;
	destroy: () => void;
}
