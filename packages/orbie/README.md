# @scilence/orbie

The **headless AI substrate** — the AI analogue of [`@scilence/tokens`](../tokens). Just as no surface hardcodes a color (it reaches for a token), **no surface rolls its own model calls** — it reaches for `orbie.*`. This package is the single, pure, framework-agnostic contract every AI capability in GUIDE routes through.

- **Headless + framework-agnostic** — no DOM, no node builtins. Runs identically in a browser or node.
- **Dependency-free at runtime** — zero runtime deps; `typescript` is the only devDependency (Apache-2.0 + MIT minimal-deps doctrine).
- **License:** Apache-2.0.

The inference engine (llm-bridge: `llm_complete / transform / summarize / health / models_list`, tier policy, local-Ollama path) is **wrapped, not replaced** — Orbie reaches it through an injectable [`OrbieBackendAdapter`](src/adapter.ts). The substrate never imports a backend directly; the adapter is the seam that keeps it testable and headless.

## The four governance locks

1. **Headless-first.** Every function works with zero chrome and a mock adapter. Chrome consumes the API; it never owns it.
2. **No surface rolls its own model calls.** `orbie.*` is the only path to a model — the same class of rule as "no hardcoded color bypassing scilence tokens."
3. **Provenance is mandatory.** `complete()` always returns a `Provenance`. References are **grounded-or-silent**: candidate citations are resolved to real artifacts and unresolved ones are *dropped*, never rendered (countering phantom citations).
4. **Pull, never push.** `promoteToCell()` is user-invoked. The substrate never pushes a cell into a surface (no-Clippy).

## Headless usage

Runs with only the in-memory mock adapter and an injected fixed clock — no backend, no chrome, deterministic:

```ts
import { createOrbie, createMockAdapter } from '@scilence/orbie';

const orbie = createOrbie(
  createMockAdapter({ text: 'A concise summary.', model: 'mixtral-local', version: '0.3' }),
  {
    clock: () => '2026-07-07T00:00:00.000Z',           // the ONLY place a clock is read
    resolveArtifact: (ref) => ref.id.startsWith('paper:'), // grounded-or-silent gate
  },
);

// Pure — no model call:
const context = orbie.assembleContext({
  surface: 'notebook',
  entities: [{ id: 'paper:123', kind: 'paper', label: 'Kenny 2019' }],
});

// The one place model selection lives:
orbie.route({ kind: 'summarize', sizeHint: 'large' }); // → { tier: 'nuanced' }

// Model call → text + mandatory provenance:
const response = await orbie.complete(
  { user: 'Summarize the selected entities.', context },
  { task: { kind: 'summarize', sizeHint: 'large' } },
);
response.text;                 // 'A concise summary.'
response.provenance.tier;      // 'nuanced'
response.provenance.at;        // '2026-07-07T00:00:00.000Z' (injected clock)
response.provenance.promptHash;// deterministic FNV-1a hex

// Pull path — user-invoked durable cell:
const cell = orbie.promoteToCell({ prompt: { user: 'Summarize the selected entities.' }, response });
cell.kind;   // 'ai'
cell.source; // 'ai_suggestion'
```

## Public surface

`createOrbie`, `createMockAdapter`, `route`, `assembleContext`, `promoteToCell`, `buildProvenance`, `stableHash`, plus all core types (`Orbie`, `Tier`, `Provenance`, `ContextFrame`, `CompleteResult`, `OrbieBackendAdapter`, …). See [`src/index.ts`](src/index.ts).

## Contract

Full governance contract, semantics, and consumer table: [`research/specs/ORBIE_SUBSTRATE_CONTRACT.md`](../../../research/specs/ORBIE_SUBSTRATE_CONTRACT.md).
