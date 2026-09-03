<!-- Code standards: rules the agent must follow when writing code for this project -->

# Code Standards

Implementation rules and conventions for the entire project. The AI agent must follow these in every session without exception. These rules prevent pattern drift across sessions.

---

## Engineering Mindset

- Readability over succinctness — write short, well-named functions (per `CONTRIBUTING.md`/`WARP.md`).
- Use early exits; avoid nested conditionals and loops.
- Keep customizations fork-safe: prefer adding new files under `custom/` over editing core upstream files; when a core file must change, keep the diff minimal and documented (see licensing's 8-line `main.ts` integration as the model).
- Understand the client/server/agnostic boundary (see architecture.md) before writing a single line — getting this wrong breaks the mocha test suite or the platform-abstraction guarantees.
- One thing at a time — complete one feature/fix fully (including its `custom/*.md` doc if it's a non-trivial fix) before starting the next.

---

## Language & Type Safety

- TypeScript strict mode is enabled project-wide (`tsconfig.json`).
- Use TypeScript for all code including `.vue` files.
- Prefer type safety over `any` types.
- `**/types.ts` files are side-agnostic and should only import from other type files.

---

## File and Folder Naming

- Vue component files: PascalCase (e.g. `PageHeader.vue`, `DatabaseSelectorCustom.vue`).
- Utility/module files: camelCase (e.g. `authHandlers.ts`, `sidebarConfig.ts`).
- Schema files: PascalCase JSON matching the doctype name (e.g. `Expense.json`, `NumberSeries.json`).
- Test files: `**/tests/**/*.spec.ts` — never called during runtime.
- One component per file.

---

## Component / Module Structure

```typescript
// imports → types → component/function → exports
// Vue SFCs: <template> → <script lang="ts"> (defineComponent, props, data/computed/methods) → no <style> block unless truly component-scoped (styling is Tailwind-first)
```

- No inline styles — styling goes through Tailwind utility classes backed by `colors.json` tokens.
- No business logic inside `src/` UI components beyond what's needed to call into `models/`/`fyo` — heavier logic belongs in `models/` or `custom/` service modules.

---

## API / Backend Conventions

### Desktop (Electron IPC)

```typescript
// IPC pattern (main process):
// main/registerIpcMainActionListeners.ts — register a named action, receive typed payload, return typed result
// custom/licensing/ipc/registerLicenseIpcListeners.ts is the template for custom IPC additions:
//   wrapped in try/catch, feature-flaggable via env var, registered from main.ts
```

- Every IPC handler validates its input before processing.
- Keymint/ClickPesa API clients wrap external calls with retry logic and never expose raw provider error bodies to the renderer — translate to a clear, human-readable message first.
- Never expose raw error messages to the client/UI.

### Web (Hono on Cloudflare Workers) — target design

```typescript
// worker/routes/*.ts — register a Hono route, validate input, return typed JSON
// worker/middleware/ — Clerk session verification + org/subscription-status/seat-limit checks,
//   run before any route handler that touches tenant data (see library-docs.md → Hono)
```

- Every route handler validates its input before processing, same as Desktop's IPC handlers.
- Return `{ success: boolean, data?, error? }` shaped JSON responses — keep this convention identical between Desktop's IPC results and Web's HTTP responses so `fyo`'s demux layer can normalize both.
- PayPal/OneSignal API clients wrap external calls with retry logic and never expose raw provider error bodies to the client — same rule as Desktop's Keymint/ClickPesa clients.
- Auth/org/subscription middleware always runs first — never add a tenant-data route that skips it "just for this one case."

---

## Database

### Desktop (SQLite)

- Never query the SQLite DB directly from a Vue component — always go through the `fyo` Doc/Model layer (`fyo.db`, `models/**`).
- Schema changes that add/remove columns can trigger SQLite's table "prestige" (rebuild) migration; when adding fields to an existing schema, consider backward compatibility with existing rows (see `custom/EXPENSE_MIGRATION_FIX.md`) — provide a default or a migration patch rather than assuming a clean table.
- Use `NumberSeries`-based naming for new submittable doctypes that need sequential IDs (see `Expense` schema).

### Web (Neon, one project per tenant) — target design

- Never query Neon directly from a Vue component — always go through the `fyo` Doc/Model layer (`fyo.db`, `models/**`), same rule as Desktop.
- **Multi-tenancy is a silo model, not a shared database:** each tenant has their own Neon project. There is no `org_id` column to filter by — the connection itself (resolved server-side from the control-plane project, per the signed-in user's Clerk org) is the tenant boundary. Never add an `org_id` filter as a "just in case" second layer that could mask a wrong-connection bug — fix the connection resolution instead.
- Every request must resolve the correct tenant project's connection via `worker/middleware/` before running any accounting query — never reuse a connection resolved for a different org, never fall back to a default.
- The control-plane project (org/subscription/payment bookkeeping) and tenant projects (accounting data) are separate Neon projects with separate connections — never query one through the other's connection.
- Postgres `ALTER TABLE ADD COLUMN` is safe for additive changes (unlike SQLite's rebuild) — still provide sane defaults, but the `EXPENSE_MIGRATION_FIX.md` failure mode is Desktop-specific. A schema change on Web must be rolled out across every tenant project via a migration runner, not a single `ALTER TABLE`.
- Use parameterized queries exclusively.

---

## Error Handling

- Never use empty catch blocks — always log or handle.
- Fork-safe custom integrations (Desktop licensing, IPC extensions) must fail gracefully with a `console.warn` rather than crashing app startup if the module is unavailable.
- User-facing errors must be human-readable — e.g. the phone-validation error message was rewritten to list all accepted formats instead of a single confusing example (`custom/licensing/subscription/`).
- Log errors with a context prefix, e.g. `[module/function]`.
- **Web only:** a failed Clerk session check, expired subscription, or seat-limit breach must return a specific, actionable error (`{ error: 'subscription_expired' }`, not a bare 401/500) so the client can route to the right billing screen rather than a generic error page.
- **Web only:** PayPal webhook handlers must return a 2xx response quickly (before slow processing) or PayPal will retry — do slow work (e.g. sending a confirmation notification) after acknowledging, not before.
- **Web only:** a Lipa Namba claim that fails validation (bad reference format, missing amount) must surface a clear message inline on the billing page — never silently drop the claim.

---

## Analytics Events

| Event                        | When                                       | Properties                          |
| ------------------------------ | ------------------------------------------- | ------------------------------------ |
| Restock notification triggered | Item stock drops below reorder threshold    | item, current stock, threshold       |
| Payment method notification    | A payment is recorded against an invoice    | invoice, payment method, amount      |

_(No project-wide analytics/telemetry SDK is wired in beyond the notification tests above — `fyo/telemetry/` exists as an upstream Frappe Books capability; confirm current usage before assuming events fire in production.)_

---

## Environment Variables

### Desktop only

| Variable                 | Used In                                       |
| -------------------------- | ---------------------------------------------- |
| `KEYMINT_API_URL`          | `custom/licensing/api/keymint-client.ts`       |
| `KEYMINT_ACCESS_TOKEN`     | `custom/licensing/api/keymint-client.ts`       |
| `KEYMINT_PRODUCT_ID`       | `custom/licensing/api/keymint-client.ts`       |
| `ENABLE_LICENSING`         | `main.ts` (set to `false` to disable licensing during dev) |
| `CLICKPESA_API_URL`        | `custom/licensing/api/clickpesa-client.ts`     |
| `CLICKPESA_API_KEY`        | `custom/licensing/api/clickpesa-client.ts`     |
| `CLICKPESA_CHECKSUM_KEY`   | `custom/licensing/api/clickpesa-client.ts`     |
| `YEARLY_LICENSE_PRICE`     | Desktop license purchase flow (subscription-manager.ts) |

### Web only (target design — Cloudflare Worker secrets, set via `wrangler secret put`, never committed)

| Variable                 | Used In                                       |
| -------------------------- | ---------------------------------------------- |
| `CLERK_SECRET_KEY`         | `worker/` Clerk middleware (`@hono/clerk-auth`) |
| `CLERK_PUBLISHABLE_KEY`    | `worker/` Clerk middleware, `src/` client-side Clerk components |
| `CLERK_WEBHOOK_SIGNING_SECRET` | `worker/routes/webhooks/clerk-org-created.ts` (Svix signature verification — separate secret from `CLERK_SECRET_KEY`, per-endpoint from the Clerk Dashboard) |
| `NEON_API_KEY`             | `worker/routes/webhooks/clerk-org-created.ts` (provisions a new tenant project per org via `@neon/sdk`) |
| `NEON_ACCOUNT_ORG_ID`      | `worker/db/` — OUR Neon account's own org ID (unrelated to Clerk orgs — see `library-docs.md` → Neon), passed once to `createNeonClient()` |
| `CONTROL_DATABASE_URL`     | `worker/db/control.ts` — the single, fixed connection to the shared control-plane project (org/subscription/payment tables) |
| `TENANT_CONNECTION_ENCRYPTION_KEY` | `worker/db/` — encrypts/decrypts `tenant_projects.connection_string` at rest |
| `PAYPAL_CLIENT_ID`         | `custom/web/payments/paypal-client.ts`         |
| `PAYPAL_CLIENT_SECRET`     | `custom/web/payments/paypal-client.ts`         |
| `PAYPAL_PLAN_ID`           | `custom/web/payments/paypal-client.ts`         |
| `PAYPAL_WEBHOOK_ID`        | `worker/routes/payments/paypal-webhook.ts` (signature verification) |
| `ONESIGNAL_APP_ID`         | `custom/web/notifications/`                    |
| `ONESIGNAL_API_KEY`        | `custom/web/notifications/`                    |
| `LIPA_NAMBA_INSTRUCTIONS`  | Billing page — paybill/business number + reference format shown to Tanzania users (kept as config, not hardcoded, per `library-docs.md`) |

**Note:** there is no `KEYMINT_*`, `ENABLE_LICENSING`, or `CLICKPESA_*` variable on Web — those are Desktop-only and must never appear in `wrangler.toml` or Worker secrets. There is also no single `DATABASE_URL` for Web — `CONTROL_DATABASE_URL` is the one fixed connection (control-plane project only); every tenant's own connection string is looked up dynamically at request time from `tenant_projects`, not set as a static env var (see `library-docs.md` → Neon).

---

## Comments

- No comments explaining what the code does — code must be self-explanatory (per `CONTRIBUTING.md`).
- Comments only for why — explaining a non-obvious decision (e.g. why licensing is wrapped in try/catch, why a schema uses a particular naming series).

---

## Dependencies

Approved core dependencies for this project (see `package.json` for exact versions):

### Shared

- `vue` / `vue-router` — UI framework and routing
- `luxon` — date handling
- `pesa` — currency/money arithmetic
- `lodash` — utilities
- `tailwindcss` (v3, postcss7-compat) / `tailwindcss-rtl` — styling
- `codemirror` / `@codemirror/*` — code/formula editing UI
- Dev/test: `playwright`, `tape`, `sinon`, `eslint` + `eslint-plugin-vue`, `prettier`

### Desktop only

- `electron` / `electron-builder` / `electron-updater` / `electron-store` — desktop shell, packaging, auto-update, local key-value store
- `better-sqlite3` / `knex` — local database and query builder
- `node-machine-id` — hardware fingerprinting for Keymint device-binding

### Web only (target design)

- `hono` — API framework on Cloudflare Workers
- `@hono/clerk-auth` — official Clerk session middleware for Hono (do not hand-roll JWT/JWKS verification)
- `@clerk/backend` (pulled in by `@hono/clerk-auth`) — Clerk backend SDK, V8-isolate compatible
- `@neon/sdk` — official Neon Platform API client, used server-side (never client-side) to provision a Neon project per tenant on org creation (`createNeonClient().projects.createAndConnect()`) — this manages projects, it does not run accounting queries
- `svix` — verifies Clerk webhook signatures on Workers (Clerk's own Next.js `verifyWebhook` helper doesn't apply here — see `library-docs.md` → Clerk)
- A Postgres/Neon client compatible with the Workers runtime for actual query execution (e.g. `@neondatabase/serverless`) — confirm the exact package before adding, since not every Postgres driver works in a Workers isolate; this is separate from `@neon/sdk` above
- `wrangler` (dev dependency) — Cloudflare Workers CLI/deploy tooling

Do not install any other packages without updating this list first. Desktop's licensing/payment integrations (Keymint, ClickPesa) are intentionally dependency-light (direct REST calls via `node-fetch`) rather than adding heavier SDKs. The Web target's PayPal and OneSignal integrations should follow the same dependency-light pattern (direct REST calls) — do not add a PayPal or OneSignal SDK package unless a strong reason emerges, to keep both targets consistent and auditable.
