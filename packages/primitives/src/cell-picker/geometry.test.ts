import assert from 'node:assert/strict';
import test from 'node:test';
import { computeCellPickerGeometry } from './geometry.ts';

const panel = { width: 460, height: 320 };
const anchor = { left: 180, top: 700, right: 220, bottom: 744, width: 40, height: 44 };

test('cell picker keeps its full row region above a low anchor', () => {
	const result = computeCellPickerGeometry({
		viewport: { left: 0, top: 0, width: 1000, height: 800 },
		panel,
		anchor,
		edgeGap: 8,
		anchorGap: 5,
		maxWidth: 460,
		maxHeight: 520,
		prefer: 'above',
	});
	assert.deepEqual(result, { left: 180, top: 375, width: 460, maxHeight: 520, placement: 'above' });
});

test('short zoomed viewport returns a bounded scroll height and visual-viewport offsets', () => {
	const result = computeCellPickerGeometry({
		viewport: { left: 120, top: 240, width: 320, height: 180 },
		panel,
		point: { x: 430, y: 390 },
		edgeGap: 8,
		anchorGap: 5,
		maxWidth: 460,
		maxHeight: 520,
	});
	assert.equal(result.width, 304);
	assert.equal(result.maxHeight, 164);
	assert.equal(result.left, 128);
	assert.equal(result.top, 248);
	assert.equal(result.placement, 'clamped');
	assert.ok(result.top + result.maxHeight <= 412);
});

test('pointer and panel coordinates clamp independently at every viewport edge', () => {
	const result = computeCellPickerGeometry({
		viewport: { left: 0, top: 0, width: 390, height: 844 },
		panel: { width: 460, height: 240 },
		point: { x: 388, y: 12 },
		edgeGap: 8,
		anchorGap: 5,
		maxWidth: 460,
		maxHeight: 520,
	});
	assert.equal(result.left, 8);
	assert.equal(result.top, 17);
	assert.equal(result.width, 374);
	assert.equal(result.placement, 'below');
});

test('an explicit pointer origin takes precedence over a fallback trigger rect', () => {
	const result = computeCellPickerGeometry({
		viewport: { left: 0, top: 0, width: 390, height: 844 },
		panel: { width: 374, height: 520 },
		anchor: { left: 300, right: 324, top: 56, bottom: 80, width: 24, height: 24 },
		point: { x: 100, y: 200 },
		edgeGap: 8,
		anchorGap: 6,
		maxWidth: 460,
		maxHeight: 520,
	});
	assert.equal(result.top, 206);
	assert.equal(result.placement, 'below');
});

test('invalid dimensions fail closed to finite in-viewport geometry', () => {
	const result = computeCellPickerGeometry({
		viewport: { left: Number.NaN, top: Number.NaN, width: -1, height: -1 },
		panel: { width: Number.NaN, height: Number.POSITIVE_INFINITY },
		edgeGap: 8,
		anchorGap: 5,
		maxWidth: 460,
		maxHeight: 520,
	});
	assert.deepEqual(result, { left: 8, top: 8, width: 0, maxHeight: 0, placement: 'clamped' });
});
