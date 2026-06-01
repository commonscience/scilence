// @scilence/status — public API barrel
//
// Typed status-code registry with an in-house ICU-subset formatter.
// Supports {var} interpolation and {n, plural, one{...} other{...}}
// pluralization. Zero runtime dependencies.

export type { Severity, StatusEntry } from './types.js';
export { StatusCodeNotFoundError } from './errors.js';
export { format } from './format.js';
export type { FormatParams } from './format.js';
export { STATUS_REGISTRY } from './registry.js';
export { resolve } from './resolve.js';
export type { ResolveParams } from './resolve.js';
