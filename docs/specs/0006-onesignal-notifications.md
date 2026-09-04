# 0006. OneSignal notifications

**Date**: 2026-09-03
**Status**: Proposed

## Summary

This decision ports the existing restock and payment method notification triggers from ntfy (Desktop) to OneSignal (Web). The triggering logic already exists and stays the same; only the delivery mechanism changes.

## Context

Desktop fires notifications through ntfy when inventory drops low or a payment method event happens, already covered by `restockNotification.spec.ts` and `paymentMethodNotification.spec.ts`. Web needs an equivalent delivery path that works for a browser based, multi tenant product. An earlier draft of this plan used `include_external_user_ids` as OneSignal's targeting parameter; that is not the current parameter. The confirmed current API uses `include_aliases` with a `target_channel`.

## Requirements

**User stories**:
- As a tenant user, I want to receive a notification when inventory is restocked or a payment method event happens, the same way Desktop already notifies me, so that I don't have to poll for these events.

**Acceptance criteria**:
- **AC-1**: The existing restock and payment method trigger logic is reused unchanged; only the delivery mechanism is swapped to OneSignal.
- **AC-2**: Notifications are sent via OneSignal's `include_aliases` targeting, keyed on the platform's own IDs (Clerk user or org IDs), with `target_channel: "push"`.
- **AC-3**: `include_aliases` is never combined with `filters`, `include_subscription_ids`, `included_segments`, or `excluded_segments` in the same request.
- **AC-4**: The `Authorization` header uses the literal `Key <api_key>` form, not `Bearer <api_key>`.
- **AC-5**: A OneSignal equivalent test suite exists under `custom/web/notifications/`, mirroring what `restockNotification.spec.ts` and `paymentMethodNotification.spec.ts` already cover for Desktop.

## Decision

**Chosen option**: OneSignal REST API, `include_aliases` targeting on Clerk user or org IDs, reusing the existing Desktop trigger logic unchanged.

## Rationale

Reusing the existing trigger logic keeps the two targets' notification behavior identical from the user's point of view; only the transport differs, which is the smallest change that satisfies the requirement. `include_aliases` is the current, confirmed targeting method for reaching a specific known user or org by the platform's own ID, rather than a OneSignal specific identifier that would need a separate mapping table.

## Feature design

**Data model sketch**: No new tables. Notification targeting uses existing Clerk user or org IDs already available from the session; no OneSignal specific identifier is stored.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `https://api.onesignal.com/notifications` | POST | `app_id`, `target_channel`, `include_aliases.external_id`, `contents` | notification ID | `Key ONESIGNAL_API_KEY` header | 400 invalid targeting combination |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Restock notification | The notification content and target | Existing restock trigger logic (reused unchanged), targeted at the relevant org's or user's Clerk ID |
| Delivery deduplication | Idempotency | A client generated UUID per logically distinct send, used only if resending the same notification is a real risk from a retry (OneSignal deduplicates on it within a 30 day window) |

**Key invariants**:
- `include_aliases` is never combined with `filters`, `include_subscription_ids`, `included_segments`, or `excluded_segments` in one request.
- The `Authorization` header is always `Key <api_key>`, never `Bearer <api_key>`.
- Up to 20,000 external IDs per call under `include_aliases.external_id`; this feature's per event sends are far below that limit.

**Security model**: `ONESIGNAL_API_KEY` is a Worker secret, never exposed to the client. Targeting always uses the platform's own verified IDs (Clerk user or org ID from the triggering event), never a client supplied identifier.

**Configuration required**:
- `ONESIGNAL_APP_ID`, `ONESIGNAL_API_KEY`: Worker secrets for the OneSignal REST API

**Critical test scenarios**:
- Happy path: a restock event fires, and the affected org's users receive a OneSignal push with the same content Desktop's ntfy notification would have shown. Verifies **AC-1, AC-2**.
- Failure case: a notification call accidentally combines `include_aliases` with `included_segments`; the request is rejected before send, not silently misdelivered. Verifies **AC-3**.
- Auth: a call using `Bearer` instead of `Key` fails and is caught in testing before deploy. Verifies **AC-4**.

## Build plan

1. Build `custom/web/notifications/`, reusing the existing restock and payment method trigger logic, swapping the delivery call to OneSignal's REST API. Satisfies **AC-1, AC-2**.
2. Confirm the request shape follows `include_aliases` + `target_channel`, with the correct `Key` authorization header. Satisfies **AC-3, AC-4**.
3. Write a OneSignal equivalent test suite under `custom/web/notifications/`, mirroring the existing Desktop notification specs. Satisfies **AC-5**.

## Consequences

**Positive**:
- Web users get the same notification coverage Desktop users already have, with no new trigger logic to design.

**Negative / tradeoffs**:
- None significant; this is a delivery mechanism swap on top of proven trigger logic.

**Neutral**:
- Depends on feature 07 (tenant data layer) being in place, since notification triggers need to know what tenant data changed.

## Follow-up

- [ ] None currently identified.
