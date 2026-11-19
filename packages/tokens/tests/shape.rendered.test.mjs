/* Purpose: measure DS-SHAPE-1 tokens with the browser's native CSS engine.
 * Input: local canonical CSS; output: assertions at density/padding scale 1.
 * Opt-in browser test, like the existing colour render suite. Does not load
 * product data, call services, or substitute arithmetic for CSS resolution. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Snug roles and control height resolve in native CSS at density 1', {skip: process.env.DS_SHAPE_RENDER !== '1'}, async () => {
  const {default: puppeteer} = await import('puppeteer');
  const browser = await puppeteer.launch({headless:true});
  try {
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', request => {
      const name = new URL(request.url()).pathname.slice(1);
      if (name.endsWith('.css') && /^[\w.-]+$/.test(name)) return request.respond({contentType:'text/css',body:readFileSync(new URL(`../src/${name}`,import.meta.url),'utf8')});
      return request.respond({contentType:'text/html',body:'<!doctype html><link rel="stylesheet" href="/index.css"><div id="probe"></div>'});
    });
    await page.goto('https://shape.test/', {waitUntil:'networkidle0'});
    const expected = {'page-margin':34,gutter:21,'section-gap':21,'subsection-gap':13,'sibling-gap':8,'child-gap':5,inset:13,'rule-gap':13,'control-height':28};
    const actual = await page.evaluate(expected => {
      document.documentElement.style.setProperty('--s-space-density','1');
      document.documentElement.style.setProperty('--s-padding-scale','1');
      const probe=document.getElementById('probe');
      return Object.fromEntries(Object.keys(expected).map(role => {
        probe.style.width=`var(--s-${role})`;
        return [role,parseFloat(getComputedStyle(probe).width)];
      }));
    },expected);
    assert.deepEqual(actual,expected);
  } finally {await browser.close();}
});
