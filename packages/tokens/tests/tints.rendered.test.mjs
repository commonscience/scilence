// Opt-in only; no server/port. The browser routes CSS directly from this checkout.
// DS_COL_RENDER=1 nice -n 10 node --test packages/tokens/tests/tints.rendered.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { src } from './colour-math.mjs';

const repo = fileURLToPath(new URL('../../../', src));
const captureDir = '/tmp/claude-501/ds-col-1-captures';
const pin = '159760748114849e22f15b395de6cf733761a389';
function fixture() {
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/tokens/index.css">
<style>
body { background:var(--s-color-bg-card);color:var(--s-color-fg-primary);font-family:var(--s-font-sans);padding:var(--s-space-5);font-weight:var(--s-font-weight-regular) }
main { display:grid;gap:var(--s-space-3) } nav { display:flex;flex-wrap:wrap;gap:var(--s-space-2) }
button { font:inherit;font-weight:var(--s-font-weight-medium);padding:var(--s-space-2);color:inherit;background:var(--s-color-bg-card);border:var(--s-border-thin) solid var(--s-color-border-subtle) }
.sample { padding:var(--s-space-3);--c:var(--s-color-status-info);background:color-mix(in srgb,var(--c) var(--s-tint-avatar-bg-rest, 0%),var(--s-color-bg-card));border:var(--s-border-thin) solid color-mix(in srgb,var(--c) var(--s-tint-avatar-border-rest, 0%),var(--s-color-bg-card)) }
.sample.alive { background:color-mix(in srgb,var(--c) var(--s-tint-avatar-bg-alive, 0%),var(--s-color-bg-card)) }
#ink { color:var(--s-ink-rest,var(--s-color-fg-muted)) } .disc { display:inline-block;padding:var(--s-space-2);font-weight:var(--s-font-weight-medium);color:var(--s-el-letter,var(--s-color-bg-card));background:var(--element) } #c { color:var(--s-el-c-letter,var(--s-color-bg-card)) }
</style></head><body><main><h1>Colour tokens</h1><p>DS-COL-1 token check. Source: pinned Scilence unit, 6 November 2026.</p>
<nav><button id="theme">Change theme</button><button id="scheme">Change element scheme</button><button id="alive">Show alive values</button></nav>
<p id="state" aria-live="polite"></p><p id="ink">Brandscale ink and paper</p>
<div id="avatar" class="sample">Avatar tint values</div>
<p id="elements">${['n','o','cl','c'].map(x=>`<span class="disc" id="${x}" style="--element:var(--s-el-${x},var(--s-color-status-info))">${x === 'cl' ? 'Cl' : x.toUpperCase()}</span>`).join(' ')}</p>
</main><script>
function render(){const p=new URLSearchParams(location.search);document.documentElement.dataset.theme=p.get('theme')||'light';document.documentElement.dataset.scheme=p.get('scheme')||'familiar';document.getElementById('avatar').classList.toggle('alive',p.get('alive')==='1');document.getElementById('state').textContent=[document.documentElement.dataset.theme,document.documentElement.dataset.scheme,p.get('alive')==='1'?'Alive values':'Rest values'].join(' / ')}
function set(key,value){const u=new URL(location.href);u.searchParams.set(key,value);history.pushState(null,'',u);render()}
document.getElementById('theme').onclick=()=>set('theme',document.documentElement.dataset.theme==='light'?'dark':'light');
document.getElementById('scheme').onclick=()=>set('scheme',document.documentElement.dataset.scheme==='familiar'?'colour-blind-safe':'familiar');
document.getElementById('alive').onclick=()=>set('alive',document.getElementById('avatar').classList.contains('alive')?'0':'1');
addEventListener('popstate',render);render();
</script></body></html>`;
}

test('rendered theme/scheme/reload behaviour and before/after captures', { skip: process.env.DS_COL_RENDER !== '1' }, async () => {
  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  mkdirSync(captureDir, {recursive:true});
  try {
    for (const phase of ['before','after']) {
      const context = await browser.newContext();
      await context.route('https://ds-col-1.test/**', async route => {
        const path = new URL(route.request().url()).pathname;
        if (!path.startsWith('/tokens/')) return route.fulfill({contentType:'text/html',body:fixture()});
        const name = path.slice('/tokens/'.length);
        if (!/^_[\w-]+\.css$|^index\.css$/.test(name)) return route.abort();
        // Baseline bytes stay in memory; no checkout, copied tree or pin change.
        const body = phase === 'before'
          ? execFileSync('git', ['show', `${pin}:packages/tokens/src/${name}`], {cwd:repo,encoding:'utf8'})
          : readFileSync(new URL(name,src),'utf8');
        return route.fulfill({contentType:'text/css',body});
      });
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      for (const width of [1440,390]) for (const theme of ['light','dark']) {
        await page.setViewportSize({width,height:1000});
        await page.goto(`https://ds-col-1.test/?theme=${theme}&scheme=familiar`);
        await page.screenshot({path:`${captureDir}/${phase}-${width}-${theme}.png`,fullPage:true});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
      }
      if (phase === 'after') {
        await page.goto('https://ds-col-1.test/?theme=light&scheme=familiar');
        const ink = () => page.locator('#ink').evaluate(e=>getComputedStyle(e).color);
        const element = () => page.locator('#n').evaluate(e=>getComputedStyle(e).backgroundColor);
        const fill = () => page.locator('#avatar').evaluate(e=>getComputedStyle(e).backgroundColor);
        const beforeInk = await ink(); await page.locator('#theme').click();
        assert.notEqual(await ink(), beforeInk); assert.match(await page.locator('#state').innerText(), /dark/);
        const familiar = await element(); await page.locator('#scheme').click();
        assert.notEqual(await element(), familiar);
        const rest = await fill(); await page.locator('#alive').click(); assert.notEqual(await fill(),rest);
        const saved = {ink:await ink(),element:await element(),fill:await fill(),url:page.url()};
        await page.reload();
        assert.deepEqual({ink:await ink(),element:await element(),fill:await fill(),url:page.url()},saved);
        await page.locator('#scheme').click(); assert.equal(await element(),familiar);
        // Native CSS must agree with the independent node colour calculations.
        const { tokens, tokenColour } = await import('./colour-math.mjs');
        for (const theme of ['light','dark']) for (const scheme of ['familiar','colour-blind-safe']) {
          await page.goto(`https://ds-col-1.test/?theme=${theme}&scheme=${scheme}`);
          const v = tokens(theme,scheme);
          for (const name of ['--s-ink-rest','--s-ink-rule','--s-el-n','--s-el-o','--s-el-cl','--s-el-c','--s-status-glyph-info','--s-status-glyph-warning']) {
            const actual = await page.evaluate(name=>{
              const e=document.createElement('span');e.style.color='var('+name+')';document.body.append(e);
              const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
              const ctx=canvas.getContext('2d');ctx.fillStyle=getComputedStyle(e).color;ctx.fillRect(0,0,1,1);e.remove();return [...ctx.getImageData(0,0,1,1).data].slice(0,3);
            },name);
            const expected = tokenColour(name,v).map(x=>x*255);
            assert.ok(actual.every((x,i)=>Math.abs(x-expected[i])<=3),`${theme} ${scheme} ${name}: ${actual} vs ${expected}`);
          }
        }
      }
      assert.deepEqual(errors,[]); await context.close();
    }
  } finally { await browser.close(); }
});
