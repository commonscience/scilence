/**
 * @scilence/orbie — core types.
 *
 * Headless + framework-agnostic. No DOM, no node builtins. These are the
 * product-facing shapes every AI capability in GUIDE speaks; the transport
 * seam ({@link ./adapter}) is the only place a concrete backend appears.
 */

/** Model tier — the routing axis. mechanical → local; nuanced → larger; frontier → user's provider. */
export type Tier = 'mechanical' | 'nuanced' | 'frontier';

/** The single place model selection resolves to. */
export interface ModelChoice {
  tier: Tier;
  model?: string;
}

/** A reference to a real in-system artifact. Grounded refs resolve to one of these. */
export interface ArtifactRef {
  id: string;
  kind: string;
  label?: string;
}

/**
 * Raw surface state handed to {@link assembleContext}. Optional/loose by design —
 * a surface hands whatever it has; the normalizer fills the gaps.
 */
export interface SurfaceState {
  surface: string;
  project?: unknown;
  thread?: unknown;
  interaction?: unknown;
  entities?: ArtifactRef[];
  selection?: unknown;
}

/**
 * A promptable snapshot of the current surface — Project ▸ Thread ▸ Interaction,
 * executable. Normalized: missing fields are `null`, entities default to `[]`.
 */
export interface ContextFrame {
  surface: string;
  project: unknown | null;
  thread: unknown | null;
  interaction: unknown | null;
  entities: ArtifactRef[];
  selection: unknown | null;
}

/** What the caller hands {@link Orbie.complete}. */
export interface PromptSpec {
  system?: string;
  user: string;
  context?: ContextFrame;
}

/**
 * Attached to every model output. Grounded-or-silent; never a bare label.
 * The clock is passed in (`at`) — the core reads no ambient clock.
 */
export interface Provenance {
  actor: 'model';
  model: string;
  version: string;
  tier: Tier;
  promptHash: string;
  /** Hashes that resolve to real in-system artifacts, or empty. */
  retrievedContextHashes: string[];
  /** Computed, not asserted; unresolved refs are dropped, never rendered. */
  groundedRefs: ArtifactRef[];
  uncertainty?: number;
  /** ISO timestamp (passed in — no ambient clock in core). */
  at: string;
}

/** The return shape of a completion: text plus mandatory provenance. */
export interface CompleteResult {
  text: string;
  provenance: Provenance;
}

/** Describes a unit of work so {@link route} can pick a tier. */
export interface TaskSpec {
  kind: string;
  sizeHint?: 'small' | 'large';
  needsFrontier?: boolean;
}

/** A prompt + its response — the durable pair {@link promoteToCell} consumes. */
export interface Interaction {
  prompt: PromptSpec;
  response: CompleteResult;
}

/**
 * A durable cell minted from an AI interaction (the notebook is the first
 * consumer surface, not the only one). The `pull` path: the user invokes
 * promotion; the substrate never pushes a cell (no-Clippy).
 */
export interface CellSpec {
  kind: 'ai';
  source: 'ai_suggestion';
  content: string;
  provenance: Provenance;
  promptText: string;
}
