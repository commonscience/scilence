/**
 * @scilence/orbie — the headless AI substrate. The AI analogue of
 * @scilence/tokens: no surface rolls its own model calls; `orbie.*` is the
 * only path to a model. Pure, framework-agnostic, dependency-free.
 *
 * See research/specs/ORBIE_SUBSTRATE_CONTRACT.md for the governance locks.
 */

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  Tier,
  ModelChoice,
  ArtifactRef,
  SurfaceState,
  ContextFrame,
  PromptSpec,
  Provenance,
  CompleteResult,
  TaskSpec,
  Interaction,
  CellSpec,
} from './types.js';

export type {
  OrbieBackendAdapter,
  BackendRequest,
  BackendResult,
  ModelDescriptor,
} from './adapter.js';

export type { BuildProvenanceArgs } from './provenance.js';
export type { MockAdapterOpts } from './mock-adapter.js';
export type { Orbie, CompleteOpts, CreateOrbieOpts } from './orbie.js';

// ── Runtime ──────────────────────────────────────────────────────────────────
export { stableHash } from './hash.js';
export { route } from './route.js';
export { assembleContext } from './assemble.js';
export { promoteToCell } from './promote.js';
export { buildProvenance } from './provenance.js';
export { createMockAdapter } from './mock-adapter.js';
export { createOrbie } from './orbie.js';
