/**
 * @scilence/primitives — inspector-stack barrel.
 *
 * Reusable ordered list of collapsible right-rail inspector sections, with
 * pointer drag-to-reorder, full keyboard reorder + ARIA live announcement,
 * and per-surface localStorage persistence of order + collapsed state.
 *
 * Generalized from `guide/shell/js/surfaces/notebook/notebook-inspector-widget.js`
 * + `notebook-inspector-stack.js`. See
 * `research/flywheel/handoffs/briefs/library-inspector-section-stack.md`.
 */

export { createInspectorStack } from './inspector-stack.js';
export type {
	InspectorSectionDescriptor,
	InspectorSectionRender,
	InspectorStackHandle,
	InspectorStackOptions,
	InspectorStackStorage,
} from './types.js';
