/**
 * @scilence/chrome — application chrome.
 *
 * First occupant: the module-host contract (F0). Dock chips and
 * module.monitor land here next. Do not put UI in @scilence/status
 * (that package is a status-code registry).
 */

export {
	LAYER_PREFIXES,
	HOST_IDS,
	DENSITIES,
	MODULE_IDS,
	LayerIdError,
	isLayerId,
	assertLayerId,
	isHostId,
	isDropPayload,
	createDropPayload,
	createModuleRegistry,
} from "./module-host.js";
export type {
	LayerPrefix,
	HostId,
	Density,
	ModuleId,
	EntityRef,
	DatumMap,
	DropPayload,
	MountContext,
	ModuleTeardown,
	ModuleMount,
	ModuleDescriptor,
	ModuleRegistry,
} from "./module-host.js";
