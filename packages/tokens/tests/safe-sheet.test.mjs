/** Proposed safe-area and sheet template tokens.
 *  Reads the token file. Does not render. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const css = readFileSync(fileURLToPath(new URL('../src/_safe-sheet.css', import.meta.url)), 'utf8');

test('safe area and keyboard tokens are proposed at token level', () => {
  assert.match(css, /Token level\. Design Lab entry, status proposed\./);
  assert.match(css, /--s-safe-top:\s*env\(safe-area-inset-top, 0px\)/);
  assert.match(css, /--s-safe-bottom:\s*env\(safe-area-inset-bottom, 0px\)/);
  assert.match(css, /--s-safe-start:\s*env\(safe-area-inset-left, 0px\)/);
  assert.match(css, /--s-safe-end:\s*env\(safe-area-inset-right, 0px\)/);
  assert.match(css, /--s-keyboard-inset:\s*0px/);
});

test('sheet geometry tokens are proposed at template level', () => {
  assert.match(css, /Template level\. Design Lab entry, status proposed\./);
  assert.match(css, /--s-sheet-max-inline:\s*min\(70rem, 94vw\)/);
  assert.match(css, /--s-sheet-peek-block:\s*min\(100%, calc\(var\(--s-size-touch-target-min\) \* 4 \+ var\(--s-safe-bottom\)\)\)/);
  assert.match(css, /--s-sheet-half-block:\s*50dvh/);
  assert.match(css, /--s-panel-track:\s*minmax\(0, 1fr\)/);
  assert.match(css, /--s-rail-sheet-inline:\s*calc\(100% - var\(--navigation-rail-width, 0px\) - var\(--s-safe-start\) - var\(--s-safe-end\)\)/);
});
