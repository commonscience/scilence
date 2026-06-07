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
	/** Called whenever a section's expanded state changes. */
	onToggle?: (id: string, expanded: boolean) => void;
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
}
