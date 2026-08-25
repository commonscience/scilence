import { test } from "node:test";
import assert from "node:assert/strict";

import {
	assertLayerId,
	createDropPayload,
	createModuleRegistry,
	isDropPayload,
	isLayerId,
	LayerIdError,
	MODULE_IDS,
} from "../dist/index.js";

test("rejects bare host words", () => {
	for (const bare of ["cell", "scene", "board", "book"]) {
		assert.equal(isLayerId(bare), false);
		assert.throws(() => assertLayerId(bare), LayerIdError);
	}
});

test("accepts layer prefixes and cmpd: wire form", () => {
	assert.equal(isLayerId("host.cell"), true);
	assert.deepEqual([...MODULE_IDS], ["module.monitor", "module.editor"]);
	assert.equal(isLayerId("module.monitor"), true);
	assert.equal(isLayerId("entity.scene"), true);
	assert.equal(isLayerId("datum.pose"), true);
	assert.equal(isLayerId("cmpd:demo:stdinchikey:ABCDEFGHIJKLMNOPQRSTUVW"), true);
	assert.equal(assertLayerId("module.editor", ["module."]), "module.editor");
	assert.throws(() => assertLayerId("host.cell", ["module."]), LayerIdError);
});

test("drop payload requires entity id + kind", () => {
	assert.equal(isDropPayload({}), false);
	assert.equal(isDropPayload({ entity: { id: "x" } }), false);
	const drop = createDropPayload({
		entity: { id: "cmp-1", kind: "entity.compound" },
		datums: { pose: { x: 1 } },
		fromHost: "host.board",
	});
	assert.equal(drop.entity.id, "cmp-1");
	assert.equal(drop.fromHost, "host.board");
	assert.deepEqual(drop.datums, { pose: { x: 1 } });
	assert.throws(() => createDropPayload({ entity: { id: "", kind: "x" } }), TypeError);
});

test("registry accepts module.* and rejects bare ids + duplicates", () => {
	const reg = createModuleRegistry();
	const mount = () => ({ destroy() {} });
	reg.register({ id: "module.monitor", densities: ["inline", "rail"], mount });
	assert.equal(reg.get("module.monitor")?.id, "module.monitor");
	assert.equal(reg.list().length, 1);
	assert.throws(
		() => reg.register({ id: "monitor", densities: ["inline"], mount }),
		LayerIdError,
	);
	assert.throws(
		() => reg.register({ id: "module.monitor", densities: ["inline"], mount }),
		LayerIdError,
	);
});
