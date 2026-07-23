/**
 * inspector-stack — implementation.
 *
 * See ./types.ts for the public contract, and the brief
 * `research/flywheel/handoffs/briefs/library-inspector-section-stack.md` for
 * the design rationale (generalization of the notebook inspector widget+stack).
 *
 * Markup contract — preserved from the notebook widget so existing CSS keeps
 * working unchanged for the notebook surface:
 *
 *   <section class="notebook-insp-widget" data-collapsed="false"
 *            data-notebook-insp-widget="<id>" data-inspector-card="<id>">
 *     <div class="inspector-stack__head">
 *       <button class="inspector-stack__grip" aria-grabbed="false" …/>
 *       <button class="notebook-insp-widget__header"
 *               aria-expanded="true"
 *               aria-controls="inspector-stack-body-<surface>-<id>">
 *         <span class="notebook-insp-widget__title">Title</span>
 *         <span class="notebook-insp-widget__chevron">…chevron…</span>
 *       </button>
 *     </div>
 *     <div class="notebook-insp-widget__body" id="…">…body…</div>
 *   </section>
 *
 * Persistence shape (key `inspector-stack:<surface>:v1`):
 *
 *   { "order": ["progress","workspace","context","provenance"],
 *     "collapsed": { "progress": true, "workspace": true } }
 *
 * Explicit / initial state wins over persisted only when the persisted entry
 * for that id is absent (mirrors the filter-rail rule).
 */

import type {
	InspectorSectionDescriptor,
	InspectorStackHandle,
	InspectorStackOptions,
	InspectorStackStorage,
} from './types.js';

/** Chevron used by the collapse button — matches the notebook widget glyph. */
const CHEVRON_SVG =
	'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" ' +
	'stroke="currentColor" stroke-width="2.5" stroke-linecap="round" ' +
	'stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';

/** 6-dot grab affordance — matches the notebook middle-column cell drag
 * handle exactly (14x14, viewBox 24, r1.4) so handles read at one size across
 * the stream and the inspector. Caitlin 2026-06-07. */
const GRIP_SVG =
	'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">' +
	'<circle cx="9" cy="6" r="1.4"/>' +
	'<circle cx="9" cy="12" r="1.4"/>' +
	'<circle cx="9" cy="18" r="1.4"/>' +
	'<circle cx="15" cy="6" r="1.4"/>' +
	'<circle cx="15" cy="12" r="1.4"/>' +
	'<circle cx="15" cy="18" r="1.4"/>' +
	'</svg>';

interface PersistedState {
	order?: string[];
	collapsed?: Record<string, boolean>;
	visible?: Record<string, boolean>;
}

interface SectionRecord {
	id: string;
	title: string;
	card: HTMLElement;
	head: HTMLElement;
	grip: HTMLButtonElement;
	header: HTMLButtonElement;
	body: HTMLElement;
	visible: boolean;
}

/** Default no-throw localStorage adapter. */
function defaultStorage(): InspectorStackStorage {
	return {
		getItem(key) {
			try {
				return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
			} catch {
				return null;
			}
		},
		setItem(key, value) {
			try {
				if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
			} catch {
				/* ignore — private mode / SSR */
			}
		},
	};
}

function readPersisted(storage: InspectorStackStorage, key: string): PersistedState {
	const raw = storage.getItem(key);
	if (!raw) return {};
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (parsed && typeof parsed === 'object') return parsed as PersistedState;
	} catch {
		/* ignore corrupt entry */
	}
	return {};
}

function writePersisted(
	storage: InspectorStackStorage,
	key: string,
	state: PersistedState,
): void {
	try {
		storage.setItem(key, JSON.stringify(state));
	} catch {
		/* ignore */
	}
}

/**
 * Compute the effective initial order:
 *   - start with the persisted order filtered to known ids;
 *   - append any newly-declared sections in their descriptor order.
 *
 * (Explicit / declared order wins for *new* ids; persisted order wins for
 *  ids the user has already moved.)
 */
function resolveInitialOrder(
	descriptors: InspectorSectionDescriptor[],
	persistedOrder: string[] | undefined,
): string[] {
	const declared = descriptors.map((d) => d.id);
	if (!persistedOrder || !persistedOrder.length) return declared;
	const declaredSet = new Set(declared);
	const seen = new Set<string>();
	const out: string[] = [];
	for (const id of persistedOrder) {
		if (declaredSet.has(id) && !seen.has(id)) {
			out.push(id);
			seen.add(id);
		}
	}
	for (const id of declared) if (!seen.has(id)) out.push(id);
	return out;
}

/**
 * Create an inspector-stack instance.
 *
 * See `InspectorStackOptions` / `InspectorStackHandle` in `./types.ts`.
 */
export function createInspectorStack(opts: InspectorStackOptions): InspectorStackHandle {
	const {
		surface,
		sections: descriptors,
		rootClass,
		cardClass,
		storage = defaultStorage(),
		onReorder,
		onToggle,
	} = opts;

	const STORAGE_KEY = `inspector-stack:${surface}:v1`;
	const persisted = readPersisted(storage, STORAGE_KEY);

	// ── root ──────────────────────────────────────────────────────────
	const root = document.createElement('div');
	// Preserve the existing notebook class so notebook CSS keeps working
	// when the notebook surface mounts via this primitive. Surfaces that
	// don't want that class can override via opts.rootClass.
	root.className = 'inspector-stack';
	if (rootClass) root.classList.add(...rootClass.split(/\s+/).filter(Boolean));
	root.dataset.inspectorStack = surface;

	// ── aria-live announcer (drag/reorder narration) ──────────────────
	const live = document.createElement('div');
	live.className = 'inspector-stack__live sr-only';
	live.setAttribute('aria-live', 'polite');
	live.setAttribute('aria-atomic', 'true');
	root.appendChild(live);

	function announce(msg: string): void {
		// Toggle to force re-read of identical announcements.
		live.textContent = '';
		// next microtask so SR reliably picks it up.
		queueMicrotask(() => {
			live.textContent = msg;
		});
	}

	// ── build sections ────────────────────────────────────────────────
	const byId = new Map<string, SectionRecord>();
	for (const d of descriptors) {
		byId.set(d.id, buildCard(d));
	}

	function buildCard(d: InspectorSectionDescriptor): SectionRecord {
		const card = document.createElement('section');
		card.className = 'notebook-insp-widget inspector-stack__card';
		if (cardClass) card.classList.add(...cardClass.split(/\s+/).filter(Boolean));
		card.dataset.inspectorCard = d.id;
		// Back-compat data attr — kept so existing notebook tests/CSS keep working.
		card.dataset.notebookInspWidget = d.id;

		const head = document.createElement('div');
		head.className = 'inspector-stack__head';

		const grip = document.createElement('button');
		grip.type = 'button';
		grip.className = 'inspector-stack__grip';
		grip.setAttribute('aria-label', `Reorder ${d.title}`);
		grip.setAttribute('aria-grabbed', 'false');
		grip.setAttribute('aria-roledescription', 'draggable section handle');
		grip.dataset.inspectorGrip = d.id;
		grip.title = 'Drag to reorder — or focus and press Space, then ↑/↓';
		grip.innerHTML = GRIP_SVG;

		const header = document.createElement('button');
		header.type = 'button';
		header.className = 'notebook-insp-widget__header';
		const bodyId = `inspector-stack-body-${surface}-${d.id}`;
		header.setAttribute('aria-controls', bodyId);

		const title = document.createElement('span');
		title.className = 'notebook-insp-widget__title';
		title.textContent = d.title;

		const chevron = document.createElement('span');
		chevron.className = 'notebook-insp-widget__chevron';
		chevron.innerHTML = CHEVRON_SVG;

		header.append(title, chevron);
		head.append(grip, header);

		const body = document.createElement('div');
		body.className = 'notebook-insp-widget__body';
		body.id = bodyId;
		if (d.body) body.appendChild(d.body);
		else if (d.render) d.render(body);

		card.append(head, body);

		// Resolve initial expanded — persisted wins; otherwise descriptor default; otherwise true.
		const persistedCollapsed = persisted.collapsed ?? {};
		const persistedHas = Object.prototype.hasOwnProperty.call(persistedCollapsed, d.id);
		const initialExpanded = persistedHas
			? !persistedCollapsed[d.id]
			: d.defaultExpanded !== false;
		card.dataset.collapsed = initialExpanded ? 'false' : 'true';
		header.setAttribute('aria-expanded', initialExpanded ? 'true' : 'false');

		const persistedVisible = persisted.visible ?? {};
		const visibleInitial = Object.prototype.hasOwnProperty.call(persistedVisible, d.id)
			? !!persistedVisible[d.id]
			: d.defaultVisible !== false;
		card.hidden = !visibleInitial;

		header.addEventListener('click', () => {
			const next = card.dataset.collapsed !== 'false' ? true : false;
			setExpanded(d.id, next);
		});

		// Drag affordances wired further down (need closures over `order`).
		return {
			id: d.id,
			title: d.title,
			card,
			head,
			grip,
			header,
			body,
			visible: visibleInitial,
		};
	}

	// ── ordering ──────────────────────────────────────────────────────
	let order: string[] = resolveInitialOrder(descriptors, persisted.order);
	for (const id of order) {
		const rec = byId.get(id);
		if (rec) root.appendChild(rec.card);
	}

	function renderOrder(): void {
		for (const id of order) {
			const rec = byId.get(id);
			if (rec) root.appendChild(rec.card);
		}
	}

	function persist(): void {
		const collapsed: Record<string, boolean> = {};
		const visible: Record<string, boolean> = {};
		for (const rec of byId.values()) {
			if (rec.card.dataset.collapsed === 'true') collapsed[rec.id] = true;
			if (!rec.visible) visible[rec.id] = false;
		}
		writePersisted(storage, STORAGE_KEY, { order: [...order], collapsed, visible });
	}

	function moveTo(id: string, targetIndex: number): boolean {
		const from = order.indexOf(id);
		if (from < 0) return false;
		const clamped = Math.max(0, Math.min(order.length - 1, targetIndex));
		if (from === clamped) return false;
		order.splice(from, 1);
		order.splice(clamped, 0, id);
		renderOrder();
		persist();
		onReorder?.([...order]);
		return true;
	}

	function visibleOrder(): string[] {
		return order.filter((id) => byId.get(id)?.visible);
	}

	// ── grip drag (pointer) ───────────────────────────────────────────
	let pointerDrag: {
		id: string;
		card: HTMLElement;
		pointerId: number;
		dropIndex: number;
	} | null = null;

	function clearDropTargets(): void {
		for (const rec of byId.values()) delete rec.card.dataset.dropTarget;
	}

	function setDragging(id: string | null): void {
		for (const rec of byId.values()) {
			if (rec.id === id) rec.card.dataset.dragging = 'true';
			else delete rec.card.dataset.dragging;
		}
	}

	function pointerMoveHandler(ev: PointerEvent): void {
		if (!pointerDrag) return;
		const cards = visibleOrder().map((id) => byId.get(id)!.card);
		clearDropTargets();
		let targetIndex = order.indexOf(pointerDrag.id);
		for (let i = 0; i < cards.length; i++) {
			const c = cards[i]!;
			const rect = c.getBoundingClientRect();
			const mid = rect.top + rect.height / 2;
			if (ev.clientY < mid) {
				c.dataset.dropTarget = c === pointerDrag.card ? 'self' : 'above';
				targetIndex = order.indexOf(c.dataset.inspectorCard ?? '');
				break;
			}
			if (i === cards.length - 1) {
				c.dataset.dropTarget = c === pointerDrag.card ? 'self' : 'below';
				targetIndex = order.indexOf(c.dataset.inspectorCard ?? '');
			}
		}
		pointerDrag.dropIndex = targetIndex;
	}

	function pointerUpHandler(_ev: PointerEvent): void {
		if (!pointerDrag) return;
		const { id, grip, dropIndex } = {
			id: pointerDrag.id,
			grip: byId.get(pointerDrag.id)!.grip,
			dropIndex: pointerDrag.dropIndex,
		};
		grip.setAttribute('aria-grabbed', 'false');
		setDragging(null);
		clearDropTargets();
		window.removeEventListener('pointermove', pointerMoveHandler);
		window.removeEventListener('pointerup', pointerUpHandler);
		window.removeEventListener('pointercancel', pointerUpHandler);
		const moved = moveTo(id, dropIndex);
		if (moved) {
			const newPos = order.indexOf(id) + 1;
			announce(`${byId.get(id)?.title ?? id} moved to position ${newPos} of ${order.length}.`);
		}
		pointerDrag = null;
	}

	function attachPointerDrag(rec: SectionRecord): void {
		rec.grip.addEventListener('pointerdown', (ev) => {
			// keyboard mode is separate — ignore if a keyboard grab is in progress.
			if (kbGrab && kbGrab.id !== rec.id) return;
			if (ev.button !== 0) return;
			ev.preventDefault();
			rec.grip.setAttribute('aria-grabbed', 'true');
			setDragging(rec.id);
			pointerDrag = {
				id: rec.id,
				card: rec.card,
				pointerId: ev.pointerId,
				dropIndex: order.indexOf(rec.id),
			};
			window.addEventListener('pointermove', pointerMoveHandler);
			window.addEventListener('pointerup', pointerUpHandler);
			window.addEventListener('pointercancel', pointerUpHandler);
		});
	}

	// ── grip keyboard reorder ─────────────────────────────────────────
	let kbGrab: { id: string; startIndex: number } | null = null;

	function attachKeyboardGrab(rec: SectionRecord): void {
		rec.grip.addEventListener('keydown', (ev) => {
			const key = ev.key;
			if (!kbGrab) {
				if (key === ' ' || key === 'Enter') {
					ev.preventDefault();
					kbGrab = { id: rec.id, startIndex: order.indexOf(rec.id) };
					rec.grip.setAttribute('aria-grabbed', 'true');
					setDragging(rec.id);
					announce(
						`Grabbed ${rec.title}. Use Arrow Up or Arrow Down to move, Enter or Space to drop, Escape to cancel.`,
					);
				}
				return;
			}
			// In keyboard grab mode.
			if (kbGrab.id !== rec.id) return;
			if (key === 'ArrowUp') {
				ev.preventDefault();
				const idx = order.indexOf(rec.id);
				if (idx > 0) {
					moveTo(rec.id, idx - 1);
					announce(`${rec.title} at position ${idx} of ${order.length}.`);
				}
				rec.grip.focus();
			} else if (key === 'ArrowDown') {
				ev.preventDefault();
				const idx = order.indexOf(rec.id);
				if (idx < order.length - 1) {
					moveTo(rec.id, idx + 1);
					announce(`${rec.title} at position ${idx + 2} of ${order.length}.`);
				}
				rec.grip.focus();
			} else if (key === ' ' || key === 'Enter') {
				ev.preventDefault();
				const finalIdx = order.indexOf(rec.id) + 1;
				rec.grip.setAttribute('aria-grabbed', 'false');
				setDragging(null);
				announce(`Dropped ${rec.title} at position ${finalIdx} of ${order.length}.`);
				kbGrab = null;
			} else if (key === 'Escape') {
				ev.preventDefault();
				if (kbGrab) {
					moveTo(rec.id, kbGrab.startIndex);
					rec.grip.setAttribute('aria-grabbed', 'false');
					setDragging(null);
					announce(`Reorder cancelled. ${rec.title} returned to original position.`);
					kbGrab = null;
				}
			}
		});
		rec.grip.addEventListener('blur', () => {
			// Auto-cancel keyboard grab if focus leaves the grip without an
			// explicit drop. Mirrors the WAI-ARIA APG drag handle pattern.
			if (kbGrab && kbGrab.id === rec.id) {
				rec.grip.setAttribute('aria-grabbed', 'false');
				setDragging(null);
				kbGrab = null;
			}
		});
	}

	for (const rec of byId.values()) {
		attachPointerDrag(rec);
		attachKeyboardGrab(rec);
	}

	// ── public API ────────────────────────────────────────────────────
	function setExpanded(id: string, expanded: boolean): void {
		const rec = byId.get(id);
		if (!rec) return;
		const current = rec.card.dataset.collapsed !== 'true';
		if (current === expanded) return;
		rec.card.dataset.collapsed = expanded ? 'false' : 'true';
		rec.header.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		persist();
		onToggle?.(id, expanded);
	}

	function setVisible(id: string, visible: boolean): void {
		const rec = byId.get(id);
		if (!rec) return;
		if (rec.visible === visible) return;
		rec.visible = visible;
		rec.card.hidden = !visible;
		persist();
	}

	function isExpanded(id: string): boolean {
		const rec = byId.get(id);
		return rec ? rec.card.dataset.collapsed !== 'true' : false;
	}

	function isVisible(id: string): boolean {
		const rec = byId.get(id);
		return rec ? rec.visible : false;
	}

	function getOrder(): string[] {
		return [...order];
	}

	function setOrder(next: string[]): void {
		const known = next.filter((id) => byId.has(id));
		const seen = new Set(known);
		for (const id of order) if (!seen.has(id)) known.push(id);
		order = known;
		renderOrder();
		persist();
		onReorder?.([...order]);
	}

	function getCardElement(id: string): HTMLElement | null {
		return byId.get(id)?.card ?? null;
	}

	function getBodyElement(id: string): HTMLElement | null {
		return byId.get(id)?.body ?? null;
	}

	return {
		root,
		setExpanded,
		setVisible,
		isExpanded,
		isVisible,
		getOrder,
		setOrder,
		getCardElement,
		getBodyElement,
	};
}
