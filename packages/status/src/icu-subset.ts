import type { StatusParams } from './types.js';

const PLURAL_PATTERN =
	/\{(\w+),\s*plural,\s*one\s*\{([^}]*)\}\s*other\s*\{([^}]*)\}\}/g;

const SIMPLE_PATTERN = /\{(\w+)\}/g;

function formatPluralBranch(branch: string, count: number): string {
	return branch.replaceAll('#', String(count));
}

function resolvePlural(template: string, params: StatusParams): string {
	return template.replace(PLURAL_PATTERN, (_match, key: string, one: string, other: string) => {
		const raw = params[key];
		const count = typeof raw === 'number' ? raw : Number(raw);
		if (!Number.isFinite(count)) {
			return `{${key}, plural, one {${one}} other {${other}}}`;
		}
		const branch = count === 1 ? one : other;
		return formatPluralBranch(branch, count);
	});
}

function resolveSimple(template: string, params: StatusParams): string {
	return template.replace(SIMPLE_PATTERN, (_match, key: string) => {
		const value = params[key];
		return value === undefined ? `{${key}}` : String(value);
	});
}

export function formatIcuSubset(template: string, params: StatusParams = {}): string {
	const withPlurals = resolvePlural(template, params);
	return resolveSimple(withPlurals, params);
}
