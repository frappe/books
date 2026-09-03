<!-- Progress tracker: live build status — update this after every session -->

# Progress Tracker

**Last updated:** 2026-09-03
**Current phase:** Phase 4 — Web Migration (target design finalized and crosschecked against current vendor docs; no code written yet)
**Overall status:** On track for Desktop. Web migration plan is decision-complete and its library usage has been verified against current documentation (Context7 + Neon's own docs) rather than assumed conventions — next session should start on sub-phase 06 (Web Platform Foundation & Control Plane).

---

## Completed

### Desktop (shipped)
- [x] Keymint hybrid online/offline licensing (device-bound, 7-day grace period, AES-256-GCM cache)
- [x] ClickPesa USSD-push payment integration for license purchase (token auth, retry logic)
- [x] Tanzania phone number validation accepting all 3 local formats, with clearer combined error message
- [x] Default super admin auto-provisioning on first company setup
- [x] Custom `Expense` doctype (schema, model, numbered series) with documented migration recovery path
- [x] Restock notifications (with item image support) and payment-method notifications
- [x] Birth date field + validation added to `Party` model
- [x] POS grid view bug fix (Classic + Modern POS item grids)
- [x] License validation bug fix: deactivated device could still validate as active (fixed)

### Web planning
- [x] Confirmed target stack: Cloudflare Workers + Hono + Neon + Clerk + OneSignal
- [x] Decided access-gating model: subscription status + per-org seat limits enforced via Clerk (no device binding, no Keymint on Web)
- [x] Decided payment model: Keymint removed entirely from Web (kept Desktop-only); ClickPesa removed entirely from Web; PayPal Subscriptions API for non-Tanzania users; Lipa Namba kept as manual instructions only (no API integration) for Tanzania users, verified by a super admin
- [x] Sequenced Phase 4 into 7 sub-phases (06–12): platform foundation → multi-tenant data layer → subscription gating → PayPal → Lipa Namba → OneSignal → deploy/cutover
- [x] All context files (architecture, project-overview, code-standards, library-docs, build-plan) updated to reflect the dual-target (Desktop/Web) split

## In Progress
- [ ] None — Web migration is fully planned but not yet started in code. Desktop has no in-progress work currently flagged (most recent commits are POS bug fixes and repo housekeeping).

## Up Next
- [ ] Start Phase 4, sub-phase 06 (Web Platform Foundation): scaffold `worker/`, wire `@hono/clerk-auth`, stand up Neon connectivity, build the Web `fyo/demux` implementation and `rendererWeb.ts` entry point.
- [ ] Decide on the Postgres/Neon client package for the Workers runtime (e.g. `@neondatabase/serverless`) before sub-phase 07 starts — confirmed compatible driver needed, not assumed.
- [ ] Set up PayPal sandbox app + Clerk instance + Neon project (accounts/credentials) ahead of sub-phases 08–09, so implementation isn't blocked waiting on account provisioning.
- [ ] Rotate/replace default Desktop super admin credentials before any production deployment (unrelated to Web, still open).
- [ ] Consider automating the Desktop `Expense` schema migration path instead of the current manual recovery procedure.

## Blocked
- [ ] None currently documented.

---

## Known Issues
| Issue | Severity | Status |
|-------|----------|--------|
| `Expense` schema changes can fail the SQLite table "prestige" rebuild against existing rows missing new columns (Desktop only — does not affect the planned Neon/Postgres Web schema) | Medium | Documented workaround in `custom/EXPENSE_MIGRATION_FIX.md`; not auto-migrated |
| Default Desktop super admin credentials (`super@rarebooks.com` / `superadmin`) are well-known/public in docs | High (for production) | Open — must be rotated per `custom/DEFAULT_CREDENTIALS.md` before shipping to a real customer |
| Web target has no code yet despite the `rarebooks-webapp` branch name — branch currently only has POS UI changes | Low | Resolved by this session's planning — branch naming/expectation mismatch is now understood, not a blocker |

---

## Decisions Made

### Desktop (existing)
- **Fork-safety as a hard constraint** — all RareBooks-specific code goes in `custom/` with minimal, documented touch-points in core files, to keep upstream `frappe/books` merges low-conflict.
- **Keymint chosen for Desktop licensing** over building a custom license server — hybrid online/offline model with grace period balances protection against RareBooks's offline-first product design.
- **ClickPesa chosen for Desktop payments** — Tanzania-market mobile money (M-Pesa, Tigo Pesa, Airtel Money) via USSD push, matching the target user base's payment habits.
- **No SDK dependency for Keymint/ClickPesa** — both integrations use direct REST calls rather than adding a vendor SDK package, keeping the dependency surface small.

### Web (this session)
- **Stack confirmed:** Cloudflare Workers + Hono + Neon + Clerk + OneSignal — unchanged from earlier planning, explicitly reconfirmed rather than assumed.
- **Keymint is Desktop-only.** Web has no device-bound license key at all; removed entirely from the Web target rather than adapted.
- **Access gating on Web is subscription status + Clerk-enforced per-org seat limits** — chosen over a pure subscription-status-only model, so pricing can scale by seat count in addition to plan tier.
- **ClickPesa is Desktop-only.** Removed entirely from Web — not reused, not called from any Web code path.
- **PayPal Subscriptions API (recurring) chosen for non-Tanzania Web users** — over a one-time-payment model — to match the subscription-based access model already used for Lipa Namba's status tracking, and because recurring billing is the standard PayPal integration pattern for SaaS.
- **Lipa Namba on Web is manual-only** — informational instructions plus a submitted reference plus super-admin review, not an automated USSD-push API integration like Desktop's ClickPesa. This keeps a Tanzania-friendly payment option on Web without duplicating ClickPesa integration work for a smaller, migratable-later use case.
- **Same shared `payments` ledger table for both PayPal and Lipa Namba claims**, distinguished by a `provider` column — avoids two parallel payment-tracking schemas. Lives in the control-plane project (see next decision), not in any tenant project.
- **Multi-tenancy is a silo model: one Neon project per tenant**, not a shared database with an `org_id` column — chosen over the initially-drafted shared-database design. Each org gets its own Neon project, provisioned automatically via the Neon API (`@neon/sdk`) on org creation. A small shared control-plane Neon project holds `organizations`, `tenant_projects` (the org → project mapping, encrypted connection strings), `subscriptions`, and `payments` — never accounting data. This trades a per-request tenant-connection lookup for physical data isolation between tenants, removing the entire class of bug where a query is missing or has the wrong `org_id` filter.
- **Seat limits are delegated to Clerk's own `maxAllowedMemberships`**, not reimplemented as a custom per-request check — found during the docs crosscheck that Clerk already provides this natively. Our worker only checks subscription status; Clerk enforces the member cap.

---

## Session Notes

**2026-09-02 (this session)**
- Finalized the Web migration's payment/access-gating architecture: Keymint removed from Web (Desktop-only), ClickPesa removed from Web (Desktop-only), PayPal Subscriptions added for non-Tanzania users, Lipa Namba downgraded from an API integration (ClickPesa-style) to manual instructions + super-admin review for Tanzania users.
- Confirmed the previously-noted target stack (Cloudflare Workers, Hono, Neon, Clerk, OneSignal) is still current.
- Rewrote `architecture.md`, `project-overview.md`, `code-standards.md`, `library-docs.md`, and `build-plan.md` to reflect the dual-target (Desktop/Web) split and this session's decisions. `ui-tokens.md`/`ui-rules.md`/`ui-registry.md` needed only minor additions since the Web target reuses the same Vue/Tailwind UI layer.
- Verified current PayPal Subscriptions webhook event names and the `@hono/clerk-auth` middleware pattern against live docs before writing them into `library-docs.md`.

**2026-09-03 (this session)**
- Changed the Web multi-tenancy model from a shared Neon database with an `org_id` column to a silo model: one Neon project per tenant, provisioned automatically via the Neon API on org creation, plus a shared control-plane project for org/subscription/payment bookkeeping.
- Verified Neon's own documented "project-per-user" pattern and the new `@neon/sdk` client (July 2026, replaces `@neondatabase/api-client`) against live docs before writing them into `library-docs.md`.
- Updated `architecture.md`, `project-overview.md`, `code-standards.md`, `library-docs.md`, and `build-plan.md` (sub-phases 06–08) to reflect the silo model — env vars changed from a single `DATABASE_URL` to `NEON_API_KEY` + `CONTROL_DATABASE_URL` + a per-tenant dynamic connection lookup.

**2026-09-03 (crosscheck pass, same day)**
- Crosschecked every Web-target library's docs via Context7 (and Neon's own docs tool) against what had been written from general research. Found and corrected several real drifts from assumed conventions:
  - **Clerk has a native per-org seat cap (`maxAllowedMemberships`)** — replaced the planned custom "compare Clerk membership count vs our own `seat_limit` column on every request" design. Now: sync `maxAllowedMemberships` to Clerk via its Backend API whenever a subscription's plan tier changes; Clerk enforces the cap itself, no per-request seat check needed. Also surfaced a real constraint: Clerk caps this at 20 seats without their paid "B2B Authentication" add-on — relevant to future tier pricing.
  - **PayPal's `CreateSubscriptionRequest.applicationContext` and `.autoRenewal` are both deprecated** per PayPal's own current SDK docs — the earlier snippet used `application_context` for the payer-redirect experience; flagged to re-check PayPal's current recommended replacement before implementing rather than building against a deprecated shape.
  - **OneSignal's targeting parameter has changed** — `include_external_user_ids` (what was written) is not the current API; the confirmed current shape is `include_aliases: { external_id: [...] }` plus a required `target_channel: "push"`. Also corrected the auth header format to `Key <api_key>` (not `Bearer`).
  - **Neon SDK details refined**: confirmed exact `{ data, error }` envelope and typed error `.kind` values, confirmed built-in retry behavior (423/429/503, 2 retries by default) and removed an unverified "700 requests/minute" rate-limit figure that had come from a low-authority third-party mirror rather than Neon's own docs. Also flagged that Neon's own `orgId` concept (which Neon account owns a project) is unrelated to our Clerk `org_id` (the tenant) — easy to conflate, now explicitly disambiguated in `library-docs.md`.
  - **Neon's product is now branded "Lakebase Postgres, from Databricks"** in its own docs — noted so it isn't confusing later, doesn't change any technical decision.
  - Clerk webhooks are Svix-based; the Next.js `verifyWebhook` helper doesn't apply to our Hono/Workers setup — documented the manual `svix` package verification path instead, and added the `CLERK_WEBHOOK_SIGNING_SECRET` env var (separate from `CLERK_SECRET_KEY`) that this requires.
- Net effect: `library-docs.md`, `architecture.md`, `code-standards.md`, `build-plan.md`, and `project-overview.md` all updated. No change to the overall architecture shape (silo multi-tenancy, PayPal + Lipa Namba, Keymint/ClickPesa Desktop-only) — these were implementation-detail corrections, not design reversals.

**2026-08-19 to 2026-08-22**
- Repo re-initialized on a new machine, `.gitignore` added, local DB folder excluded from version control.
- Fixed a POS grid view bug (Classic and Modern item grids).

**2026-07-07**
- Fixed a license validation bug where a deactivated device could still be validated as active — closed.

**2026-05-08 to 2026-05-13**
- Added mobile notifications and restock alerts for inventory management, with image support.
- Added `birth_date` field + validation to the `Party` model.

**2026-03-12 to 2026-03-19**
- Implemented the ClickPesa payment integration (token-based auth) and related documentation.
- Added expiration-date support for license creation.
- Updated app identity/display names and logo scaling for the Windows appx build.

**Next session should:**
- If starting sub-phase 06, provision the control-plane Neon project first (manually or via a one-time setup script) before wiring the `clerk-org-created` webhook that provisions tenant projects.
- Re-check PayPal's current `Create Subscription` request schema before implementing sub-phase 09 — this session's crosscheck found two deprecated fields on that exact shape, which signals the API surface moves; don't build from the snippet in `library-docs.md` without a fresh check.
- Decide the actual seat counts per subscription tier before sub-phase 08, and confirm whether any tier needs Clerk's paid B2B Authentication add-on (required above 20 seats per org).
- General rule going forward: this session's docs crosscheck has a shelf life like any other vendor research — re-verify Neon, Clerk, PayPal, and OneSignal specifics again before actually implementing each, don't treat this pass as permanently current.
- If resuming Desktop licensing/payments work instead, re-read `custom/licensing/README.md` first — that code is untouched by all of this session's Web planning.
