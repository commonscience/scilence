// @scilence/status — in-house ICU-subset formatter
//
// Supported grammar (intentionally small, zero deps):
//
//   1. Plain text passes through unchanged.
//   2. {name}                          → simple variable interpolation.
//   3. {name, plural, one{A} other{B}} → pluralization on params[name].
//      Inside a plural branch, `#` is replaced with params[name],
//      and {var} placeholders are recursively interpolated.
//
// Only the `one` and `other` plural categories are recognized; any other
// category (e.g. `=0`, `few`, `many`) is rejected as unsupported.
//
// This is deliberately a subset of full ICU MessageFormat. It exists so
// the status registry can ship without pulling a runtime dependency.

export type FormatParams = Record<string, string | number>;

export function format(template: string, params: FormatParams): string {
	let out = '';
	let i = 0;
	while (i < template.length) {
		const ch = template[i];
		if (ch === '{') {
			const end = findMatchingBrace(template, i);
			const inner = template.slice(i + 1, end);
			out += evaluatePlaceholder(inner, params);
			i = end + 1;
		} else {
			out += ch;
			i += 1;
		}
	}
	return out;
}

function findMatchingBrace(source: string, start: number): number {
	let depth = 0;
	for (let i = start; i < source.length; i += 1) {
		const c = source[i];
		if (c === '{') {
			depth += 1;
		} else if (c === '}') {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	throw new Error(`Unmatched brace in template starting at index ${start}: ${source}`);
}

function evaluatePlaceholder(inner: string, params: FormatParams): string {
	const firstComma = inner.indexOf(',');
	if (firstComma === -1) {
		// Simple {name}
		const name = inner.trim();
		const value = params[name];
		if (value === undefined) {
			throw new Error(`Missing template parameter: ${name}`);
		}
		return String(value);
	}

	const name = inner.slice(0, firstComma).trim();
	const rest = inner.slice(firstComma + 1).trim();

	// Expect `plural, one{...} other{...}`
	const secondComma = rest.indexOf(',');
	if (secondComma === -1) {
		throw new Error(`Malformed placeholder (expected type + branches): {${inner}}`);
	}
	const type = rest.slice(0, secondComma).trim();
	const branchesSrc = rest.slice(secondComma + 1).trim();

	if (type !== 'plural') {
		throw new Error(`Unsupported ICU placeholder type: ${type}`);
	}

	const raw = params[name];
	if (raw === undefined) {
		throw new Error(`Missing template parameter: ${name}`);
	}
	const n = typeof raw === 'number' ? raw : Number(raw);
	if (!Number.isFinite(n)) {
		throw new Error(`Plural parameter '${name}' must be a number; got: ${String(raw)}`);
	}

	const branches = parsePluralBranches(branchesSrc);
	const selected = n === 1 ? branches.one ?? branches.other : branches.other;
	if (selected === undefined) {
		throw new Error(`Plural form missing 'other' branch for {${name}}`);
	}

	// `#` is replaced with the count; remaining {var}s recurse through format().
	const withCount = selected.replace(/#/g, String(n));
	return format(withCount, params);
}

interface PluralBranches {
	one?: string;
	other?: string;
}

function parsePluralBranches(source: string): PluralBranches {
	const branches: PluralBranches = {};
	let i = 0;
	while (i < source.length) {
		// Skip whitespace.
		while (i < source.length) {
			const c = source[i];
			if (c === undefined || !isWhitespace(c)) break;
			i += 1;
		}
		if (i >= source.length) break;

		// Read branch keyword up to whitespace or `{`.
		let keyword = '';
		while (i < source.length) {
			const c = source[i];
			if (c === undefined || c === '{' || isWhitespace(c)) break;
			keyword += c;
			i += 1;
		}

		// Skip whitespace between keyword and `{`.
		while (i < source.length) {
			const c = source[i];
			if (c === undefined || !isWhitespace(c)) break;
			i += 1;
		}

		if (source[i] !== '{') {
			throw new Error(`Expected '{' after plural keyword '${keyword}'`);
		}
		const end = findMatchingBrace(source, i);
		const body = source.slice(i + 1, end);

		if (keyword === 'one') {
			branches.one = body;
		} else if (keyword === 'other') {
			branches.other = body;
		} else {
			throw new Error(`Unsupported plural category: ${keyword}`);
		}
		i = end + 1;
	}
	return branches;
}

function isWhitespace(c: string): boolean {
	return c === ' ' || c === '\t' || c === '\n' || c === '\r';
}
