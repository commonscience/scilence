/**
 * Cascade mosaic — variable tiles. Position = era, size = weight, ink = trust.
 * Avatars are initials; overflow is +N. No GUIDE event types here.
 */

import { escapeAttr, escapeXml } from "./svg-escape.js";

/**
 * @typedef {{ id: string, label: string }} MosaicColumn
 * @typedef {{ id: string, label: string, initials: string, count?: number }} MosaicActor
 * @typedef {{
 *   id: string,
 *   eventIds: string[],
 *   column: string,
 *   weight: "anchor" | "decision" | "note" | "chip",
 *   ink: "sourced" | "inferred" | "demo",
 *   inscription?: string,
 *   whenLabel?: string,
 *   actors?: MosaicActor[],
 *   gapBefore?: boolean,
 * }} MosaicTile
 * @typedef {{
 *   columns: MosaicColumn[],
 *   tiles: MosaicTile[],
 *   cast?: MosaicActor[],
 * }} MosaicModel
 */

const BOX = {
	pictogram: { anchor: [12, 12], decision: [10, 10], note: [8, 8], chip: [6, 6] },
	rail: { anchor: [56, 48], decision: [48, 38], note: [34, 24], chip: [20, 12] },
	portal: { anchor: [84, 68], decision: [70, 52], note: [50, 34], chip: [26, 16] },
};

const INK = { sourced: 0.88, inferred: 0.42, demo: 0.16 };
const CAST_MAX = { pictogram: 0, rail: 5, portal: 8 };
const FACE_MAX = { pictogram: 0, rail: 2, portal: 3 };

/**
 * @param {MosaicModel} model
 * @param {{ density?: "pictogram" | "rail" | "portal", selection?: { eventId?: string } }} [opts]
 */
export function renderMosaicSvg(model, opts = {}) {
	const columns = Array.isArray(model?.columns) ? model.columns : [];
	const tiles = Array.isArray(model?.tiles) ? model.tiles : [];
	const cast = Array.isArray(model?.cast) ? model.cast : [];
	const density =
		opts.density === "portal" ? "portal" : opts.density === "pictogram" ? "pictogram" : "rail";
	const selected = opts.selection?.eventId ?? null;
	const boxes = BOX[density];
	const showType = density !== "pictogram";
	const colW = boxes.anchor[0] + (showType ? 8 : 2);
	const gap = showType ? 6 : 2;
	const headH = showType ? 14 : 0;
	const castH = showType && CAST_MAX[density] > 0 ? 20 : 0;
	const pad = 4;

	if (!columns.length) {
		return `<svg class="s-chart s-chart--mosaic" viewBox="0 0 160 40" role="img" aria-label="No events yet"><text x="80" y="24" text-anchor="middle" font-size="11" fill="currentColor" opacity="0.5">No events yet</text></svg>`;
	}

	const packed = columns.map((col) => packColumn(tiles.filter((t) => t.column === col.id), boxes, density));
	const bodyH = Math.max(36, ...packed.map((p) => p.height));
	const width = Math.max(120, pad * 2 + columns.length * colW + (columns.length - 1) * gap);
	const height = pad + headH + bodyH + castH + pad;
	const parts = [];

	if (showType) {
		for (let i = 0; i < columns.length; i++) {
			const x = pad + i * (colW + gap) + colW / 2;
			parts.push(
				`<text x="${x}" y="${pad + 10}" text-anchor="middle" font-size="8" fill="currentColor" opacity="0.55">${escapeXml(columns[i].label)}</text>`,
			);
		}
	}

	for (let i = 0; i < columns.length; i++) {
		const ox = pad + i * (colW + gap);
		const oy = pad + headH;
		for (const cell of packed[i].cells) {
			parts.push(drawTile(cell, ox, oy, selected, density, showType));
		}
	}

	if (castH) {
		parts.push(drawCast(cast, pad, pad + headH + bodyH + 4, width - pad * 2, CAST_MAX[density]));
	}

	return `<svg class="s-chart s-chart--mosaic" data-s-chart-density="${density}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Provenance mosaic">${parts.join("")}</svg>`;
}

/**
 * @param {MosaicTile[]} tiles
 * @param {Record<string, [number, number]>} boxes
 * @param {string} density
 */
function packColumn(tiles, boxes, density) {
	const sorted = [...tiles].sort((a, b) => String(a.whenLabel || "").localeCompare(String(b.whenLabel || "")));
	let y = 0;
	const cells = [];
	for (const tile of sorted) {
		if (tile.gapBefore) y += density === "portal" ? 14 : 10;
		const [w, h] = boxes[tile.weight] ?? boxes.note;
		cells.push({ tile, x: 0, y, w, h });
		y += h + 3;
	}
	return { cells, height: y };
}

/**
 * @param {{ tile: MosaicTile, x: number, y: number, w: number, h: number }} cell
 */
function drawTile(cell, ox, oy, selected, density, showType) {
	const { tile, w, h } = cell;
	const x = ox + cell.x;
	const y = oy + cell.y;
	const opacity = INK[tile.ink] ?? INK.inferred;
	const eventIds = (tile.eventIds ?? []).join(",");
	const current =
		selected && eventIds.split(",").includes(selected)
			? ' data-s-chart-current="true" stroke="currentColor" stroke-width="1.25"'
			: tile.ink === "demo"
				? ' stroke="currentColor" stroke-width="0.6" stroke-opacity="0.35"'
				: ' stroke="none"';
	const tip = escapeXml(
		[tile.inscription || tile.whenLabel, (tile.actors ?? []).map((a) => a.label).join(", "), tile.whenLabel]
			.filter(Boolean)
			.join(" · "),
	);
	const label =
		showType && (tile.weight === "anchor" || tile.weight === "decision") && tile.inscription
			? `<text x="${x + 4}" y="${y + 11}" font-size="8" fill="currentColor">${escapeXml(clip(tile.inscription, w > 50 ? 14 : 10))}</text>`
			: "";
	const when =
		showType && tile.weight === "anchor" && tile.whenLabel
			? `<text x="${x + 4}" y="${y + 21}" font-size="7" fill="currentColor" opacity="0.65">${escapeXml(tile.whenLabel)}</text>`
			: "";
	const faces = showType ? drawFaces(tile.actors ?? [], x + w - 4, y + h - 6, FACE_MAX[density] ?? 2) : "";
	return `<g class="s-chart__cell" data-s-chart-tile="${escapeAttr(tile.id)}" data-s-chart-col="${escapeAttr(tile.column)}" data-s-chart-events="${escapeAttr(eventIds)}" transform="translate(0,0)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="currentColor" opacity="${opacity}"${current}/><title>${tip}</title>${label}${when}${faces}</g>`;
}

/** @param {MosaicActor[]} actors */
function drawFaces(actors, right, cy, max) {
	if (!actors.length || max <= 0) return "";
	const extra = Math.max(0, actors.length - max);
	const shown = actors.slice(0, max);
	const r = 5;
	let x = right - (extra ? 12 : 0) - shown.length * 8;
	const parts = [];
	for (const actor of shown) {
		parts.push(
			`<circle cx="${x}" cy="${cy}" r="${r}" fill="var(--s-color-bg-card, #fff)" stroke="currentColor" stroke-width="0.75"/>`,
			`<text x="${x}" y="${cy + 2.5}" text-anchor="middle" font-size="5.5" fill="currentColor">${escapeXml(actor.initials.slice(0, 2))}</text>`,
		);
		x += 8;
	}
	if (extra) {
		parts.push(
			`<text x="${right - 2}" y="${cy + 2.5}" text-anchor="end" font-size="6" fill="currentColor" opacity="0.7">+${extra}</text>`,
		);
	}
	return parts.join("");
}

/** @param {MosaicActor[]} cast */
function drawCast(cast, x, y, width, max) {
	if (!cast.length || max <= 0) return "";
	const extra = Math.max(0, cast.length - max);
	const shown = cast.slice(0, max);
	const parts = [
		`<text x="${x}" y="${y + 8}" font-size="7" fill="currentColor" opacity="0.5">Who</text>`,
	];
	let cx = x + 22;
	const r = 6;
	for (const actor of shown) {
		const n = actor.count && actor.count > 1 ? actor.count : 0;
		parts.push(
			`<g class="s-chart__cast" data-s-chart-actor="${escapeAttr(actor.id)}"><circle cx="${cx}" cy="${y + 6}" r="${r}" fill="var(--s-color-bg-card, #fff)" stroke="currentColor" stroke-width="0.8"/><text x="${cx}" y="${y + 8.5}" text-anchor="middle" font-size="6" fill="currentColor">${escapeXml(actor.initials.slice(0, 2))}</text><title>${escapeXml(actor.label)}${n ? ` · ${n}` : ""}</title></g>`,
		);
		cx += 11;
		if (cx > x + width - 20) break;
	}
	if (extra) {
		parts.push(
			`<text x="${Math.min(cx + 2, x + width)}" y="${y + 9}" font-size="7" fill="currentColor" opacity="0.7">+${extra}</text>`,
		);
	}
	return parts.join("");
}

/** @param {string} text @param {number} n */
function clip(text, n) {
	const s = String(text || "").trim();
	return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
