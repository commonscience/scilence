import { attachStripBrush } from "./brush.js";
import { renderHeatmapSvg } from "./heatmap.js";
import { renderMosaicSvg } from "./mosaic.js";
import { renderStripSvg } from "./strip.js";

const KINDS = new Set(["heatmap", "mosaic", "strip"]);
const DENSITIES = new Set(["pictogram", "rail", "portal", "band"]);

/**
 * @param {HTMLElement} host
 * @param {{
 *   kind: "heatmap" | "mosaic" | "strip",
 *   density?: "pictogram" | "rail" | "portal" | "band",
 *   xScale?: "ordinal" | "time",
 *   width?: number,
 *   height?: number,
 *   data: object,
 *   selection?: { eventId?: string, cellId?: string },
 *   onHover?: (payload: { eventIds: string[], row: string, col: string } | null) => void,
 *   onSelect?: (payload: { eventIds: string[], row: string, col: string }) => void,
 *   onBrush?: (payload: { eventIds: string[] } | null) => void,
 * }} opts
 */
export function createChart(host, opts) {
	if (!host || typeof host.replaceChildren !== "function") {
		return { destroy() {}, update() {} };
	}
	const kind = KINDS.has(opts?.kind) ? opts.kind : "heatmap";
	const density = DENSITIES.has(opts?.density) ? opts.density : "rail";
	let data = opts?.data ?? { rows: [], cols: [], cells: [] };
	let selection = opts?.selection ?? {};

	const root = document.createElement("div");
	root.dataset.sChartHost = kind;
	root.style.color = "var(--s-fg, currentColor)";

	const tip = document.createElement("p");
	tip.className = "s-chart__tip";
	tip.setAttribute("role", "status");
	tip.setAttribute("aria-live", "polite");
	tip.style.cssText =
		"margin:6px 0 0;font-size:11px;line-height:1.4;opacity:.7;min-height:1.4em";

	function paint() {
		root.replaceChildren();
		const wrap = document.createElement("div");
		wrap.innerHTML =
			kind === "mosaic"
				? renderMosaicSvg(data, { density, selection })
				: kind === "strip"
					? renderStripSvg(data, {
							density,
							selection,
							xScale: opts?.xScale,
							width: opts?.width,
							height: opts?.height,
						})
					: renderHeatmapSvg(data, { density, selection });
		const svg = wrap.firstElementChild;
		if (svg) root.appendChild(svg);
		root.appendChild(tip);
		wire(root);
		if (kind === "strip" && density === "portal" && svg?.tagName?.toLowerCase() === "svg") {
			attachStripBrush(svg, { onBrush: opts.onBrush });
		}
	}

	function payloadFromRect(rect) {
		const eventIds = String(rect.getAttribute("data-s-chart-events") || "")
			.split(",")
			.filter(Boolean);
		return {
			eventIds,
			row: rect.getAttribute("data-s-chart-row") || "",
			col: rect.getAttribute("data-s-chart-col") || "",
		};
	}

	function wire(scope) {
		for (const rect of scope.querySelectorAll(".s-chart__cell")) {
			rect.style.cursor = "pointer";
			rect.addEventListener("pointerenter", () => {
				const payload = payloadFromRect(rect);
				const title =
					rect.querySelector("title")?.textContent ||
					rect.getAttribute("aria-label") ||
					"";
				tip.textContent = title;
				opts.onHover?.(payload);
			});
			rect.addEventListener("pointerleave", () => {
				tip.textContent = "";
				opts.onHover?.(null);
			});
			rect.addEventListener("click", (e) => {
				e.preventDefault();
				opts.onSelect?.(payloadFromRect(rect));
			});
		}
	}

	paint();
	host.replaceChildren(root);

	return {
		destroy() {
			host.replaceChildren();
		},
		update(next = {}) {
			if (next.data) data = next.data;
			if (next.selection) selection = next.selection;
			paint();
		},
	};
}
