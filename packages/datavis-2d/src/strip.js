/**
 * Time-strip / beeswarm — one shared time axis, unlabeled.
 * Size = weight class, ink = trust, extra gap = drought. No lifecycle labels.
 */

import { escapeAttr } from "./svg-escape.js";

/**
 * @typedef {{
 *   id: string,
 *   eventIds: string[],
 *   at: number | string | Date,
 *   gapBefore?: boolean,
 *   weight?: "anchor" | "decision" | "note" | "chip",
 *   ink?: "sourced" | "inferred" | "demo",
 *   tip?: string,
 * }} StripMark
 * @typedef {{ marks: StripMark[] }} StripModel
 */

const FRAME = {
	pictogram: { w: 220, h: 36, r: { chip: 1.5, note: 2, decision: 2.5, anchor: 3 } },
	rail: { w: 340, h: 100, r: { chip: 2.5, note: 3.5, decision: 5, anchor: 6.5 } },
	portal: { w: 340, h: 200, r: { chip: 3.5, note: 5, decision: 7, anchor: 9 } },
	// Full-width published band — a wide, short strip (~14:1) for a page-width
	// figure. Rail's ink vocabulary, because the mark sizes are read the same way.
	band: { w: 1100, h: 80, r: { chip: 2.5, note: 3.5, decision: 5, anchor: 6.5 } },
};

const INK = { sourced: 0.88, inferred: 0.45, demo: 0.18 };

/**
 * A mark's instant, as epoch ms. Accepts the number the typedef promises, plus
 * the ISO string a published ledger actually carries. NaN means "no instant",
 * which is what disqualifies a model from time spacing.
 *
 * @param {unknown} at
 * @returns {number}
 */
function toTime(at) {
	if (typeof at === "number") return at;
	if (typeof at === "string") return Date.parse(at);
	if (at instanceof Date) return at.getTime();
	return Number.NaN;
}

/**
 * @param {StripModel} model
 * @param {{
 *   density?: "pictogram" | "rail" | "portal" | "band",
 *   xScale?: "ordinal" | "time",
 *   width?: number,
 *   height?: number,
 *   selection?: { eventId?: string },
 * }} [opts]
 */
export function renderStripSvg(model, opts = {}) {
	const marks = Array.isArray(model?.marks) ? model.marks : [];
	const density = FRAME[opts.density] ? opts.density : "rail";
	const selected = opts.selection?.eventId ?? null;
	const frame = FRAME[density];
	const w = size(opts.width, frame.w);
	const h = size(opts.height, frame.h);
	const padX = density === "pictogram" ? 8 : 14;
	const mid = h / 2;

	if (!marks.length) {
		return `<svg class="s-chart s-chart--strip" viewBox="0 0 ${w} ${h}" role="img" aria-label="No events yet"><text x="${w / 2}" y="${mid + 4}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.5">No events yet</text></svg>`;
	}

	const inner = w - padX * 2;

	// Time spacing is opt-in, and only honoured when it can be honest: every mark
	// needs an instant, and the span needs width. A single mark, marks that all
	// share one timestamp, or one unparseable `at` all fall back to ordinal —
	// silently in the drawing, but the resolved scale is published on the root so
	// a caption can say which one the reader is looking at.
	const times = marks.map((m) => toTime(m.at));
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	let dated = true;
	for (const t of times) {
		if (!Number.isFinite(t)) {
			dated = false;
			break;
		}
		if (t < min) min = t;
		if (t > max) max = t;
	}
	const timeScale = opts.xScale === "time" && dated && max > min;
	const span = max - min;

	const droughts = marks.filter((m) => m.gapBefore).length;
	const steps = Math.max(1, marks.length - 1);
	const slot = inner / (steps + droughts * 0.6);
	const placed = [];
	let cursor = padX;
	const parts = [
		`<line x1="${padX}" y1="${mid}" x2="${w - padX}" y2="${mid}" stroke="currentColor" stroke-width="1" opacity="0.18"/>`,
	];

	for (let i = 0; i < marks.length; i++) {
		const mark = marks[i];
		const r = frame.r[mark.weight] ?? frame.r.note;
		let x;
		if (timeScale) {
			// Real elapsed time is the drought; `gapBefore` is the ordinal
			// stand-in for it and has nothing left to say here.
			x = padX + inner * ((times[i] - min) / span);
		} else {
			if (i === 0) {
				cursor = padX;
			} else {
				cursor += slot * (mark.gapBefore ? 1.6 : 1);
			}
			x = marks.length === 1 ? w / 2 : cursor;
		}
		const y = beeswarmY(placed, x, r, mid);
		placed.push({ x, y, r });

		const eventIds = (mark.eventIds ?? []).join(",");
		const opacity = INK[mark.ink] ?? INK.inferred;
		const current =
			selected && eventIds.split(",").includes(selected)
				? ' data-s-chart-current="true" stroke="currentColor" stroke-width="1.25"'
				: mark.ink === "demo"
					? ' stroke="currentColor" stroke-width="0.6" stroke-opacity="0.35"'
					: ' stroke="none"';
		parts.push(
			`<g class="s-chart__cell" data-s-chart-tile="${escapeAttr(mark.id)}" data-s-chart-events="${escapeAttr(eventIds)}" aria-label="${escapeAttr(mark.tip || "")}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="currentColor" opacity="${opacity}"${current}/></g>`,
		);
	}

	return `<svg class="s-chart s-chart--strip" data-s-chart-density="${density}" data-s-chart-xscale="${timeScale ? "time" : "ordinal"}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Study provenance">${parts.join("")}</svg>`;
}

/**
 * A caller-supplied box wins over the density's own, when it is a real one.
 *
 * @param {unknown} value
 * @param {number} fallback
 */
function size(value, fallback) {
	return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

/**
 * @param {{ x: number, y: number, r: number }[]} placed
 * @param {number} x
 * @param {number} r
 * @param {number} mid
 */
function beeswarmY(placed, x, r, mid) {
	let y = mid;
	let dir = 1;
	for (let tries = 0; tries < 8; tries++) {
		const hit = placed.some((p) => {
			const dx = p.x - x;
			const dy = p.y - y;
			const min = p.r + r + 1;
			return dx * dx + dy * dy < min * min;
		});
		if (!hit) return y;
		y = mid + dir * (r + 1.5) * Math.ceil((tries + 1) / 2);
		dir *= -1;
	}
	return y;
}
