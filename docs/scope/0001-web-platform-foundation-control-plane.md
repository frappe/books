# 0001. Web platform foundation & control plane

**Date**: 2026-09-03
**Status**: In Progress

## Summary

This decision stands up the ground everything else in the web migration builds on: a Hono API running on Cloudflare Workers, Clerk for sign in and organizations, and a small shared "control plane" Neon (Postgres) project that records which organization owns which tenant database and what its subscription status is. Each organization gets its own, fully isolated Neon project (a "silo" model), created automatically the moment the organization is created. Nothing accounting related is built yet; this feature's only job is: sign in, create an org, get a tenant project provisioned, see an empty dashboard.

## Context

RareBooks ships today as an Electron desktop app with a local SQLite file per company; the file itself is the tenant boundary. The web migration needs an equivalent boundary that works for a browser based, multi user, subscription product, without changing the accounting core (`fyo`, `models/`, `reports/`) that both targets share.

The two realistic multi tenancy shapes are a shared database with an `org_id` column on every table, or one database per tenant. A shared database is cheaper to provision but makes every single query a place a missing or wrong `org_id` filter can leak one tenant's data to another. RareBooks is an accounting product; that failure mode is unacceptable here. Neon's own documented pattern for platforms building isolated databases per customer is project per tenant, and Neon's API supports fast, on demand project creation, which makes per tenant isolation practical instead of merely safer in theory.

## Requirements

**User stories**:
- As a new customer, I want to sign up and create my organization so that I get my own isolated place to do my company's bookkeeping.
- As a signed in user, I want to reach my organization's dashboard so that I know my account and my data are connected and ready.

**Acceptance criteria**:
- **AC-1**: A user can sign up and sign in via Clerk.
- **AC-2**: Creating a Clerk organization triggers automatic provisioning of a new, isolated Neon project for that organization, with no manual step.
- **AC-3**: The control plane project records the organization (`organizations`), the org to tenant project mapping (`tenant_projects`), and placeholder rows the later billing features will populate (`subscriptions`, `payments`).
- **AC-4**: The tenant project's connection string is encrypted at rest in the control plane project and is never logged, returned in an API response, or exposed to the client.
- **AC-5**: A signed in user whose org's tenant project is `READY` reaches an empty dashboard shell; a user whose org has no `READY` tenant project does not.
- **AC-6**: `fyo/demux/*.ts` gets a web implementation that calls the Hono API via `fetch()`, and `rendererWeb.ts` is the browser entry point; no other client code becomes platform aware.

## Decision

**Chosen option**: A Cloudflare Workers Hono API, Clerk for auth and organizations, and a Neon project per tenant (silo model) with a small shared control plane project for cross tenant bookkeeping.

This is already the confirmed target stack (see `context/architecture.md`, `context/library-docs.md`), crosschecked against current Neon, Hono, and Clerk documentation as of 2026-09-02. This spec formalizes it as a scope linked decision rather than re-deriving it.

## Rationale

Physical isolation (a separate Neon project per tenant) trades a small per request lookup cost for eliminating an entire class of bug: there is no `org_id` filter to get wrong, because a tenant's project only ever contains that tenant's data. Hono was chosen because it runs natively on Cloudflare Workers' V8 isolate runtime; Clerk was chosen because it already models organizations and membership natively, which the seat cap decision in feature 08 depends on directly. Keeping `fyo/demux/*.ts` as the only platform aware layer preserves the existing Desktop and Web platform abstraction rather than introducing a second one.

## Feature design

**Data model sketch** (control plane project, one project shared across all tenants):

- `organizations`: `id` (text, Clerk org ID, primary key), `name` (text), `plan_seat_limit` (integer, kept in sync with Clerk's `maxAllowedMemberships`, a record of intent not a per request check), `created_at` (timestamptz)
- `tenant_projects`: `org_id` (text, primary key, references `organizations.id`), `neon_project_id` (text), `connection_string` (text, encrypted at rest, AES-256-GCM, same pattern as Desktop's Keymint license cache), `region` (text), `status` (text: `PROVISIONING`, `READY`, `SUSPENDED`, `FAILED`), `created_at` (timestamptz)
- `subscriptions`: `id` (uuid, primary key), `org_id` (text), `provider` (text: `paypal` or `lipa_namba`), `status` (text: `ACTIVE`, `PAST_DUE`, `EXPIRED`, `PENDING_REVIEW`, `CANCELLED`), `paypal_subscription_id` (text, nullable), `current_period_end` (timestamptz, nullable), `updated_at` (timestamptz). Populated by features 09 and 10; this feature only creates the table.
- `payments`: `id` (uuid, primary key), `org_id` (text), `provider` (text), `amount` (Currency), `status` (text), `reference` (text), `reviewed_by` (text, nullable), `created_at` (timestamptz). Populated by features 09 and 10; this feature only creates the table.

Each tenant project gets the standard accounting schema (Party, SalesInvoice, PurchaseInvoice, Payment, JournalEntry, Item, StockLedgerEntry, Account, and RareBooks's custom additions), Postgres flavored instead of SQLite flavored, with no `org_id` column anywhere; applying that schema is feature 07's job, not this one; this feature only needs the tenant project to exist and be reachable.

**State transitions**: `tenant_projects.status`: `PROVISIONING` → `READY` (schema applied successfully, feature 07) or `FAILED` (provisioning or schema failed); `READY` → `SUSPENDED` (operational, out of scope here).

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/me` | GET | none (session) | `userId`, `orgId`, `orgRole` | Clerk session | 401 unauthenticated |
| `/webhooks/clerk/organization-created` | POST | Clerk webhook payload, svix headers | 200 on success | svix signature | 400 unverified signature |
| `/api/dashboard` | GET | none (session) | empty dashboard shell payload | Clerk session + org's tenant `READY` | 401, 403 (org not ready) |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Org creation | New Neon project + connection string | Neon API `createAndConnect()` via `@neon/sdk`, our own Neon account (`NEON_ACCOUNT_ORG_ID`, static, not per tenant) |
| Every tenant request | The tenant's Neon connection | `worker/db/resolve-tenant.ts`, control plane lookup of `tenant_projects` by the Clerk `org_id` from the verified session, decrypted in memory, short TTL cached per request, never cached across different orgs |
| Dashboard reachability | Whether to allow or block | `tenant_projects.status === 'READY'` for the signed in user's `org_id` |

**Key invariants**:
- Client code (`src/`) never imports server code (`worker/`) directly, and vice versa; only `fyo/demux/*.ts` is platform aware.
- Every tenant's accounting data lives only in that tenant's own Neon project; there is no `org_id` column to filter by, isolation is physical.
- `tenant_projects.connection_string` is always encrypted at rest and never logged or exposed to the client.
- New organizations get a provisioned Neon project automatically via the `organization.created` webhook, never as a manual step.
- Keymint (`custom/licensing/`) and ClickPesa code must never be imported by, bundled into, or referenced from `worker/`, `rendererWeb.ts`, or anything under `custom/web/`.

**Security model**: Every request is authenticated via a verified Clerk session (`@hono/clerk-auth`); the active Clerk `org_id` on that session is the only source of tenant identity, never a client supplied value. The `organization.created` webhook is verified via `svix` against the raw request body and the endpoint's signing secret before any provisioning happens. `NEON_API_KEY` is a platform level secret capable of managing every tenant project; it is never exposed to the client or logged, same handling as `CLERK_SECRET_KEY`.

**Configuration required**:
- `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`: Clerk auth and webhook verification
- `NEON_API_KEY`, `NEON_ACCOUNT_ORG_ID`: provisioning tenant projects via `@neon/sdk`
- `CONTROL_DATABASE_URL`: the single, fixed connection string to the shared control plane project

**Critical test scenarios**:
- Happy path: a new user signs up, creates an org, the org's Neon project provisions and reaches `READY`, and the user reaches the empty dashboard. Verifies **AC-1, AC-2, AC-5**.
- Failure case: Neon project provisioning fails (a `4xx`/`5xx`/`operation` error from `@neon/sdk`); `tenant_projects.status` is set to `FAILED`, not left `PROVISIONING` indefinitely, and the user sees a clear failure state rather than an infinite loading dashboard. Verifies **AC-2**.
- Auth/permission: a signed in user whose org has no `READY` tenant project is blocked from the dashboard route. Verifies **AC-5**.
- Security: an unverified `organization.created` webhook payload (bad or missing svix signature) is rejected before any provisioning call runs. Verifies **AC-2, AC-4**.

## Build plan

1. Scaffold `worker/`: Hono app, `@hono/clerk-auth` middleware, `wrangler.toml`. Satisfies **AC-1**.
2. Provision the control plane Neon project (once) and create the `organizations`, `tenant_projects`, `subscriptions`, `payments` tables. Satisfies **AC-3**.
3. Build `worker/routes/webhooks/organization-created.ts`: verify the svix signature, then call `@neon/sdk`'s `createAndConnect()` to provision a tenant project, encrypt the connection string, and write the `tenant_projects` row. Satisfies **AC-2, AC-4**.
4. Build `worker/db/control.ts` (fixed control plane connection) and `worker/db/resolve-tenant.ts` (per request tenant lookup, decrypt, short TTL cache). Satisfies **AC-4**.
5. Build the `fyo/demux/*.ts` web implementation (swap `ipcRenderer` calls for `fetch()` against `worker/`) and `rendererWeb.ts`, the browser entry point. Satisfies **AC-6**.
6. Build the sign in, sign up, org creation UI (Clerk components) and the empty dashboard shell, gated on `tenant_projects.status === 'READY'`. Satisfies **AC-5**.

## Consequences

**Positive**:
- Physical tenant isolation removes an entire class of cross tenant data leak bug before any accounting feature is built on top.
- The platform demux pattern stays intact; Desktop code paths are untouched.

**Negative / tradeoffs**:
- Every tenant data request pays a small extra lookup hop (resolve the tenant's Neon connection) that a shared database with an `org_id` column would not pay.
- One Neon project per tenant has a real provisioning cost per signup; at very high tenant counts, Neon's own guidance favors branching from a template project instead. That is a noted future scaling option, not the current decision, and should not be adopted without an explicit follow up decision.

**Neutral**:
- Introduces a new secret surface (`NEON_API_KEY`, Clerk secrets, `CONTROL_DATABASE_URL`) that Desktop never had, needing the same handling discipline Desktop's Keymint credentials already get.

## Follow-up

- [ ] Confirm the exact Postgres/Neon client package for the Workers runtime (e.g. `@neondatabase/serverless`) before feature 07 starts; do not assume a generic `pg` driver works unmodified in a Workers isolate.
- [ ] Decide whether project per tenant remains the model at scale, or whether to move to Neon's branch per tenant pattern, once real tenant counts make it relevant.
