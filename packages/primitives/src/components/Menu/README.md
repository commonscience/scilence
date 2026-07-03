# Menu

Pan-app dropdown / action-menu primitive. Fills the confirmed NET-NEW
Menu/MenuItem gap (`research/specs/DS_COMPONENTIZATION_CATALOG.md` §A21 —
27+ hand-rolled `aria-haspopup`/menu sites shell-wide). First consumer:
the GUIDE shell footer account menu.

## Scope

Menu owns the menu *contents*: `role="menu"` semantics, roving-tabindex
keyboard nav (Arrows / Home / End; Enter/Space activate natively), and row
rendering — items (icon / label / hint / trailing / danger / disabled /
active), separators, group headers, and free-form `custom` presentation rows
(identity blocks).

Menu does **not** own anchor positioning, portaling, or open/close lifecycle —
the consumer's popover engine (or a future Popover primitive) owns placement
and dismissal, including Escape. This keeps Menu embeddable in any host
(footer popovers, headers, right rails).

## Variants

- `size`: `sm` (compact chrome menus, default) | `md`
- `chrome`: `surface` (paints its own raised-plane bg/border/shadow — shadow
  carve-out per `feedback_box_shadow_carveouts`, default) | `bare`
  (transparent; for embedding in a host that already owns the surface)

## Usage

```ts
import { createMenu } from '@scilence/primitives';

const menu = createMenu({
	ariaLabel: 'Account menu',
	variants: { size: 'sm', chrome: 'bare' },
	entries: [
		{ custom: identityHeaderEl },
		{ separator: true },
		{ id: 'settings', label: 'Settings', icon: gearSvg },
		{ id: 'help', label: 'Help & shortcuts', hint: '?' },
		{ separator: true },
		{ id: 'sign-out', label: 'Sign out', danger: true },
	],
	onSelect: (id) => handleAction(id),
});
host.appendChild(menu.element);
menu.focusFirst();
```

## Deferred (add when a consumer needs them)

Submenus, typeahead, `menuitemradio`/`menuitemcheckbox` roles.
