import { createButton, type ButtonHandle } from '../Button/index.js';
import { createIconButton, type IconButtonHandle } from '../IconButton/index.js';
import type { HeaderSlot, FooterSlot, ModalChromeHandle, ModalChromeOptions, ModalChromeSlots, ModalFeedbackSlot } from './types.js';

let chromeSequence = 0;
type Control = ButtonHandle | IconButtonHandle;
const dataAttributes = (attributes: Readonly<Record<string, string>> | undefined): Record<string, string> =>
	Object.fromEntries(Object.entries(attributes ?? {}).filter(([key]) => key.startsWith('data-')));
const toneLabels: Record<ModalFeedbackSlot['tone'], string> = {
	info: 'Information', success: 'Success', warning: 'Attention', danger: 'Problem',
};

function icon(doc: Document, kind: 'close' | ModalFeedbackSlot['tone']): SVGElement {
	const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
	svg.setAttribute('stroke-width', '1.7'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
	const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d', kind === 'close' ? 'M6 6l12 12M18 6L6 18'
		: kind === 'success' ? 'M5 12l4 4L19 6'
		: kind === 'warning' ? 'M12 3L2 21h20L12 3zM12 9v5M12 17h.01'
		: kind === 'danger' ? 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 7v6M12 17h.01'
		: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 11v6M12 7h.01');
	svg.append(path); return svg;
}

/** Modal's own header/stepper, feedback and action groups, reusable by existing
 * dialog hosts. No body lifecycle, navigation policy, persistence or implicit
 * completion lives here. Load Modal.css, which includes its Button/IconButton atoms. */
export function createModalChrome(options: ModalChromeOptions): ModalChromeHandle {
	const doc = options.document ?? document;
	const id = ++chromeSequence;
	let disposed = false;
	let feedbackSignature = '';
	const headerControls: Control[] = [];
	const footerControls: Control[] = [];
	const region = (name: string) => {
		const element = doc.createElement('div');
		element.className = `s-modal__${name}`; element.dataset.modalRegion = name; element.hidden = true;
		return element;
	};
	const headerElement = region('header');
	const feedbackElement = region('feedback');
	const footerElement = region('footer');
	const titleId = `s-modal-title-${id}`;
	const subtitleId = `s-modal-subtitle-${id}`;
	const clear = (controls: Control[]) => { for (const control of controls) control.destroy(); controls.length = 0; };
	const focusKey = (element: HTMLElement) => element.contains(doc.activeElement)
		? (doc.activeElement as HTMLElement).dataset.modalFocusKey ?? null : null;
	const restoreFocus = (element: HTMLElement, key: string | null) => {
		if (!key) return;
		Array.from(element.querySelectorAll<HTMLElement>('[data-modal-focus-key]'))
			.find((candidate) => candidate.dataset.modalFocusKey === key && !candidate.hasAttribute('disabled'))?.focus({ preventScroll: true });
	};
	function header(slot: HeaderSlot | null | undefined): void {
		const focused = focusKey(headerElement);
		clear(headerControls); headerElement.replaceChildren(); headerElement.hidden = !slot;
		if (!slot) return;
		const row = doc.createElement('div'); row.className = 's-modal__header-row';
		const inner = doc.createElement('div'); inner.className = 's-modal__header-inner';
		const title = doc.createElement('h2'); title.className = 's-modal__title'; title.id = titleId; title.textContent = slot.title;
		const subtitle = doc.createElement('p'); subtitle.className = 's-modal__subtitle'; subtitle.id = subtitleId;
		subtitle.textContent = slot.subtitle ?? ''; subtitle.hidden = !slot.subtitle;
		inner.append(title, subtitle); row.append(inner);
		const actions = doc.createElement('div'); actions.className = 's-modal__header-actions';
		for (const action of slot.actions ?? []) {
			const common = { label: action.label, disabled: action.disabled, className: 's-modal__header-action',
				attributes: { 'data-action-id': action.id, 'data-modal-focus-key': `header:${action.id}` }, onClick: action.onClick };
			const control = action.icon ? createIconButton({ ...common, icon: action.icon, variants: { tone: 'ghost', size: 'md' } })
				: createButton({ ...common, variants: { variant: 'ghost', size: 'sm' } });
			headerControls.push(control); actions.append(control.element);
		}
		const close = createIconButton({ label: 'Close', icon: icon(doc, 'close'), variants: { tone: 'ghost', size: 'lg' },
			className: 's-modal__close', attributes: { 'data-modal-focus-key': 'close' },
			onClick: () => { if (!disposed) options.onCloseRequest('close-button'); } });
		close.element.hidden = slot.close === false || slot.close === 'esc-only';
		headerControls.push(close); row.append(actions, close.element); headerElement.append(row);
		if (slot.stepper) {
			const stepper = slot.stepper;
			const nav = doc.createElement('nav'); nav.className = 's-modal__stepper'; nav.setAttribute('aria-label', stepper.label ?? 'Steps');
			const list = doc.createElement('ol'); list.className = 's-modal__step-list';
			for (const [index, step] of stepper.items.entries()) {
				const item = doc.createElement('li'); item.className = 's-modal__step';
				item.dataset.state = step.state ?? 'pending'; item.dataset.current = String(step.id === stepper.activeId);
				const stateLabel = step.state === 'complete' ? ', complete' : step.state === 'error' ? ', needs attention' : '';
				const control = createButton({ label: `${index + 1} ${step.label}`, disabled: step.disabled,
					variants: { variant: 'ghost', size: 'sm' }, className: 's-modal__step-action',
					attributes: { ...dataAttributes(step.attributes), 'data-step-id': step.id, 'data-modal-focus-key': `step:${step.id}`, 'aria-label': `${index + 1}. ${step.label}${stateLabel}` },
					onClick: () => { if (!disposed) stepper.onSelect(step.id); } });
				if (step.id === stepper.activeId) control.element.setAttribute('aria-current', 'step');
				headerControls.push(control); item.append(control.element); list.append(item);
			}
			nav.append(list); headerElement.append(nav);
		}
		restoreFocus(headerElement, focused);
	}
	function feedback(slot: ModalFeedbackSlot | null | undefined): void {
		const signature = JSON.stringify(slot ?? null);
		if (signature === feedbackSignature) return;
		feedbackSignature = signature;
		feedbackElement.hidden = !slot;
		feedbackElement.replaceChildren();
		feedbackElement.removeAttribute('role'); feedbackElement.removeAttribute('aria-live');
		if (!slot) return;
		const announcement = slot.announcement ?? 'polite';
		feedbackElement.dataset.tone = slot.tone;
		feedbackElement.setAttribute('aria-live', announcement); feedbackElement.setAttribute('aria-atomic', 'true');
		if (announcement !== 'off') feedbackElement.setAttribute('role', announcement === 'assertive' ? 'alert' : 'status');
		const graphic = icon(doc, slot.tone); graphic.classList.add('s-modal__feedback-icon');
		const content = doc.createElement('div'); content.className = 's-modal__feedback-content';
		const title = doc.createElement('strong'); title.className = 's-modal__feedback-title'; title.textContent = slot.title ?? toneLabels[slot.tone];
		const message = doc.createElement('p'); message.className = 's-modal__feedback-message'; message.textContent = slot.message;
		content.append(title, message); feedbackElement.append(graphic, content);
	}
	function footer(slot: FooterSlot | null | undefined): void {
		const focused = focusKey(footerElement);
		clear(footerControls); footerElement.replaceChildren(); footerElement.hidden = !slot;
		if (!slot) return;
		for (const group of ['start', 'end'] as const) {
			const actions = slot.actions.filter((action) => (action.group ?? 'end') === group);
			if (!actions.length) continue;
			const groupElement = doc.createElement('div'); groupElement.className = `s-modal__action-group s-modal__action-group--${group}`;
			for (const action of actions) {
				const control = createButton({ label: action.label, disabled: action.disabled, loading: action.loading, awaitClick: true,
					variants: { variant: action.variant === 'cancel' ? 'ghost' : action.variant === 'danger' ? 'danger'
						: slot.primaryActionId === action.id ? 'primary' : action.variant, size: 'sm' },
					className: `s-modal__btn s-modal__btn--${action.variant}${slot.primaryActionId === action.id ? ' s-modal__btn--is-primary' : ''}`,
					attributes: { ...dataAttributes(action.attributes), 'data-action-id': action.id, 'data-modal-focus-key': `footer:${action.id}`, 'aria-label': action.label },
					onClick: async () => {
						if (disposed) return;
						try { await action.onClick(); if (!disposed && action.closeOnSuccess) options.onCloseRequest('commit-success'); }
						catch { /* Domain owner supplies error feedback; rejection never implies success. */ }
					} });
				footerControls.push(control); groupElement.append(control.element);
			}
			footerElement.append(groupElement);
		}
		restoreFocus(footerElement, focused);
	}
	function update(slots: ModalChromeSlots): void {
		if (disposed) return;
		if ('header' in slots) header(slots.header);
		if ('feedback' in slots) feedback(slots.feedback);
		if ('footer' in slots) footer(slots.footer);
	}
	update(options);
	return { headerElement, feedbackElement, footerElement, titleId, subtitleId, update,
		destroy() { if (disposed) return; disposed = true; clear(headerControls); clear(footerControls);
			headerElement.remove(); feedbackElement.remove(); footerElement.remove(); } };
}
