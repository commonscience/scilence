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

import { mergeModalVariants } from './resolve-modal-tokens.js';
import type {
	BreadcrumbSlot,
	Cleanup,
	CloseReason,
	FooterSlot,
	HeaderSlot,
	ModalConfig,
	ModalHandle,
	ModalSlots,
	ModalVariants,
	SidebarSlot,
	StatusBarSlot,
	ToolbarSlot,
} from './types.js';

export class Modal implements ModalHandle {
	readonly element: HTMLDialogElement;
	private variants: ModalVariants;
	private modifiers: Set<string>;
	private slots: ModalSlots;
	private lifecycle: ModalConfig['lifecycle'];

	private readonly surfaceEl: HTMLElement;
	private readonly breadcrumbEl: HTMLElement;
	private readonly headerEl: HTMLElement;
	private readonly headerTitleEl: HTMLElement;
	private readonly headerSubtitleEl: HTMLElement;
	private readonly headerActionsEl: HTMLElement;
	private readonly headerCloseBtn: HTMLButtonElement;
	private readonly toolbarEl: HTMLElement;
	private readonly mainEl: HTMLElement;
	private readonly sidebarEl: HTMLElement;
	private readonly bodyHostEl: HTMLElement;
	private readonly statusBarEl: HTMLElement;
	private readonly footerEl: HTMLElement;

	private bodyCleanup: Cleanup | null = null;
	private returnFocusEl: HTMLElement | null = null;
	private isClosing = false;

	constructor(opts: ModalConfig) {
		this.variants = mergeModalVariants(opts.variants);
		this.modifiers = new Set(opts.modifiers ?? []);
		this.slots = opts.slots;
		this.lifecycle = opts.lifecycle;

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

		this.breadcrumbEl = this.makeRegion('breadcrumb');
		this.headerEl = this.makeRegion('header');
		this.headerTitleEl = document.createElement('h2');
		this.headerTitleEl.className = 's-modal__title';
		this.headerSubtitleEl = document.createElement('p');
		this.headerSubtitleEl.className = 's-modal__subtitle';
		this.headerSubtitleEl.hidden = true;
		this.headerActionsEl = document.createElement('div');
		this.headerActionsEl.className = 's-modal__header-actions';
		this.headerCloseBtn = document.createElement('button');
		this.headerCloseBtn.type = 'button';
		this.headerCloseBtn.className = 's-modal__close';
		this.headerCloseBtn.setAttribute('aria-label', 'Close');
		this.headerCloseBtn.innerHTML =
			'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>';
		this.headerCloseBtn.addEventListener('click', () => this.close('close-button'));

		const headerInner = document.createElement('div');
		headerInner.className = 's-modal__header-inner';
		headerInner.append(this.headerTitleEl, this.headerSubtitleEl);
		this.headerEl.append(headerInner, this.headerActionsEl, this.headerCloseBtn);

		this.toolbarEl = this.makeRegion('toolbar');
		this.mainEl = document.createElement('div');
		this.mainEl.className = 's-modal__main';
		this.sidebarEl = this.makeRegion('sidebar');
		this.bodyHostEl = document.createElement('div');
		this.bodyHostEl.className = 's-modal__body';
		this.mainEl.append(this.sidebarEl, this.bodyHostEl);
		this.statusBarEl = this.makeRegion('status-bar');
		this.footerEl = this.makeRegion('footer');

		this.surfaceEl.append(
			this.breadcrumbEl,
			this.headerEl,
			this.toolbarEl,
			this.mainEl,
			this.statusBarEl,
			this.footerEl,
		);
		this.element.append(this.surfaceEl);

		this.renderAllSlots();
		this.wireScrimClick();
		this.wireCancelEvent();
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

	private wireScrimClick(): void {
		this.element.addEventListener('click', (ev) => {
			if (ev.target === this.element) {
				this.close('scrim-click');
			}
		});
	}

	private wireCancelEvent(): void {
		this.element.addEventListener('cancel', (ev) => {
			ev.preventDefault();
			this.close('esc-key');
		});
	}

	private renderAllSlots(): void {
		this.renderHeader(this.slots.header);
		this.renderBody();
		this.renderFooter(this.slots.footer);
		this.renderSidebar(this.slots.sidebar);
		this.renderToolbar(this.slots.toolbar);
		this.renderStatusBar(this.slots.statusBar);
		this.renderBreadcrumb(this.slots.breadcrumb);
	}

	private renderHeader(slot: HeaderSlot | undefined): void {
		this.headerEl.hidden = !slot;
		if (!slot) return;
		this.headerTitleEl.textContent = slot.title;
		if (slot.subtitle) {
			this.headerSubtitleEl.textContent = slot.subtitle;
			this.headerSubtitleEl.hidden = false;
		} else {
			this.headerSubtitleEl.hidden = true;
		}

		this.headerActionsEl.replaceChildren();
		if (slot.actions) {
			for (const action of slot.actions) {
				const btn = document.createElement('button');
				btn.type = 'button';
				btn.className = 's-modal__header-action';
				btn.dataset.actionId = action.id;
				btn.setAttribute('aria-label', action.label);
				if (action.icon) btn.append(action.icon);
				else btn.textContent = action.label;
				btn.disabled = !!action.disabled;
				btn.addEventListener('click', action.onClick);
				this.headerActionsEl.append(btn);
			}
		}

		const closeValue = slot.close ?? true;
		// `false` = no dismissal at all (no X button, ESC suppressed via cancel handler swap)
		// `'esc-only'` = no X button but ESC works
		// `true` / `'always'` = both X button + ESC
		const showXButton = closeValue !== false && closeValue !== 'esc-only';
		this.headerCloseBtn.hidden = !showXButton;
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
		this.footerEl.hidden = !slot;
		if (!slot) return;
		this.footerEl.replaceChildren();
		for (const action of slot.actions) {
			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = `s-modal__btn s-modal__btn--${action.variant}`;
			btn.dataset.actionId = action.id;
			btn.textContent = action.label;
			btn.disabled = !!action.disabled || !!action.loading;
			if (slot.primaryActionId === action.id) {
				btn.classList.add('s-modal__btn--is-primary');
			}
			btn.addEventListener('click', async () => {
				const result = action.onClick();
				if (result instanceof Promise) {
					try {
						await result;
						if (action.closeOnSuccess) {
							this.close('commit-success');
						}
					} catch (err) {
						console.warn(`[scilence:Modal] footer action '${action.id}' rejected`, err);
					}
				} else if (action.closeOnSuccess) {
					this.close('commit-success');
				}
			});
			this.footerEl.append(btn);
		}
	}

	private renderSidebar(slot: SidebarSlot | undefined): void {
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
				slot.onChange?.(item.id);
			});
			this.sidebarEl.append(btn);
		}
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

	open(): void {
		if (this.element.open) return;
		this.returnFocusEl = (document.activeElement as HTMLElement) ?? null;
		if (!this.element.isConnected) {
			document.body.append(this.element);
		}
		this.element.showModal();
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
		this.element.remove();
	}

	isOpen(): boolean {
		return this.element.open;
	}

	updateSlots(partial: Partial<ModalSlots>): void {
		this.slots = { ...this.slots, ...partial };
		if (partial.header !== undefined) this.renderHeader(this.slots.header);
		if (partial.footer !== undefined) this.renderFooter(this.slots.footer);
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
