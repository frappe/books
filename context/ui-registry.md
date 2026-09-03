# UI Registry

Living document. Updated after every component is built or changed. Read this before building any new component — match existing patterns exactly before inventing new ones.

---

## How to Use

Before building any component:

1. Check if a similar component already exists here (or in `src/components/`)
2. If yes — match its exact classes and prop conventions
3. If no — build it following `ui-rules.md` and `ui-tokens.md`, then add it here

After building any component — update this file with the component name, file path, and exact classes/props used.

---

## Existing Base Components (inherited from Frappe Books — inventory as of repo inspection, not exhaustive)

These already exist in `src/components/` and should be reused rather than re-built. Details (exact classes, full prop lists) should be filled in here the first time each one is touched during a RareBooks session, rather than assumed from this summary.

| Component | Path | Purpose |
| ----------- | ------ | -------- |
| `Button.vue` | `src/components/Button.vue` | Primary/secondary button, loading spinner, icon support |
| `Badge.vue` | `src/components/Badge.vue` | Small status/label badge |
| `StatusPill.vue` | `src/components/StatusPill.vue` | Colored status pill driven by `getBgTextColorClass()` (gray/orange/red/green/blue/yellow) |
| `Avatar.vue` | `src/components/Avatar.vue` | User avatar |
| `Dialog.vue` / `Modal.vue` | `src/components/Dialog.vue`, `Modal.vue` | Modal dialogs |
| `Dropdown.vue` / `DropdownWithActions.vue` | `src/components/` | Dropdown menus |
| `FilterDropdown.vue` | `src/components/FilterDropdown.vue` | List view filters |
| `FormContainer.vue` / `FormHeader.vue` / `TwoColumnForm.vue` | `src/components/` | Doctype form layout |
| `PageHeader.vue` / `PageHeaderNavGroup.vue` | `src/components/` | Page-level header/nav |
| `Paginator.vue` | `src/components/Paginator.vue` | List pagination |
| `Popover.vue` / `Tooltip.vue` | `src/components/` | Popovers/tooltips |
| `QuickView.vue` | `src/components/QuickView.vue` | Quick-view side panel |
| `SearchBar.vue` | `src/components/SearchBar.vue` | Global/list search |
| `Sidebar.vue` | `src/components/Sidebar.vue` | Left navigation |
| `Toast.vue` | `src/components/Toast.vue` | Toast notifications |
| `ExportWizard.vue` | `src/components/ExportWizard.vue` | Data export flow |
| `HowTo.vue` / `ShortcutKeys.vue` / `ShortcutsHelper.vue` | `src/components/` | Onboarding/help UI |
| `WindowsTitleBar.vue` | `src/components/WindowsTitleBar.vue` | Custom title bar (Windows) |
| `Controls/*` | `src/components/Controls/` | Field-level input controls per fieldtype (Data, Link, Select, Date, Currency, etc.) |
| `Charts/*` | `src/components/Charts/` | Dashboard/report charts |
| `POS/Classic/*`, `POS/Modern/*` | `src/components/POS/` | Point of Sale UI (two variants) |
| `Report/*` | `src/components/Report/` | Report rendering components |

## RareBooks-Specific Components (custom/)

| Component | Path | Purpose |
| ----------- | ------ | -------- |
| `SyncNotification.vue` | `custom/src/components/SyncNotification.vue` | Sync status notification |
| `DatabaseSelectorCustom.vue` | `custom/src/pages/DatabaseSelectorCustom.vue` | RareBooks-branded database/company selector, replaces base selector |

---

## Web-Only Components (target design — not built yet)

RareBooks now targets both Desktop and Web (see `architecture.md`). The Web target reuses every component above unchanged — same Vue/Tailwind layer, no visual divergence — plus a small set of new components specific to Web's auth/billing flows. Build these following `ui-rules.md`/`ui-tokens.md` exactly like any other component, and move each out of this section into the main tables above once built.

| Component (planned) | Suggested path | Purpose |
| ---------------------- | ----------------- | --------- |
| Clerk sign-in/sign-up embed | `src/pages/web/SignIn.vue` | Wraps Clerk's hosted components in the app's card/layout conventions |
| Organization switcher/creator | `src/components/web/OrgSwitcher.vue` | Create/switch active Clerk organization |
| Billing page | `src/pages/web/Billing.vue` | Shows subscription status, PayPal checkout button, Lipa Namba instructions + claim form (tabbed or region-detected) |
| PayPal checkout button | `src/components/web/PayPalCheckoutButton.vue` | Wraps `Button.vue`, triggers the PayPal subscription create/redirect flow |
| Lipa Namba instructions panel | `src/components/web/LipaNambaInstructions.vue` | Static paybill/reference instructions, reuses card conventions |
| Payment claim form | `src/components/web/PaymentClaimForm.vue` | Reuses `Controls/` field components for reference/amount entry |
| Payment review list (super admin only) | `src/pages/web/PaymentReview.vue` | Lists pending Lipa Namba claims with approve/reject actions, reuses table conventions from `ui-rules.md` |
| Subscription status badge | Extend `StatusPill.vue` usage | `ACTIVE`/`PAST_DUE`/`EXPIRED`/`PENDING_REVIEW` states, mapped to the existing 6-color status system — do not invent new colors |

---

## New Components Built This Session

_None yet — add entries here as new components are built, following the same table format above (Component / Path / Purpose / exact classes used)._
