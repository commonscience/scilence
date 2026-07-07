/**
 * The transport seam. `@scilence/orbie` never imports a backend directly — it
 * depends on this interface. The shell provides a concrete adapter that talks
 * to llm-bridge (`llm_complete / transform / summarize / health / models_list`);
 * tests provide a mock. That is what keeps the substrate headless and testable
 * and O1 independent of llm-bridge's runtime.
 */

import type { ArtifactRef, ContextFrame, Tier } from './types.js';

/**
 * A request into the backend. The backend assembles the final model prompt from
 * these parts — the substrate passes them through rather than pre-flattening, so
 * nothing the caller supplies (system instruction, assembled context) is dropped.
 */
export interface BackendRequest {
  /** The user turn. */
  prompt: string;
  tier: Tier;
  model?: string;
  /** Optional system instruction. */
  system?: string;
  /** Optional assembled surface context the backend may fold into the prompt. */
  context?: ContextFrame;
}

/** A backend response. `refs` are candidate citations, grounded downstream. */
export interface BackendResult {
  text: string;
  model: string;
  version: string;
  refs?: ArtifactRef[];
}

/** A model the backend can serve, with its tier. */
export interface ModelDescriptor {
  id: string;
  tier: Tier;
}

/**
 * The injectable backend. Maps 1:1 to llm-bridge, but this package never names
 * llm-bridge — the adapter is the seam.
 */
export interface OrbieBackendAdapter {
  generate(req: BackendRequest): Promise<BackendResult>;
  transform(req: BackendRequest): Promise<BackendResult>;
  summarize(req: BackendRequest): Promise<BackendResult>;
  health(): Promise<{ ok: boolean }>;
  models(): Promise<ModelDescriptor[]>;
}
