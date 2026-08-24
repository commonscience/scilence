/**
 * inspector-stack — types
 *
 * Reusable ordered list of collapsible inspector sections (right-rail panels),
 * with pointer drag-to-reorder, full keyboard reorder + ARIA live announcement,
 * and per-surface localStorage persistence of order + collapsed state.
 *
 * Surface-agnostic. First consumers: notebook inspector, library inspector
 * (see brief library-inspector-section-stack.md).
 */

/** Optional render hook used when `body` is not provided up front. */
export type InspectorSectionRender = (host: HTMLElement) => void;

/**
 * Section descriptor passed into the primitive. One of `body` / `render`
 * is expected; if both are present, `body` wins and `render` is ignored.
 */
export interface InspectorSectionDescriptor {
	/** Stable identifier (used in persistence + DOM data attributes). */
	id: string;
	/** Visible section title rendered in the header. */
	title: string;
	/** Pre-built body element. */
	body?: HTMLElement;
	/** Render hook — called once with the body host on construction. */
	render?: InspectorSectionRender;
	/** Initial expanded state (only used when there is no persisted entry). */
	defaultExpanded?: boolean;
	/** Initial visibility (only used when there is no persisted entry). */
	defaultVisible?: boolean;
	/**
	 * Give this section an OVERFLOW (kebab) button at the end of its header.
	 *
	 * The primitive owns the button — placement, hit area, aria, the fact that
	 * clicking it does not toggle the card — and nothing else. What the menu
	 * contains is surface knowledge, so `onOpen` is called with the button as
	 * the anchor and the surface mounts whatever menu it likes.
	 */
	menu?: InspectorSectionMenu;
}

/** Overflow-button wiring for one section (see `InspectorSectionDescriptor.menu`). */
export interface InspectorSectionMenu {
	/** Accessible name. Defaults to `More ${title} options`. */
	label?: string;
	/** Invoked on click / Enter with the button, so the surface can anchor to it. */
	onOpen: (anchor: HTMLButtonElement, event: Event) => void;
}

/** Constructor options for the inspector-stack primitive. */
export interface InspectorStackOptions {
	/**
	 * Per-surface identifier — used as the localStorage namespace.
	 * Key shape: `inspector-stack:<surface>:v1`.
	 * Mirrors the filter-rail `:<surface>:groups-v1` convention.
	 */
	surface: string;
	/** Ordered list of section descriptors. */
	sections: InspectorSectionDescriptor[];
	/** Optional class added to the root container in addition to the primitive's own. */
	rootClass?: string;
	/** Optional class added to each card section in addition to the primitive's own. */
	cardClass?: string;
	/**
	 * Optional storage implementation. Defaults to window.localStorage,
	 * with a silent no-op fallback when access throws (private mode / SSR).
	 */
	storage?: InspectorStackStorage;
	/** Called whenever the section order changes (drag or keyboard reorder). */
	onReorder?: (order: string[]) => void;
	/**
	 * Called whenever a section's expanded state changes.
	 *
	 * `meta.source` separates a reader's own click on the header from a
	 * programmatic `setExpanded`. A surface that wants to stop fighting the
	 * reader — re-opening a card they just shut every time the selection
	 * changes — needs to know which of the two it is looking at.
	 */
	onToggle?: (id: string, expanded: boolean, meta: { source: 'user' | 'api' }) => void;
}

/** Minimal storage shape — pluggable for tests / SSR. */
export interface InspectorStackStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

/** Public handle returned by `createInspectorStack`. */
export interface InspectorStackHandle {
	/** The mounted root element — append this to your right-rail host. */
	readonly root: HTMLElement;
	/** Expand or collapse a section by id. No-op if id is unknown. */
	setExpanded(id: string, expanded: boolean): void;
	/** Show or hide a section by id. Hidden sections are skipped by keyboard reorder. */
	setVisible(id: string, visible: boolean): void;
	/** Read the expanded state for a section. */
	isExpanded(id: string): boolean;
	/** Read the visibility state for a section. */
	isVisible(id: string): boolean;
	/** Current section id order (visible + hidden). */
	getOrder(): string[];
	/** Programmatically reorder. Silently ignores unknown ids. */
	setOrder(order: string[]): void;
	/** Return the section card root for a given id, or null. */
	getCardElement(id: string): HTMLElement | null;
	/** Return the section body host for a given id, or null. */
	getBodyElement(id: string): HTMLElement | null;
	/**
	 * Set a section's PEEK line — one short fact the card keeps saying while it
	 * is collapsed ("19 events · latest Apr 2016").
	 *
	 * Collapsing is only calm if it is cheap to undo, and it is only cheap to
	 * undo if you can tell from the shut card whether you need it open. Every
	 * section has the slot (it is also the spacer that pins the chevron to the
	 * right edge); a section that never calls this simply shows nothing in it.
	 * The text is retained but not painted while the card is expanded — the
	 * body is already saying more than the peek could.
	 */
	setPeek(id: string, text: string): void;
	/** Return the section's overflow button, or null when it declared no menu. */
	getMenuButton(id: string): HTMLButtonElement | null;
}
