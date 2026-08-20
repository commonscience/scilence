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
