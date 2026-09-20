import { createIconButton } from '../IconButton/index.js';
import { createMenu } from '../Menu/index.js';
import type { MenuEntry } from '../Menu/index.js';
import { attachHoverDisclosure } from '../../hover-disclosure/index.js';
import type { ContextMenuButtonConfig, ContextMenuButtonHandle } from './types.js';

let nextContextMenuId = 0;

/** Canonical icon-triggered native-popover menu composition. */
export function createContextMenuButton(config: ContextMenuButtonConfig): ContextMenuButtonHandle {
	const doc = config.icon.ownerDocument;
	const win = doc.defaultView;
	if (!win) throw new Error('ContextMenuButton requires a document with a window.');
	const iconButton = createIconButton({
		icon: config.icon,
		label: config.label,
		variants: { tone: 'ghost', size: 'sm' },
		className: config.className,
		attributes: config.attributes,
	});
	const element = iconButton.element as HTMLButtonElement;
	// Portaled surfaces can retain a scoped application owner without teaching
	// the primitive about that owner's layout or lifecycle.
	element.dataset.contextMenuTrigger = '';
	const popover = doc.createElement('div');
	popover.className = 's-context-menu-button__popover';
	popover.id = `s-context-menu-${++nextContextMenuId}`;
	popover.setAttribute('popover', 'auto');
	element.setAttribute('aria-haspopup', 'menu');
	element.setAttribute('aria-controls', popover.id);

	/** Explicit context-menu activation replaces only peer context menus. Native
	 * auto-popovers and HoverDisclosure retain dismissal/state synchronization;
	 * dialogs and unrelated application popovers are deliberately untouched. */
	const closeContextMenuPeers = () => {
		for (const peer of doc.querySelectorAll<HTMLElement>('[data-context-menu-trigger][aria-expanded="true"][aria-controls]')) {
			if (peer === element) continue;
			const controlled = doc.getElementById(peer.getAttribute('aria-controls')!);
			if (controlled?.hasAttribute('popover') && controlled.matches(':popover-open')) controlled.hidePopover();
		}
	};
	const onExplicitClick = () => closeContextMenuPeers();
	const onExplicitKeydown = (event: KeyboardEvent) => {
		if (event.key === 'ArrowDown') closeContextMenuPeers();
	};
	element.addEventListener('click', onExplicitClick, true);
	element.addEventListener('keydown', onExplicitKeydown, true);

	let disclosure: ReturnType<typeof attachHoverDisclosure>;
	const menu = createMenu({
		ariaLabel: config.label,
		entries: [...config.entries()],
		variants: { size: config.size ?? 'sm', chrome: 'bare' },
		onSelect(id, item, event) {
			disclosure.close({ restoreFocus: true });
			config.onSelect(id, item, event);
		},
	});
	popover.append(menu.element);
	doc.body.append(popover);

	const refresh = () => menu.setEntries([...config.entries()]);
	const position = () => {
		const anchor = element.getBoundingClientRect();
		const panel = popover.getBoundingClientRect();
		const viewport = win.visualViewport;
		const leftEdge = viewport?.offsetLeft ?? 0;
		const topEdge = viewport?.offsetTop ?? 0;
		const rightEdge = leftEdge + (viewport?.width ?? win.innerWidth);
		const bottomEdge = topEdge + (viewport?.height ?? win.innerHeight);
		const computed = win.getComputedStyle(popover);
		const gap = Number.parseFloat(computed.getPropertyValue('--s-context-menu-anchor-gap')) || 0;
		const margin = Number.parseFloat(computed.getPropertyValue('--s-context-menu-viewport-margin')) || 0;
		const preferredLeft = config.align === 'start' ? anchor.left : anchor.right - panel.width;
		const left = Math.min(Math.max(preferredLeft, leftEdge + margin), Math.max(leftEdge + margin, rightEdge - panel.width - margin));
		const below = anchor.bottom + gap;
		const top = below + panel.height <= bottomEdge - margin
			? below
			: Math.max(topEdge + margin, anchor.top - panel.height - gap);
		popover.style.setProperty('--s-context-menu-left', `${Math.round(left)}px`);
		popover.style.setProperty('--s-context-menu-top', `${Math.round(top)}px`);
	};
	const validOwner = () => element.isConnected && popover.isConnected
		&& !element.closest('[hidden], [inert]') && config.canOpen?.() !== false;
	const mutationObserver = typeof win.MutationObserver === 'function'
		? new win.MutationObserver(() => {
			if (disclosure.state !== 'closed' && !validOwner()) disclosure.close();
		})
		: undefined;
	disclosure = attachHoverDisclosure({
		trigger: element,
		popover,
		beforeOpen: refresh,
		position,
		focusFirst: () => menu.focusFirst(),
		canOpen: validOwner,
		previewGroup: config.previewGroup,
		onStateChange(state) {
			mutationObserver?.disconnect();
			if (state !== 'closed') mutationObserver?.observe(doc.documentElement, {
				attributes: true, attributeFilter: ['hidden', 'inert'], childList: true, subtree: true,
			});
		},
	});

	const reposition = () => {
		if (popover.matches(':popover-open')) position();
	};
	win.addEventListener('resize', reposition);
	win.addEventListener('scroll', reposition, true);
	win.visualViewport?.addEventListener('resize', reposition);
	win.visualViewport?.addEventListener('scroll', reposition);
	const resizeObserver = typeof win.ResizeObserver === 'function'
		? new win.ResizeObserver(reposition)
		: undefined;
	resizeObserver?.observe(element);
	resizeObserver?.observe(popover);

	let destroyed = false;
	return {
		element,
		popover,
		refresh,
		close: options => disclosure.close(options),
		destroy() {
			if (destroyed) return;
			destroyed = true;
			mutationObserver?.disconnect();
			resizeObserver?.disconnect();
			win.removeEventListener('resize', reposition);
			win.removeEventListener('scroll', reposition, true);
			win.visualViewport?.removeEventListener('resize', reposition);
			win.visualViewport?.removeEventListener('scroll', reposition);
			element.removeEventListener('click', onExplicitClick, true);
			element.removeEventListener('keydown', onExplicitKeydown, true);
			disclosure.destroy();
			menu.destroy();
			iconButton.destroy();
			popover.remove();
		},
	};
}

export type { ContextMenuButtonConfig, ContextMenuButtonHandle } from './types.js';
export type { MenuEntry };
