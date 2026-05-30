import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
	formatIcuSubset,
	resolve,
	StatusCodeNotFoundError,
} from '../dist/index.js';

describe('formatIcuSubset', () => {
	it('interpolates simple variables', () => {
		assert.equal(formatIcuSubset('Hello {name}.', { name: 'Series A' }), 'Hello Series A.');
	});

	it('interpolates plural branches', () => {
		assert.equal(
			formatIcuSubset('{n, plural, one {# compound} other {# compounds}} in {library}.', {
				n: 3,
				library: 'Series A',
			}),
			'3 compounds in Series A.',
		);
		assert.equal(
			formatIcuSubset('{n, plural, one {# compound} other {# compounds}} in {library}.', {
				n: 1,
				library: 'Series A',
			}),
			'1 compound in Series A.',
		);
	});
});

describe('resolve', () => {
	it('resolves duplicate_smiles with plural and variable interpolation', () => {
		const result = resolve('library.ingest.duplicate_smiles', {
			n: 3,
			library: 'Series A',
		});

		assert.equal(result.code, 'library.ingest.duplicate_smiles');
		assert.equal(result.severity, 'error');
		assert.match(result.title, /3 compounds/);
		assert.match(result.title, /Series A/);
		assert.equal(result.detail, 'Deduplicated on canonical SMILES.');
	});

	it('resolves a success code with success severity', () => {
		const result = resolve('etl.intake.job_complete', {
			project: 'Magpie',
			rows: 42,
		});

		assert.equal(result.severity, 'success');
		assert.match(result.title, /Magpie/);
		assert.match(result.detail, /42 rows/);
	});

	it('throws StatusCodeNotFoundError for unknown codes', () => {
		assert.throws(
			() => resolve('not.a.real.code'),
			(error) => {
				assert.ok(error instanceof StatusCodeNotFoundError);
				assert.equal(error.code, 'not.a.real.code');
				return true;
			},
		);
	});
});
