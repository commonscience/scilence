// Small, fail-closed evaluator for the token syntax used by DS-COL-1.
// CSS is read from this checkout, never node_modules or a host application's copy.
import { readFileSync } from 'node:fs';
export const src = new URL('../src/', import.meta.url);
export const read = name => readFileSync(new URL(name, src), 'utf8');
export function blocks(css) {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map(([, selector, body]) => ({ selector: selector.trim(), declarations:
      [...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, n, v]) => [n, v.trim()]) }));
}
export function tokens(theme, scheme = 'familiar', hue = 180) {
  const values = {};
  for (const file of ['_palettes.css', '_commons-public.css', '_status-colors.css', '_themes-light.css', '_themes-dark.css', '_tints.css', '_typography.css']) {
    for (const block of blocks(read(file))) {
      const s = block.selector;
      // These foundation files use root defaults followed by explicit dark overrides.
      if (s.includes('data-density')) continue;
      if (s.includes('data-scheme')) {
        if (scheme === 'colour-blind-safe' !== s.includes("data-scheme='colour-blind-safe'")) continue;
      } else if (s.includes('dark') && !s.includes(':root,') && !s.endsWith(':root') && theme !== 'dark') continue;
      Object.assign(values, Object.fromEntries(block.declarations));
    }
  }
  values['--brand-hue'] = String(hue);
  return values;
}
export function resolve(value, values, trail = []) {
  return value.replace(/var\((--[\w-]+)\)/g, (_, name) => {
    if (!(name in values) || trail.includes(name)) throw new Error(`Unresolved/cyclic ${[...trail, name].join(' -> ')}`);
    return resolve(values[name], values, [...trail, name]);
  });
}
function split(s, delimiter = ',') {
  let depth = 0, start = 0; const parts = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    if (s[i] === ')') depth--;
    if (depth === 0 && (delimiter === ' ' ? /\s/.test(s[i]) : s[i] === delimiter)) {
      if (s.slice(start, i).trim()) parts.push(s.slice(start, i).trim());
      start = i + 1;
    }
  }
  if (s.slice(start).trim()) parts.push(s.slice(start).trim());
  return parts;
}
function number(s, channels = {}) {
  s = s.replace(/\b(l|c|h)\b/g, x => channels[x] ?? x).replace(/calc\(/g, '(');
  if (!/^[\d.eE+*/()\s%-]+$/.test(s)) throw new Error(`Unsupported arithmetic ${s}`);
  const percent = s.endsWith('%');
  const value = Function(`'use strict'; return (${s.replace(/%/g, '')});`)();
  if (!Number.isFinite(value)) throw new Error(`Non-finite ${s}`);
  return value / (percent ? 100 : 1);
}
export const clamp = x => Math.max(0, Math.min(1, x));
export const linear = x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
const encoded = x => x <= .0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - .055;
export function fromLch([l, c, h]) {
  const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180);
  const L = (l + .3963377774 * a + .2158037573 * b) ** 3;
  const M = (l - .1055613458 * a - .0638541728 * b) ** 3;
  const S = (l - .0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * L - 3.3077115913 * M + .2309699292 * S,
    -1.2684380046 * L + 2.6097574011 * M - .3413193965 * S,
    -.0041960863 * L - .7034186147 * M + 1.707614701 * S].map(x => clamp(encoded(x)));
}
export function lab(rgb) {
  const [r, g, b] = rgb.map(linear);
  const l = Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b);
  const m = Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b);
  const s = Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);
  return [.2104542553*l+.793617785*m-.0040720468*s,
    1.9779984951*l-2.428592205*m+.4505937099*s,
    .0259040371*l+.7827717662*m-.808675766*s];
}
export function colour(expression, values) {
  const v = resolve(expression, values);
  if (v.startsWith('color-mix(')) {
    const [space, a, b] = split(v.slice(10, -1));
    if (space !== 'in srgb') throw new Error(`Unsupported mixing ${space}`);
    const parts = split(a, ' '), weight = number(parts.pop());
    const A = colour(parts.join(' '), values), B = colour(b, values);
    return A.map((x, i) => x * weight + B[i] * (1 - weight));
  }
  if (!v.startsWith('oklch(')) throw new Error(`Unsupported colour ${v}`);
  const parts = split(v.slice(6, -1), ' ');
  let channels = {};
  if (parts[0] === 'from') {
    const base = lab(colour(parts[1], values));
    channels = { l: base[0], c: Math.hypot(base[1], base[2]), h: (Math.atan2(base[2], base[1])*180/Math.PI+360)%360 };
    parts.splice(0, 2);
  }
  if (parts.length !== 3) throw new Error(`Unsupported channels ${v}`);
  return fromLch(parts.map(x => number(x, channels)));
}
export const tokenColour = (name, values) => colour(`var(${name})`, values);
const luminance = rgb => rgb.map(linear).reduce((s, x, i) => s + x * [.2126, .7152, .0722][i], 0);
export function contrast(a, b) {
  const A = luminance(a), B = luminance(b);
  return (Math.max(A, B) + .05) / (Math.min(A, B) + .05);
}
// Machado, Oliveira & Fernandes (2009), full severity, linear RGB.
// Matrices also used by the founder-reviewed colour-alive experiment.
export const simulations = {
  protan: [[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
  deutan: [[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.01182,.04294,.968881]],
  tritan: [[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.3039]],
};
export function simulatedLab(rgb, simulation) {
  const input = rgb.map(linear);
  return lab(simulations[simulation].map(row => encoded(clamp(row.reduce((s, x, i) => s + x * input[i], 0)))));
}
export function pairs(names) { return names.flatMap((a, i) => names.slice(i + 1).map(b => [a, b])); }
