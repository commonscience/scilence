/**
 * Activity heatmap — rows × time buckets. Tokens only (currentColor + opacity).
 *
 * @typedef {{ id: string, label: string }} ChartAxisItem
 * @typedef {{
 *   row: string,
 *   col: string,
 *   value: number,
 *   eventIds?: string[],
 * }} HeatmapCell
 * @typedef {{
 *   rows: ChartAxisItem[],
 *   cols: ChartAxisItem[],
 *   cells: HeatmapCell[],
 * }} HeatmapModel
 */

import { escapeAttr, escapeXml } from "./svg-escape.js";

/**
 * @param {HeatmapModel} model
 * @param {{ density?: "pictogram" | "rail" | "portal", selection?: { eventId?: string, cellId?: string } }} [opts]
 * @returns {string}
 */
export function renderHeatmapSvg(model, opts = {}) {
	const rows = Array.isArray(model?.rows) ? model.rows : [];
	const cols = Array.isArray(model?.cols) ? model.cols : [];
	const cells = Array.isArray(model?.cells) ? model.cells : [];
	const density = opts.density === "portal" ? "portal" : opts.density === "pictogram" ? "pictogram" : "rail";
	const selectedEventId = opts.selection?.eventId ?? null;

	const labelW = density === "pictogram" ? 0 : 72;
	const colW = density === "portal" ? 28 : density === "pictogram" ? 8 : 14;
	const rowH = density === "portal" ? 22 : density === "pictogram" ? 8 : 16;
	const pad = 4;
	const width = Math.max(120, labelW + cols.length * colW + pad * 2);
	const height = Math.max(36, rows.length * rowH + pad * 2 + (density === "pictogram" ? 0 : 14));

	if (!rows.length || !cols.length) {
		return `<svg class="s-chart s-chart--heatmap" viewBox="0 0 ${width} 40" role="img" aria-label="No events yet"><text x="${width / 2}" y="24" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.5">No events yet</text></svg>`;
	}

	const max = cells.reduce((m, c) => Math.max(m, Number(c.value) || 0), 0) || 1;
	const byKey = new Map(cells.map((c) => [`${c.row}:${c.col}`, c]));
	const parts = [];

	if (density !== "pictogram") {
		for (let i = 0; i < rows.length; i++) {
			const y = pad + i * rowH + rowH * 0.7;
			parts.push(
				`<text x="${labelW - 6}" y="${y}" text-anchor="end" font-size="10" fill="currentColor" opacity="0.65">${escapeXml(rows[i].label)}</text>`,
			);
		}
	}

	for (let r = 0; r < rows.length; r++) {
		for (let c = 0; c < cols.length; c++) {
			const cell = byKey.get(`${rows[r].id}:${cols[c].id}`);
			const value = Number(cell?.value) || 0;
			const opacity = value <= 0 ? 0.06 : 0.18 + (value / max) * 0.72;
			const x = labelW + c * colW + 1;
			const y = pad + r * rowH + 1;
			const eventIds = (cell?.eventIds ?? []).join(",");
			const current =
				selectedEventId && eventIds.split(",").includes(selectedEventId)
					? ' data-s-chart-current="true" stroke="currentColor" stroke-width="1"'
					: ' stroke="none"';
			parts.push(
				`<rect class="s-chart__cell" data-s-chart-row="${escapeAttr(rows[r].id)}" data-s-chart-col="${escapeAttr(cols[c].id)}" data-s-chart-events="${escapeAttr(eventIds)}" x="${x}" y="${y}" width="${colW - 2}" height="${rowH - 2}" rx="2" fill="currentColor" opacity="${opacity.toFixed(2)}"${current}><title>${escapeXml(`${rows[r].label} · ${cols[c].label} · ${value}`)}</title></rect>`,
			);
		}
	}

	return `<svg class="s-chart s-chart--heatmap" data-s-chart-density="${density}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Activity heatmap">${parts.join("")}</svg>`;
}
