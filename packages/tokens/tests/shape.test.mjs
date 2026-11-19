/* Purpose: verify the approved DS-SHAPE-1 token contract from local CSS.
 * Inputs: canonical token source; output: Node assertions. Aliases resolve
 * without a browser; spacing is measured separately by the rendered test.
 * No product state, palette values or density defaults are changed here. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {blocks, read, resolve, src} from './colour-math.mjs';

const files = readdirSync(src).filter(file => file.endsWith('.css'));
const roots = files.flatMap(file => blocks(read(file)).filter(block => block.selector.split(',').some(selector => selector.trim() === ':root')));
const values = Object.assign({}, ...roots.map(block => Object.fromEntries(block.declarations)));
const roles = {'page-margin':6, gutter:5, 'section-gap':5, 'subsection-gap':4, 'sibling-gap':3, 'child-gap':2, inset:4, 'rule-gap':4};

test('all declared weight tokens resolve to 400 or 500', () => {
  const weights = files.flatMap(file => blocks(read(file)).flatMap(block => block.declarations.filter(([name]) => /weight/.test(name))));
  assert.ok(weights.length >= 8);
  for (const [name, value] of weights) assert.ok(['400','500'].includes(resolve(value,values)), name);
  assert.equal(resolve(values['--s-font-weight-regular'], values), '400');
  for (const name of ['medium','semibold','bold']) assert.equal(resolve(values[`--s-font-weight-${name}`],values),'500');
});
test('Snug roles have one canonical definition and the approved Fibonacci alias', () => {
  for (const [role, step] of Object.entries(roles)) {
    const name = `--s-${role}`;
    assert.equal(files.flatMap(file => blocks(read(file)).flatMap(block => block.declarations.filter(([n]) => n === name))).length, 1, name);
    assert.equal(values[name], `var(--s-space-${step})`, name);
  }
  assert.equal(values['--s-layout-gutter'],'var(--s-gutter)');
  assert.equal(values['--s-layout-section-gap'],'var(--s-section-gap)');
});
test('control height has a single 28px owner and icon buttons alias it', () => {
  assert.equal(values['--s-control-height'], '28px');
  assert.equal(values['--s-icon-button-size-md-container'], 'var(--s-control-height)');
});
test('radius nesting publishes its own inset and preserves the formula', () => {
  const css = read('_radius-borders.css');
  assert.doesNotMatch(css, /--s-inset\b/);
  assert.match(css, /--s-radius-inset: var\(--s-radius-nest-inset, var\(--s-space-3\)\)/);
  assert.match(css, /padding: var\(--s-radius-inset\)/);
  assert.match(css, /var\(--s-radius-outer, var\(--s-radius-none\)\) - var\(--s-radius-inset, var\(--s-radius-none\)\)/);
});
test('every cream definition retains its value and carries its retirement warning', () => {
  const lines = read('_palettes.css').split('\n').filter(line => /--(?:s-)?cream-[\w-]+:/.test(line));
  assert.ok(lines.length > 20);
  for (const line of lines) assert.match(line, /retired 2026-11-06, do not use/);
});
