/**
 * Class-only contract for Button and IconButton.
 *
 * `<button class="s-button" data-variant="…" data-size="…">` must render
 * completely without createButton(). This reads each member's types.ts
 * unions and fails if the sheet lacks the rule that resolves that member's
 * custom properties, so a new variant cannot ship factory-only again.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const here = new URL('.', import.meta.url);
const read = (rel: string) => readFileSync(new URL(rel, here), 'utf8');

function unionMembers(types: string, name: string): string[] {
	const match = types.match(new RegExp(`export type ${name} =([^;]+);`));
	assert.ok(match, `types.ts declares ${name}`);
	return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function ruleBody(css: string, selector: string): string {
	const at = css.indexOf(`${selector} {`);
	assert.ok(at >= 0, `missing rule ${selector}`);
	return css.slice(at, css.indexOf('}', at));
}

test('Button.css resolves every Variant and Size from data attributes', () => {
	const types = read('./Button/types.ts');
	const css = read('./Button/Button.css');
	for (const v of unionMembers(types, 'Variant')) {
		const body = ruleBody(css, `.s-button[data-variant='${v}']`);
		for (const prop of ['bg', 'fg', 'border-color']) {
			assert.match(body, new RegExp(`--s-button-${prop}: var\\(--s-button-variant-${v}-${prop}\\)`));
		}
	}
	for (const s of unionMembers(types, 'Size')) {
		const body = ruleBody(css, `.s-button[data-size='${s}']`);
		for (const prop of ['font-size', 'padding-block', 'padding-inline', 'gap', 'height']) {
			assert.match(body, new RegExp(`--s-button-${prop}: var\\(--s-button-size-${s}-${prop}\\)`));
		}
	}
});

test('IconButton.css resolves every Tone, Size and Shape from data attributes', () => {
	const types = read('./IconButton/types.ts');
	const css = read('./IconButton/IconButton.css');
	for (const t of unionMembers(types, 'Tone')) {
		const body = ruleBody(css, `.s-icon-button[data-tone='${t}']`);
		for (const prop of ['bg', 'fg', 'border-color', 'hover-bg']) {
			assert.match(body, new RegExp(`--s-icon-button-${prop}: var\\(--s-icon-button-tone-${t}-${prop}\\)`));
		}
	}
	for (const s of unionMembers(types, 'Size')) {
		const body = ruleBody(css, `.s-icon-button[data-size='${s}']`);
		assert.match(body, new RegExp(`--s-icon-button-size: var\\(--s-icon-button-size-${s}-container\\)`));
		assert.match(body, new RegExp(`--s-icon-button-icon-size: var\\(--s-icon-button-size-${s}-icon\\)`));
	}
	for (const sh of unionMembers(types, 'Shape')) {
		const body = ruleBody(css, `.s-icon-button[data-shape='${sh}']`);
		assert.match(body, new RegExp(`--s-icon-button-radius: var\\(--s-icon-button-shape-${sh}-radius\\)`));
	}
});

test('a bare class resolves no variant: data attributes are required', () => {
	// frame-navigation-tree.ts puts the bare `s-button` class on nav heads that
	// reset their own chrome; resolving min-height or colour there would repaint them.
	const cases: Array<[string, string, string]> = [
		['./Button/Button.css', '.s-button', '--s-button-'],
		['./IconButton/IconButton.css', '.s-icon-button', '--s-icon-button-'],
	];
	for (const [rel, root, prefix] of cases) {
		const css = read(rel);
		const body = ruleBody(css, root);
		assert.doesNotMatch(body, new RegExp(`${prefix}[a-z-]+:`), `${rel}: bare ${root} sets a resolved prop`);
		assert.doesNotMatch(css, /:where\(/, `${rel}: variant rules must not use :where() (one-class rules could repaint them)`);
	}
});

test('secondary hover lifts ink to the hover-fg token', () => {
	const css = read('./Button/Button.css');
	const body = ruleBody(css, ".s-button[data-variant='secondary']:hover:not(:disabled):not([aria-disabled='true'])");
	assert.match(body, /color: var\(--s-button-variant-secondary-hover-fg\)/);
});

test('Button corners use the control radius role', () => {
	assert.match(ruleBody(read('./Button/Button.css'), '.s-button'), /border-radius: var\(--s-radius-control\)/);
});

test('IconButton pressed uses the paired selected tokens, not a second recipe', () => {
	const css = read('./IconButton/IconButton.css');
	const body = ruleBody(css, ".s-icon-button[aria-pressed='true']");
	assert.match(body, /background: var\(--s-color-selected-bg\)/);
	assert.match(body, /color: var\(--s-color-selected-fg\)/);
	assert.doesNotMatch(css, /--s-brand-alpha-/);
});

test('factory resolvers still name the same token families the class rules use', () => {
	assert.match(read('./Button/resolve-button-tokens.ts'), /--s-button-variant-\$\{v\}-bg/);
	assert.match(read('./IconButton/resolve-iconbutton-tokens.ts'), /--s-icon-button-tone-\$\{t\}-bg/);
});
