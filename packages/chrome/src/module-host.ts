/**
 * Module-host contract (F0 / GH #1482).
 *
 * One mount shape, one drop payload, one registry. Layer prefixes keep
 * Cell / Scene / Board / Book from colliding with entity.scene or table.cell.
 *
 * @see research/memory-drops/project_cell_scene_board_book.md
 */

export const LAYER_PREFIXES = ["host.", "module.", "entity.", "datum."] as const;
export type LayerPrefix = (typeof LAYER_PREFIXES)[number];

export const HOST_IDS = [
	"host.cell",
	"host.scene",
	"host.board",
	"host.book",
] as const;
export type HostId = (typeof HOST_IDS)[number];

export const DENSITIES = ["inline", "rail", "portal"] as const;
export type Density = (typeof DENSITIES)[number];

/** Locked module ids that already register. Bare `monitor` / `editor` are
 *  forbidden. Next mounts (`module.cas` `module.chat` `module.tree`
 *  `module.dock`) still use the `module.` prefix — add them here when they
 *  register, not before. */
export const MODULE_IDS = ["module.monitor", "module.editor"] as const;
export type ModuleId = (typeof MODULE_IDS)[number];

/** Registry object. `kind` is `entity.<name>` or a locked wire form (`cmpd:`). */
export interface EntityRef {
	id: string;
	kind: string;
}

/** Tiniest addressable bit — always attached to an entity, never free-floating. */
export interface DatumMap {
	[key: string]: unknown;
}

/**
 * Drag / embed payload. Not pixels. `fromHost` is where the gesture started.
 */
export interface DropPayload {
	entity: EntityRef;
	datums?: DatumMap;
	fromHost?: HostId;
}

export interface MountContext {
	density: Density;
	host: HostId;
	projectSlug?: string;
	selection?: unknown;
	view?: string;
	drop?: DropPayload;
}

export interface ModuleTeardown {
	destroy: () => void;
}

export type ModuleMount = (el: HTMLElement, ctx: MountContext) => ModuleTeardown;

export interface ModuleDescriptor {
	id: string;
	densities: readonly Density[];
	mount: ModuleMount;
}

export class LayerIdError extends Error {
	readonly id: string;
	constructor(id: string, detail: string) {
		super(`layer id rejected (${id}): ${detail}`);
		this.name = "LayerIdError";
		this.id = id;
	}
}

const LAYER_RE = /^(host|module|entity|datum)\.[a-z][a-z0-9-]*$/;
const CMPD_RE = /^cmpd:/;

/** True when `id` is a prefixed layer id or a locked compound wire form. */
export function isLayerId(id: string): boolean {
	return LAYER_RE.test(id) || CMPD_RE.test(id);
}

/**
 * Reject bare `cell` / `scene` / `board` / `book` and any id that is not
 * `host.|module.|entity.|datum.` (or `cmpd:`).
 */
export function assertLayerId(id: string, allowed?: readonly LayerPrefix[]): string {
	if (typeof id !== "string" || id === "") {
		throw new LayerIdError(String(id), "id must be a non-empty string");
	}
	if (!isLayerId(id)) {
		throw new LayerIdError(
			id,
			"use host.|module.|entity.|datum. (or cmpd:) — bare cell/scene/board/book are forbidden",
		);
	}
	if (allowed && allowed.length > 0 && !CMPD_RE.test(id)) {
		const ok = allowed.some((p) => id.startsWith(p));
		if (!ok) {
			throw new LayerIdError(id, `expected one of ${allowed.join(" ")}`);
		}
	}
	return id;
}

export function isHostId(value: unknown): value is HostId {
	return typeof value === "string" && (HOST_IDS as readonly string[]).includes(value);
}

export function isDropPayload(value: unknown): value is DropPayload {
	if (value === null || typeof value !== "object") return false;
	const rec = value as Record<string, unknown>;
	const entity = rec.entity;
	if (entity === null || typeof entity !== "object") return false;
	const er = entity as Record<string, unknown>;
	if (typeof er.id !== "string" || er.id === "") return false;
	if (typeof er.kind !== "string" || er.kind === "") return false;
	if (rec.fromHost !== undefined && !isHostId(rec.fromHost)) return false;
	if (rec.datums !== undefined && (rec.datums === null || typeof rec.datums !== "object")) {
		return false;
	}
	return true;
}

export function createDropPayload(input: DropPayload): DropPayload {
	if (!isDropPayload(input)) {
		throw new TypeError("DropPayload requires entity.id + entity.kind");
	}
	const payload: DropPayload = {
		entity: { id: input.entity.id, kind: input.entity.kind },
	};
	if (input.datums) payload.datums = { ...input.datums };
	if (input.fromHost) payload.fromHost = input.fromHost;
	return payload;
}

export interface ModuleRegistry {
	register: (desc: ModuleDescriptor) => void;
	get: (id: string) => ModuleDescriptor | undefined;
	list: () => ModuleDescriptor[];
}

export function createModuleRegistry(): ModuleRegistry {
	const byId = new Map<string, ModuleDescriptor>();

	function register(desc: ModuleDescriptor): void {
		assertLayerId(desc.id, ["module."]);
		if (!Array.isArray(desc.densities) || desc.densities.length === 0) {
			throw new TypeError(`${desc.id} must declare at least one density`);
		}
		for (const d of desc.densities) {
			if (!(DENSITIES as readonly string[]).includes(d)) {
				throw new TypeError(`${desc.id} has unknown density ${String(d)}`);
			}
		}
		if (typeof desc.mount !== "function") {
			throw new TypeError(`${desc.id} mount must be a function`);
		}
		if (byId.has(desc.id)) {
			throw new LayerIdError(desc.id, "already registered");
		}
		byId.set(desc.id, desc);
	}

	return {
		register,
		get: (id) => byId.get(id),
		list: () => [...byId.values()],
	};
}
