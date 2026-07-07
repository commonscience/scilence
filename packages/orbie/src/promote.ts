/**
 * The pull path: mint a durable cell in the invoking surface from an AI
 * interaction. Pure. The user invokes this from the thread; the substrate never
 * pushes a cell into a surface (no-Clippy). Pan-surface — the notebook is the
 * first consumer, not the only one.
 */

import type { CellSpec, Interaction } from './types.js';

/**
 * Project an {@link Interaction} into a {@link CellSpec} the caller commits
 * through the invoking surface's normal commit gate. Carries provenance and the
 * originating prompt text forward.
 */
export function promoteToCell(interaction: Interaction): CellSpec {
  return {
    kind: 'ai',
    source: 'ai_suggestion',
    content: interaction.response.text,
    provenance: interaction.response.provenance,
    promptText: interaction.prompt.user,
  };
}
