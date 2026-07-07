import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createOrbie,
  createMockAdapter,
  route,
  assembleContext,
  promoteToCell,
  buildProvenance,
  stableHash,
} from '../dist/index.js';

const FIXED_AT = '2026-07-07T00:00:00.000Z';
const fixedClock = () => FIXED_AT;

test('route() — all three branches, deterministic', () => {
  assert.deepEqual(route({ kind: 'x' }), { tier: 'mechanical' });
  assert.deepEqual(route({ kind: 'x', sizeHint: 'small' }), { tier: 'mechanical' });
  assert.deepEqual(route({ kind: 'x', sizeHint: 'large' }), { tier: 'nuanced' });
  assert.deepEqual(route({ kind: 'x', needsFrontier: true }), { tier: 'frontier' });
  // needsFrontier wins over sizeHint
  assert.deepEqual(route({ kind: 'x', sizeHint: 'large', needsFrontier: true }), { tier: 'frontier' });
});

test('assembleContext() — normalizes missing fields to null / []', () => {
  const frame = assembleContext({ surface: 'notebook' });
  assert.equal(frame.surface, 'notebook');
  assert.equal(frame.project, null);
  assert.equal(frame.thread, null);
  assert.equal(frame.interaction, null);
  assert.equal(frame.selection, null);
  assert.deepEqual(frame.entities, []);

  const full = assembleContext({
    surface: 's',
    project: { id: 'p' },
    thread: { id: 't' },
    interaction: { id: 'i' },
    entities: [{ id: 'e1', kind: 'paper' }],
    selection: { from: 0 },
  });
  assert.deepEqual(full.project, { id: 'p' });
  assert.deepEqual(full.entities, [{ id: 'e1', kind: 'paper' }]);
  assert.deepEqual(full.selection, { from: 0 });
});

test('complete() — returns text + well-formed Provenance with injected fixed clock', async () => {
  const adapter = createMockAdapter({ text: 'hello world', model: 'mock-local', version: '1.2' });
  const orbie = createOrbie(adapter, { clock: fixedClock });

  const res = await orbie.complete({ user: 'ping' });
  assert.equal(res.text, 'hello world');

  const p = res.provenance;
  assert.equal(p.actor, 'model');
  assert.equal(p.model, 'mock-local');
  assert.equal(p.version, '1.2');
  assert.equal(p.tier, 'mechanical');
  assert.equal(p.at, FIXED_AT); // deterministic clock
  assert.equal(p.promptHash, stableHash('ping')); // deterministic hash
  assert.deepEqual(p.retrievedContextHashes, []);
  assert.deepEqual(p.groundedRefs, []);
});

test('complete() — tier resolves from opts.tier, then task, else mechanical', async () => {
  const orbie = createOrbie(createMockAdapter(), { clock: fixedClock });
  assert.equal((await orbie.complete({ user: 'a' })).provenance.tier, 'mechanical');
  assert.equal((await orbie.complete({ user: 'a' }, { task: { kind: 'k', sizeHint: 'large' } })).provenance.tier, 'nuanced');
  assert.equal((await orbie.complete({ user: 'a' }, { tier: 'frontier', task: { kind: 'k' } })).provenance.tier, 'frontier');
});

test('complete() — contextHashes flow onto provenance', async () => {
  const orbie = createOrbie(createMockAdapter(), { clock: fixedClock });
  const res = await orbie.complete({ user: 'a' }, { contextHashes: ['h1', 'h2'] });
  assert.deepEqual(res.provenance.retrievedContextHashes, ['h1', 'h2']);
});

test('grounded-or-silent — unresolved refs dropped, resolved kept', async () => {
  const refs = [
    { id: 'real-1', kind: 'paper' },
    { id: 'phantom-1', kind: 'paper' },
  ];
  const adapter = createMockAdapter({ refs });
  const orbie = createOrbie(adapter, {
    clock: fixedClock,
    resolveArtifact: (ref) => ref.id.startsWith('real'),
  });
  const res = await orbie.complete({ user: 'cite something' });
  assert.deepEqual(res.provenance.groundedRefs, [{ id: 'real-1', kind: 'paper' }]);

  // default resolver drops everything (silence over fabrication)
  const silent = createOrbie(createMockAdapter({ refs }), { clock: fixedClock });
  const silentRes = await silent.complete({ user: 'cite something' });
  assert.deepEqual(silentRes.provenance.groundedRefs, []);
});

test('buildProvenance() — direct, grounded-or-silent default', () => {
  const p = buildProvenance({
    prompt: 'q',
    result: { text: 't', model: 'm', version: 'v', refs: [{ id: 'x', kind: 'k' }] },
    tier: 'mechanical',
    at: FIXED_AT,
  });
  assert.equal(p.promptHash, stableHash('q'));
  assert.deepEqual(p.groundedRefs, []); // no resolver → silent
  assert.equal(p.at, FIXED_AT);
});

test('stableHash() — deterministic and dependency-free', () => {
  assert.equal(stableHash('ping'), stableHash('ping'));
  assert.notEqual(stableHash('ping'), stableHash('pong'));
  assert.match(stableHash('ping'), /^[0-9a-f]{8}$/);
});

test('promoteToCell() — shape carries provenance + promptText', async () => {
  const orbie = createOrbie(createMockAdapter({ text: 'answer' }), { clock: fixedClock });
  const response = await orbie.complete({ user: 'the question' });
  const cell = promoteToCell({ prompt: { user: 'the question' }, response });

  assert.equal(cell.kind, 'ai');
  assert.equal(cell.source, 'ai_suggestion');
  assert.equal(cell.content, 'answer');
  assert.equal(cell.promptText, 'the question');
  assert.deepEqual(cell.provenance, response.provenance);
});

test('headless smoke — whole flow runs with only createMockAdapter (no DOM, no node builtins)', async () => {
  const orbie = createOrbie(createMockAdapter({ text: 'grounded answer' }), { clock: fixedClock });

  const context = orbie.assembleContext({ surface: 'notebook', entities: [{ id: 'e', kind: 'paper' }] });
  const choice = orbie.route({ kind: 'summarize', sizeHint: 'large' });
  assert.equal(choice.tier, 'nuanced');

  const response = await orbie.complete({ user: 'summarize', context }, { task: { kind: 'summarize', sizeHint: 'large' } });
  assert.equal(response.text, 'grounded answer');
  assert.equal(response.provenance.tier, 'nuanced');

  const cell = orbie.promoteToCell({ prompt: { user: 'summarize' }, response });
  assert.equal(cell.kind, 'ai');
  assert.equal(cell.content, 'grounded answer');
});
