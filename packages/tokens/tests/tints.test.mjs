import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blocks, read, tokens, resolve, tokenColour, colour, contrast, lab, pairs, simulatedLab, simulations } from './colour-math.mjs';

const names = [...new Set(blocks(read('_tints.css')).flatMap(b => b.declarations.map(([n]) => n)))];
const tones = ['info', 'warning', 'success', 'danger', 'accent-warm'];
const role = tone => tone === 'accent-warm' ? '--s-color-accent-warm' : `--s-color-status-${tone}`;
const mix = (tone, percent, v) => colour(`color-mix(in srgb, var(${role(tone)}) ${percent}, var(--s-color-bg-card))`, v);
const states = ['avatar', 'alert', 'alert-urgent'];
const modes = ['rest', 'alive'];

// No snapshots: these checks evaluate token changes and the resulting colours.
test('barrel loads tints once, after both theme anchors', () => {
  const css = read('index.css');
  assert.equal(css.match(/@import '\.\/_tints.css';/g)?.length, 1);
  assert.ok(css.indexOf('_tints.css') > css.indexOf('_themes-dark.css'));
});
test('each selector defines a token once; new names have no other source owner', () => {
  for (const b of blocks(read('_tints.css'))) {
    const declared = b.declarations.map(([name]) => name);
    assert.equal(new Set(declared).size, declared.length, b.selector);
  }
  for (const file of read('index.css').matchAll(/@import '\.\/([^']+)';/g)) {
    if (file[1] === '_tints.css') continue;
    for (const b of blocks(read(file[1]))) for (const [name] of b.declarations) {
      assert.ok(!names.includes(name), `${name} also defined in ${file[1]}`);
    }
  }
  assert.doesNotMatch(read('_tints.css'), /#[\da-f]{3,8}\b|\b(?:grey|gray|silver)\s*;/i);
});
test('decided rest/alive percentages and weights are preserved', () => {
  for (const theme of ['light', 'dark']) {
    const v = tokens(theme);
    for (const [name, expected] of Object.entries({
      '--s-tint-avatar-bg-rest':'3%', '--s-tint-avatar-border-rest':'9%',
      '--s-tint-avatar-bg-alive':'11%', '--s-tint-avatar-border-alive':'20%',
      '--s-tint-alert-bg-rest':'1.5%', '--s-tint-alert-border-rest':'9%',
      '--s-tint-alert-bg-alive':'4.7%', '--s-tint-alert-border-alive':'22%',
      '--s-tint-alert-urgent-bg-rest':'4.7%', '--s-tint-alert-urgent-border-rest':'22%',
      '--s-meaning-level':'55%', '--s-font-weight-regular':'400',
      '--s-font-weight-medium':'500', '--s-font-weight-semibold':'500', '--s-font-weight-bold':'500',
      '--s-commons-weight-semibold':'500', '--s-commons-weight-strong':'500',
    })) assert.equal(resolve(v[name], v), expected, `${theme} ${name}`);
  }
});
for (const theme of ['light', 'dark']) {
  test(`${theme}: all tokens resolve, including the default alive ink`, () => {
    const v = tokens(theme);
    for (const name of names) assert.ok(resolve(v[name], v), name);
    assert.notDeepEqual(tokenColour('--s-ink-rest', v), tokenColour('--s-ink-alive', v));
  });
  test(`${theme}: neutral hue follows white-label brand hue`, () => {
    for (const hue of [120, 180, 240, 300]) {
      const v = tokens(theme, 'familiar', hue);
      for (const name of ['--s-ink-rest', '--s-ink-rule', '--s-el-c']) {
        const [, a, b] = lab(tokenColour(name, v));
        const actual = (Math.atan2(b,a)*180/Math.PI+360)%360;
        const delta = Math.abs(((actual-hue+540)%360)-180);
        assert.ok(delta <= 3, `${name} hue ${actual} vs ${hue}`);
      }
    }
  });
  for (const state of states) for (const mode of modes) {
    test(`${theme} ${state} ${mode}: text >= 4.5 on every fill and edge tint`, () => {
      const v = tokens(theme), text = tokenColour('--s-color-fg-primary', v);
      for (const tone of tones) for (const layer of ['bg', 'border']) {
        const percent = resolve(v[`--s-tint-${state}-${layer}-${mode}`], v);
        const ratio = contrast(text, mix(tone, percent, v));
        assert.ok(ratio >= 4.5, `${tone} ${layer}: ${ratio.toFixed(3)}`);
      }
    });
  }
  // Edge floor: 1.18, set by the founder on 2026-11-06 (q-gpt-crew-dscol1-edge-20261107, option A).
  // The earlier 1.4 floor predated the quieter decided tints (avatar 11/20, alert 4.7/22); text and
  // status glyph carry the meaning, the edge is a hairline. Measured alive edges are 1.19 to 1.49.
  const EDGE_FLOOR = 1.18, FILL_FLOOR = 1.03;
  for (const state of states) for (const layer of ['bg', 'border']) {
    test(`${theme} ${state} alive ${layer}: perceptibility >= ${layer === 'bg' ? FILL_FLOOR : EDGE_FLOOR}`, () => {
      const v = tokens(theme), card = tokenColour('--s-color-bg-card', v), failures = [];
      for (const tone of tones) {
        const ratio = contrast(card, mix(tone, resolve(v[`--s-tint-${state}-${layer}-alive`], v), v));
        if (ratio < (layer === 'bg' ? FILL_FLOOR : EDGE_FLOOR)) failures.push(`${tone}=${ratio.toFixed(3)}`);
      }
      assert.deepEqual(failures, [], `Decided percentages on current card: ${failures.join(', ')}`);
    });
  }
  test(`${theme}: status glyphs >= 3 against card and every associated alert state`, () => {
    const v = tokens(theme), failures = [];
    for (const tone of tones.filter(t => t !== 'accent-warm')) {
      const glyph = tokenColour(`--s-status-glyph-${tone}`, v);
      for (const state of states) for (const mode of modes) {
        const background = mix(tone, resolve(v[`--s-tint-${state}-bg-${mode}`], v), v);
        const ratio = contrast(glyph, background);
        if (ratio < 3) failures.push(`${tone} ${state} ${mode}=${ratio.toFixed(3)}`);
      }
      assert.ok(contrast(glyph, tokenColour('--s-color-bg-card', v)) >= 3, tone);
    }
    assert.deepEqual(failures, []);
  });
  for (const scheme of ['familiar', 'colour-blind-safe']) {
    test(`${theme} ${scheme}: element letters >= 4.5 on their discs`, () => {
      const v = tokens(theme, scheme);
      for (const element of ['n','o','cl','c']) {
        const letter = element === 'c' ? '--s-el-c-letter' : '--s-el-letter';
        const ratio = contrast(tokenColour(letter,v),tokenColour(`--s-el-${element}`,v));
        assert.ok(ratio >= 4.5, `${element}: ${ratio.toFixed(3)}`);
      }
    });
  }
  for (const palette of ['familiar', 'colour-blind-safe', 'status', 'series']) for (const simulation of Object.keys(simulations)) {
    test(`${theme} ${palette}: Machado ${simulation} pair separation`, t => {
      const v = tokens(theme, palette === 'status' ? 'familiar' : palette);
      const set = palette === 'series' ? [1,2,3,4,5].map(x => `--s-series-${x}`) : palette === 'status' ? ['info','warning','success','danger'].map(x => `--s-status-glyph-${x}`) : ['n','o','cl','c'].map(x => `--s-el-${x}`);
      const failures = [];
      for (const [a,b] of pairs(set)) {
        const A = simulatedLab(tokenColour(a,v), simulation), B = simulatedLab(tokenColour(b,v), simulation);
        const d = Math.hypot(...A.map((x,i) => x-B[i])), dl = Math.abs(A[0]-B[0]);
        if (d >= .07 || dl >= .12) continue;
        const message = `${a}/${b}: distance=${d.toFixed(5)}, lightness=${dl.toFixed(5)}`;
        // Sole founder-approved exception; never extends to protan/tritan or another pair.
        if (palette === 'familiar' && simulation === 'deutan' && a === '--s-el-o' && b === '--s-el-cl') {
          t.diagnostic(`known exception (2026-11-06): ${message}; reference experiment 0.05; familiar default retained with mandatory letters and offered safe scheme`);
        } else failures.push(message);
      }
      assert.deepEqual(failures, [], `${simulation}: ${failures.join('; ')}`);
    });
  }
}

test('colour evaluator has independent sRGB and contrast reference checks', () => {
  const black = colour('oklch(0 0 0)', {}), white = colour('oklch(1 0 0)', {});
  assert.ok(Math.abs(contrast(black, white)-21) < .00001);
  assert.ok(Math.abs(contrast([1,0,0], [1,1,1])-3.9985) < .001);
  assert.throws(() => colour('unsupported(1)', {}), /Unsupported/);
  assert.throws(() => resolve('var(--missing)', {}), /Unresolved/);
});
