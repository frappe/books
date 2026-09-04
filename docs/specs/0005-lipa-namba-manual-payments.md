# 0005. Lipa Namba manual payments (Tanzania payments) & admin review

**Date**: 2026-09-03
**Status**: Proposed

## Summary

This decision gives Tanzania based tenants a way to pay by mobile money without a live payment API integration: the billing page shows static Lipa Namba instructions, the tenant submits a payment reference, and a super admin manually reviews and approves or rejects the claim. This is the only admin surface currently in scope for the web migration; it exists specifically to support this feature.

## Context

ClickPesa gave Desktop a live USSD push integration for Tanzania mobile money, but it is explicitly not carried over to Web (see feature 09's context). Tanzania customers still need a way to pay that does not require a foreign PayPal account. The chosen path is deliberately informational, not automated: show payment instructions, collect a submitted reference, and have a human verify it, the same trust model a small business already uses for manual mobile money payments today.

## Requirements

**User stories**:
- As a Tanzania based tenant, I want to see clear payment instructions and submit proof of payment so that I can activate my subscription without needing PayPal.
- As a super admin, I want to review pending Lipa Namba claims and approve or reject them so that only genuinely paid subscriptions get activated.

**Acceptance criteria**:
- **AC-1**: A Tanzania tenant sees Lipa Namba payment instructions (paybill or business number, amount, reference format) on the billing page.
- **AC-2**: Submitting a payment reference writes a `payments` row with `provider = 'lipa_namba'` and `status = 'PENDING_REVIEW'`; no claim is ever auto approved.
- **AC-3**: A super admin only route lists pending claims and lets a super admin approve or reject each one.
- **AC-4**: Approving a claim sets `payments.status = 'APPROVED'`, records `reviewed_by` as the approving super admin's Clerk user ID, and updates `subscriptions` the same way a PayPal activation would.
- **AC-5**: The super admin authorization check is a distinct RareBooks level role, separate from normal org scoped access, and separate from Clerk's own built in roles.
- **AC-6**: No API integration with any Tanzania mobile money provider exists on Web for this feature; it is instructions, manual claim, and manual review by design.

## Decision

**Chosen option**: Static payment instructions plus a manual claim and manual super admin review flow, with a dedicated `payments.status = 'PENDING_REVIEW'` state that always requires an explicit approve or reject action.

## Rationale

Building a live mobile money integration for Web would duplicate ClickPesa's complexity for a payment path that is explicitly meant to stay simple; the manual review model matches how Tanzania SMEs already reconcile mobile money payments by hand, and keeps the trust boundary (a human confirms the money actually arrived) explicit rather than automated.

## Feature design

**Data model sketch**: No new tables; writes to `payments` in the control plane project (feature 06). `payments.provider = 'lipa_namba'`, `payments.reference` set to the user submitted transaction reference, `payments.reviewed_by` set only on approval. The super admin role itself is implemented as an explicit allow list or a Clerk metadata flag, not a new table.

**State transitions**: `payments.status`: `PENDING_REVIEW` → `APPROVED` (super admin approves, `subscriptions` updated) or `REJECTED` (super admin rejects, no subscription change).

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/payments/lipa-namba-claim` | POST | `reference` (string), `amount` (number) | created `payments` row | Clerk session | 422 invalid reference |
| `/api/admin/payments?status=PENDING_REVIEW` | GET | none | list of pending claims | super admin | 403 not super admin |
| `/api/admin/payments/:id/approve` | POST | none | updated `payments` + `subscriptions` | super admin | 404, 409 already reviewed |
| `/api/admin/payments/:id/reject` | POST | none | updated `payments` | super admin | 404, 409 already reviewed |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Billing page instructions | Paybill or business number, reference format | Project configuration (env var or an admin editable setting), not hardcoded in a component, since the business number may change independent of a deploy |
| Claim submission | The `payments` row | User submitted `reference` and `amount`, tied to the session's `org_id` |
| Approval | `reviewed_by` | The approving super admin's Clerk user ID from their verified session |

**Key invariants**:
- No Lipa Namba claim is ever auto approved; every claim starts `PENDING_REVIEW` and requires an explicit super admin action.
- The super admin route group is behind its own authorization check, separate from normal org scoped access.
- No live mobile money API call exists in this feature.

**Security model**: The claim submission route is scoped to the submitting user's own org via their verified session. The admin review routes require the distinct super admin check in `worker/middleware/`; a signed in user who is not flagged as super admin gets 403 regardless of their org role.

**Configuration required**:
- A project configuration value for the displayed paybill/business number and instructions text (env var or admin editable setting, not hardcoded)

**Critical test scenarios**:
- Happy path: a tenant submits a claim, a super admin approves it, and the org's subscription updates to `ACTIVE`. Verifies **AC-2, AC-4**.
- Failure case: a super admin rejects a claim; `payments.status` becomes `REJECTED` and no subscription change happens. Verifies **AC-4**.
- Auth/permission: a signed in user who is not a super admin is denied access to the admin review routes even if they belong to an org with an active subscription. Verifies **AC-3, AC-5**.

## Build plan

1. Build the billing page Lipa Namba instructions panel and the claim submission form, reading instructions from project configuration. Satisfies **AC-1**.
2. Build `custom/web/payments/lipa-namba.ts`, the claim submission route writing a `PENDING_REVIEW` `payments` row. Satisfies **AC-2**.
3. Build the super admin authorization check in `worker/middleware/`. Satisfies **AC-5**.
4. Build the super admin payment review page (list, approve, reject) and the approve/reject routes, updating `payments` and `subscriptions`. Satisfies **AC-3, AC-4**.

## Consequences

**Positive**:
- Gives Tanzania tenants a payment path with no new API integration risk and a trust model that matches how they already pay for things.

**Negative / tradeoffs**:
- Manual review does not scale the way an automated payment does; every claim needs a human, which is an operational cost as tenant count grows.

**Neutral**:
- Introduces the platform's only admin surface as a side effect of this one payment path; a broader admin panel, if ever needed, would build on this authorization check rather than replace it.

## Follow-up

- [ ] None currently identified.
