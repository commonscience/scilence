# @scilence/status

Typed STEAMCO status-code registry with an in-house ICU-subset formatter.

Zero runtime dependencies. The only dev dependency is `typescript` via the
pnpm workspace.

## What's in the box

- `StatusEntry` — `{ code, severity, title, detail }`, where severity is
  one of `success | info | warning | error` and title/detail are
  ICU-subset templates.
- `STATUS_REGISTRY` — a frozen record of seeded status codes.
- `resolve(code, params)` — looks up `code` and returns a fully
  interpolated `StatusEntry`. Throws `StatusCodeNotFoundError` for
  unknown codes.
- `format(template, params)` — the underlying template engine, exposed
  for advanced callers.

## Supported template grammar

- Plain text is passed through unchanged.
- `{name}` substitutes `params[name]` (string or number).
- `{n, plural, one{...} other{...}}` pluralizes on `params[n]`. Inside
  a branch, `#` is replaced with the count value and nested `{var}`
  placeholders recurse through `format()`. Only `one` and `other`
  categories are supported.

Anything outside this subset (other plural categories, `select`,
`selectordinal`, number/date skeletons, etc.) is intentionally rejected
so callers cannot accidentally rely on richer ICU semantics that the
in-house formatter does not implement.

## Seed registry

| Code                                | Severity |
| ----------------------------------- | -------- |
| `etl.intake.job_complete`           | success  |
| `library.ingest.duplicate_smiles`   | error    |
| `reactivity.premise_changed`        | warning  |
| `notification.center.mark_all_read` | info     |
| `etl.intake.automap_failed`         | error    |

## Build + test

```
pnpm --filter @scilence/status run build
pnpm --filter @scilence/status test
```

Tests live in `tests/` and are plain ESM (Node `node:test` + `node:assert`)
running against the compiled `dist/` output.
