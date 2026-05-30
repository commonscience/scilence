# @scilence/status

Canonical status registry for STEAMCO surfaces. Status is data, not strings:
every user-facing success / error / warning / progress message resolves from a
typed, namespaced code via `resolve(code, params)`.

Spec: [`STATUS_REGISTRY_SPEC.md`](../../../research/specs/STATUS_REGISTRY_SPEC.md)
(workspace repo).

## v0 scope

- `StatusEntry` schema (code, category/severity, title, detail, owning_feature,
  surfaces, and optional RFC 9457 / telemetry fields)
- Seed registry (~5 notification-center readiness codes)
- In-house ICU-subset formatter (`{var}` + `{n, plural, one{…} other{…}}`)
- `resolve(code, params)` returning `{ code, severity, title, detail }`
- Explicit unknown-code handling via `StatusCodeNotFoundError`

Out of scope for v0: docs generator, `status:gate`, surface routing, codegen.

## Usage

```typescript
import { resolve } from '@scilence/status';

const message = resolve('library.ingest.duplicate_smiles', {
	n: 3,
	library: 'Series A',
});
// message.severity === 'error'
// message.title === '3 compounds already in Series A.'
```

## Build + test

```bash
pnpm run build
pnpm run test
```
