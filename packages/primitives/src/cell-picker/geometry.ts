/**
 * Geometry for a floating picker that must remain usable inside the visual
 * viewport. Presentation, focus, dismissal and top-layer ownership stay with
 * the consumer; this module only returns bounded dimensions and coordinates.
 */

export interface CellPickerPoint {
	x: number;
	y: number;
}

export interface CellPickerRect {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
}

export interface CellPickerViewport {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface CellPickerGeometryOptions {
	viewport: CellPickerViewport;
	panel: Pick<CellPickerRect, 'width' | 'height'>;
	anchor?: CellPickerRect | null;
	point?: CellPickerPoint | null;
	edgeGap: number;
	anchorGap: number;
	maxWidth: number;
	maxHeight: number;
	prefer?: 'above' | 'below' | 'auto';
}

export interface CellPickerGeometry {
	left: number;
	top: number;
	width: number;
	maxHeight: number;
	placement: 'above' | 'below' | 'clamped';
}

function finite(value: number, fallback = 0): number {
	return Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, minimum: number, maximum: number): number {
	if (maximum < minimum) return minimum;
	return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Fit a picker to the visual viewport and choose the side with enough room.
 * The returned maxHeight is part of the contract: consumers apply it before
 * measuring/repositioning so zoom and short-window layouts scroll internally.
 */
export function computeCellPickerGeometry(options: CellPickerGeometryOptions): CellPickerGeometry {
	const viewportLeft = finite(options.viewport.left);
	const viewportTop = finite(options.viewport.top);
	const viewportWidth = Math.max(0, finite(options.viewport.width));
	const viewportHeight = Math.max(0, finite(options.viewport.height));
	const edgeGap = Math.max(0, finite(options.edgeGap));
	const anchorGap = Math.max(0, finite(options.anchorGap));
	const viewportRight = viewportLeft + viewportWidth;
	const viewportBottom = viewportTop + viewportHeight;
	const usableWidth = Math.max(0, viewportWidth - edgeGap * 2);
	const usableHeight = Math.max(0, viewportHeight - edgeGap * 2);
	const width = Math.min(Math.max(0, finite(options.maxWidth)), usableWidth);
	const maxHeight = Math.min(Math.max(0, finite(options.maxHeight)), usableHeight);
	const panelHeight = Math.min(Math.max(0, finite(options.panel.height)), maxHeight);

	const anchor = options.anchor ?? null;
	const point = options.point ?? null;
	const originX = finite(point?.x ?? anchor?.left ?? viewportLeft + edgeGap);
	// A pointer is an explicit requested origin. Only fall back to the trigger
	// rectangle for keyboard/programmatic opening, where no point is supplied.
	const aboveEdge = finite(point?.y ?? anchor?.top ?? viewportTop + edgeGap) - anchorGap;
	const belowEdge = finite(point?.y ?? anchor?.bottom ?? viewportTop + edgeGap) + anchorGap;
	const aboveTop = aboveEdge - panelHeight;
	const belowTop = belowEdge;
	const minTop = viewportTop + edgeGap;
	const maxTop = viewportBottom - edgeGap - panelHeight;
	const fitsAbove = aboveTop >= minTop;
	const fitsBelow = belowTop <= maxTop;
	const roomAbove = Math.max(0, aboveEdge - minTop);
	const roomBelow = Math.max(0, viewportBottom - edgeGap - belowEdge);
	const prefer = options.prefer ?? 'auto';

	let placement: CellPickerGeometry['placement'];
	let requestedTop: number;
	if (prefer === 'above' && fitsAbove) {
		placement = 'above'; requestedTop = aboveTop;
	} else if (prefer === 'below' && fitsBelow) {
		placement = 'below'; requestedTop = belowTop;
	} else if (prefer !== 'above' && fitsBelow) {
		placement = 'below'; requestedTop = belowTop;
	} else if (fitsAbove) {
		placement = 'above'; requestedTop = aboveTop;
	} else if (fitsBelow) {
		placement = 'below'; requestedTop = belowTop;
	} else {
		placement = 'clamped';
		requestedTop = roomBelow >= roomAbove ? belowTop : aboveTop;
	}

	return {
		left: clamp(originX, viewportLeft + edgeGap, viewportRight - edgeGap - width),
		top: clamp(requestedTop, minTop, maxTop),
		width,
		maxHeight,
		placement,
	};
}
