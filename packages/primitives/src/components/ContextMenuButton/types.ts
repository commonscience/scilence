import type { MenuEntry, MenuItemDescriptor, MenuSize } from '../Menu/index.js';

export interface ContextMenuButtonConfig {
	label: string;
	icon: HTMLElement | SVGElement;
	entries: () => readonly MenuEntry[];
	onSelect: (id: string, item: MenuItemDescriptor, event: Event) => void;
	size?: MenuSize;
	align?: 'start' | 'end';
	className?: string;
	attributes?: Record<string, string>;
	canOpen?: () => boolean;
	previewGroup?: HTMLElement;
}

export interface ContextMenuButtonHandle {
	readonly element: HTMLButtonElement;
	readonly popover: HTMLElement;
	refresh: () => void;
	close: (options?: { restoreFocus?: boolean }) => void;
	destroy: () => void;
}
