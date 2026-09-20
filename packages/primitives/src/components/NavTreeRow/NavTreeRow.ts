import type { NavTreeRowConfig, NavTreeRowHandle } from './types.js';

/** A navigation disclosure row with sibling action controls.
 *
 * The primitive deliberately does not own the controlled branch, persistence,
 * ordering, or the lifetime of action handles. Consumers apply the requested
 * expansion to their own panel and call setExpanded with the accepted state.
 */
export class NavTreeRow implements NavTreeRowHandle {
	readonly element: HTMLElement;
	readonly disclosure: HTMLButtonElement;
	readonly actionHost: HTMLElement;
	private readonly leading: HTMLElement;
	private readonly leadingCollapsed: HTMLElement;
	private readonly leadingExpanded: HTMLElement;
	private readonly label: HTMLElement;
	private readonly trailing: HTMLElement;
	private expanded: boolean;
	private readonly onExpandedChange: NavTreeRowConfig['onExpandedChange'];
	private readonly clickHandler: (event: MouseEvent) => void;
	private readonly keydownHandler: (event: KeyboardEvent) => void;

	constructor(config: NavTreeRowConfig) {
		const doc = config.document ?? document;
		this.expanded = config.expanded;
		this.onExpandedChange = config.onExpandedChange;

		this.element = doc.createElement('div');
		this.element.className = 's-nav-tree-row';
		const variant = config.variant ?? 'item';
		this.element.dataset.variant = variant;
		this.element.classList.add(`s-nav-tree-row--${variant}`);
		for (const [name, value] of Object.entries(config.attributes ?? {})) {
			this.element.setAttribute(name, value);
		}

		this.disclosure = doc.createElement('button');
		this.disclosure.type = 'button';
		this.disclosure.className = 's-nav-tree-row__disclosure';
		this.disclosure.setAttribute('aria-controls', config.controls);

		this.leading = doc.createElement('span');
		this.leading.className = 's-nav-tree-row__leading';
		this.leading.setAttribute('aria-hidden', 'true');
		this.leadingCollapsed = doc.createElement('span');
		this.leadingCollapsed.className = 's-nav-tree-row__leading-collapsed';
		this.leadingExpanded = doc.createElement('span');
		this.leadingExpanded.className = 's-nav-tree-row__leading-expanded';
		this.leading.append(this.leadingCollapsed, this.leadingExpanded);

		this.label = doc.createElement('span');
		this.label.className = 's-nav-tree-row__label';
		this.trailing = doc.createElement('span');
		this.trailing.className = 's-nav-tree-row__trailing';
		this.trailing.setAttribute('aria-hidden', 'true');

		this.actionHost = doc.createElement('div');
		this.actionHost.className = 's-nav-tree-row__actions';
		this.actionHost.setAttribute('aria-label', `${config.label} actions`);

		this.disclosure.append(this.leading, this.label, this.trailing);
		this.element.append(this.disclosure, this.actionHost);
		this.setLabel(config.label);
		this.setLeading(config.leading, config.leadingExpanded);
		this.setTrailing(config.trailing);
		this.setActions(config.actions ?? []);
		this.setActive(Boolean(config.active));
		this.setDisabled(Boolean(config.disabled));
		this.setExpanded(config.expanded);

		this.clickHandler = event => this.request(!this.expanded, event);
		this.keydownHandler = event => {
			if (event.key === 'ArrowRight' && !this.expanded) {
				event.preventDefault();
				this.request(true, event);
			} else if (event.key === 'ArrowLeft' && this.expanded) {
				event.preventDefault();
				this.request(false, event);
			}
		};
		this.disclosure.addEventListener('click', this.clickHandler);
		this.disclosure.addEventListener('keydown', this.keydownHandler);
	}

	private request(expanded: boolean, event: Event): void {
		if (this.disclosure.disabled) return;
		this.onExpandedChange(expanded, event);
	}

	setLabel(label: string): void {
		this.label.textContent = label;
		this.actionHost.setAttribute('aria-label', `${label} actions`);
	}

	setLeading(collapsed?: Node, expanded?: Node): void {
		this.leadingCollapsed.replaceChildren(...(collapsed ? [collapsed] : []));
		this.leadingExpanded.replaceChildren(...(expanded ? [expanded] : collapsed ? [collapsed.cloneNode(true)] : []));
		this.leading.hidden = !collapsed && !expanded;
	}

	setTrailing(trailing?: Node): void {
		this.trailing.replaceChildren(...(trailing ? [trailing] : []));
		this.trailing.hidden = !trailing;
	}

	setExpanded(expanded: boolean): void {
		this.expanded = expanded;
		this.disclosure.setAttribute('aria-expanded', String(expanded));
		this.leadingCollapsed.hidden = expanded;
		this.leadingExpanded.hidden = !expanded;
	}

	setActive(active: boolean): void {
		if (active) this.disclosure.setAttribute('aria-current', 'true');
		else this.disclosure.removeAttribute('aria-current');
	}

	setDisabled(disabled: boolean): void {
		this.disclosure.disabled = disabled;
		this.actionHost.toggleAttribute('inert', disabled);
	}

	setActions(actions: readonly HTMLElement[]): void {
		for (const action of actions) action.classList.add('s-nav-tree-row__action');
		this.actionHost.replaceChildren(...actions);
		this.element.toggleAttribute('data-has-actions', actions.length > 0);
	}

	destroy(): void {
		this.disclosure.removeEventListener('click', this.clickHandler);
		this.disclosure.removeEventListener('keydown', this.keydownHandler);
		this.element.remove();
	}
}

export function createNavTreeRow(config: NavTreeRowConfig): NavTreeRow {
	return new NavTreeRow(config);
}

export type { NavTreeRowConfig, NavTreeRowHandle } from './types.js';
