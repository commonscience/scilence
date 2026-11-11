import assert from 'node:assert/strict';
import test from 'node:test';
import { createPlacementHandle, placementHandleLabel } from './index.ts';

class FakeClassList {
	readonly values = new Set<string>();
	add(...names: string[]) { names.forEach(name => this.values.add(name)); }
}

class FakeElement {
	type = '';
	className = '';
	disabled = false;
	removed = false;
	innerHTML = '';
	readonly dataset: Record<string, string> = {};
	readonly classList = new FakeClassList();
	readonly attributes = new Map<string, string>();
	readonly children: FakeElement[] = [];
	readonly listeners = new Map<string, Set<(event: MouseEvent) => void>>();
	setAttribute(name: string, value: string) { this.attributes.set(name, value); }
	getAttribute(name: string) { return this.attributes.get(name) ?? null; }
	append(...nodes: FakeElement[]) { this.children.push(...nodes); }
	addEventListener(type: string, listener: (event: MouseEvent) => void) {
		const listeners = this.listeners.get(type) ?? new Set();
		listeners.add(listener); this.listeners.set(type, listeners);
	}
	removeEventListener(type: string, listener: (event: MouseEvent) => void) { this.listeners.get(type)?.delete(listener); }
	click() { if (!this.disabled) for (const listener of this.listeners.get('click') ?? []) listener({ type: 'click' } as MouseEvent); }
	remove() { this.removed = true; }
}

const fakeDocument = {
	createElement: () => new FakeElement(),
	createElementNS: () => new FakeElement(),
} as unknown as Document;

test('placement handle is a native named sibling action with one activation path', () => {
	let activations = 0;
	const handle = createPlacementHandle({ document: fakeDocument, itemLabel: 'Text', onActivate: () => activations++ });
	const element = handle.element as unknown as FakeElement;
	assert.equal(element.type, 'button');
	assert.equal(element.className, 's-placement-handle');
	assert.equal(element.dataset.placementHandle, '');
	assert.equal(element.getAttribute('aria-label'), 'Place Text\u2026');
	element.click();
	assert.equal(activations, 1);
	handle.setDisabled(true);
	element.click();
	assert.equal(activations, 1);
	handle.setItemLabel('Data');
	assert.equal(element.getAttribute('aria-label'), 'Place Data\u2026');
	handle.destroy();
	assert.equal(element.removed, true);
});

test('placement action names are stable and trim consumer labels', () => {
	assert.equal(placementHandleLabel(' Portal '), 'Place Portal\u2026');
});
