/**
 * Portal strip brush — drag a span on the shared time axis.
 * GUIDE maps the event ids; this file does not know notebooks.
 */

const DRAG_PX = 6;

/**
 * @param {Element} svg
 * @param {number} x0
 * @param {number} x1
 * @returns {string[]}
 */
export function eventIdsBetweenSvgX(svg, x0, x1) {
	if (!svg) return [];
	const lo = Math.min(x0, x1);
	const hi = Math.max(x0, x1);
	const ids = [];
	for (const cell of svg.querySelectorAll(".s-chart__cell")) {
		const circle = cell.querySelector("circle");
		const cx = Number(circle?.getAttribute("cx"));
		if (!Number.isFinite(cx) || cx < lo || cx > hi) continue;
		ids.push(
			...String(cell.getAttribute("data-s-chart-events") || "")
				.split(",")
				.filter(Boolean),
		);
	}
	return ids;
}

/**
 * @param {SVGSVGElement} svg
 * @param {number} clientX
 */
export function clientToSvgX(svg, clientX) {
	const box = svg.getBoundingClientRect();
	const vb = svg.viewBox?.baseVal;
	const width = box.width || 1;
	const vbX = vb?.x ?? 0;
	const vbW = vb?.width || width;
	return vbX + ((clientX - box.left) / width) * vbW;
}

/**
 * @param {SVGSVGElement} svg
 * @param {{ onBrush?: (payload: { eventIds: string[] } | null) => void }} [opts]
 * @returns {() => void}
 */
export function attachStripBrush(svg, opts = {}) {
	if (!svg || typeof opts.onBrush !== "function") return () => {};

	const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");
	overlay.setAttribute("class", "s-chart__brush");
	overlay.setAttribute("fill", "currentColor");
	overlay.setAttribute("opacity", "0.12");
	overlay.setAttribute("pointer-events", "none");
	overlay.setAttribute("y", "0");
	overlay.setAttribute("height", String(svg.viewBox?.baseVal?.height || 200));
	overlay.setAttribute("width", "0");
	svg.appendChild(overlay);

	let startClientX = null;
	let dragging = false;

	const onDown = (e) => {
		if (e.button !== 0) return;
		startClientX = e.clientX;
		dragging = false;
		svg.setPointerCapture?.(e.pointerId);
	};

	const onMove = (e) => {
		if (startClientX == null) return;
		if (Math.abs(e.clientX - startClientX) >= DRAG_PX) dragging = true;
		if (!dragging) return;
		const x0 = clientToSvgX(svg, startClientX);
		const x1 = clientToSvgX(svg, e.clientX);
		overlay.setAttribute("x", String(Math.min(x0, x1)));
		overlay.setAttribute("width", String(Math.abs(x1 - x0)));
	};

	const onUp = (e) => {
		if (startClientX == null) return;
		if (dragging) {
			e.preventDefault();
			e.stopPropagation();
			const ids = eventIdsBetweenSvgX(
				svg,
				clientToSvgX(svg, startClientX),
				clientToSvgX(svg, e.clientX),
			);
			opts.onBrush(ids.length ? { eventIds: ids } : null);
			const swallow = (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				svg.removeEventListener("click", swallow, true);
			};
			svg.addEventListener("click", swallow, true);
		} else if (!e.target?.closest?.(".s-chart__cell")) {
			overlay.setAttribute("width", "0");
			opts.onBrush(null);
		}
		startClientX = null;
		dragging = false;
	};

	svg.addEventListener("pointerdown", onDown);
	svg.addEventListener("pointermove", onMove);
	svg.addEventListener("pointerup", onUp);
	svg.addEventListener("pointercancel", onUp);

	return () => {
		svg.removeEventListener("pointerdown", onDown);
		svg.removeEventListener("pointermove", onMove);
		svg.removeEventListener("pointerup", onUp);
		svg.removeEventListener("pointercancel", onUp);
		overlay.remove();
	};
}
