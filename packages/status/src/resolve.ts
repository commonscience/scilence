import { StatusCodeNotFoundError } from './errors.js';
import { formatIcuSubset } from './icu-subset.js';
import { STATUS_REGISTRY } from './registry.js';
import type { ResolvedStatus, StatusParams } from './types.js';

export function resolve(code: string, params: StatusParams = {}): ResolvedStatus {
	const entry = STATUS_REGISTRY[code as keyof typeof STATUS_REGISTRY];
	if (!entry) {
		throw new StatusCodeNotFoundError(code);
	}

	return {
		code: entry.code,
		severity: entry.category,
		title: formatIcuSubset(entry.title, params),
		detail: formatIcuSubset(entry.detail, params),
	};
}
