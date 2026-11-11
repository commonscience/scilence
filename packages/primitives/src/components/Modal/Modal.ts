/**
 * @scilence/primitives — Modal substrate (vanilla TS).
 *
 * Native `<dialog>` based. Owns:
 *   - Slot DOM scaffold (breadcrumb / header / toolbar / sidebar / body /
 *     status-bar / footer)
 *   - Open / close lifecycle + reason routing
 *   - Body cleanup invocation on close
 *   - Scrim-click + ESC + close-button → close routing
 *
 * Does NOT own:
 *   - Plugin contract validation (GUIDE wiring layer, separate)
 *   - Commit gate integration (GUIDE wiring layer)
 *   - popout multi-monitor mechanics (separate brief)
 *   - Bumper-car multi-modal nav animation (separate brief)
 *
 * Spec: research/specs/GUIDE_MODAL_CONTRACT.md (sibling of
 * GUIDE_PLUGIN_CONTRACT.md). v1 design locked 2026-06-07.
 */

import { createModalChrome } from './chrome.js';
import { mergeModalVariants } from './resolve-modal-tokens.js';
import type {
	BreadcrumbSlot,
	Cleanup,
	CloseReason,
	FooterSlot,
	HeaderSlot,
	ModalConfig,
	ModalChromeHandle,
	ModalHandle,
	ModalSlots,
	ModalVariants,
	SidebarSlot,
	StatusBarSlot,
	ToolbarSlot,
} from './types.js';

const PHONE_SIDEBAR_MEDIA_QUERY = '(max-width: 767px)';

const modalHandles = new WeakMap<HTMLElement, ModalHandle>();

/** Return only a native Modal owned by this module; foreign hosts use createModalChrome. */
export function getModalHandle(element: HTMLElement): ModalHandle | null {
	return modalHandles.get(element) ?? null;
}

export class Modal implements ModalHandle {
	readonly element: HTMLDialogElement;
	private variants: ModalVariants;
	private modifiers: Set<string>;
	private slots: ModalSlots;
	private lifecycle: ModalConfig['lifecycle'];

	private readonly surfaceEl: HTMLElement;
	private readonly breadcrumbEl: HTMLElement;
	private readonly headerEl: HTMLElement;
	private readonly chrome: ModalChromeHandle;
	private readonly ignoreScrim: boolean;
	private readonly feedbackEl: HTMLElement;
	private readonly toolbarEl: HTMLElement;
	private readonly mainEl: HTMLElement;
	private readonly sidebarEl: HTMLElement;
	private readonly bodyHostEl: HTMLElement;
	private readonly statusBarEl: HTMLElement;
	private readonly footerEl: HTMLElement;

	private bodyCleanup: Cleanup | null = null;
	private returnFocusEl: HTMLElement | null = null;
	private isClosing = false;
	private sidebarRevealFrame: number | null = null;
	private sidebarResizeListening = false;
	private readonly handleSidebarViewportResize = (): void => {
		this.scheduleActiveSidebarReveal();
	};

	constructor(opts: ModalConfig) {
		this.variants = mergeModalVariants(opts.variants);
		this.modifiers = new Set(opts.modifiers ?? []);
		this.slots = opts.slots;
		this.lifecycle = opts.lifecycle;
		this.ignoreScrim = opts.dismissal?.ignoreScrim === true;

		if (this.variants.mode === 'popout') {
			throw new Error(
				'[scilence:Modal] mode="popout" interface is declared but mechanics are not yet implemented. See research/flywheel/handoffs/briefs/canonical-modal-primitive-architecture.md "modal-popout-multi-monitor-mechanics".',
			);
		}

		this.element = document.createElement('dialog');
		this.element.classList.add('s-modal-dialog');
		this.applyVariantClasses();
		if (opts.className) {
			for (const part of opts.className.split(/\s+/)) {
				if (part) this.element.classList.add(part);
			}
		}
		if (opts.attributes) {
			for (const [key, val] of Object.entries(opts.attributes)) {
				this.element.setAttribute(key, val);
			}
		}

		this.surfaceEl = document.createElement('div');
		this.surfaceEl.className = 's-modal-dialog__surface';
		if (opts.presentation === 'wizard') this.surfaceEl.classList.add('s-modal-frame--wizard');
		this.element.dataset.presentation = opts.presentation ?? 'content';

		this.chrome = createModalChrome({ onCloseRequest: (reason) => this.close(reason) });
		this.element.setAttribute('aria-labelledby', this.chrome.titleId);
		this.element.setAttribute('aria-describedby', this.chrome.subtitleId);
		this.breadcrumbEl = this.makeRegion('breadcrumb');
		this.headerEl = this.chrome.headerElement;
		this.feedbackEl = this.chrome.feedbackElement;

		this.toolbarEl = this.makeRegion('toolbar');
		this.mainEl = document.createElement('div');
		this.mainEl.className = 's-modal__main';
		this.sidebarEl = this.makeRegion('sidebar');
		this.bodyHostEl = document.createElement('div');
		this.bodyHostEl.className = 's-modal__body';
		this.mainEl.append(this.sidebarEl, this.bodyHostEl);
		this.statusBarEl = this.makeRegion('status-bar');
		this.footerEl = this.chrome.footerElement;

		this.surfaceEl.append(
			this.breadcrumbEl,
			this.headerEl,
			this.toolbarEl,
			this.mainEl,
			this.statusBarEl,
			this.feedbackEl,
			this.footerEl,
		);
		this.element.append(this.surfaceEl);

		this.renderAllSlots();
		this.wireScrimClick();
		this.wireCancelEvent();
		this.element.addEventListener('close', () => this.stopSidebarRevealLifecycle());
		modalHandles.set(this.element, this);
	}

	private makeRegion(name: string): HTMLElement {
		const el = document.createElement('div');
		el.className = `s-modal__${name}`;
		el.dataset.modalRegion = name;
		el.hidden = true;
		return el;
	}

	private applyVariantClasses(): void {
		this.element.dataset.size = this.variants.size;
		this.element.dataset.mode = this.variants.mode;
		this.element.classList.add(`s-modal-dialog--${this.variants.size}`);
		for (const mod of this.modifiers) {
			this.element.classList.add(`s-modal-dialog--${mod}`);
		}
	}

	/**
	 * The CURRENT dismissal policy, read at event time rather than wire time so
	 * a re-rendered header slot takes effect immediately.
	 *
	 * WHY THIS EXISTS. `close` was documented in types.ts as `false` = "no
	 * dismissal at all" and `'esc-only'` = "ESC works, no X button", and the
	 * implementation honoured neither: wireScrimClick() and wireCancelEvent()
	 * were registered unconditionally in the constructor and never consulted
	 * the option. `close: false` only hid the X — ESC and scrim-click still
	 * dismissed — and `false` and `'esc-only'` were behaviourally identical.
	 * A comment claimed ESC was "suppressed via cancel handler swap"; no such
	 * swap existed anywhere.
	 *
	 * That is the wrong way round for the cases the option is for: a modal
	 * declaring `close: false` is normally one where dismissal loses work or
	 * abandons a required step.
	 */
	private dismissPolicy(): { x: boolean; esc: boolean; scrim: boolean } {
		const value = this.slots.header?.close ?? true;
		if (value === false) return { x: false, esc: false, scrim: false };
		if (value === 'esc-only') return { x: false, esc: true, scrim: false };
		return { x: true, esc: true, scrim: !this.ignoreScrim };
	}

	private wireScrimClick(): void {
		this.element.addEventListener('click', (ev) => {
			if (ev.target !== this.element) return;
			if (!this.dismissPolicy().scrim) return;
			this.close('scrim-click');
		});
	}

	private wireCancelEvent(): void {
		this.element.addEventListener('cancel', (ev) => {
			// Always preventDefault: the native <dialog> ESC would close without
			// running our reason routing or the body cleanup. Whether we then
			// close is the policy question.
			ev.preventDefault();
			if (!this.dismissPolicy().esc) return;
			this.close('esc-key');
		});
	}

	private renderAllSlots(): void {
		this.renderHeader(this.slots.header);
		this.renderBody();
		this.renderFooter(this.slots.footer);
		this.chrome.update({ feedback: this.slots.feedback });
		this.renderSidebar(this.slots.sidebar);
		this.renderToolbar(this.slots.toolbar);
		this.renderStatusBar(this.slots.statusBar);
		this.renderBreadcrumb(this.slots.breadcrumb);
	}

	private renderHeader(slot: HeaderSlot | undefined): void {
		this.chrome.update({ header: slot });
	}

	private renderBody(): void {
		// Tear down prior cleanup before re-render.
		if (this.bodyCleanup) {
			try {
				this.bodyCleanup();
			} catch (err) {
				console.warn('[scilence:Modal] body cleanup threw', err);
			}
			this.bodyCleanup = null;
		}
		this.bodyHostEl.replaceChildren();
		this.bodyHostEl.classList.toggle('s-modal__body--padded', this.slots.body.padded !== false);
		this.bodyCleanup = this.slots.body.render(this.bodyHostEl);
	}

	private renderFooter(slot: FooterSlot | undefined): void {
		this.chrome.update({ footer: slot });
	}

	private renderSidebar(slot: SidebarSlot | undefined): void {
		this.cancelActiveSidebarReveal();
		this.sidebarEl.hidden = !slot;
		if (!slot) return;
		this.sidebarEl.replaceChildren();
		const activeId = slot.defaultActiveId ?? slot.items[0]?.id;
		for (const item of slot.items) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 's-modal__sidebar-item';
			btn.dataset.itemId = item.id;
			btn.disabled = !!item.disabled;
			if (item.id === activeId) {
				btn.setAttribute('aria-pressed', 'true');
				btn.classList.add('is-active');
			}
			if (item.icon) {
				const iconWrap = document.createElement('span');
				iconWrap.className = 's-modal__sidebar-item-icon';
				iconWrap.setAttribute('aria-hidden', 'true');
				iconWrap.append(item.icon);
				btn.append(iconWrap);
			}
			const labelEl = document.createElement('span');
			labelEl.className = 's-modal__sidebar-item-label';
			labelEl.textContent = item.label;
			btn.append(labelEl);
			if (item.badge != null) {
				const badge = document.createElement('span');
				badge.className = 's-modal__sidebar-item-badge';
				badge.textContent = String(item.badge);
				btn.append(badge);
			}
			btn.addEventListener('click', () => {
				if (item.disabled) return;
				for (const sib of this.sidebarEl.querySelectorAll<HTMLButtonElement>('.s-modal__sidebar-item')) {
					sib.removeAttribute('aria-pressed');
					sib.classList.remove('is-active');
				}
				btn.setAttribute('aria-pressed', 'true');
				btn.classList.add('is-active');
				this.scheduleActiveSidebarReveal();
				slot.onChange?.(item.id);
			});
			this.sidebarEl.append(btn);
		}
		this.scheduleActiveSidebarReveal();
	}

	private isPhoneSidebarLayout(): boolean {
		if (typeof window.matchMedia === 'function') {
			return window.matchMedia(PHONE_SIDEBAR_MEDIA_QUERY).matches;
		}
		return window.innerWidth <= 767;
	}

	private cancelActiveSidebarReveal(): void {
		if (this.sidebarRevealFrame === null) return;
		window.cancelAnimationFrame(this.sidebarRevealFrame);
		this.sidebarRevealFrame = null;
	}

	private scheduleActiveSidebarReveal(): void {
		this.cancelActiveSidebarReveal();
		if (!this.element.open || this.sidebarEl.hidden || !this.isPhoneSidebarLayout()) return;
		this.sidebarRevealFrame = window.requestAnimationFrame(() => {
			this.sidebarRevealFrame = null;
			if (!this.element.open || this.sidebarEl.hidden || !this.isPhoneSidebarLayout()) return;
			const activeItem = this.sidebarEl.querySelector<HTMLElement>(
				'.s-modal__sidebar-item[aria-pressed="true"]',
			);
			activeItem?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});
	}

	private startSidebarRevealLifecycle(): void {
		if (!this.sidebarResizeListening) {
			window.addEventListener('resize', this.handleSidebarViewportResize);
			this.sidebarResizeListening = true;
		}
		this.scheduleActiveSidebarReveal();
	}

	private stopSidebarRevealLifecycle(): void {
		this.cancelActiveSidebarReveal();
		if (!this.sidebarResizeListening) return;
		window.removeEventListener('resize', this.handleSidebarViewportResize);
		this.sidebarResizeListening = false;
	}

	private renderToolbar(slot: ToolbarSlot | undefined): void {
		this.toolbarEl.hidden = !slot;
		if (!slot) return;
		this.toolbarEl.classList.toggle('s-modal__toolbar--segmented', !!slot.segmented);
		this.toolbarEl.replaceChildren();
		for (const tool of slot.tools) {
			this.toolbarEl.append(this.renderToolbarTool(tool));
		}
	}

	private renderToolbarTool(tool: ToolbarSlot['tools'][number]): HTMLElement {
		switch (tool.kind) {
			case 'separator': {
				const sep = document.createElement('span');
				sep.className = 's-modal__toolbar-separator';
				sep.setAttribute('aria-hidden', 'true');
				return sep;
			}
			case 'button': {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 's-modal__toolbar-button';
				btn.dataset.toolId = tool.id;
				btn.setAttribute('aria-label', tool.label);
				if (tool.icon) btn.append(tool.icon);
				else btn.textContent = tool.label;
				btn.addEventListener('click', tool.onClick);
				return btn;
			}
			case 'toggle': {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 's-modal__toolbar-toggle';
				btn.dataset.toolId = tool.id;
				btn.setAttribute('aria-pressed', tool.pressed ? 'true' : 'false');
				btn.setAttribute('aria-label', tool.label);
				if (tool.icon) btn.append(tool.icon);
				else btn.textContent = tool.label;
				btn.addEventListener('click', () => {
					const next = btn.getAttribute('aria-pressed') !== 'true';
					btn.setAttribute('aria-pressed', next ? 'true' : 'false');
					tool.onChange(next);
				});
				return btn;
			}
			case 'select': {
				const select = document.createElement('select');
				select.className = 's-modal__toolbar-select';
				select.dataset.toolId = tool.id;
				select.setAttribute('aria-label', tool.label);
				for (const opt of tool.options) {
					const optionEl = document.createElement('option');
					optionEl.value = opt.id;
					optionEl.textContent = opt.label;
					if (opt.id === tool.value) optionEl.selected = true;
					select.append(optionEl);
				}
				select.addEventListener('change', () => tool.onChange(select.value));
				return select;
			}
		}
	}

	private renderStatusBar(slot: StatusBarSlot | undefined): void {
		this.statusBarEl.hidden = !slot;
		if (!slot) return;
		this.statusBarEl.replaceChildren();
		for (const item of slot.items) {
			const itemEl = document.createElement('span');
			itemEl.className = `s-modal__status-item s-modal__status-item--${item.kind}`;
			if (item.tone) itemEl.dataset.tone = item.tone;
			itemEl.dataset.itemId = item.id;
			if (item.icon) {
				const iconWrap = document.createElement('span');
				iconWrap.className = 's-modal__status-item-icon';
				iconWrap.setAttribute('aria-hidden', 'true');
				iconWrap.append(item.icon);
				itemEl.append(iconWrap);
			}
			const labelEl = document.createElement('span');
			labelEl.className = 's-modal__status-item-label';
			labelEl.textContent = item.label;
			itemEl.append(labelEl);
			this.statusBarEl.append(itemEl);
		}
	}

	private renderBreadcrumb(slot: BreadcrumbSlot | undefined): void {
		this.breadcrumbEl.hidden = !slot;
		if (!slot) return;
		this.breadcrumbEl.replaceChildren();
		slot.items.forEach((item, idx) => {
			const isLast = idx === slot.items.length - 1;
			const itemEl = document.createElement('button');
			itemEl.type = 'button';
			itemEl.className = 's-modal__breadcrumb-item';
			itemEl.dataset.itemId = item.id;
			if (item.back) itemEl.classList.add('s-modal__breadcrumb-item--back');
			if (isLast) {
				itemEl.classList.add('is-current');
				itemEl.setAttribute('aria-current', 'page');
				itemEl.disabled = true;
			}
			itemEl.textContent = item.label;
			itemEl.addEventListener('click', () => {
				if (!isLast) slot.onNavigate?.(item);
			});
			this.breadcrumbEl.append(itemEl);
			if (!isLast) {
				const sep = document.createElement('span');
				sep.className = 's-modal__breadcrumb-sep';
				sep.setAttribute('aria-hidden', 'true');
				sep.textContent = '/';
				this.breadcrumbEl.append(sep);
			}
		});
	}

	render(): HTMLDialogElement {
		return this.element;
	}

	open(): void {
		if (this.element.open) return;
		this.returnFocusEl = (document.activeElement as HTMLElement) ?? null;
		if (!this.element.isConnected) {
			document.body.append(this.element);
		}
		this.element.showModal();
		this.startSidebarRevealLifecycle();
		this.lifecycle?.onOpen?.();
	}

	close(reason: CloseReason = 'programmatic'): void {
		if (this.isClosing || !this.element.open) return;
		this.isClosing = true;
		try {
			const result = this.lifecycle?.onClose?.(reason);
			if (result === false) {
				this.isClosing = false;
				return;
			}
		} catch (err) {
			console.warn('[scilence:Modal] onClose threw', err);
		}
		if (this.bodyCleanup) {
			try {
				this.bodyCleanup();
			} catch (err) {
				console.warn('[scilence:Modal] body cleanup threw on close', err);
			}
			this.bodyCleanup = null;
		}
		this.stopSidebarRevealLifecycle();
		this.element.close();
		this.isClosing = false;
		const target = this.returnFocusEl;
		this.lifecycle?.onFocusReturn?.(target);
		if (target && typeof target.focus === 'function') {
			try {
				target.focus();
			} catch {
				/* return focus is best-effort */
			}
		}
	}

	destroy(): void {
		if (this.element.open) this.close('programmatic');
		this.stopSidebarRevealLifecycle();
		this.chrome.destroy();
		modalHandles.delete(this.element);
		this.element.remove();
	}

	isOpen(): boolean {
		return this.element.open;
	}

	updateSlots(partial: Partial<ModalSlots>): void {
		this.slots = { ...this.slots, ...partial };
		if (partial.header !== undefined) this.renderHeader(this.slots.header);
		if (partial.footer !== undefined) this.renderFooter(this.slots.footer);
		if ('feedback' in partial) this.chrome.update({ feedback: partial.feedback });
		if (partial.sidebar !== undefined) this.renderSidebar(this.slots.sidebar);
		if (partial.toolbar !== undefined) this.renderToolbar(this.slots.toolbar);
		if (partial.statusBar !== undefined) this.renderStatusBar(this.slots.statusBar);
		if (partial.breadcrumb !== undefined) this.renderBreadcrumb(this.slots.breadcrumb);
		if (partial.body !== undefined) this.renderBody();
	}
}

/** Factory — preferred entry. */
export function createModal(opts: ModalConfig): Modal {
	return new Modal(opts);
}

export type { ModalConfig, ModalHandle } from './types.js';
