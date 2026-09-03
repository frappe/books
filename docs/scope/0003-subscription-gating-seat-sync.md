# 0003. Subscription gating & seat sync

**Date**: 2026-09-03
**Status**: Proposed

## Summary

This decision replaces what Keymint does on Desktop (device bound license enforcement) with two separate, simpler checks on Web: a subscription status check against the control plane's `subscriptions` table on every tenant data request, and Clerk's own native per organization member cap for seat limits. The two are deliberately not combined into one custom check; Clerk already enforces the seat cap itself once told what it is.

## Context

Desktop enforces access through Keymint, a device bound license with an offline grace period. That model does not fit Web: there is no device to bind, and Web already requires connectivity, so there is no need for an offline grace period either. What Web actually needs is: is this organization's subscription currently paid up, and has it hit its seat limit. An earlier draft of this plan treated seat limits as a custom check (compare Clerk's live membership count against an app level `seat_limit` column on every request). That was corrected after confirming Clerk organizations already have a native, enforced member cap (`maxAllowedMemberships`) that Clerk itself blocks over cap invitations against, making a custom per request seat check redundant and a source of drift.

## Requirements

**User stories**:
- As the platform, I need to block tenant data access when an organization's subscription is not active, so that unpaid customers cannot keep using the product.
- As an organization admin, I want my plan's seat count to be enforced so that I cannot accidentally invite more members than I am paying for.

**Acceptance criteria**:
- **AC-1**: Every tenant data request checks the org's subscription status from the control plane `subscriptions` table before the tenant connection is even resolved; a non `ACTIVE` status is rejected with no partial tenant lookup performed.
- **AC-2**: A denied request routes the client to a billing or upgrade prompt; there is no offline grace period on Web.
- **AC-3**: On every subscription activation, plan change, and cancellation or downgrade, the org's `maxAllowedMemberships` is synced to Clerk via the Backend API to match the new plan's seat count.
- **AC-4**: Seat limits are never re-checked in `worker/middleware/`; Clerk's own enforcement is the only seat check.
- **AC-5**: This feature does not import or reference `custom/licensing/` (Keymint) anywhere.

## Decision

**Chosen option**: A subscription status middleware check against the control plane, run before tenant resolution, combined with syncing Clerk's `maxAllowedMemberships` on every plan change rather than re-implementing seat counting.

## Rationale

Checking subscription status before resolving the tenant connection avoids wasting a Neon lookup on a request that is about to be denied. Delegating seat enforcement entirely to Clerk removes an entire category of custom logic and the drift risk of a locally cached seat count disagreeing with Clerk's actual membership count; Clerk's own cap is authoritative and already enforced on Clerk's side.

## Feature design

**Data model sketch**: No new tables. Reads `organizations.plan_seat_limit` and `subscriptions.status` from the control plane project (both created in feature 06). `plan_seat_limit` is written by this feature's Clerk sync step, as a record of intent, not read back for enforcement.

**State transitions**: Request handling: `subscriptions.status === 'ACTIVE'` → request proceeds; anything else (`PAST_DUE`, `EXPIRED`, `PENDING_REVIEW`, `CANCELLED`) → request rejected, billing prompt shown.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `worker/middleware/subscription-gate.ts` (middleware, not a route) | n/a | verified session `org_id` | allow or 402/403 | Clerk session | 402/403 subscription not active |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Every tenant request | Allow or deny | `subscriptions.status` for the session's `org_id`, control plane query |
| Seat cap sync | Clerk `maxAllowedMemberships` value | The org's current plan tier's seat count, set via `clerkClient.organizations.updateOrganization` on activation, plan change, or cancellation |

**Key invariants**:
- Seat limits are Clerk's own responsibility; never re-implemented as a per request check.
- No offline grace period on Web; a denied request routes straight to a billing prompt.
- This feature never imports or references `custom/licensing/`.

**Security model**: The gate reads only from the verified Clerk session's `org_id`, never a client supplied value. `maxAllowedMemberships` above 20 requires Clerk's paid B2B Authentication add on; any subscription tier planned above 20 seats needs that add on confirmed before launch.

**Configuration required**:
- Uses `CLERK_SECRET_KEY` and `CONTROL_DATABASE_URL` already configured in feature 06; no new secrets.

**Critical test scenarios**:
- Happy path: an org with an `ACTIVE` subscription and a tenant project has its tenant data requests succeed. Verifies **AC-1**.
- Failure case: an org with a `PAST_DUE` or `EXPIRED` subscription has its tenant data requests rejected before any tenant connection is resolved, and is shown a billing prompt. Verifies **AC-1, AC-2**.
- Seat sync: a subscription plan change updates the org's `maxAllowedMemberships` on Clerk, and Clerk itself then blocks a new invite over the new cap. Verifies **AC-3, AC-4**.

## Build plan

1. Build `worker/middleware/subscription-gate.ts`, querying `subscriptions.status` from the control plane before tenant resolution runs. Satisfies **AC-1**.
2. Wire the billing/upgrade prompt UI shown on a denied request. Satisfies **AC-2**.
3. Build the Clerk seat sync call, triggered on subscription activation, plan change, and cancellation (hooked into features 09 and 10's payment event handling once they exist). Satisfies **AC-3, AC-4**.

## Consequences

**Positive**:
- Removing custom seat enforcement removes an entire class of drift bug between a locally cached count and Clerk's real membership state.

**Negative / tradeoffs**:
- Hard access denial with no grace period means any transient control plane outage directly blocks legitimate paying customers; Desktop's fail open, offline tolerant design does not carry over here by choice.

**Neutral**:
- Any subscription tier above 20 seats is gated on confirming Clerk's B2B Authentication add on before it can be sold.

## Follow-up

- [ ] Confirm Clerk's current `maxAllowedMemberships` pricing and add on requirement against the live Clerk pricing page before finalizing any tier above 20 seats.
