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
	/** Navigation belongs to the header; the consumer owns reachability and validation. */
	stepper?: ModalStepperSlot;
	actions?: HeaderAction[];
	/**
	 * Dismissal policy. Governs all THREE routes -- the X button, ESC, and
	 * scrim-click -- not just the button.
	 *
	 *   `true` / `'always'`  X + ESC + scrim-click   (default)
	 *   `'esc-only'`         ESC only; no X, no scrim-click
	 *   `false`              no dismissal at all
	 *
	 * This used to describe exactly that and implement none of it: the scrim
	 * and cancel handlers were wired unconditionally and never read this value,
	 * so `false` merely hid the X while ESC and scrim-click still dismissed,
	 * and `false` and `'esc-only'` behaved identically. See Modal.dismissPolicy().
	 */
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
	/** Which action id is primary (accent). Never binds Enter to an action. */
	primaryActionId?: string;
}

export interface FooterAction {
	id: string;
	label: string;
	variant: 'primary' | 'secondary' | 'cancel' | 'danger';
	onClick: () => void | Promise<void>;
	disabled?: boolean;
	loading?: boolean;
	/** Start actions (Cancel/Save review) stay separate from forward actions. */
	group?: 'start' | 'end';
	/** Consumer data-* instrumentation; semantic/button attributes remain component-owned. */
	attributes?: Readonly<Record<string, string>>;
	/** When true + the click resolves, modal closes with reason `commit-success`. */
	closeOnSuccess?: boolean;
}

/** Modal-owned navigation part, composed from Button atoms. Not a workflow engine. */
export interface ModalStepperItem {
	id: string;
	label: string;
	state?: 'pending' | 'complete' | 'error';
	disabled?: boolean;
	attributes?: Readonly<Record<string, string>>;
}

export interface ModalStepperSlot {
	items: readonly ModalStepperItem[];
	activeId: string;
	label?: string;
	onSelect(id: string): void;
}

/** Wrapping semantic feedback above the action-only footer. Text is never HTML. */
export interface ModalFeedbackSlot {
	tone: 'info' | 'success' | 'warning' | 'danger';
	title?: string;
	message: string;
	/** Default polite, including errors; assertive is an explicit consumer decision. */
	announcement?: 'off' | 'polite' | 'assertive';
}

export type ModalPresentation = 'content' | 'wizard';
export interface ModalDismissal {
	/** Ignore incidental backdrop clicks while retaining X and Escape policy. */
	ignoreScrim?: boolean;
}

/** Partial updates omit unchanged parts; null explicitly clears an optional part. */
export interface ModalChromeSlots {
	header?: HeaderSlot | null;
	feedback?: ModalFeedbackSlot | null;
	footer?: FooterSlot | null;
}

export interface ModalChromeOptions extends ModalChromeSlots {
	document?: Document;
	onCloseRequest(reason: CloseReason): void;
}

/** Shared owned parts for native Modal and another existing dialog host. */
export interface ModalChromeHandle {
	readonly headerElement: HTMLElement;
	readonly feedbackElement: HTMLElement;
	readonly footerElement: HTMLElement;
	readonly titleId: string;
	readonly subtitleId: string;
	update(slots: ModalChromeSlots): void;
	destroy(): void;
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
	feedback?: ModalFeedbackSlot | null;
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
	presentation?: ModalPresentation;
	dismissal?: ModalDismissal;
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
