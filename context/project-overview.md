<!-- Project overview: what you're building, why, and who it's for -->

# Project Overview

## About the Project

RareBooks is a double-entry accounting application for small and medium-sized businesses, forked from the open-source Frappe Books project. It now targets two deployment forms from one codebase:

- **Desktop (Electron)** — the shipped product today. Offline-first, locally-stored SQLite database, native installers for Windows/macOS/Linux.
- **Web (Cloudflare, in progress)** — a multi-tenant SaaS version: Clerk-authenticated organizations, a Neon/Postgres backend behind a Hono API on Cloudflare Workers, reached from any browser instead of an installed app.

Both provide the same core bookkeeping — invoicing, billing, payments, journal entries, point-of-sale, inventory, and financial reporting — but differ in how they're deployed, licensed, and paid for. See `architecture.md` for the full stack split.

---

## The Problem It Solves

Small and medium-sized enterprises, particularly in East African markets (Tanzania/Kenya), face accounting tools that are either too expensive, too complex, or require constant connectivity. RareBooks' Desktop product eliminates that with a full offline-capable double-entry system, sold as a licensed installed app (Keymint device licensing, ClickPesa mobile-money payments). The Web product extends the same accounting core to customers who want browser-based, multi-user, subscription access — including customers outside Tanzania who have no easy way to pay via local mobile money, which is why the Web target adds PayPal Subscriptions as a payment option alongside a manually-verified Lipa Namba path for Tanzania users who prefer it.

---

## Pages

**Desktop:** a Vue single-page app rendered inside Electron; navigation is handled by `vue-router` between setup, dashboard, list/form views per doctype (Sales Invoice, Purchase Invoice, Payments, Journal Entry, Party, Item, etc.), Point of Sale, and the financial report views.

**Web (target design):** the same Vue pages/routes, plus new web-only pages: sign-in/sign-up (Clerk), organization creation/switching, a billing page (PayPal checkout for non-Tanzania users, Lipa Namba instructions + claim submission for Tanzania users), and a super-admin view for reviewing pending Lipa Namba payment claims.

---

## Navigation

Sidebar navigation (`src/components/Sidebar.vue`, with RareBooks-specific overrides in `custom/src/utils/sidebarConfig.ts`) grouping the core accounting sections (Dashboard, Sales, Purchases, Point of Sale, Inventory, Reports, Expenses, Settings) — shared by both targets. Web adds a Billing entry (and, for super admins only, a Payment Review entry) to this same sidebar rather than a separate nav system.

---

## Core User Flow

### Flow 1 — First-Time Setup

**Desktop:** a new user launches the app, runs the setup wizard to create a company, and the app automatically provisions a default super admin account (no manual DB work required). Additional users can be added afterward; the default super admin password should be changed for production use.

**Web (target design):** a new user signs up via Clerk, creates an organization (the tenant boundary), and becomes its first admin. No local "default super admin" concept — Clerk's own membership/roles handle this. A separate RareBooks-level "super admin" role (for reviewing Lipa Namba claims across all orgs) is granted manually, not auto-provisioned per organization.

### Flow 2 — Day-to-Day Bookkeeping

Shared by both targets: users create and manage Sales/Purchase Invoices, record Payments and Journal Entries, and run Point of Sale transactions — all written through the `fyo` ORM (to local SQLite on Desktop, to Neon on Web). Inventory movements trigger restock notifications (ntfy on Desktop, OneSignal on Web).

### Flow 3a — Desktop Licensing & Subscription (unchanged)

On startup, the app checks license status against Keymint (online) or the encrypted local cache (offline, 7-day grace period). If a license needs to be purchased or renewed, the user enters a Tanzania mobile-money phone number and pays via a ClickPesa USSD push prompt; once payment is confirmed, the license activates and the device is bound to it.

### Flow 3b — Web Subscription & Payment (target design)

Every request checks the signed-in user's organization subscription status (control-plane, via Clerk + Neon) — no device binding, no offline grace period (Web assumes connectivity). Member/seat limits are enforced natively by Clerk itself (`maxAllowedMemberships`, synced whenever a plan tier changes), not re-checked per request. To subscribe or renew:

- **Users outside Tanzania:** start a PayPal subscription checkout; PayPal webhooks (`BILLING.SUBSCRIPTION.ACTIVATED`, `PAYMENT.SALE.COMPLETED`, etc.) update the org's subscription status automatically.
- **Users in Tanzania:** see Lipa Namba paybill instructions in the billing page, pay via mobile money outside the app, and submit a payment reference in-app. This creates a pending claim; a super admin manually reviews and approves it before the subscription activates.

---

## Data Architecture

### Desktop: Company Database (SQLite, per-company)

- Lives on the user's local machine, one file per company.
- Changes on every transaction (invoice, payment, journal entry, inventory movement, expense).
- Managed exclusively through the `fyo` Doc/Model layer.

### Desktop: License State (encrypted local cache + Keymint remote)

- Cached locally via Electron `safeStorage`/`electron-store`, AES-256-GCM encrypted, HMAC-verified.
- Refreshed hourly when online; falls back to a 7-day offline grace period.
- Must never be modified by app/business logic — only by `custom/licensing/LicenseManager`. Desktop-only; has no Web equivalent.

### Web: Tenant Database (one Neon project per tenant) — target design

- Multi-tenancy is a silo model: each organization gets its own, fully isolated Neon project, provisioned automatically via the Neon API when the organization is created. There is no shared database and no `org_id` column on accounting tables — the project itself is the tenant boundary.
- Changes on every transaction, same triggers as Desktop.
- Managed exclusively through the `fyo` Doc/Model layer, via `worker/db/` routing each request to the signed-in org's own project instead of `backend/`'s SQLite file.

### Web: Control Plane (one shared Neon project) — target design

- Holds `organizations`, `tenant_projects` (the org → Neon project mapping, with encrypted connection strings), `subscriptions`, and `payments` — never accounting data.
- `tenant_projects` is what `worker/middleware/` consults on every request to find the right tenant project before running any accounting query.
- Only PayPal's verified webhook handler or a super admin's explicit approval action may transition a `subscriptions`/`payments` row to `ACTIVE`/`APPROVED` — never inferred or auto-approved.

---

## Features In Scope

### Shared (both targets)

- Double-entry accounting (Sales/Purchase Invoicing, Payments, Journal Entries)
- Point of Sale (Classic and Modern grid views)
- Inventory management with restock/low-stock notifications
- Custom Expense tracking (RareBooks-specific doctype, numbered series)
- Financial reports: General Ledger, Profit & Loss, Balance Sheet, Trial Balance, GST
- Multi-language support (translation CSVs for 18+ languages)

### Desktop only

- Offline-first operation with local SQLite storage
- Device-bound software licensing (Keymint) with online/offline hybrid validation
- License purchase via Tanzania mobile money (ClickPesa USSD push)
- Default super admin auto-provisioning on first setup

### Web only (target design)

- Clerk authentication and multi-tenant organization management, with per-org seat limits enforced natively by Clerk (`maxAllowedMemberships`)
- Subscription-status access gating (no device license key)
- PayPal Subscriptions checkout for users outside Tanzania
- Lipa Namba manual payment instructions + super-admin claim review for Tanzania users
- OneSignal push notifications (replacing ntfy)
- Multi-user, multi-device access to the same organization's data simultaneously

## Features Out of Scope

- Offline operation on Web — the Web target requires connectivity; there is no offline grace period equivalent to Desktop's.
- Keymint device licensing on Web — deliberately removed; Web access is subscription-status-based only.
- ClickPesa (automated USSD push) on Web — deliberately removed; Tanzania users on Web get manual Lipa Namba instructions instead, not an automated payment flow.
- Real-time collaborative editing of a single record (multi-user access is supported, but concurrent-edit conflict resolution beyond the existing `fyo` sync behavior is not planned).

---

## Tech Stack

### Desktop

- **Frontend:** Vue 3, Vite, TypeScript, Tailwind CSS v3 (postcss7-compat)
- **Backend:** Electron 22 main process, Knex + `better-sqlite3`
- **Database:** SQLite (local, per company)
- **Auth:** Local `User` doctype (PBKDF2), custom default-super-admin provisioning
- **Licensing/Payments:** Keymint.dev (licensing), ClickPesa (mobile-money payments)
- **Notifications:** ntfy, custom in-app Toast
- **Other:** electron-builder (packaging/installers), Playwright (`uitest`), mocha/tape (unit tests)

### Web (target design)

- **Frontend:** Vue 3, Vite, TypeScript, Tailwind CSS v3 — same as Desktop, served as static assets
- **Backend:** Hono on Cloudflare Workers
- **Database:** Neon (Postgres), multi-tenant
- **Auth:** Clerk (authentication + organization/tenant management, seat limits)
- **Payments:** PayPal Subscriptions API (non-Tanzania), manual Lipa Namba instructions + super-admin review (Tanzania) — no Keymint, no ClickPesa
- **Notifications:** OneSignal
- **Other:** Wrangler (deploy tooling)

---

## Target User

- **Desktop:** small and medium-sized business owners and bookkeepers in East Africa (primarily Tanzania, also Kenya) who need an affordable, offline-capable, double-entry accounting and point-of-sale tool, purchased and licensed per device.
- **Web:** the same core audience, plus businesses (in or outside Tanzania) that prefer browser-based, multi-user access over an installed app, and international customers who need a payment method other than Tanzania mobile money.

---

## Success Criteria

### Shared

- Core accounting flows (invoicing, payments, journal entries, reports) work correctly and match between the two targets.
- Upstream `frappe/books` changes can be merged with minimal conflict, since RareBooks customizations stay isolated under `custom/` (including new Web-only code under `custom/web/`).

### Desktop

- A new company can be set up and immediately usable (super admin login) without manual database intervention.
- Core accounting flows work fully offline.
- License activation and renewal work end-to-end via ClickPesa mobile-money payment, with graceful offline grace-period behavior.

### Web (target design)

- A new organization can sign up via Clerk and start using the app without any manual provisioning step — including automatic Neon project creation.
- Every tenant's accounting data is physically isolated in its own Neon project — no cross-tenant data leakage is possible even in principle, since there's no shared table to mis-scope.
- PayPal subscription checkout and webhook handling correctly activate/suspend/cancel access without manual intervention.
- Lipa Namba claims never self-approve; every approval is traceable to a specific super admin action.
- Keymint and ClickPesa code paths are fully absent from the Web bundle — verified by the invariants in `architecture.md`, not just by convention.
