// @scilence/status — resolve()
//
// Looks up a status code in the registry and returns a StatusEntry with
// title and detail templates interpolated against the supplied params.
// Unknown codes throw StatusCodeNotFoundError.

import { StatusCodeNotFoundError } from './errors.js';
import { format } from './format.js';
import type { FormatParams } from './format.js';
import { STATUS_REGISTRY } from './registry.js';
import type { StatusEntry } from './types.js';

export type ResolveParams = FormatParams;

export function resolve(code: string, params: ResolveParams = {}): StatusEntry {
	const entry = STATUS_REGISTRY[code];
	if (entry === undefined) {
		throw new StatusCodeNotFoundError(code);
	}
	return {
		code: entry.code,
		severity: entry.severity,
		title: format(entry.title, params),
		detail: format(entry.detail, params),
	};
}
