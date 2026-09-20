export interface PlacementHandleOptions {
	/** Human-readable noun used to build the action name, e.g. `Text`. */
	itemLabel: string;
	/** Optional owner document for portals, iframes and deterministic tests. */
	document?: Document;
	disabled?: boolean;
	onActivate?: (event: MouseEvent) => void;
}

export interface PlacementHandle {
	readonly element: HTMLButtonElement;
	render: () => HTMLButtonElement;
	setDisabled: (disabled: boolean) => void;
	setItemLabel: (itemLabel: string) => void;
	destroy: () => void;
}

export function placementHandleLabel(itemLabel: string): string {
	return `Place ${itemLabel.trim()}\u2026`;
}

/**
 * Create the discoverable action paired with a draggable item.
 *
 * The consumer puts the handle and the draggable/browsing button next to each
 * other inside an `.s-placement-item`. Keeping two real sibling buttons avoids
 * invalid nested controls. Native button activation supplies click, tap,
 * Enter and Space equivalence; application code owns location choice and any
 * later persistence.
 */
export function createPlacementHandle(options: PlacementHandleOptions): PlacementHandle {
	const doc = options.document ?? document;
	const element = doc.createElement('button');
	element.type = 'button';
	element.className = 's-placement-handle';
	element.dataset.placementHandle = '';

	const icon = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
	icon.setAttribute('viewBox', '0 0 16 16');
	icon.setAttribute('aria-hidden', 'true');
	icon.setAttribute('focusable', 'false');
	icon.innerHTML = '<circle cx="5" cy="4" r="1"/><circle cx="11" cy="4" r="1"/><circle cx="5" cy="8" r="1"/><circle cx="11" cy="8" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="11" cy="12" r="1"/>';
	const visibleLabel = doc.createElement('span');
	visibleLabel.className = 's-placement-handle__label';
	visibleLabel.textContent = 'Place';
	element.append(icon, visibleLabel);

	const setItemLabel = (itemLabel: string) => element.setAttribute('aria-label', placementHandleLabel(itemLabel));
	const setDisabled = (disabled: boolean) => { element.disabled = disabled; };
	const onClick = (event: MouseEvent) => {
		if (!element.disabled) options.onActivate?.(event);
	};

	setItemLabel(options.itemLabel);
	setDisabled(options.disabled ?? false);
	element.addEventListener('click', onClick);

	return {
		element,
		render: () => element,
		setDisabled,
		setItemLabel,
		destroy() {
			element.removeEventListener('click', onClick);
			element.remove();
		},
	};
}
