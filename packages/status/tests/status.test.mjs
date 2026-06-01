// @scilence/status — unit tests
//
// Plain ESM (no TS) so we can run via `node --test` without pulling
// @types/node into the workspace. Tests target the compiled dist/
// artifact produced by `tsc -p tsconfig.json`.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
	resolve,
	StatusCodeNotFoundError,
	format,
	STATUS_REGISTRY,
} from '../dist/index.js';

test('library.ingest.duplicate_smiles: plural with n=3 + library yields error severity + interpolated title', () => {
	const r = resolve('library.ingest.duplicate_smiles', { n: 3, library: 'Series A' });
	assert.equal(r.code, 'library.ingest.duplicate_smiles');
	assert.equal(r.severity, 'error');
	assert.equal(r.title, '3 duplicates in Series A');
	assert.equal(r.detail, '3 rows were flagged as duplicate SMILES in Series A.');
});

test('library.ingest.duplicate_smiles: plural with n=1 selects the singular (one) branch', () => {
	const r = resolve('library.ingest.duplicate_smiles', { n: 1, library: 'Series A' });
	assert.equal(r.severity, 'error');
	assert.equal(r.title, '1 duplicate in Series A');
	assert.equal(r.detail, '1 row was flagged as duplicate SMILES in Series A.');
});

test('etl.intake.job_complete: success code resolves with simple {var} interpolation', () => {
	const r = resolve('etl.intake.job_complete', { jobId: 'job-42', library: 'Series A' });
	assert.equal(r.code, 'etl.intake.job_complete');
	assert.equal(r.severity, 'success');
	assert.equal(r.title, 'Intake job complete');
	assert.equal(r.detail, 'Intake job job-42 finished for Series A.');
});

test('resolve(): unknown code throws StatusCodeNotFoundError carrying the offending code', () => {
	let caught;
	try {
		resolve('not.a.real.code');
	} catch (err) {
		caught = err;
	}
	assert.ok(caught instanceof StatusCodeNotFoundError, 'expected StatusCodeNotFoundError');
	assert.equal(caught.code, 'not.a.real.code');
	assert.equal(caught.name, 'StatusCodeNotFoundError');
});

test('seed registry has all five expected codes with correct severities', () => {
	const expected = {
		'etl.intake.job_complete': 'success',
		'library.ingest.duplicate_smiles': 'error',
		'reactivity.premise_changed': 'warning',
		'notification.center.mark_all_read': 'info',
		'etl.intake.automap_failed': 'error',
	};
	for (const [code, severity] of Object.entries(expected)) {
		const entry = STATUS_REGISTRY[code];
		assert.ok(entry, `registry missing ${code}`);
		assert.equal(entry.severity, severity, `${code} severity mismatch`);
	}
	// And the formatter handles a bare {var} template directly.
	assert.equal(format('hello {who}', { who: 'world' }), 'hello world');
});
