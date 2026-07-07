/**
 * The ONE place model selection lives. Every routing decision flows through
 * here so it is consistent, swappable, and telemetry-visible.
 */

import type { ModelChoice, TaskSpec } from './types.js';

/**
 * Deterministic tier selection:
 * - `needsFrontier` → frontier (user's provider)
 * - else `sizeHint === 'large'` → nuanced (larger/frontier-capable local)
 * - else → mechanical (local)
 */
export function route(task: TaskSpec): ModelChoice {
  if (task.needsFrontier) {
    return { tier: 'frontier' };
  }
  if (task.sizeHint === 'large') {
    return { tier: 'nuanced' };
  }
  return { tier: 'mechanical' };
}
