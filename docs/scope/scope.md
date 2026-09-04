# Scope: RareBooks Web Platform

RareBooks is a bookkeeping app for small and medium businesses, forked from Frappe Books, today shipping as an Electron desktop app. This scope covers migrating it to a hosted, multi tenant web platform for the East African (Tanzania and Kenya) market. Phase and feature numbers below mirror `context/build-plan.md`, the project's own build plan, so the two stay in sync.

**Build approach:** Tracer Bullet (each feature built as a thin, complete vertical slice through every layer, working end to end, before the next one starts).
**Workflow:** GA (after `/develop`: `/check verify`, then `/test`, then a fresh model `/check review`, then `/document`). The project default level of rigor, since this plan touches payments, auth, and multi tenant data. `/architect` is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. `· GA`) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use `/develop` and skip `/architect`. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 01 | Keymint hybrid licensing | Phase 1: Commercial Foundation | existing |
| 02 | ClickPesa payment integration | Phase 1: Commercial Foundation | existing |
| 03 | Default super admin auto-provisioning | Phase 2: Onboarding & Access | existing |
| 04 | Expense tracking, full feature | Phase 3: Accounting Extensions | existing |
| 05 | Inventory & payment notifications | Phase 3: Accounting Extensions | existing |
| 06 | Web platform foundation & control plane | Phase 4: Web Migration | in-progress |
| 07 | Tenant schema & data layer | Phase 4: Web Migration | planned |
| 08 | Subscription gating & seat sync | Phase 4: Web Migration | planned |
| 09 | PayPal subscriptions (non Tanzania payments) | Phase 4: Web Migration | planned |
| 10 | Lipa Namba manual payments (Tanzania payments) & admin review | Phase 4: Web Migration | planned |
| 11 | OneSignal notifications | Phase 4: Web Migration | planned |
| 12 | Deploy & cutover readiness | Phase 4: Web Migration | planned |
| 13 | Legal & compliance pages | Phase 4: Web Migration (addition) | planned |

## Existing

### 01. Keymint hybrid licensing · existing
Device bound license activation and validation for the Electron app, with an offline grace period. Desktop only; never ported to Web. code in `custom/licensing/`

### 02. ClickPesa payment integration · existing
USSD push mobile money payment for license purchase, Tanzania only. Desktop only; replaced on Web by features 09 and 10, not extended. code in `custom/licensing/api/clickpesa-client.ts`

### 03. Default super admin auto-provisioning · existing
Auto-creates a super admin user on first company setup if none exists. code in `custom/setup/createDefaultSuperAdmin.ts`

### 04. Expense tracking, full feature · existing
Custom `Expense` doctype (schema, model, numbered series) with a documented migration recovery path. code in `custom/schemas/Expense.json`

### 05. Inventory & payment notifications · existing
Restock notifications (with item image support) and payment method notifications, delivered via ntfy on Desktop. code in `custom/` notification handlers

## Phase 4: Web Migration

Move from a single machine Electron app to a multi tenant web architecture: Cloudflare Workers, Neon, Clerk, Hono backend. Nothing in this phase exists in the codebase yet. Sequenced so the platform foundation lands before any payment integration, since payments need somewhere to record subscription status against.

### 06. Web platform foundation & control plane · in-progress
Stand up the Hono API, Clerk auth, and the control plane Neon project. No accounting features yet, just: can a user sign in, create an organization, get a tenant project provisioned, and see an empty dashboard.
**Done when:** creating an organization auto provisions a dedicated Neon tenant project, the control plane project records the org, its tenant pointer, and subscription status, and a signed in user with a `READY` tenant reaches an empty dashboard shell.
- [x] Design it (spec): `/architect web platform foundation & control plane`
- [ ] Build it: `/develop web platform foundation & control plane`
   - [x] `worker/` scaffold: Hono app, `@hono/clerk-auth` middleware, `wrangler.toml`
   - [x] Control plane Neon project: `organizations`, `tenant_projects`, `subscriptions`, `payments` tables — schema written (`worker/db/schema.sql`), not yet applied to a real Neon project
   - [x] `worker/routes/webhooks/organization-created.ts`: provisions a tenant Neon project on org creation, stores the encrypted connection string
   - [x] `worker/db/control.ts` and `worker/db/resolve-tenant.ts`
   - [x] `fyo/demux/*.ts` web implementation + `rendererWeb.ts` entry point, plus the sign-in/sign-up/org-creation/dashboard UI (`src/pages/web/`, `src/web/router.ts`)
- [ ] Verify it: `/check verify web platform foundation & control plane`
- [ ] Test it: `/test web platform foundation & control plane`
- [ ] Review it: `/check review web platform foundation & control plane`
- [ ] Document it: `/document web platform foundation & control plane`
Spec 0001. code in `worker/`, `custom/web/auth/`, `fyo/demux/`, `src/pages/web/`, `src/web/`, `rendererWeb.ts`

All 5 milestones are code-complete and typecheck clean (verified against real, currently-published package versions and types — `@neon/sdk`, `svix`, `@clerk/vue`, `@hono/clerk-auth` — not assumed from memory; two real bugs were caught and fixed this way: svix's `verify()` doesn't parse the payload, and `@neon/sdk`'s `orgId` is client-level config, not a per-call field). Not yet run against live infrastructure — no Cloudflare, Neon, or Clerk account is available in the build environment. Before `Build it` can be ticked: create the Neon, Clerk, and Cloudflare accounts/projects, set the secrets in `worker/wrangler.toml`'s comment block (including generating `TENANT_ENCRYPTION_KEY`), apply `worker/db/schema.sql` to the control plane project, and run `wrangler dev` end to end.

### 07. Tenant schema & data layer · needs a decision
Apply the accounting schema to freshly provisioned tenant projects, and route doc CRUD through the correct per tenant connection, so the same doctypes and forms Desktop already has work through the Web stack.
**Done when:** a newly provisioned tenant project has the full accounting schema applied and marked `READY`, and generic doc CRUD routes read and write against the signed in org's own tenant project with no `org_id` column anywhere.
- [ ] Design it (spec): `/architect tenant schema & data layer`
Depends on 06.

### 08. Subscription gating & seat sync · needs a decision
Implement access control, the thing that replaces Keymint on Web: subscription status gating plus Clerk's native per org seat cap.
**Done when:** a request against tenant data is blocked before the tenant connection is even resolved when the org's subscription status is not `ACTIVE`, and `maxAllowedMemberships` on Clerk is kept in sync with the org's plan tier on every activation, plan change, and cancellation.
- [ ] Design it (spec): `/architect subscription gating & seat sync`
Depends on 07. Must never import or reference `custom/licensing/` (Keymint) anywhere in this phase.

### 09. PayPal subscriptions (non Tanzania payments) · needs a decision
Recurring subscription billing for tenants outside Tanzania.
**Done when:** a tenant outside Tanzania can subscribe through PayPal, get charged on a recurring schedule, and the control plane's subscription and payments records update correctly from verified PayPal webhook events.
- [ ] Design it (spec): `/architect paypal subscriptions`
Depends on 08. Must never import or reference `custom/licensing/api/clickpesa-client.ts` (ClickPesa); PayPal fully replaces it on Web, not alongside it.

### 10. Lipa Namba manual payments (Tanzania payments) & admin review · needs a decision
Manual mobile money payment instructions for Tanzania tenants, with no live payment API integration, verified by a super admin. Includes the super admin payment review page (the only admin surface currently in scope).
**Done when:** a Tanzania tenant sees Lipa Namba payment instructions, submits a payment reference, a super admin can list, approve, or reject the pending claim, and an approved claim updates the org's subscription the same way a PayPal payment would.
- [ ] Design it (spec): `/architect lipa namba manual payments`
Depends on 08.

### 11. OneSignal notifications · needs a decision
Port restock and payment notification triggers from ntfy (Desktop) to OneSignal (Web), reusing the existing trigger logic.
**Done when:** a restock or payment method event on the web platform reliably sends a OneSignal push to the right org or user, using the same trigger conditions Desktop already tests.
- [ ] Design it (spec): `/architect onesignal notifications`
Depends on 07 (needs the tenant data layer to know what to notify about).

### 12. Deploy & cutover readiness · needs a decision
Operational readiness: production deploy pipeline and a final check that the invariants hold before onboarding real customers.
**Done when:** `wrangler deploy` ships the worker with production secrets configured, no Keymint or ClickPesa code is present in the deployed bundle, and a load or smoke test confirms multi tenant query scoping holds under concurrent tenants.
- [ ] Design it (spec): `/architect deploy & cutover readiness`
Depends on 09, 10, 11, and 13 (legal pages should be live before real customers are onboarded).

### 13. Legal & compliance pages
Terms of Service, Privacy Policy, and basic compliance content, needed once real payments and tenant data are live. Not part of the original `context/build-plan.md` sub-phase list; added because Charles confirmed it in scope during planning.
**Done when:** ToS and Privacy Policy pages are published and linked from signup and billing flows.
- [ ] Build it: `/develop legal & compliance pages`

## Note on file & image storage

An earlier pass of this plan included a "tenant file & image storage" feature using Neon's S3 compatible object storage, per a preference Charles stated at the time. `context/architecture.md`'s Storage section says no shared storage bucket exists in either target currently, and that if one is ever needed it would likely be Cloudflare R2, not Neon storage, since Neon does not do blob storage. This is a real conflict between what was decided in this scope session and what the project's own architecture doc says. Dropped from this scope pass pending a decision; raise it with `/architect` (as its own feature) once you have picked a direction.

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies, so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` + 2 to 5 milestones; the tier's closing boxes (`Verify it`, `Test it`, `Review it` + `Document it` for GA); any surfaced follow-up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; GA's last stage (after `/document`) is the suggested point to call it done |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature's rigor above or below the project default (GA); none carry an override tag here, all inherit GA.
