/**
 * The "what the surface hands the model" boundary — a pure normalizer.
 * No model call, no DOM. Testable in isolation.
 */

import type { ContextFrame, SurfaceState } from './types.js';

/**
 * Harvest raw {@link SurfaceState} into a normalized {@link ContextFrame}
 * (Project ▸ Thread ▸ Interaction). Missing fields become `null`; entities
 * default to `[]`. Pure — same input always yields the same frame.
 */
export function assembleContext(state: SurfaceState): ContextFrame {
  return {
    surface: state.surface,
    project: state.project ?? null,
    thread: state.thread ?? null,
    interaction: state.interaction ?? null,
    entities: state.entities ?? [],
    selection: state.selection ?? null,
  };
}
