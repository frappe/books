<!-- System architecture: how the app is structured and how data flows through it -->

# Architecture

RareBooks now targets **two deployment forms** from one codebase:

- **Desktop (Electron)** — the existing, shipped product. Local SQLite per company, Keymint device-bound licensing, ClickPesa mobile-money payments. Unchanged by this migration.
- **Web (Cloudflare)** — the in-progress migration. Multi-tenant, Clerk-authenticated, Neon-backed, deployed on Cloudflare Workers with a Hono API. No Keymint, no ClickPesa. Access is gated by our own subscription status plus Clerk's native per-org member cap (`maxAllowedMemberships`, synced from our plan tiers); payments are PayPal Subscriptions (non-Tanzania) or manually-verified Lipa Namba (Tanzania).

Everything below is organized by target where the two diverge, and shared where they don't.

## Stack

| Layer          | Desktop (Electron)                          | Web (Cloudflare)                                                     |
| -------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Shell          | Electron 22 + Vue 3 (Vite), main + renderer processes | Cloudflare Workers (Hono API) + Vue 3 SPA served as static assets, browser-only renderer |
| Language       | TypeScript (strict), `.vue` SFCs             | Same                                                                     |
| Database       | SQLite (`better-sqlite3` + Knex), local file per company | Neon (Postgres) — **one Neon project per tenant** (silo model), provisioned via the Neon API on org creation; a small shared "control plane" Neon project maps organizations to their tenant project/connection details |
| ORM            | `fyo` (custom Doc/Model framework) over SQLite | `fyo` — same Doc/Model framework, swapped onto a Postgres-speaking backend via `DatabaseDemuxWeb` |
| Platform demux | `fyo/demux/*.ts` → Electron `ipcRenderer`    | `fyo/demux/*.ts` → `fetch()` calls to the Hono API (`rendererWeb.ts` entry point) |
| Auth           | Local `User` doctype (PBKDF2) + default super admin | Clerk (auth + organization/tenant management; seat limits enforced natively via Clerk's `maxAllowedMemberships`, synced from our plan tiers) |
| Licensing      | Keymint.dev (device-bound, hybrid online/offline) | **None** — access gated by subscription status, not a license key       |
| Payments       | ClickPesa (Tanzania USSD push)               | PayPal Subscriptions API (non-Tanzania) + manual Lipa Namba instructions (Tanzania), verified by a super admin |
| Storage        | Local filesystem only                        | Neon — tenant project per org (accounting data) + one control-plane project (org/subscription/payment bookkeeping) |
| Notifications  | ntfy, custom restock/payment notifications   | OneSignal, plus the same restock/payment notification logic             |
| Styling        | Tailwind CSS v3 (postcss7-compat) + `colors.json` | Same — no styling changes for the web migration                         |
| Build/Deploy   | electron-builder (Windows incl. MSIX, macOS, Linux) | Cloudflare Workers deploy (Wrangler)                                     |
| Testing        | mocha + tape, Playwright (`uitest`)          | Same test tooling, plus Worker-side tests for the Hono API               |

RareBooks is a fork of **Frappe Books**, an open-source offline-first double-entry accounting desktop app. Charles's customizations live almost entirely under `custom/` to stay fork-safe against upstream `frappe/books` merges — this holds for both targets: web-specific code should live under `custom/web/` (or equivalent), not scattered into core files.

---

## Folder Structure

```
/
├── main.ts                     # Electron main process entry point — Desktop only
├── main/                       # Electron main process: IPC, auto-updater, print/PDF — Desktop only
├── backend/                    # Knex + SQLite CRUD/patches — Desktop only
├── worker/                     # NEW — Hono API on Cloudflare Workers — Web only
│   ├── routes/                 # Hono route handlers (auth callback, doc CRUD, subscription, payments)
│   ├── middleware/              # Clerk session verification, tenant-project resolution, subscription-status checks (seat limits are Clerk's own, not checked here)
│   └── db/                     # Control-plane Neon client (org→project mapping) + per-tenant connection resolver — NOT a single shared Neon client, see architecture.md → Database
├── schemas/                    # JSON schema definitions (core, app, regional, meta) + builder code — shared
├── fyo/                        # Core client-adjacent framework (Doc ORM, demux, core handlers) — shared
│   ├── demux/                  # Platform abstraction — electron (existing) + web (NEW) implementations
│   ├── model/                  # Doc (ORM) class — shared
│   └── core/                   # dbHandler, authHandler — shared, authHandler gets a Clerk-aware web variant
├── models/                     # Model classes extending Doc — business logic — shared
├── reports/                    # Report logic + view config — shared
├── src/                        # Vue UI — shared
│   ├── components/             # Reusable Vue components — shared, plus new web-only auth/billing components
│   ├── pages/                  # Page-level Vue components — shared, plus new web-only pages (sign-in, billing)
│   ├── setup/                  # Setup wizard — shared, org creation added for web
│   └── renderer/                # Electron renderer process init — Desktop only
├── rendererWeb.ts               # NEW — browser entry point, replaces main.ts/renderer/ for Web
├── custom/                     # RareBooks-specific customizations — kept fork-safe, isolated from upstream
│   ├── licensing/               # Keymint hybrid license system — Desktop only, untouched by this migration
│   ├── web/                     # NEW — all web-only custom code lives here
│   │   ├── auth/                 # Clerk integration (org creation, syncing plan tier → Clerk's maxAllowedMemberships, webhooks)
│   │   ├── payments/             # PayPal Subscriptions client + webhook handler, Lipa Namba manual-verification flow
│   │   └── notifications/        # OneSignal integration
│   ├── schemas/, models/        # Custom schema/model additions (e.g. Expense, NumberSeries) — shared
│   ├── main/, setup/, patches/  # Custom main-process hooks, default super admin setup — Desktop only
│   └── src/                     # Custom Vue components — shared, plus web-only components under src/web/
├── regional/                    # Regional (country) config — shared
├── translations/                 # CSV translation files per language — shared
├── templates/                   # Print/invoice HTML templates — shared
├── tests/                       # RareBooks-specific spec files — shared, plus worker/ tests for Web
├── build/                       # electron-builder assets — Desktop only
├── colors.json                  # Design token source of truth — shared
└── utils/                       # Platform-agnostic shared utilities — shared
```

`worker/`, `rendererWeb.ts`, and `custom/web/` are new — they don't exist in the repo yet as of this inspection (2026-09-02); the `rarebooks-webapp` branch currently contains only POS UI fixes, not this structure. Treat the paths above as the target layout to build toward, not confirmed current state.

---

## System Boundaries

| Folder                  | Owns                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| `main/`, `main.ts`       | Electron main process ("server"), **Desktop only**. Owns IPC listeners, auto-updater, DB file access, printing, Keymint licensing IPC. Cannot import client (`src/`) code, and must never be bundled into the Web build. |
| `worker/`                | Hono API on Cloudflare Workers, **Web only**. Owns HTTP routes, Clerk session verification, tenant-project resolution (control plane lookup + per-request Neon connection), PayPal/Lipa Namba payment routes. Cannot import Electron-only code (`main/`, `custom/licensing/`). |
| `backend/`               | Knex + SQLite CRUD, migration patches, **Desktop only**. Not used by the Web target — `worker/db/` is Web's equivalent, talking to Neon/Postgres instead. |
| `src/`                   | Vue UI layer, shared by both targets. Cannot import server code (`main/`, `backend/`, `worker/`) directly — always goes through `fyo.db`/`fyo.auth` via the platform demux. |
| `fyo/demux/*`            | **Only** files allowed to be platform-aware. Desktop demux calls `ipcRenderer`; Web demux calls the Hono API via `fetch()`. All other client code stays platform-agnostic. |
| `models/`, `reports/`    | Client-adjacent business logic, shared by both targets — tested with mocha on Node. Must not globally import Vue/frontend code; dynamic `import()` only, never outside test paths. |
| `schemas/`               | Server-side JSON schema definitions and schema-builder code, shared by both targets.           |
| `utils/`, `dummy/`        | Platform-agnostic. No `node` `fs` or browser `window` APIs.                                    |
| `custom/licensing/`      | Keymint device-bound licensing — **Desktop only**. Must never be imported from `worker/`, `rendererWeb.ts`, or anything under `custom/web/`. |
| `custom/web/`            | All Web-only custom code (Clerk, PayPal, Lipa Namba manual flow, OneSignal) — kept isolated the same way `custom/licensing/` is, so it never leaks into the Desktop build. |
| `custom/` (general)      | RareBooks-only additions overall. Kept isolated so upstream `frappe/books` merges stay low-conflict — integration points into core files are minimal and documented per feature. |

---

## Data Flows

### Flow 1a — Electron IPC (Desktop, Client ↔ Main)

```
Vue component / page action (src/)
        ↓
fyo/demux/*.ts  (electron implementation)
        ↓  ipcRenderer.send / ipcRenderer.invoke
main/registerIpcMainActionListeners.ts (main.ts)
        ↓
backend/ (Knex query against SQLite)
        ↓
Response back over IPC → fyo singleton (db/doc/auth) → UI reactively updates
```

### Flow 1b — Web API (Web, Client ↔ Worker) — target design

```
Vue component / page action (src/, running in the browser via rendererWeb.ts)
        ↓
fyo/demux/*.ts  (web implementation — fetch() instead of ipcRenderer)
        ↓  HTTP request, Clerk session token attached
worker/routes/*.ts (Hono, on Cloudflare Workers)
        ↓  middleware: verify Clerk session → resolve org/tenant → check subscription status (control-plane)
        ↓     (seat/member limits are enforced by Clerk itself via maxAllowedMemberships — see library-docs.md; not re-checked here)
        ↓  worker/db/: look up the org's Neon project connection details in the control-plane project
        ↓     (cached per-request / short-TTL cache — never re-provision on every request)
worker/db/ (Neon query against THAT tenant's own Neon project — never the control-plane project, never another tenant's)
        ↓
JSON response → fyo singleton (db/doc/auth) → UI reactively updates
```

The tenant-project lookup is the one extra hop this model adds over a shared-database approach — it trades a small per-request lookup for full physical data isolation between tenants (no `org_id` filter to get wrong).

### Flow 2 — Doc/ORM Lifecycle (shared)

```
Schema (schemas/**/*.json) defines shape
        ↓
Model (models/**/*.ts) extends Doc — adds business logic/validation
        ↓
fyo.doc.getNewDoc() / fyo.doc.getDoc() → Doc instance ("doc")
        ↓
doc.sync() → fyo.db (via demux, electron or web) → backend/SQLite or worker/db against the signed-in org's own Neon project
        ↓
Observers (`method:schemaName`) fire on fyo.db.observer / fyo.doc.observer
```

### Flow 2b — Tenant Provisioning (Web only, target design)

```
Clerk `organization.created` webhook fires (new org signs up)
        ↓
worker/routes/webhooks/clerk-org-created.ts
        ↓
Neon API: POST /projects  (or @neon/sdk's createAndConnect()) — creates a new, isolated Neon project for this org
        ↓
Connection details (project_id + connection string) written to the control-plane project's `tenant_projects` table, connection string encrypted at rest
        ↓
Tenant project's schema is applied (accounting tables — same schema Desktop uses, Postgres-flavored) via a migration run against the fresh project
        ↓
Org is now usable — first request after signup resolves its project via Flow 1b above
```

### Flow 3a — Desktop Licensing & Payments (unchanged, Keymint + ClickPesa)

```
App start → custom/licensing/ipc/registerLicenseIpcListeners (registered in main.ts, fork-safe try/catch)
        ↓
LicenseManager.checkLicense()
        ↓
Online: keymint-client.ts → keymint.dev REST API
   or
Offline: encrypted AES-256-GCM cache (license-cache.ts) + 7-day grace period (grace-period.ts)
        ↓
Device binding via fingerprint/device-id.ts (machine ID + MAC → SHA-256)

Payment (license purchase):
User enters phone number → subscription-manager.ts validates TZ phone format
        ↓
clickpesa-client.ts → ClickPesa USSD push (preview → initiate) → mobile money prompt on user's phone
        ↓
Payment confirmed → license activated via Keymint
```

This flow is Desktop-only and stays exactly as-is. Nothing about it changes for the Web migration.

### Flow 3b — Web Access Gating & Payments (target design)

```
Sign-in → Clerk handles auth, resolves the user's organization (tenant)
        ↓
worker middleware, on every API request: read org's subscription status from the control-plane `subscriptions` table
        ↓
ACTIVE → request proceeds
PAST_DUE / EXPIRED → request rejected, client shown a billing/upgrade prompt (no grace period, no offline mode — Web requires connectivity)

(Member/seat limits are a separate concern, enforced by Clerk itself — see library-docs.md → Clerk. When a subscription's plan tier changes, sync the new seat count to Clerk's `maxAllowedMemberships` for that org; Clerk then blocks new invitations over the cap on its own, no per-request check needed here.)

Payment — user outside Tanzania:
User starts checkout → worker/routes creates a PayPal subscription (PayPal Subscriptions API)
        ↓
PayPal webhook (BILLING.SUBSCRIPTION.ACTIVATED / .CANCELLED / .SUSPENDED / PAYMENT.SALE.COMPLETED etc.)
        ↓
worker/routes/payments/paypal-webhook.ts updates the org's subscription status in Neon (shared payments table + org's subscription record)

Payment — user in Tanzania:
User is shown Lipa Namba paybill/instructions in the billing page (no API call — informational only)
        ↓
User pays via mobile money outside the app, then submits a payment reference/proof in-app
        ↓
Claim recorded in the shared payments table (status: PENDING_REVIEW)
        ↓
Super admin reviews claims in an admin view → approves/rejects
        ↓
Approved → org's subscription status updated in Neon, same shape/fields as the PayPal-driven path
```

### Flow 4 — Notifications

```
Desktop: Inventory/payment event in a model → custom notification handler → ntfy / in-app Toast
Web:     Same event → custom notification handler → OneSignal push, same triggering logic
```

Tests: `restockNotification.spec.ts`, `paymentMethodNotification.spec.ts`, `ntfyNotification.spec.ts` (Desktop). A OneSignal-equivalent test suite should be added under `custom/web/notifications/` before this ships.

---

## Database Schema

RareBooks inherits the full Frappe Books accounting schema (Party, SalesInvoice, PurchaseInvoice, Payment, JournalEntry, Item, StockLedgerEntry, Account, etc.). This is shared by both targets, but the two targets store it very differently:

- **Desktop:** one SQLite file per company — the file itself is the tenant boundary.
- **Web:** one Neon project per tenant (silo model, not a shared database) — physical isolation, not a filter. There is **no `org_id` column** on accounting tables in this model, because each tenant's Neon project only ever contains that tenant's data. This is a deliberate choice over the earlier shared-database + `org_id`-column design: it trades a small provisioning/lookup overhead for eliminating an entire class of bug (a missing or wrong `org_id` filter leaking data across tenants).

A second, small **control-plane Neon project** (one project, shared, provisioned once) exists purely to hold cross-tenant bookkeeping: which org owns which tenant project, and subscription/payment status. It never holds accounting data.

### Control-Plane Project (one project, shared across all tenants)

#### `organizations`

| Column        | Type      | Notes                                  |
| --------------- | --------- | ----------------------------------------- |
| id              | text      | Clerk organization ID, primary key       |
| name            | text      |                                          |
| plan_seat_limit | integer   | The seat count for the org's current plan tier — kept in sync with Clerk's `maxAllowedMemberships` on that org whenever the plan changes (via Clerk's Backend API). This is a record of what we intended to set, not a value `worker/middleware/` re-checks per request — Clerk enforces the actual cap itself. |
| created_at      | timestamptz |                                        |

#### `tenant_projects` (org → Neon project mapping — the core of the silo model)

| Column               | Type        | Notes                                                          |
| ---------------------- | ----------- | ------------------------------------------------------------------ |
| org_id                  | text        | → `organizations.id`, primary key (one project per org)           |
| neon_project_id         | text        | The tenant's Neon project ID                                       |
| connection_string       | text        | **Encrypted at rest** (same AES-256-GCM pattern used for Desktop's Keymint cache — see `library-docs.md`) |
| region                  | text        | Neon region the project was provisioned in                         |
| status                  | text        | `PROVISIONING`, `READY`, `SUSPENDED`, `FAILED`                     |
| created_at              | timestamptz |                                                                    |

#### `subscriptions`

| Column           | Type        | Notes                                                     |
| ------------------ | ----------- | ------------------------------------------------------------ |
| id                  | uuid        | Primary key                                                  |
| org_id              | text        | → `organizations.id`                                         |
| provider            | text        | `'paypal'` or `'lipa_namba'`                                 |
| status              | text        | `ACTIVE`, `PAST_DUE`, `EXPIRED`, `PENDING_REVIEW`, `CANCELLED` |
| paypal_subscription_id | text     | Nullable — only set when `provider = 'paypal'`               |
| current_period_end  | timestamptz | Nullable — not always meaningful for the manual Lipa Namba path |
| updated_at          | timestamptz |                                                              |

#### `payments` (shared payments ledger — both PayPal and Lipa Namba claims land here)

| Column          | Type        | Notes                                                              |
| ----------------- | ----------- | ------------------------------------------------------------------ |
| id                | uuid        | Primary key                                                        |
| org_id            | text        | → `organizations.id`                                               |
| provider          | text        | `'paypal'` or `'lipa_namba'`                                       |
| amount            | Currency    |                                                                    |
| status            | text        | `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `COMPLETED`               |
| reference         | text        | Lipa Namba: user-submitted transaction reference. PayPal: PayPal transaction/sale ID. |
| reviewed_by       | text        | Nullable — super admin's Clerk user ID, set only for manually-reviewed Lipa Namba claims |
| created_at        | timestamptz |                                                                    |

`subscriptions` and `payments` deliberately live in the control-plane project, not in each tenant's own project — billing/subscription state is a RareBooks platform concern, not the tenant's accounting data, and a super admin reviewing Lipa Namba claims across all orgs needs one place to query, not N separate tenant projects.

### Tenant Project (one project per org, provisioned via the Neon API — see Flow 2b above)

Each tenant project's schema is just the standard accounting schema — the same tables Desktop's SQLite file holds (Party, SalesInvoice, PurchaseInvoice, Payment, JournalEntry, Item, StockLedgerEntry, Account, etc.), Postgres-flavored instead of SQLite-flavored, with **no `org_id` column anywhere** — the project itself is the tenant boundary. Plus the shared custom additions below.

#### `Expense` (`custom/schemas/Expense.json`)

| Column          | Type | Notes                                             |
| ---------------- | ---- | -------------------------------------------------- |
| name             | Data | Primary key, auto-generated via `NumberSeries` (`Exp-`), hidden in UI |
| numberSeries     | Link | → `NumberSeries`, defaults to `Exp-`               |
| date             | Date | Required                                           |
| vendor           | Link | → `Party`                                          |
| expense_account  | Link | → `Account`                                        |
| amount           | Currency | Expense amount                                 |
| description      | Data | Free text                                          |

Note: on Desktop, `Expense` schema changes historically hit a SQLite `ALTER TABLE` limitation during the table "prestige" (rebuild) migration when existing rows predate new columns — see `custom/EXPENSE_MIGRATION_FIX.md`. Postgres does not have this limitation, so this specific failure mode doesn't apply to any tenant project, but keep providing column defaults on both targets for consistency. Applying a schema change to the Web target now means migrating it across every existing tenant project, not one shared database — plan for a migration runner that iterates tenant projects (via the control-plane's `tenant_projects` table) rather than a single `ALTER TABLE` run.

#### `NumberSeries` (custom variant, `custom/schemas/NumberSeries.json`)

Extended to support the `Expense` doctype's numbering series.

#### `Party` (core schema, custom field)

- Added `birth_date` field with validation.

---

## Storage

- **Desktop:** local-only, per-company SQLite database files on the user's machine. Keymint license cache via Electron `safeStorage` + `electron-store`, AES-256-GCM encrypted.
- **Web:** one Neon project per tenant for accounting data (see Database Schema above), plus one shared control-plane Neon project for org/subscription/payment bookkeeping. No shared storage bucket in either target currently — Lipa Namba payment proof, if ever needed beyond a text reference, would need a separate decision (Neon doesn't do blob storage; would likely mean Cloudflare R2).

---

## Authentication

- **Desktop app users (accounting system):** Local `User` doctype (PBKDF2-hashed passwords). A default super admin is auto-created on first company setup if no users exist (`custom/setup/createDefaultSuperAdmin.ts`). Unchanged.
- **Desktop software licensing:** Device-bound Keymint license, separate from app login. Unchanged, Desktop-only.
- **Web app users:** Clerk handles both authentication and organization (tenant) management. Every accounting request is scoped to the signed-in user's active Clerk organization. Member/seat limits are enforced natively by Clerk via each org's `maxAllowedMemberships` (set/updated through Clerk's Backend API whenever a subscription's plan tier changes) — `worker/middleware/` checks subscription status only, not seat count, since Clerk already blocks over-cap invitations on its own. Note: Clerk caps `maxAllowedMemberships` at 20 without their paid "B2B Authentication" add-on — any subscription tier planned above 20 seats needs that add-on confirmed first.
- **Web "super admin":** a RareBooks-level role (not a Clerk system role) used specifically to review and approve/reject pending Lipa Namba payment claims across all organizations, via the control-plane project's `payments` table. Needs its own authorization check in `worker/middleware/` distinct from normal org-scoped access.

---

## Key Integration Patterns

### Keymint Licensing (`custom/licensing/LicenseManager.ts`) — Desktop only, unchanged

```typescript
import { getLicenseManager, initializeLicensing } from './custom/licensing';

// Initialize on app startup (main.ts, fork-safe try/catch block)
const result = await initializeLicensing();
```

License states: `ACTIVE_ONLINE`, `ACTIVE_OFFLINE`, `GRACE_EXPIRING`, `GRACE_EXPIRED`, `INVALID`, `EXPIRED`, `UNLICENSED`. **Must never be imported from `worker/`, `rendererWeb.ts`, or `custom/web/`.**

### ClickPesa Payments (`custom/licensing/api/clickpesa-client.ts`) — Desktop only, unchanged

Preview → initiate USSD push request pattern against `https://api.clickpesa.com`. Tanzania phone formats: `+255XXXXXXXXX`, `255XXXXXXXXX`, `0XXXXXXXXX`. **Must never be imported from `worker/`, `rendererWeb.ts`, or `custom/web/`** — the Web target does not use ClickPesa at all.

### PayPal Subscriptions (`custom/web/payments/paypal-client.ts`) — Web only, target design

```typescript
// worker route creates a subscription against a pre-configured PayPal plan ID,
// then redirects the user to PayPal's approval URL.
// A webhook route verifies PayPal's signature and updates `subscriptions` + `payments` in Neon.
```

See `library-docs.md` for the PayPal Subscriptions API shape.

### Lipa Namba Manual Instructions (`custom/web/payments/lipa-namba.ts`) — Web only, target design

No external API call. The billing page renders static payment instructions (paybill/business number, reference format) for Tanzania users, collects a submitted reference, writes a `PENDING_REVIEW` row to `payments`, and a super admin view lists/approves/rejects those claims.

### Platform Demux Pattern (`fyo/demux/*.ts`) — shared, extended for Web

```typescript
// Electron implementation: branches on ipcRenderer
// Web implementation (NEW): branches on fetch() against the Hono worker API
// All other client code calls fyo.db / fyo.auth without knowing which platform it's on.
```

---

## Invariants

Rules the AI agent must never violate:

- Client code (`src/`) must never import server code (`main/`, `backend/`, `worker/`) directly, and vice versa.
- Only `fyo/demux/*.ts` files may contain platform-specific logic (`ipcRenderer` for Desktop, `fetch()` against the worker API for Web).
- `models/**` and `reports/**` must not globally import Vue or frontend-only code — mocha tests run these on Node. Frontend code may only be pulled in via dynamic `import()` on non-test paths.
- `models/**` must never import the singleton `Fyo` from `src/` — `fyo` is passed in as a parameter.
- All custom RareBooks code lives under `custom/` wherever possible, with the smallest possible number of touch-points in core files, to keep upstream `frappe/books` merges low-conflict. This applies equally to `custom/web/`.
- **Keymint code (`custom/licensing/`) must never be imported by, bundled into, or referenced from anything under `worker/`, `rendererWeb.ts`, or `custom/web/`.** The Web target has no device-bound licensing.
- **ClickPesa code must never be imported by, bundled into, or referenced from anything under `worker/`, `rendererWeb.ts`, or `custom/web/`.** The Web target has no ClickPesa integration.
- Every tenant's accounting data lives only in that tenant's own Neon project — never in the shared control-plane project, and never alongside another tenant's data. There is no `org_id` column to filter by; isolation is physical (separate project/connection), not logical. A request handler must resolve the correct tenant project connection (via the control-plane `tenant_projects` table) before running any accounting query — never fall back to a default or cached "last used" connection across requests for different orgs.
- The control-plane project's `tenant_projects.connection_string` must always be stored encrypted at rest (same AES-256-GCM pattern as Desktop's Keymint license cache) and must never be logged, returned in an API response, or exposed to the client — the client only ever talks to `worker/`, never directly to a tenant's Neon project.
- New organizations must get a provisioned Neon project automatically (Clerk `organization.created` webhook → Neon API → `tenant_projects` row), not as a manual step — see Flow 2b.
- A schema change to shared/custom doctypes (e.g. adding a column) must be applied across every tenant project, not just one — plan migrations as a runner over `tenant_projects`, not a single `ALTER TABLE`.
- PayPal webhook handlers must verify PayPal's webhook signature before trusting any payload — never update subscription status from an unverified webhook call.
- Lipa Namba payment claims must never auto-approve — every claim starts `PENDING_REVIEW` and requires an explicit super admin action to become `APPROVED`.
- Licensing (Desktop) must remain optional/non-blocking at startup — wrapped in try/catch, disableable via `ENABLE_LICENSING=false`. This pattern (fail open, don't crash startup) should be mirrored for Web's Clerk/subscription check where reasonable, but note Web access gating is allowed to hard-block (no offline grace period) since Web requires connectivity anyway.
- Never hardcode hex colors in components — use tokens from `colors.json` / Tailwind classes.
- Never maintain translation strings as module-level constants — translations only resolve after `LanguageMap` is loaded (`fyo/utils/translation.ts`).
- Schema `name` field is always the primary key (auto-added if missing); regional schemas override non-regional variants at build time, and subclass schemas combine with their abstract parent.
