<!-- Build plan: features broken into phases with clear done criteria -->

# Build Plan

## Core Principle

RareBooks is a fork of an already-mature product (Frappe Books), not a greenfield build — so this plan tracks RareBooks-specific additions layered on top of the inherited accounting core, not the accounting core itself (invoicing, ledger, reports, etc. already exist and are considered "Done" baseline). Each RareBooks feature is built fork-safe: isolated in `custom/` wherever possible, with UI wired in and visually verified before deeper logic is trusted, and a corresponding `custom/*.md` doc written for any non-trivial fix so future sessions don't re-debate it.

RareBooks now spans two deployment targets — Desktop (Electron, shipped) and Web (Cloudflare, in progress). Phases 1–3 below are Desktop-specific work already built. Phase 4 is the Web migration, sequenced so the platform foundation (auth, tenancy, data layer) lands before any payment integration is attempted — payments need somewhere to record subscription status against, so building them first would mean rebuilding them once tenancy exists. Within Phase 4, Keymint and ClickPesa are explicitly out of scope everywhere — Web replaces them rather than reusing them (see `architecture.md` invariants).

---

## Phase 1 — Commercial Foundation (Licensing & Payments)

### 01 Keymint Hybrid Licensing

Device-bound license activation/validation with offline grace period, so the app can be sold and enforced per-device.

**UI:**

- License activation screen/dialog (enter license key)
- License status indicator (active/grace/expired) surfaced somewhere in settings or on startup gate

**Logic:**

- `LicenseManager` orchestration (`custom/licensing/LicenseManager.ts`)
- Online validator (Keymint REST) + offline validator (encrypted cache) + grace period (7 days)
- Device fingerprinting (machine ID + MAC → SHA-256)
- IPC listeners registered fork-safely in `main.ts`

**Status:** Built.

---

### 02 ClickPesa Payment Integration

License purchase via Tanzania mobile money (USSD push), token-based auth.

**UI:**

- "Buy License" flow: phone number entry → payment confirmation state

**Logic:**

- `clickpesa-client.ts`: token generation, preview-ussd-push, initiate-ussd-push, retry logic
- Phone number validation accepting all 3 Tanzania formats with a clear combined error message
- License activation on confirmed payment

**Status:** Built. Iterated multiple times on phone-format validation and error messaging (see `custom/licensing/subscription/` docs) and on payment initiation error handling (`PAYMENT_INITIATION_ERROR_FIX.md`, `PAYMENT_METHOD_FIX.md`, `PAYMENT_PHONE_FIX.md`).

---

## Phase 2 — Onboarding & Access

### 03 Default Super Admin Auto-Provisioning

Eliminate manual DB work to get a usable login after first company setup.

**UI:**

- No new UI — existing setup wizard flow is unchanged from the user's perspective, just followed by an automatic admin account.

**Logic:**

- `custom/setup/createDefaultSuperAdmin.ts` — creates super admin only if no users exist
- `custom/setup/setupInstanceCustom.ts` — wraps base `setupInstance`, called from `src/App.vue` in place of the base import

**Status:** Built. Default credentials documented in `custom/DEFAULT_CREDENTIALS.md` — must be rotated before production use.

---

## Phase 3 — Accounting Extensions

### 04 Expense Tracking — Full Feature

Custom `Expense` doctype (vendor, expense account, amount, date, numbered series) not present in base Frappe Books.

**UI:**

- Expense list view + form (via base doctype form rendering, driven by `custom/schemas/Expense.json`)

**Logic:**

- `custom/models/Expense.ts`, `custom/schemas/Expense.json`, `custom/schemas/NumberSeries.json` extension
- Migration handling for the SQLite table "prestige" rebuild when the schema changed on existing data (`custom/EXPENSE_MIGRATION_FIX.md`)

**Status:** Built, with a known migration edge case documented (clear-data or manual-column-add recovery paths) rather than fully automated.

---

### 05 Inventory & Payment Notifications

Restock alerts and payment-method notifications, including image support for restock alerts.

**UI:**

- Toast / ntfy notifications for low stock and payment events

**Logic:**

- Restock notification handling, payment method notification handling
- Image handling for items feeding into notification images (added 2026-05-12)
- Birth date field/validation added to `Party` model alongside this work (2026-05-09)

**Status:** Built (`tests/restockNotification.spec.ts`, `tests/paymentMethodNotification.spec.ts`, `tests/ntfyNotification.spec.ts` cover this).

---

## Phase 4 — Web Migration (Not Started — target design, sequenced)

Move from a single-machine Electron app toward a multi-tenant web architecture: Cloudflare Workers, Neon, Clerk, Hono backend. **Nothing below exists in the codebase yet** — the `rarebooks-webapp` branch currently only contains POS UI grid refinements. This phase is broken into sub-phases so each is independently buildable and visually/functionally verifiable, per the Core Principle above — build the platform foundation before any payment integration, since payments depend on auth/tenancy existing first.

### 06 Web Platform Foundation & Control Plane

Stand up the Hono API, Clerk auth, and the control-plane Neon project — no accounting features yet, just "can a user sign in, create an org, get a tenant project provisioned, and see an empty dashboard."

**UI:**

- Sign-in / sign-up pages (Clerk components)
- Organization creation flow
- Empty dashboard shell reachable only when authenticated with an active org whose tenant project is `READY`

**Logic:**

- `worker/` scaffold: Hono app, `@hono/clerk-auth` middleware, `wrangler.toml`
- Control-plane Neon project provisioned (once, manually or via a setup script): `organizations`, `tenant_projects`, `subscriptions`, `payments` tables
- `worker/routes/webhooks/clerk-org-created.ts`: on org creation, call the Neon API (`@neon/sdk`'s `createAndConnect()`) to provision a new, isolated tenant project; encrypt and store its connection string in `tenant_projects`
- `worker/db/control.ts`: fixed connection to the control-plane project
- `worker/db/resolve-tenant.ts`: per-request lookup + decrypt + short-TTL cache of a tenant's connection, given the signed-in user's Clerk `org_id`
- `fyo/demux/*.ts` web implementation (replacing `ipcRenderer` calls with `fetch()` against `worker/`)
- `rendererWeb.ts` browser entry point

**Status:** Not started.

---

### 07 Tenant Schema & Data Layer

Apply the accounting schema to freshly-provisioned tenant projects, and route doc CRUD through the correct per-tenant connection — so the same doctypes/forms Desktop already has work through the Web stack.

**UI:**

- Reuse existing doctype list/form views (`src/pages/`, `src/components/`) unchanged — this phase is backend-only if the UI layer is properly platform-agnostic already

**Logic:**

- Accounting schema migration script, run against each newly-provisioned tenant project as the last step of `clerk-org-created.ts` (mark `tenant_projects.status = 'READY'` only once it succeeds)
- `worker/routes/`: generic doc CRUD routes mirroring `main/registerIpcMainActionListeners.ts`'s IPC actions, each running after `resolve-tenant.ts` middleware — **no `org_id` column or filter anywhere in tenant-project tables**, the resolved connection is the only tenant boundary
- Verify `models/**`/`reports/**` run correctly against `fyo.db` backed by a tenant's Neon project, not just SQLite (may surface Postgres-vs-SQLite query differences to fix)
- A migration runner utility for rolling out future schema changes across every row in `tenant_projects`, not just one project

**Status:** Not started. Depends on 06.

---

### 08 Subscription Gating & Seat Sync

Implement access control — the thing that replaces Keymint on Web.

**UI:**

- Billing/subscription status indicator, "upgrade" prompt shown when access is denied
- Seat usage indicator in org settings (reads Clerk's own membership count/cap, not a separate app-level counter)

**Logic:**

- `subscriptions` table already exists in the control-plane project (created in sub-phase 06) — this sub-phase wires the actual check
- `worker/middleware/`: check subscription status only (control-plane `subscriptions` query) on every tenant-data request, before `resolve-tenant.ts` even bothers looking up the tenant connection — no point resolving a tenant project for a request that's about to be denied
- **Seat limits are Clerk's own responsibility, not re-implemented here:** on subscription activation/plan-change/cancellation, call Clerk's Backend API (`clerkClient.organizations.updateOrganization(orgId, { maxAllowedMemberships })`) to sync the org's member cap to the new plan's seat count — Clerk then blocks over-cap invitations natively. Confirm before committing to tier pricing: Clerk's `maxAllowedMemberships` tops out at 20 without their paid B2B Authentication add-on.
- No offline grace period — a denied request routes the client straight to the billing prompt

**Status:** Not started. Depends on 07. **Do not import or reference `custom/licensing/` (Keymint) anywhere in this phase** — see `architecture.md` invariants.

---

### 09 PayPal Subscriptions (Non-Tanzania Payments)

**UI:**

- Billing page: "Subscribe with PayPal" checkout button, redirect to PayPal approval, return/cancel handling

**Logic:**

- `custom/web/payments/paypal-client.ts`: create-subscription call against a pre-configured PayPal plan
- `worker/routes/payments/paypal-webhook.ts`: verify webhook signature, handle `BILLING.SUBSCRIPTION.ACTIVATED`, `PAYMENT.SALE.COMPLETED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `payments` table insert/update on `PAYMENT.SALE.COMPLETED`; `subscriptions` status update on the lifecycle events
- Sandbox PayPal environment for development; production credentials gated behind an explicit go-live step

**Status:** Not started. Depends on 08. **Do not import or reference `custom/licensing/api/clickpesa-client.ts` (ClickPesa) anywhere in this phase** — PayPal is a full replacement, not an addition alongside it, on Web.

---

### 10 Lipa Namba Manual Payments (Tanzania Payments)

**UI:**

- Billing page: Lipa Namba instructions panel (paybill/business number, reference format) for Tanzania users, a form to submit the paid reference
- Super-admin-only "Payment Review" page: list pending claims, approve/reject actions

**Logic:**

- `custom/web/payments/lipa-namba.ts`: claim submission route, writes `payments` row with `provider='lipa_namba'`, `status='PENDING_REVIEW'`
- Super-admin authorization check in `worker/middleware/` (RareBooks-level role, not a Clerk built-in)
- Approve action: `payments.status='APPROVED'` + `subscriptions` update, `reviewed_by` set to the approving super admin's Clerk user ID
- No API integration with any Tanzania mobile-money provider on Web — this is instructions + manual claim + manual review, by design

**Status:** Not started. Depends on 08.

---

### 11 OneSignal Notifications

Port restock/payment notification triggers from ntfy (Desktop) to OneSignal (Web).

**UI:**

- Browser push permission prompt / notification preferences (if needed)

**Logic:**

- `custom/web/notifications/`: reuse existing trigger logic (see `restockNotification.spec.ts`, `paymentMethodNotification.spec.ts`), swap delivery to OneSignal's REST API

**Status:** Not started. Depends on 07 (needs the tenant data layer to know what to notify about).

---

### 12 Deploy & Cutover Readiness

**UI:**

- None — operational phase

**Logic:**

- Wrangler deploy pipeline, Worker secrets configured for production PayPal/Clerk/Neon/OneSignal
- Confirm the invariants hold: no Keymint or ClickPesa code present in the deployed Worker bundle
- Load/smoke test multi-tenant query scoping before onboarding real customers

**Status:** Not started. Depends on 09, 10, 11.

---

## Feature Count

| Phase     | Name                                        | Features |
| --------- | --------------------------------------------- | -------- |
| 1         | Commercial Foundation (Desktop)               | 2        |
| 2         | Onboarding & Access (Desktop)                 | 1        |
| 3         | Accounting Extensions (shared)                | 2        |
| 4         | Web Migration (target design, not started)    | 7        |
| **Total** |                                                | **12**   |
