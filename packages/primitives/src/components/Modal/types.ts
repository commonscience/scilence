/**
 * @scilence/primitives — Modal substrate types.
 *
 * The pure substrate operates on a leaner `ModalConfig` than the
 * GUIDE-side `ModalMountContract` (which adds plugin-contract integration
 * concerns). The two-layer split is locked in
 *   research/flywheel/handoffs/briefs/canonical-modal-primitive-architecture.md
 * + research/specs/GUIDE_MODAL_CONTRACT.md (the GUIDE-side wiring contract).
 */

/** Size variants. All 9 values from the locked v1 spec. */
export type ModalSize =
	| 'sm'
	| 'md'
	| 'lg'
	| 'xl'
	| 'xxl'
	| 'cas'
	| 'full'
	| 'lightbox'
	| 'contained';

/** Activation mode. `popout` is interface-only in v1; mechanics deferred. */
export type ModalMode = 'docked' | 'popout';

/** Chrome modifiers. v1 locked to `animated`-only. */
export type ModalModifier = 'animated';

export type ModalVariants = {
	size: ModalSize;
	mode: ModalMode;
};

/** Reason the modal closed (passed to onClose / lifecycle). */
export type CloseReason =
	| 'scrim-click'
	| 'esc-key'
	| 'close-button'
	| 'programmatic'
	| 'commit-success'
	| 'navigation-away';

/** Body slot — the only required slot. */
export interface BodySlot {
	/** Render into the provided host element. Return a cleanup thunk
	 * called on close. */
	render: (host: HTMLElement) => Cleanup;
	/** When false, host does not apply default body padding. Default true. */
	padded?: boolean;
}

export type Cleanup = () => void;

/** Header slot — title + optional actions + close behavior. */
export interface HeaderSlot {
	title: string;
	subtitle?: string;
	actions?: HeaderAction[];
	/** Close behavior. `true` = show X button + ESC; `false` = no
	 * dismissal at all; `'esc-only'` = ESC works, no X button. Default true. */
	close?: boolean | 'always' | 'esc-only';
}

export interface HeaderAction {
	id: string;
	label: string;
	icon?: HTMLElement | SVGElement;
	onClick: () => void;
	disabled?: boolean;
}

/** Footer slot — action row. */
export interface FooterSlot {
	actions: FooterAction[];
	/** Which action id is the primary (accent + Enter-key default). */
	primaryActionId?: string;
}

export interface FooterAction {
	id: string;
	label: string;
	variant: 'primary' | 'secondary' | 'cancel' | 'danger';
	onClick: () => void | Promise<void>;
	disabled?: boolean;
	loading?: boolean;
	/** When true + the click resolves, modal closes with reason `commit-success`. */
	closeOnSuccess?: boolean;
}

/** Sidebar slot — navigation rail inside modal. */
export interface SidebarSlot {
	items: SidebarItem[];
	defaultActiveId?: string;
	onChange?: (activeId: string) => void;
}

export interface SidebarItem {
	id: string;
	label: string;
	icon?: HTMLElement | SVGElement;
	badge?: string | number;
	disabled?: boolean;
}

/** Toolbar slot — persistent tool palette above body. */
export interface ToolbarSlot {
	tools: ToolbarTool[];
	/** When true, render tools as a SegmentedControl group. */
	segmented?: boolean;
}

export type ToolbarTool =
	| { kind: 'button'; id: string; label: string; icon?: HTMLElement | SVGElement; onClick: () => void }
	| { kind: 'toggle'; id: string; label: string; icon?: HTMLElement | SVGElement; pressed: boolean; onChange: (next: boolean) => void }
	| { kind: 'select'; id: string; label: string; options: { id: string; label: string }[]; value: string; onChange: (next: string) => void }
	| { kind: 'separator' };

/** Status-bar slot — compact tokens (provenance, pending, conflict markers). */
export interface StatusBarSlot {
	items: StatusItem[];
}

export interface StatusItem {
	id: string;
	kind: 'text' | 'chip' | 'indicator';
	label: string;
	tone?: 'default' | 'info' | 'success' | 'warning' | 'danger' | 'muted';
	icon?: HTMLElement | SVGElement;
}

/** Breadcrumb slot — above-header back nav (bumper-car integration). */
export interface BreadcrumbSlot {
	items: BreadcrumbItem[];
	onNavigate?: (item: BreadcrumbItem) => void;
}

export interface BreadcrumbItem {
	id: string;
	label: string;
	back?: boolean;
}

/** All slot fills. body required; others optional. */
export interface ModalSlots {
	header?: HeaderSlot;
	body: BodySlot;
	footer?: FooterSlot;
	sidebar?: SidebarSlot;
	toolbar?: ToolbarSlot;
	statusBar?: StatusBarSlot;
	breadcrumb?: BreadcrumbSlot;
}

/** Lifecycle hooks. */
export interface ModalLifecycle {
	onOpen?: () => void;
	/** Return `false` to abort close (e.g. unsaved-changes confirm). */
	onClose?: (reason: CloseReason) => boolean | void;
	onFocusReturn?: (returnFocusEl: HTMLElement | null) => void;
}

export interface ModalConfig {
	variants?: Partial<ModalVariants>;
	modifiers?: ModalModifier[];
	slots: ModalSlots;
	lifecycle?: ModalLifecycle;
	/** Extra classes on the <dialog> root. */
	className?: string;
	/** Extra attributes on the <dialog> root. */
	attributes?: Record<string, string>;
}

export interface ModalHandle {
	readonly element: HTMLDialogElement;
	render(): HTMLDialogElement;
	open(): void;
	close(reason?: CloseReason): void;
	destroy(): void;
	isOpen(): boolean;
	/** Update slots in place (e.g. footer button loading state). */
	updateSlots(partial: Partial<ModalSlots>): void;
}
