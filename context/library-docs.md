<!-- Library docs: key usage patterns for the libraries in this project -->

# Library Docs

Project-specific usage patterns for every third party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints specific to this codebase.

Read the relevant section before implementing any feature that touches these libraries. Sections are marked **Desktop only**, **Web only**, or **Shared**.

_Verified against current docs: 2026-09-02._

---

## Before Using Any Library

Before implementing any feature that uses a third party library:

1. **Check for a skill/AGENTS.md entry** for that library where one exists.
2. **Check if an MCP server is configured** for that library. If one is available — use it before falling back to general knowledge.
3. **Read this file** for project-specific patterns that override general library knowledge.

The order of authority is:

```
MCP server (real-time docs) → Skills → This file (project rules) → General training knowledge
```

Never rely on general training knowledge alone for library APIs — they change frequently and training data may be outdated. This is especially true for Keymint, ClickPesa, Clerk, and PayPal below, which are all fast-moving vendors.

**Target-boundary rule:** libraries marked Desktop only must never be imported from `worker/`, `rendererWeb.ts`, or `custom/web/`. Libraries marked Web only must never be imported from `main/`, `main.ts`, or `custom/licensing/`. See `architecture.md` invariants.

---

## fyo (internal ORM / platform framework) — Shared

The core client-adjacent framework managing the `Doc` abstraction, database access, and platform demux (`fyo/`).

### Usage Pattern 1 — Doc lifecycle

```typescript
const doc = fyo.doc.getNewDoc('Expense', { date, vendor, amount });
await doc.sync();

const doc = await fyo.doc.getDoc('Expense', name);
```

**Rules:**

- Always go through `fyo.db` / `fyo.doc` — never query SQLite or Neon directly from `models/` or `src/`.
- `models/**` must receive `fyo` as a constructor/function parameter — never import the singleton from `src/`.

### Usage Pattern 2 — Platform demux

```typescript
// fyo/demux/*.ts branches on platform:
// - Desktop implementation calls ipcRenderer directly
// - Web implementation (target design) calls fetch() against the Hono worker API
// All other client code stays platform-agnostic.
```

**Rules:**

- Never call `ipcRenderer` or `fetch()` against the worker API from `src/` components directly — go through the demux layer.

---

## better-sqlite3 + Knex (database) — Desktop only

Local SQLite database, one file per company, accessed via `backend/` on the main process side.

### Usage Pattern — Schema migrations ("prestige")

When a schema adds/removes columns on an existing doctype, the framework rebuilds the table (create temp table with new schema → copy data → drop old → rename). This copy step fails if it selects a column that doesn't exist in the old table.

**Rules:**

- When adding fields to an existing schema, provide a default value or write a `backend/patches/` migration rather than assuming a clean table — see `custom/EXPENSE_MIGRATION_FIX.md`.
- This limitation is Desktop/SQLite-specific — it does not apply to the Web target's Neon/Postgres backend (see below).

---

## Neon (Postgres) — Web only, target design

**Multi-tenancy model: one Neon project per tenant (silo model), not a shared database with an `org_id` column.** This is Neon's own documented "project-per-user" integration pattern for platforms building isolated databases per customer. A small shared control-plane Neon project holds the org→project mapping and billing state; every tenant's own accounting data lives only in that tenant's own Neon project.

_Note: Neon's product is now positioned as "Lakebase Postgres, from Databricks" in its own docs — same product, new parent-company branding. Doesn't change anything below, but don't be thrown by the name if it shows up in the Neon console._

**Disambiguation — two unrelated "org" concepts:** Neon's own API has its own `org_id`/`orgId` concept (which Neon account/team owns a project, for Neon's own billing and access control). This is completely separate from our Clerk organization (the tenant/customer). Set Neon's `orgId` once, statically, to our own Neon account when configuring `createNeonClient()` — never derive it per-tenant, and never confuse it with the Clerk `org_id` that identifies a customer.

### Usage Pattern 1 — Provisioning a tenant project on org creation

```typescript
// worker/routes/webhooks/clerk-org-created.ts
import { createNeonClient } from '@neon/sdk';

const neon = createNeonClient({
  apiKey: env.NEON_API_KEY,
  orgId: env.NEON_ACCOUNT_ORG_ID, // OUR Neon account's org — static, not per-tenant
});

const { data, error } = await neon.projects.createAndConnect(
  { name: `tenant-${clerkOrgId}`, region_id: 'aws-us-east-2' },
  { pooled: true } // default true — use the pooled connection string for a Workers-runtime app
);
if (error) throw error; // typed NeonError — see error handling below

const { project, connectionString } = data;

// Encrypt connectionString (AES-256-GCM, same pattern as Desktop's Keymint cache)
// and store it, alongside project.id, in the control-plane project's `tenant_projects` table.
// Then run the accounting schema migration against the fresh project before marking it READY.
```

`createAndConnect()` polls provisioning operations to completion automatically for this specific call (the client-wide `waitForReadiness` default is `false`, but `projects.create`/`createAndConnect` and `branches.create`/`createAndConnect` turn it on for themselves) — it only resolves once the project can actually accept connections, so don't add a manual polling loop around it.

### Usage Pattern 2 — Resolving and querying a tenant's project per request

```typescript
// worker/middleware/resolve-tenant.ts
// 1. Get org_id (Clerk) from the verified Clerk session (never from client input)
// 2. Look up (and short-TTL cache) the org's connection details from the
//    control-plane project's `tenant_projects` table, decrypting connection_string
// 3. Open a connection to THAT project for this request only

const tenantConn = await resolveTenantConnection(clerkOrgId); // control-plane lookup + decrypt
const rows = await tenantSql`SELECT * FROM "SalesInvoice" WHERE name = ${name}`;
// no org_id WHERE clause needed or present — the project itself is the boundary
```

**Rules:**

- Never query a tenant's accounting data through the control-plane project's connection, and never query the control-plane's `organizations`/`subscriptions`/`payments` tables through a tenant project's connection — these are two distinct Neon projects with two distinct connection strings, never mixed.
- `tenant_projects.connection_string` is encrypted at rest in the control-plane project; decrypt only in-memory, per-request, never log it.
- Cache resolved tenant connections briefly (e.g. in a short-TTL in-memory/KV cache) to avoid a control-plane round-trip on every single request, but never cache across requests for different orgs, and never let a stale cached connection outlive a project's credentials being rotated. Use `neon.postgres.roles.resetPassword(projectId, branchId, roleName)` to rotate a tenant's DB credentials if a rotation is ever needed — it returns the new password on the `Role` result.
- Use parameterized queries exclusively — never string-interpolate raw values into SQL, in either the control-plane or tenant connections.
- Postgres `ALTER TABLE ADD COLUMN` is safe for additive schema changes (unlike SQLite's "prestige" rebuild — see `custom/EXPENSE_MIGRATION_FIX.md`, which is Desktop-only) — still provide sane defaults for existing rows. Because there's one project per tenant, a schema change must be applied by a migration runner that iterates every row in `tenant_projects`, not a single `ALTER TABLE` statement against one shared database.
- For very high tenant counts, Neon's own guidance is to branch from a template project instead of creating a full project per tenant (branches share storage with the parent until the tenant writes data, and provision faster via `neon.branches.createAndConnect()`) — note this as a future scaling option, but the current decision is full projects per tenant, not branches, so don't switch to branch-per-tenant without an explicit decision to do so.

### Usage Pattern 3 — Control-plane queries (org/subscription/payment bookkeeping)

```typescript
// worker/db/control.ts — a single, fixed connection to the one shared control-plane project
const org = await controlSql`SELECT * FROM organizations WHERE id = ${orgId}`;
const pending = await controlSql`SELECT * FROM payments WHERE status = 'PENDING_REVIEW'`;
```

**Rules:**

- The control-plane connection string is a single Worker secret (`CONTROL_DATABASE_URL`), unlike tenant connections which are looked up dynamically — see `code-standards.md` → Environment Variables.
- `payments`/`subscriptions` queries (e.g. the super-admin Lipa Namba review view) always go through this single control-plane connection, since they span all orgs by design.

### Error handling and retries (confirmed against current SDK docs)

`@neon/sdk` returns a `{ data, error }` envelope by default (opt into `throwOnError: true` per-client or per-call to throw instead). `error` is one of a typed hierarchy discriminated by `.kind`: `api` (any non-2xx), `not_found` (404), `auth` (401/403), `rate_limit` (429, after retries are exhausted), `operation` (an awaited provisioning operation failed), `timeout`, `network`, or `client` (SDK-side, e.g. an ambiguous connection-string selection). The client retries automatically on `423`/`429`/`503` responses, 2 retries by default (configurable via the `retries` client option) — don't build your own retry loop on top of this for the ergonomic namespace methods.

```typescript
const { data, error } = await neon.projects.get(projectId);
if (error?.kind === 'not_found') {
  // this tenant's project is gone — surface distinctly from a generic failure
}
```

---

## @neon/sdk (Neon Platform API client) — Web only, target design

The official TypeScript client for the Neon API — projects, branches, Postgres data-plane resources, object storage, functions, and Managed Better Auth, all through one typed client. Fetch-based, replaces the deprecated Axios-based `@neondatabase/api-client`.

```typescript
import { createNeonClient } from '@neon/sdk';
const neon = createNeonClient({ apiKey: env.NEON_API_KEY, orgId: env.NEON_ACCOUNT_ORG_ID });

// Every method returns { data, error } by default (or throws with throwOnError: true)
const { data, error } = await neon.projects.list().all();
```

**Rules:**

- `createNeonClient` covers common workflows (projects, branches, Postgres resources, snapshots, and more) but not every Platform API operation — for anything without an ergonomic wrapper, use the `raw` layer (`import { raw } from '@neon/sdk'`, or a specific tree-shakeable function from `@neon/sdk/raw`) rather than hand-rolling a fetch call.
- Retries on `423`/`429`/`503` are built in (2 by default, configurable via the client's `retries` option) — don't add a manual retry loop around ergonomic-namespace calls.
- `NEON_API_KEY` is a platform-level secret (can create/delete/manage every tenant project) — treat it with the same care as `CLERK_SECRET_KEY`, never expose it to the client, never log it.
- `neon.projects.list()` (and other list methods) return a lazily-paginated result — call `.all()` for every page, `.page()` for just the first, or iterate with `for await` to stream — don't assume a plain array comes back.

---

## Postgres driver for the Workers runtime — Web only, target design

A Postgres/Neon client compatible with the Workers V8-isolate runtime is needed for actual query execution against both the control-plane and tenant connections (separate concern from `@neon/sdk`, which is for project *management*, not querying). Confirm the exact package (e.g. `@neondatabase/serverless`) before adding it — do not assume a generic `pg` driver works unmodified in a Workers isolate.

---

## Hono (API framework on Cloudflare Workers) — Web only, target design

The Web target's backend API, replacing Electron's IPC layer.

### Usage Pattern — Route + middleware structure

```typescript
// worker/index.ts
import { Hono } from 'hono';
import { clerkMiddleware, getAuth } from '@hono/clerk-auth';

const app = new Hono<{ Bindings: Env }>();

app.use('*', clerkMiddleware());

app.use('*', async (c, next) => {
  const auth = getAuth(c);
  if (!auth?.userId) return c.json({ error: 'Unauthorized' }, 401);
  // resolve org from auth.orgId, check subscription status + seat limit here
  await next();
});

app.post('/api/doc/:schema', async (c) => { /* ... */ });

export default app;
```

**Rules:**

- Use the official `@hono/clerk-auth` middleware for session verification — do not hand-roll JWT/JWKS verification.
- Every route handler that touches tenant data must run after the org-resolution + subscription-status middleware; never bypass it for a "quick" route.
- Keep route handlers thin — delegate to `models/`/`fyo` for business logic, matching how `main/registerIpcMainActionListeners.ts` stays thin on Desktop.
- Return `{ success: boolean, data?, error? }` shaped JSON, consistent with the project's API convention in `code-standards.md`.

---

## Clerk (auth + organizations) — Web only, target design

Handles user authentication and multi-tenant organization management for the Web target.

### Usage Pattern — Session + org resolution in Hono

```typescript
import { getAuth } from '@hono/clerk-auth';

app.get('/api/me', (c) => {
  const auth = getAuth(c);
  return c.json({ userId: auth?.userId, orgId: auth?.orgId, orgRole: auth?.orgRole });
});
```

**Rules:**

- `@hono/clerk-auth` works natively on Cloudflare Workers (built on `@clerk/backend`, designed for V8 isolates) — no Node-only Clerk SDK. This specific package isn't covered in detail by Clerk's or Hono's primary docs indexes (verify its current README directly before implementation — it's a real, actively-maintained community/official-adjacent package, but treat its exact API as needing a fresh check, not this file, at build time).
- The active organization (`auth.orgId`) is the tenant boundary for every Neon query — see Neon section above.
- Config: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` env vars (Worker secrets, never committed).
- The Web "super admin" role (for reviewing Lipa Namba payment claims) is a RareBooks-level authorization check on top of Clerk, not a Clerk built-in role — implement it as an explicit allow-list or a custom Clerk metadata flag checked in `worker/middleware/`.

### Usage Pattern — Seat limits: use Clerk's own `maxAllowedMemberships`, don't reinvent one

**Correction from an earlier draft of this plan:** seat enforcement should NOT be a custom "compare Clerk's live membership count against our own `seat_limit` column on every request" check. Clerk organizations already have a native, enforced member cap:

```typescript
// Set (or update) an org's member cap directly via Clerk's Backend API —
// call this whenever a subscription's plan/tier changes, not on every request.
await clerkClient.organizations.updateOrganization(orgId, {
  maxAllowedMemberships: planSeatCount, // e.g. 5 for Basic, 20 for Pro
});
```

Clerk itself then blocks new invitations once an org hits its cap — the check happens on Clerk's side, not in `worker/middleware/`. `worker/middleware/` still needs to check **subscription status** (active/past-due/expired, from the control-plane `subscriptions` table — Clerk has no idea about our PayPal/Lipa Namba billing), just not seat count.

**Rules:**

- Default `maxAllowedMemberships` per org is 5; can be set up to 20 without Clerk's paid "B2B Authentication" add-on, and unlimited with it. **If any planned subscription tier needs more than 20 seats, that add-on is a prerequisite** — confirm this against the current Clerk pricing page before committing to a tier structure, since add-on availability/pricing changes.
- Setting `maxAllowedMemberships: 0` means unlimited for that org.
- There is no per-user cap on how many organizations a user can belong to — only the per-org member cap above.
- Sync `maxAllowedMemberships` to Clerk on every subscription activation, plan change, and cancellation/downgrade — a stale value left over-provisioned after a downgrade is a real gap (Clerk won't shrink existing membership, but will block new invites once back under the new cap).

### Usage Pattern — Webhook verification (org creation, membership events)

Clerk webhooks are delivered via Svix. There's a Next.js-specific helper (`verifyWebhook` from `@clerk/nextjs/webhooks`) — **not applicable here**, since the Web target runs on Hono/Cloudflare Workers, not Next.js. Verify manually using the `svix` package (Workers-compatible) against the raw request body and the endpoint's signing secret from the Clerk Dashboard:

```typescript
import { Webhook } from 'svix';

const wh = new Webhook(env.CLERK_WEBHOOK_SIGNING_SECRET);
const evt = wh.verify(rawBody, {
  'svix-id': c.req.header('svix-id')!,
  'svix-timestamp': c.req.header('svix-timestamp')!,
  'svix-signature': c.req.header('svix-signature')!,
});
// evt.type === 'organization.created' → provision a tenant Neon project (see Neon section)
```

Relevant event types, confirmed current: `organization.created`, `organization.updated`, `organization.deleted`, `organization_membership.created/updated/deleted`, `organization_invitation.created/accepted/revoked`.

**Rules:**

- Never process a Clerk webhook payload before `wh.verify()` succeeds — same rule as PayPal's webhook signature verification below.
- `CLERK_WEBHOOK_SIGNING_SECRET` is a separate secret from `CLERK_SECRET_KEY` — found per-endpoint in the Clerk Dashboard, not the same value.

---

## Keymint.dev (licensing) — Desktop only

Device-bound license activation/validation for the Electron app, used via direct REST calls in `custom/licensing/api/keymint-client.ts`.

**This library is Desktop-only and must not be ported to, imported by, or referenced from the Web target.** The Web target has no license-key concept — access is gated purely by Clerk org + subscription status (see Clerk and Neon sections above).

### Usage Pattern — Validate/activate a key (Desktop)

```typescript
const res = await fetch('https://api.keymint.dev/...', {
  method: 'POST',
  headers: { Authorization: `Bearer ${KEYMINT_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: KEYMINT_PRODUCT_ID, licenseKey, hostId: deviceId }),
});
```

**Rules:**

- Online validation happens through `custom/licensing/validation/online-validator.ts`; failures/timeouts fall back to `offline-validator.ts` + the encrypted cache.
- Device binding = machine ID + MAC address → SHA-256 (`fingerprint/device-id.ts`). Never send raw MAC/machine ID to the renderer or logs.
- Grace period is 7 days offline; warn the user once < 2 days remain (`GRACE_EXPIRING` state).
- License cache is AES-256-GCM encrypted, key stored in Electron `safeStorage`.
- Config: `KEYMINT_API_URL`, `KEYMINT_ACCESS_TOKEN`, `KEYMINT_PRODUCT_ID`, `ENABLE_LICENSING`.

---

## ClickPesa (mobile-money payments) — Desktop only

Collects license purchase payments via USSD Push to Tanzania mobile money, used in `custom/licensing/api/clickpesa-client.ts`.

**This library is Desktop-only and must not be ported to, imported by, or referenced from the Web target.** The Web target replaces ClickPesa entirely with PayPal Subscriptions (non-Tanzania users) and manual Lipa Namba instructions (Tanzania users) — see below.

### Usage Pattern — Preview then initiate a USSD push (Desktop)

```typescript
POST https://api.clickpesa.com/third-parties/payments/preview-ussd-push-request
{ amount, currency: "TZS", orderReference, phoneNumber }

POST https://api.clickpesa.com/third-parties/payments/initiate-ussd-push-request
{ amount, currency: "TZS", orderReference, phoneNumber, checksum }
```

**Rules (Desktop, unchanged):**

- Currency is always `TZS`.
- Phone numbers normalized to accept `+255XXXXXXXXX`, `255XXXXXXXXX`, `0XXXXXXXXX`.
- Requests retried up to 3 attempts.
- Config: `CLICKPESA_API_URL`, `CLICKPESA_API_KEY`, `CLICKPESA_CHECKSUM_KEY`, `YEARLY_LICENSE_PRICE`.

---

## PayPal Subscriptions API — Web only, target design

Recurring subscription billing for Web users outside Tanzania. Confirmed current webhook event names (Sept 2026): `BILLING.SUBSCRIPTION.CREATED`, `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`, `PAYMENT.SALE.COMPLETED`, `PAYMENT.SALE.REFUNDED`, `PAYMENT.SALE.REVERSED`.

**Correction from an earlier draft of this plan:** the official `CreateSubscriptionRequest` schema (confirmed against PayPal's own TypeScript Server SDK docs) marks **both `applicationContext` and `autoRenewal` as DEPRECATED**. An earlier draft of this section used `application_context: { shipping_preference, user_action, return_url, cancel_url }` to control the payer redirect experience — that field still exists but is deprecated, so re-check PayPal's current recommended replacement (likely plan-level configuration or the `plan` override object) before implementing, rather than building against the deprecated shape from memory.

### Usage Pattern — Create a subscription, then handle its webhook

```typescript
// 1. One-time setup (not per-request): create a Catalog Product + a Billing Plan
//    in the PayPal dashboard or via the Catalog Products / Subscriptions REST APIs.
//    Store the resulting plan ID as a Worker secret/env var (e.g. PAYPAL_PLAN_ID).

// 2. worker/routes/payments/paypal-create.ts
POST https://api-m.paypal.com/v1/billing/subscriptions
{
  "plan_id": PAYPAL_PLAN_ID,
  "subscriber": { "email_address": userEmail }
  // Do NOT reach for "application_context" or "auto_renewal" without first checking
  // PayPal's current docs — both are deprecated on CreateSubscriptionRequest as of
  // this crosscheck (Sept 2026); confirm the current recommended replacement first.
}
// Redirect the user to the "approve" link (HATEOAS) in the response — this part is unchanged.

// 3. worker/routes/payments/paypal-webhook.ts
// Verify the webhook signature against PayPal's
// /v1/notifications/verify-webhook-signature endpoint BEFORE trusting the payload —
// confirmed there is no official SDK helper for this (the TypeScript Server SDK's
// client explicitly has no webhook-verification code), so this must be a manual REST call.
// Then branch on event.event_type:
//   BILLING.SUBSCRIPTION.ACTIVATED  → subscriptions.status = ACTIVE
//   PAYMENT.SALE.COMPLETED          → insert a `payments` row (status COMPLETED)
//   BILLING.SUBSCRIPTION.SUSPENDED,
//   BILLING.SUBSCRIPTION.CANCELLED,
//   BILLING.SUBSCRIPTION.EXPIRED    → subscriptions.status = matching state
//   BILLING.SUBSCRIPTION.PAYMENT.FAILED → subscriptions.status = PAST_DUE
```

**Rules:**

- Never update `subscriptions`/`payments` from a webhook payload whose signature hasn't been verified.
- Use sandbox credentials/environment (`api-m.sandbox.paypal.com`) until go-live is explicitly confirmed; never point at production PayPal from a dev branch.
- Config: `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLAN_ID`, `PAYPAL_WEBHOOK_ID` (needed for signature verification) as Worker secrets.
- Treat `BILLING.SUBSCRIPTION.ACTIVATED` and `PAYMENT.SALE.COMPLETED` as the two events that actually grant/extend access — the rest are informational or revoke access.
- This is a genuinely different integration shape from ClickPesa's — do not copy ClickPesa's "preview → initiate → poll" pattern here; PayPal is create-subscription → redirect → webhook, no polling.
- Before implementing, re-fetch PayPal's current `Create Subscription` request schema — this crosscheck found two deprecated fields on the exact request shape planned above, which is a signal this API surface changes; don't treat the snippet above as final.

---

## Lipa Namba (manual instructions, Tanzania) — Web only, target design

**Not an API integration.** Per the migration decision, Lipa Namba on Web is informational-only — no automated USSD push like Desktop's ClickPesa flow.

### Usage Pattern

```typescript
// Billing page (Vue, src/): renders static instructions —
// business/paybill number, amount, and a required reference format —
// then collects a user-submitted transaction reference and calls:
POST /api/payments/lipa-namba-claim
{ reference: string, amount: number }
// worker route inserts a `payments` row: provider='lipa_namba', status='PENDING_REVIEW'

// Super admin review view (Web only):
GET /api/admin/payments?status=PENDING_REVIEW
POST /api/admin/payments/:id/approve   // sets payments.status='APPROVED', updates subscriptions
POST /api/admin/payments/:id/reject
```

**Rules:**

- Never auto-approve a Lipa Namba claim — every claim requires an explicit super admin action.
- The super admin route group must be behind its own authorization check (see Clerk section above), separate from normal org-scoped access.
- Keep the displayed paybill/instructions text as project configuration (env var or a simple admin-editable setting), not hardcoded in a component, since the business number/instructions may change independent of a deploy.

---

## OneSignal (notifications) — Web only, target design

Replaces `ntfy` for the Web target; same triggering logic (restock, payment events) as Desktop.

**Correction from an earlier draft of this plan:** the earlier snippet used `include_external_user_ids`, which is not the current targeting parameter. The confirmed current API uses `include_aliases` with a `target_channel`.

### Usage Pattern (confirmed against current OpenAPI spec)

```typescript
POST https://api.onesignal.com/notifications
Authorization: Key ONESIGNAL_API_KEY   // note: "Key " prefix, not "Bearer "
Content-Type: application/json

{
  "app_id": ONESIGNAL_APP_ID,
  "target_channel": "push",              // required when using include_aliases
  "include_aliases": {
    "external_id": ["org_abc123", "org_def456"]  // your own IDs — e.g. Clerk user/org IDs
  },
  "contents": { "en": "Restocked: 3 items are low on stock" }
}
```

**Rules:**

- Reuse the existing restock/payment-event trigger logic (`tests/restockNotification.spec.ts`, `tests/paymentMethodNotification.spec.ts` describe the current Desktop behavior) — only the delivery mechanism changes for Web.
- `include_aliases` is **not compatible** with `filters`, `include_subscription_ids`, `included_segments`, or `excluded_segments` in the same call — pick one targeting method per request, don't try to combine them.
- Limit: up to 20,000 external IDs per call under `include_aliases.external_id`.
- Config: `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY` as Worker secrets. The `Authorization` header value is literally `Key <api_key>` — a common mistake is using `Bearer <api_key>` instead, which fails.
- Use an idempotency key (a client-generated UUID, one per logically distinct send) if resending the same notification is a real risk from a retry — the API deduplicates on it within a 30-day window.

---

## Tailwind CSS v3 (postcss7-compat) + tailwindcss-rtl — Shared

Styling layer, configured via `tailwind.config.js`, tokens sourced from `colors.json`. No changes for the Web migration — see `ui-tokens.md` and `ui-rules.md`.

---

## electron-builder (packaging) — Desktop only

Builds installers for Windows (incl. MSIX), macOS, and Linux. Not used by the Web target, which deploys via Wrangler to Cloudflare Workers instead.

### Usage Pattern (Desktop)

```bash
yarn build            # current platform
yarn build --linux
yarn build:msix
```

---

## Wrangler (Cloudflare Workers deploy) — Web only, target design

```bash
wrangler deploy      # deploy worker/ to Cloudflare
wrangler dev         # local dev server for the Hono API
```

**Rules:**

- Secrets (`CLERK_SECRET_KEY`, `PAYPAL_CLIENT_SECRET`, `ONESIGNAL_API_KEY`, Neon connection string, etc.) go through `wrangler secret put`, never committed to `wrangler.toml`.
- `wrangler.toml` should not exist yet in this repo as of the last inspection — confirm current state before assuming a working config is already checked in.
