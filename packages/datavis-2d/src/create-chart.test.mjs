import assert from "node:assert/strict";
import { test } from "node:test";

import { eventIdsBetweenSvgX } from "./brush.js";
import { renderHeatmapSvg } from "./heatmap.js";
import { renderMosaicSvg } from "./mosaic.js";
import { renderStripSvg } from "./strip.js";

const sample = {
	rows: [{ id: "obs", label: "Observation" }],
	cols: [
		{ id: "2005-01", label: "Jan 2005" },
		{ id: "2006-03", label: "Mar 2006" },
	],
	cells: [
		{ row: "obs", col: "2005-01", value: 2, eventIds: ["a", "b"] },
		{ row: "obs", col: "2006-03", value: 1, eventIds: ["c"] },
	],
};

test("renderHeatmapSvg paints a cell per bucket and marks selection", () => {
	const svg = renderHeatmapSvg(sample, { density: "rail", selection: { eventId: "c" } });
	assert.match(svg, /data-s-chart-events="c"/);
	assert.match(svg, /data-s-chart-current="true"/);
	assert.match(svg, /Observation/);
});

test("renderMosaicSvg sizes anchors and stacks overflow avatars", () => {
	const svg = renderMosaicSvg(
		{
			columns: [
				{ id: "clinic", label: "Clinic" },
				{ id: "in-silico", label: "In silico" },
			],
			tiles: [
				{
					id: "a",
					eventIds: ["a"],
					column: "clinic",
					weight: "anchor",
					ink: "sourced",
					inscription: "FDA 2016",
					whenLabel: "2016",
					actors: [
						{ id: "a1", label: "Ada", initials: "AL" },
						{ id: "a2", label: "Bea", initials: "BN" },
						{ id: "a3", label: "Cara", initials: "CK" },
					],
				},
			],
			cast: Array.from({ length: 9 }, (_, i) => ({
				id: `p${i}`,
				label: `Person ${i}`,
				initials: `P${i}`,
				count: 1,
			})),
		},
		{ density: "rail" },
	);
	assert.match(svg, /s-chart--mosaic/);
	assert.match(svg, /FDA 2016/);
	assert.match(svg, /\+1/);
	assert.match(svg, /\+4/);
});

test("renderStripSvg places marks on one axis and keeps droughts", () => {
	const svg = renderStripSvg(
		{
			marks: [
				{
					id: "a",
					eventIds: ["a"],
					at: Date.parse("2005-02-01T00:00:00.000Z"),
					weight: "anchor",
					ink: "sourced",
					tip: "Git · solo · 1 Feb 2005 · Nature",
				},
				{
					id: "b",
					eventIds: ["b"],
					at: Date.parse("2016-04-11T00:00:00.000Z"),
					weight: "note",
					ink: "inferred",
					gapBefore: true,
					tip: "Maya Chen · solo · 11 Apr 2016 · FDA",
				},
			],
		},
		{ density: "rail", selection: { eventId: "b" } },
	);
	assert.match(svg, /s-chart--strip/);
	assert.match(svg, /viewBox="0 0 340 100"/);
	assert.match(svg, /data-s-chart-events="a"/);
	assert.match(svg, /data-s-chart-current="true"/);
	assert.match(svg, /aria-label="Git · solo · 1 Feb 2005 · Nature"/);
	assert.doesNotMatch(svg, /<title>/);
	assert.doesNotMatch(svg, /In silico|Clinic|in-vitro/i);
});

test("eventIdsBetweenSvgX keeps marks whose cx sits in the span", () => {
	const svg = {
		querySelectorAll() {
			return [
				{
					querySelector: () => ({ getAttribute: () => "20" }),
					getAttribute: (name) => (name === "data-s-chart-events" ? "a" : ""),
				},
				{
					querySelector: () => ({ getAttribute: () => "200" }),
					getAttribute: (name) => (name === "data-s-chart-events" ? "b" : ""),
				},
			];
		},
	};
	assert.deepEqual(eventIdsBetweenSvgX(svg, 0, 50), ["a"]);
	assert.deepEqual(eventIdsBetweenSvgX(svg, 0, 400), ["a", "b"]);
});

test("renderHeatmapSvg empty model is honest, not a fake graph", () => {
	const svg = renderHeatmapSvg({ rows: [], cols: [], cells: [] });
	assert.match(svg, /No events yet/);
	assert.doesNotMatch(svg, /s-chart__cell/);
});

/** cx of every mark, left to right in document order. */
function cxs(svg) {
	return [...svg.matchAll(/<circle cx="([-\d.]+)"/g)].map((m) => Number(m[1]));
}

/** A model whose instants are deliberately lopsided: two close, one far. */
function lopsided(at = (iso) => Date.parse(iso)) {
	return {
		marks: [
			{ id: "a", eventIds: ["a"], at: at("2000-01-01T00:00:00.000Z"), weight: "chip" },
			{ id: "b", eventIds: ["b"], at: at("2001-01-01T00:00:00.000Z"), weight: "chip" },
			{ id: "c", eventIds: ["c"], at: at("2010-01-01T00:00:00.000Z"), weight: "chip" },
		],
	};
}

test("renderStripSvg defaults to ordinal — even spacing, and it says so", () => {
	const svg = renderStripSvg(lopsided(), { density: "rail" });
	const [a, b, c] = cxs(svg);
	assert.match(svg, /data-s-chart-xscale="ordinal"/);
	// Three evenly-spaced slots: the 1-year gap and the 9-year gap draw alike.
	assert.ok(Math.abs((b - a) - (c - b)) < 0.2, `expected even slots, got ${a},${b},${c}`);
});

test("renderStripSvg xScale:'time' spaces marks by elapsed time", () => {
	const svg = renderStripSvg(lopsided(), { density: "rail", xScale: "time" });
	const [a, b, c] = cxs(svg);
	assert.match(svg, /data-s-chart-xscale="time"/);
	// padX..w-padX == 14..326. a is the floor, c the ceiling, b one tenth along.
	assert.equal(a, 14);
	assert.equal(c, 326);
	assert.ok(Math.abs(b - (14 + 312 * (1 / 10))) < 1.5, `b landed at ${b}`);
	// The whole point: the 9-year gap is far wider than the 1-year gap.
	assert.ok(c - b > (b - a) * 5, `expected a real drought, got ${a},${b},${c}`);
});

test("renderStripSvg time scale reads ISO strings, not just epoch numbers", () => {
	const iso = renderStripSvg(lopsided((s) => s), { density: "rail", xScale: "time" });
	const epoch = renderStripSvg(lopsided(), { density: "rail", xScale: "time" });
	assert.match(iso, /data-s-chart-xscale="time"/);
	assert.deepEqual(cxs(iso), cxs(epoch));
});

test("renderStripSvg time scale ignores gapBefore — elapsed time is the drought", () => {
	const plain = renderStripSvg(lopsided(), { density: "rail", xScale: "time" });
	const model = lopsided();
	model.marks[1].gapBefore = true;
	const gapped = renderStripSvg(model, { density: "rail", xScale: "time" });
	assert.deepEqual(cxs(gapped), cxs(plain));
});

test("renderStripSvg falls back to ordinal when the range is zero", () => {
	const at = Date.parse("2020-05-05T00:00:00.000Z");
	const svg = renderStripSvg(
		{
			marks: [
				{ id: "a", eventIds: ["a"], at, weight: "chip" },
				{ id: "b", eventIds: ["b"], at, weight: "chip" },
			],
		},
		{ density: "rail", xScale: "time" },
	);
	assert.match(svg, /data-s-chart-xscale="ordinal"/);
	// Ordinal still separates them; a zero-range time map would stack both on padX.
	const [a, b] = cxs(svg);
	assert.ok(b > a, `expected ordinal separation, got ${a},${b}`);
});

test("renderStripSvg falls back to ordinal when any mark has no instant", () => {
	for (const bad of [undefined, null, "not a date", Number.NaN]) {
		const model = lopsided();
		model.marks[1].at = bad;
		const svg = renderStripSvg(model, { density: "rail", xScale: "time" });
		assert.match(svg, /data-s-chart-xscale="ordinal"/, `at=${String(bad)} should not scale`);
		assert.deepEqual(
			cxs(svg),
			cxs(renderStripSvg(model, { density: "rail" })),
			`at=${String(bad)} should draw exactly like ordinal`,
		);
	}
});

test("renderStripSvg time scale keeps same-instant marks apart via the beeswarm", () => {
	// The published-commons case: two events share a timestamp, so time spacing
	// gives them one x. They must not end up as one occluded dot.
	const at = "1909-07-02T12:00:00.000Z";
	const svg = renderStripSvg(
		{
			marks: [
				{ id: "a", eventIds: ["a"], at, weight: "note" },
				{ id: "b", eventIds: ["b"], at, weight: "chip" },
				{ id: "c", eventIds: ["c"], at: "1913-09-09T12:00:00.000Z", weight: "note" },
			],
		},
		{ density: "band", xScale: "time" },
	);
	assert.match(svg, /data-s-chart-xscale="time"/);
	const [a, b] = cxs(svg);
	assert.equal(a, b);
	const ys = [...svg.matchAll(/cy="([-\d.]+)"/g)].map((m) => Number(m[1]));
	assert.notEqual(ys[0], ys[1]);
});

test("renderStripSvg band density is a wide, short published strip", () => {
	const svg = renderStripSvg(lopsided(), { density: "band", xScale: "time" });
	assert.match(svg, /viewBox="0 0 1100 80"/);
	assert.match(svg, /data-s-chart-density="band"/);
	assert.equal(cxs(svg).at(-1), 1086);
});

test("renderStripSvg takes an explicit width and height over the density's own", () => {
	const svg = renderStripSvg(lopsided(), { density: "band", width: 1240, height: 90 });
	assert.match(svg, /viewBox="0 0 1240 90"/);
	// The density still owns the ink vocabulary, only the box changed.
	assert.match(svg, /data-s-chart-density="band"/);
});

test("renderStripSvg ignores a nonsense width or height", () => {
	for (const bad of [0, -40, Number.NaN, "1100", null]) {
		const svg = renderStripSvg(lopsided(), { density: "rail", width: bad, height: bad });
		assert.match(svg, /viewBox="0 0 340 100"/, `width=${String(bad)} should not apply`);
	}
});

test("renderStripSvg empty model honours an explicit box", () => {
	const svg = renderStripSvg({ marks: [] }, { density: "band", width: 1200, height: 60 });
	assert.match(svg, /viewBox="0 0 1200 60"/);
	assert.match(svg, /No events yet/);
});

test("renderStripSvg unknown density still falls back to rail", () => {
	const svg = renderStripSvg(lopsided(), { density: "enormous" });
	assert.match(svg, /viewBox="0 0 340 100"/);
	assert.match(svg, /data-s-chart-density="rail"/);
});
