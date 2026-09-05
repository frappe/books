# 0007. Deploy & cutover readiness

**Date**: 2026-09-03
**Status**: Proposed

## Summary

This decision covers the operational work needed before real customers are onboarded to the web platform: a working Wrangler deploy pipeline with production secrets configured, a confirmation that no Desktop only Keymint or ClickPesa code is present in the deployed Worker bundle, and a load or smoke test proving multi tenant query scoping holds under real, concurrent tenant traffic.

## Context

Every prior feature in this phase (06 through 11) builds the actual product; none of them individually confirm the whole thing is safe to put in front of paying customers. Two risks are specific to this migration and worth checking explicitly before cutover: a Desktop only dependency (Keymint or ClickPesa) accidentally leaking into the Web bundle, which the project's own invariants already forbid throughout development but are worth a final confirmation on; and the tenant isolation model (a Neon project per tenant, no `org_id` filter) actually holding under concurrent load rather than only in single request testing.

## Requirements

**User stories**:
- As the platform, I need a repeatable production deploy so that shipping an update to the web platform is not a manual, error prone process.
- As the platform, I need confidence that tenant data isolation holds under real concurrent traffic before onboarding paying customers.

**Acceptance criteria**:
- **AC-1**: `wrangler deploy` ships `worker/` to Cloudflare Workers with all production secrets (PayPal, Clerk, Neon, OneSignal) configured, not left as sandbox or development values.
- **AC-2**: The Worker source graph and the emitted deployment artifact contain no Keymint or ClickPesa code.
- **AC-3**: A load or smoke test exercises multiple tenants concurrently and confirms each request only ever reads or writes its own org's tenant project, never another org's.
- **AC-4**: Legal and compliance pages (feature 13) are live before cutover.

## Decision

**Chosen option**: A scripted `wrangler deploy` pipeline gated on a secrets checklist, a bundle content check for forbidden Desktop only imports, and a concurrent tenant load test as the final gate before onboarding real customers.

## Rationale

The invariants forbidding Keymint and ClickPesa in the Web bundle are enforced by code review discipline throughout features 06 through 11, but a final automated or scripted check before cutover catches a mistake that slipped through review, at the point where it matters most. A single request test proves tenant resolution works; only a concurrent test proves it holds when many tenants' requests interleave, which is the actual production condition.

## Feature design

**Data model sketch**: No new tables; this feature is operational, not data model changing.

**API surface**: None new; this feature deploys and verifies the API surface built by features 06 through 11.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Production deploy | The live Worker | `wrangler deploy`, with production values for `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`, `CLERK_SECRET_KEY`, `NEON_API_KEY`, `ONESIGNAL_API_KEY`, and the other secrets each prior feature introduced |
| Bundle check | Pass or fail | Run `wrangler deploy --dry-run --outdir <dir> --metafile <dir>/bundle-meta.json`, then inspect both the esbuild metafile's input graph and every emitted module. Reject licensing source inputs and stable provider markers such as `keymint.dev`, `KEYMINT_`, `api.clickpesa.com`, `CLICKPESA_`, `preview-ussd-push-request`, and `initiate-ussd-push-request`; do not rely on an unresolved `../../custom/licensing` import surviving bundling. |
| Load test result | Pass or fail | Concurrent requests across multiple test tenants, each checked against the tenant project it should and should not have touched |

**Key invariants**:
- No Keymint or ClickPesa code is present in the deployed Worker bundle.
- Production PayPal credentials are only used once the go live step from feature 09 is explicitly confirmed.

**Security model**: Production secrets are set as Worker secrets, never committed to the repository or logged during deploy.

**Configuration required**:
- All secrets introduced by features 06, 08 (Clerk), 09 (PayPal), 11 (OneSignal), set to production values for this deploy

**Critical test scenarios**:
- Happy path: `wrangler deploy` succeeds and the deployed Worker serves requests correctly for a real tenant. Verifies **AC-1**.
- Failure case: the source graph contains a Desktop licensing input, or an emitted module contains a Keymint or ClickPesa provider marker after esbuild has inlined imports; deploy is blocked until it is removed. Verifies **AC-2**.
- Isolation under load: concurrent requests from multiple test tenants never cross tenant boundaries. Verifies **AC-3**.

## Build plan

1. Script the Wrangler deploy pipeline with a production secrets checklist. Satisfies **AC-1**.
2. Add a bundle gate that inspects the Wrangler/esbuild metafile and all dry-run output modules for Desktop licensing inputs and stable Keymint or ClickPesa provider markers. Satisfies **AC-2**.
3. Write and run a concurrent, multi tenant load or smoke test against a staging deploy before the first real customer is onboarded. Satisfies **AC-3**.
4. Confirm feature 13 (legal and compliance pages) is live before flipping the deploy to serve real customers. Satisfies **AC-4**.

## Consequences

**Positive**:
- Catches a Desktop only dependency leak or a tenant isolation failure before it reaches paying customers, at the last responsible moment.

**Negative / tradeoffs**:
- Adds a manual or scripted gate before cutover, slowing down the first launch in exchange for the confidence that isolation actually holds under load.

**Neutral**:
- This feature has no product surface of its own; it is entirely operational verification of features 06 through 11.

## Follow-up

- [ ] Decide who is authorized to flip production secrets live, since that action grants real payment processing capability.
