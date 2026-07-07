/**
 * `createOrbie` — the composition root. Binds an injected backend adapter to
 * the pure substrate functions (route / assembleContext / promoteToCell) and
 * the provenance builder. The only stateful seam is the injected clock, which
 * is the single place a wall-clock is read — keeping the substrate headless
 * and deterministically testable.
 */

import type { OrbieBackendAdapter } from './adapter.js';
import type {
  ArtifactRef,
  CellSpec,
  CompleteResult,
  ContextFrame,
  Interaction,
  ModelChoice,
  PromptSpec,
  SurfaceState,
  TaskSpec,
  Tier,
} from './types.js';
import { route } from './route.js';
import { assembleContext } from './assemble.js';
import { promoteToCell } from './promote.js';
import { buildProvenance } from './provenance.js';

/** Per-call options for {@link Orbie.complete}. */
export interface CompleteOpts {
  /** Explicit tier override; wins over `task`. */
  tier?: Tier;
  /** If no explicit tier, route this task to pick one. */
  task?: TaskSpec;
  /** Hashes of retrieved context, recorded on the provenance. */
  contextHashes?: string[];
}

/** The product-facing substrate surface. `orbie.*` is the only path to a model. */
export interface Orbie {
  complete(prompt: PromptSpec, opts?: CompleteOpts): Promise<CompleteResult>;
  assembleContext(state: SurfaceState): ContextFrame;
  route(task: TaskSpec): ModelChoice;
  promoteToCell(interaction: Interaction): CellSpec;
}

/** Construction options — injectable clock + artifact resolver for headless testability. */
export interface CreateOrbieOpts {
  /** The ONLY place a wall-clock is read. Defaults to ISO-now. */
  clock?: () => string;
  /** Resolves a candidate ref to a real artifact; default drops all (grounded-or-silent). */
  resolveArtifact?: (ref: ArtifactRef) => boolean;
}

/**
 * Build an {@link Orbie} bound to `adapter`. Pure functions (route,
 * assembleContext, promoteToCell) are exposed as-is; `complete` routes,
 * dispatches to the adapter's `generate`, and attaches mandatory provenance.
 */
export function createOrbie(adapter: OrbieBackendAdapter, opts?: CreateOrbieOpts): Orbie {
  const clock = opts?.clock ?? (() => new Date().toISOString());
  const resolveArtifact = opts?.resolveArtifact ?? (() => false);

  return {
    async complete(prompt: PromptSpec, callOpts?: CompleteOpts): Promise<CompleteResult> {
      const tier: Tier = callOpts?.tier ?? (callOpts?.task ? route(callOpts.task).tier : 'mechanical');
      const result = await adapter.generate({
        prompt: prompt.user,
        system: prompt.system,
        context: prompt.context,
        tier,
      });
      const provenance = buildProvenance({
        prompt: prompt.user,
        result,
        tier,
        at: clock(),
        contextHashes: callOpts?.contextHashes,
        resolveArtifact,
      });
      return { text: result.text, provenance };
    },

    assembleContext(state: SurfaceState): ContextFrame {
      return assembleContext(state);
    },

    route(task: TaskSpec): ModelChoice {
      return route(task);
    },

    promoteToCell(interaction: Interaction): CellSpec {
      return promoteToCell(interaction);
    },
  };
}
