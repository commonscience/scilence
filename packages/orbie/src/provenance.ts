/**
 * Provenance construction — mandatory on every model output, grounded-or-silent.
 *
 * `groundedRefs` are COMPUTED by resolving the backend's candidate citations to
 * real artifacts; unresolved references are DROPPED (countering the measured
 * phantom-citation rate), never rendered. If no resolver is supplied, nothing
 * grounds — silence over fabrication.
 */

import type { BackendResult } from './adapter.js';
import type { ArtifactRef, Provenance, Tier } from './types.js';
import { stableHash } from './hash.js';

export interface BuildProvenanceArgs {
  prompt: string;
  result: BackendResult;
  tier: Tier;
  /** ISO timestamp — passed in; the core reads no ambient clock. */
  at: string;
  contextHashes?: string[];
  /** Returns true only for refs that resolve to a real in-system artifact. */
  resolveArtifact?: (ref: ArtifactRef) => boolean;
}

/**
 * Assemble a {@link Provenance} record. `promptHash = stableHash(prompt)`;
 * `groundedRefs = (result.refs || []).filter(resolveArtifact)` with a
 * default resolver of `() => false` (grounded-or-silent).
 */
export function buildProvenance(args: BuildProvenanceArgs): Provenance {
  const { prompt, result, tier, at, contextHashes, resolveArtifact } = args;
  const resolve = resolveArtifact ?? (() => false);
  return {
    actor: 'model',
    model: result.model,
    version: result.version,
    tier,
    promptHash: stableHash(prompt),
    retrievedContextHashes: contextHashes ?? [],
    groundedRefs: (result.refs ?? []).filter(resolve),
    at,
  };
}
