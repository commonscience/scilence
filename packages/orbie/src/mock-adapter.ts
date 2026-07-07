/**
 * A deterministic in-memory adapter for tests + headless demos. Zero backend,
 * zero chrome — this is what makes "callable headless" real.
 */

import type { BackendResult, ModelDescriptor, OrbieBackendAdapter } from './adapter.js';
import type { ArtifactRef } from './types.js';

export interface MockAdapterOpts {
  text?: string;
  model?: string;
  version?: string;
  refs?: ArtifactRef[];
}

/**
 * Every generate/transform/summarize returns the same canned result;
 * `health` is always ok; `models` reports the single canned model. Fully
 * deterministic given its options.
 */
export function createMockAdapter(opts?: MockAdapterOpts): OrbieBackendAdapter {
  const text = opts?.text ?? 'mock completion';
  const model = opts?.model ?? 'mock-local';
  const version = opts?.version ?? '0.0.0';
  const refs = opts?.refs;

  const result = (): BackendResult => ({
    text,
    model,
    version,
    ...(refs !== undefined ? { refs } : {}),
  });

  const models: ModelDescriptor[] = [{ id: model, tier: 'mechanical' }];

  return {
    async generate() {
      return result();
    },
    async transform() {
      return result();
    },
    async summarize() {
      return result();
    },
    async health() {
      return { ok: true };
    },
    async models() {
      return models;
    },
  };
}
