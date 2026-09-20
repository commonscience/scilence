export type NavTreeRowVariant = 'item' | 'section';

export interface NavTreeRowConfig {
	label: string;
	leading?: Node;
	leadingExpanded?: Node;
	/** Decorative disclosure/status affordance rendered immediately after the label. */
	trailing?: Node;
	expanded: boolean;
	controls: string;
	active?: boolean;
	disabled?: boolean;
	variant?: NavTreeRowVariant;
	actions?: readonly HTMLElement[];
	attributes?: Record<string, string>;
	onExpandedChange: (expanded: boolean, event: Event) => void;
	/** Primarily for isolated documents and deterministic tests. */
	document?: Document;
}

export interface NavTreeRowHandle {
	readonly element: HTMLElement;
	readonly disclosure: HTMLButtonElement;
	readonly actionHost: HTMLElement;
	setLabel: (label: string) => void;
	setLeading: (collapsed?: Node, expanded?: Node) => void;
	setTrailing: (trailing?: Node) => void;
	setExpanded: (expanded: boolean) => void;
	setActive: (active: boolean) => void;
	setDisabled: (disabled: boolean) => void;
	setActions: (actions: readonly HTMLElement[]) => void;
	destroy: () => void;
}
