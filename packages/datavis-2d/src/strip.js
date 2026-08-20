/**
 * Time-strip / beeswarm — one shared time axis, unlabeled.
 * Size = weight class, ink = trust, extra gap = drought. No lifecycle labels.
 */

import { escapeAttr } from "./svg-escape.js";

/**
 * @typedef {{
 *   id: string,
 *   eventIds: string[],
 *   at: number,
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
};

const INK = { sourced: 0.88, inferred: 0.45, demo: 0.18 };

/**
 * @param {StripModel} model
 * @param {{ density?: "pictogram" | "rail" | "portal", selection?: { eventId?: string } }} [opts]
 */
export function renderStripSvg(model, opts = {}) {
	const marks = Array.isArray(model?.marks) ? model.marks : [];
	const density =
		opts.density === "portal" ? "portal" : opts.density === "pictogram" ? "pictogram" : "rail";
	const selected = opts.selection?.eventId ?? null;
	const frame = FRAME[density];
	const padX = density === "pictogram" ? 8 : 14;
	const mid = frame.h / 2;

	if (!marks.length) {
		return `<svg class="s-chart s-chart--strip" viewBox="0 0 ${frame.w} ${frame.h}" role="img" aria-label="No events yet"><text x="${frame.w / 2}" y="${mid + 4}" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.5">No events yet</text></svg>`;
	}

	const inner = frame.w - padX * 2;
	const droughts = marks.filter((m) => m.gapBefore).length;
	const steps = Math.max(1, marks.length - 1);
	const slot = inner / (steps + droughts * 0.6);
	const placed = [];
	let cursor = padX;
	const parts = [
		`<line x1="${padX}" y1="${mid}" x2="${frame.w - padX}" y2="${mid}" stroke="currentColor" stroke-width="1" opacity="0.18"/>`,
	];

	for (let i = 0; i < marks.length; i++) {
		const mark = marks[i];
		const r = frame.r[mark.weight] ?? frame.r.note;
		if (i === 0) {
			cursor = padX;
		} else {
			cursor += slot * (mark.gapBefore ? 1.6 : 1);
		}
		const x = marks.length === 1 ? frame.w / 2 : cursor;
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

	return `<svg class="s-chart s-chart--strip" data-s-chart-density="${density}" viewBox="0 0 ${frame.w} ${frame.h}" role="img" aria-label="Study provenance">${parts.join("")}</svg>`;
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
