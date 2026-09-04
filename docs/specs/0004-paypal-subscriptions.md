# 0004. PayPal subscriptions (non Tanzania payments)

**Date**: 2026-09-03
**Status**: Proposed

## Summary

This decision adds recurring subscription billing via PayPal Subscriptions for tenants outside Tanzania. A user starts checkout, gets redirected to PayPal to approve a subscription against a pre configured plan, and PayPal's webhooks update the org's subscription and payment records in the control plane from then on. This fully replaces ClickPesa on Web; it is not used alongside it.

## Context

Desktop sells licenses via ClickPesa, a Tanzania only mobile money integration. That does not serve customers outside Tanzania, who have no easy way to pay via local mobile money. PayPal Subscriptions is the chosen path for that audience. PayPal's own `CreateSubscriptionRequest` schema marks both `applicationContext` and `autoRenewal` as deprecated as of the current crosscheck (September 2026); an earlier draft of this plan used the deprecated `application_context` shape to control the payer redirect experience, which is a signal this API surface changes and should not be built from memory at implementation time.

## Requirements

**User stories**:
- As a customer outside Tanzania, I want to subscribe and pay through PayPal so that I can get billing access without needing local mobile money.
- As the platform, I need PayPal's billing events to reliably update an org's subscription status so that access gating (feature 08) reflects reality.

**Acceptance criteria**:
- **AC-1**: A user outside Tanzania can start checkout, get redirected to PayPal's approval flow, and return with a subscription created against the pre configured PayPal plan.
- **AC-2**: `BILLING.SUBSCRIPTION.ACTIVATED` and `PAYMENT.SALE.COMPLETED` webhook events update `subscriptions.status = ACTIVE` and insert a `payments` row respectively.
- **AC-3**: `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.CANCELLED`, `BILLING.SUBSCRIPTION.EXPIRED`, and `BILLING.SUBSCRIPTION.PAYMENT.FAILED` update `subscriptions.status` to the matching state (`PAST_DUE` for a payment failure).
- **AC-4**: No webhook payload is trusted or acted on before its PayPal signature is verified against PayPal's verify webhook signature endpoint.
- **AC-5**: This feature does not import or reference `../../custom/licensing/api/clickpesa-client.ts` anywhere; PayPal is a full replacement, not an addition alongside ClickPesa, on Web.
- **AC-6**: Sandbox PayPal credentials are used until an explicit go live step switches to production credentials.

## Decision

**Chosen option**: PayPal Subscriptions API, create subscription then redirect then webhook, with the exact payer redirect fields re-verified against PayPal's current docs at build time rather than the deprecated `application_context` shape.

## Rationale

PayPal Subscriptions is the standard recurring billing product for customers PayPal supports globally, and it is a genuinely different integration shape from ClickPesa's preview then initiate then poll pattern; copying that shape here would be wrong. Signature verification before trusting any webhook payload is non negotiable for a system that grants or revokes paid access based on that payload.

## Feature design

**Data model sketch**: No new tables; writes to `subscriptions` and `payments` in the control plane project, created in feature 06. `subscriptions.provider = 'paypal'`, `subscriptions.paypal_subscription_id` set on creation. `payments.provider = 'paypal'`, `payments.reference` set to the PayPal transaction or sale ID.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `worker/routes/payments/paypal-create.ts` | POST | `org_id` (session), user email | PayPal approval redirect URL | Clerk session | 502 PayPal API error |
| `worker/routes/payments/paypal-webhook.ts` | POST | PayPal webhook payload | 200 on processed | PayPal webhook signature | 400 unverified signature |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Create subscription | PayPal `plan_id` | `PAYPAL_PLAN_ID`, a pre configured Worker secret, set up once via the PayPal dashboard or Catalog Products / Subscriptions REST APIs, not per request |
| Webhook processing | Verified event | PayPal's verify webhook signature endpoint, called before any payload field is trusted |
| Subscription status update | New `subscriptions.status` value | The specific PayPal event type received, mapped per **AC-2, AC-3** |

**Key invariants**:
- No `subscriptions`/`payments` update happens from an unverified webhook payload.
- Sandbox environment (`api-m.sandbox.paypal.com`) is used until go live is explicitly confirmed; production PayPal is never pointed at from a dev branch.
- `../../custom/licensing/api/clickpesa-client.ts` is never imported by, bundled into, or referenced from this feature.

**Security model**: The create subscription route only ever creates a subscription for the currently signed in session's org; the webhook route trusts nothing until PayPal's signature verification succeeds, using `PAYPAL_WEBHOOK_ID` against PayPal's verify endpoint (there is no official SDK helper for this, confirmed no webhook verification code exists in PayPal's TypeScript Server SDK client, so this is a manual REST call).

**Configuration required**:
- `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLAN_ID`, `PAYPAL_WEBHOOK_ID`: Worker secrets for creating subscriptions and verifying webhooks

**Critical test scenarios**:
- Happy path: a user completes PayPal checkout, `BILLING.SUBSCRIPTION.ACTIVATED` and `PAYMENT.SALE.COMPLETED` arrive, and the org's subscription becomes `ACTIVE` with a `payments` row recorded. Verifies **AC-1, AC-2**.
- Failure case: `BILLING.SUBSCRIPTION.PAYMENT.FAILED` arrives; `subscriptions.status` becomes `PAST_DUE`, not silently ignored. Verifies **AC-3**.
- Security: a webhook payload with an invalid or missing signature is rejected and never updates `subscriptions`/`payments`. Verifies **AC-4**.

## Build plan

1. Set up the PayPal Catalog Product and Billing Plan (one time, not per request), storing `PAYPAL_PLAN_ID`. Satisfies **AC-1**.
2. Build `worker/routes/payments/paypal-create.ts`, checking PayPal's current recommended payer redirect configuration before implementing (the deprecated `application_context`/`autoRenewal` fields must not be used). Satisfies **AC-1**.
3. Build `worker/routes/payments/paypal-webhook.ts`: verify signature first, then branch on `event_type` per **AC-2, AC-3**. Satisfies **AC-2, AC-3, AC-4**.
4. Build the billing page checkout button and PayPal return/cancel handling UI. Satisfies **AC-1**.
5. Gate production PayPal credentials behind an explicit go live step. Satisfies **AC-6**.

## Consequences

**Positive**:
- Opens billing access to customers outside Tanzania who have no ClickPesa equivalent.

**Negative / tradeoffs**:
- PayPal's request schema has already changed once during this plan's own crosscheck (two deprecated fields found); the create subscription integration should be re-verified against PayPal's current docs at build time, not built from this spec's snippet as final.

**Neutral**:
- Introduces PayPal specific secrets and a webhook signature verification step Desktop's ClickPesa integration never needed.

## Follow-up

- [ ] Re-fetch PayPal's current Create Subscription request schema immediately before implementation; do not build against the `application_context`/`autoRenewal` shape referenced in earlier drafts.
