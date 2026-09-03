# 0002. Tenant schema & data layer

**Date**: 2026-09-03
**Status**: Proposed

## Summary

This decision applies the full accounting schema to a freshly provisioned tenant Neon project as the last step of onboarding, and builds the generic document CRUD routes that let the existing accounting UI and business logic run against a tenant's Postgres database instead of Desktop's SQLite file. Nothing changes in `src/`, `models/`, or `reports/`; this is a backend only feature that proves the shared accounting core works unmodified against the new tenant boundary from feature 06.

## Context

Feature 06 provisions an empty, isolated Neon project per organization but does not put the accounting schema into it or expose any way to read or write documents against it. Without this feature, an organization has a database with nothing in it and no route that talks to it. The accounting schema and business logic already exist and are shared between Desktop and Web by design (`fyo`, `models/`, `reports/`); the work here is routing, migration, and confirming Postgres flavored behavior matches SQLite flavored behavior closely enough that nothing in the shared layer needs to change.

## Requirements

**User stories**:
- As a newly onboarded organization, I want my tenant database to have the full accounting schema so that I can immediately start creating invoices, parties, and journal entries.
- As the platform, I need a generic way to read and write any doctype against a tenant's own project so that the same UI and business logic Desktop already has works on Web without a rewrite.

**Acceptance criteria**:
- **AC-1**: The accounting schema (Party, SalesInvoice, PurchaseInvoice, Payment, JournalEntry, Item, StockLedgerEntry, Account, and RareBooks's custom doctypes) is applied to a tenant project as the final step of provisioning, and `tenant_projects.status` only becomes `READY` once the migration succeeds.
- **AC-2**: Generic doc CRUD routes exist in `worker/routes/`, mirroring the actions `main/registerIpcMainActionListeners.ts` exposes on Desktop, each running after the tenant resolution middleware from feature 06.
- **AC-3**: No tenant project table has an `org_id` column or any tenant filter; the resolved connection is the only tenant boundary.
- **AC-4**: `models/**` and `reports/**` run correctly against a tenant's Neon project, with any Postgres versus SQLite query differences found and fixed.
- **AC-5**: A migration runner exists that can roll out a future schema change across every row in `tenant_projects`, not just one project.

## Decision

**Chosen option**: Apply the standard accounting schema, Postgres flavored, to each tenant project via a migration script run at the end of provisioning; route document CRUD through generic `worker/routes/` handlers that call the existing `fyo`/`models` layer against the resolved tenant connection.

## Rationale

Reusing the existing schema and business logic unmodified is the entire point of keeping `fyo/demux/*.ts` as the only platform aware layer; rewriting `models/`/`reports/` for Web would defeat that design. Postgres's `ALTER TABLE ADD COLUMN` is safe for additive changes, unlike SQLite's rebuild based "prestige" migration Desktop has to work around, but because there is one project per tenant instead of one shared database, any schema change must be applied by a runner that iterates every tenant project rather than a single statement.

## Feature design

**Data model sketch**: The tenant project schema is the existing accounting schema, unchanged in shape from what SQLite holds today, plus the existing custom additions: `Expense` (`name`, `numberSeries`, `date`, `vendor`, `expense_account`, `amount`, `description`), the `NumberSeries` extension for `Expense`'s numbering, and `Party.birth_date`. No new fields are introduced by this feature.

**API surface**:
| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/doc/:schema` | POST | doc fields per schema | created doc | Clerk session, resolved tenant, subscription active (feature 08, not yet built; treat as always allowed until 08 lands) | 422 validation |
| `/api/doc/:schema/:name` | GET | none | doc | same | 404 |
| `/api/doc/:schema/:name` | PUT | doc fields | updated doc | same | 422, 404 |
| `/api/doc/:schema/:name` | DELETE | none | 200 | same | 404 |
| `/api/doc/:schema` | GET | filters, pagination | list of docs | same | 400 invalid filter |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Any doc CRUD call | The tenant connection used | `worker/db/resolve-tenant.ts` from feature 06, keyed on the verified session's `org_id` |
| Provisioning completion | `tenant_projects.status = 'READY'` | Set only after the schema migration against the fresh project returns success |

**Key invariants**:
- No `org_id` column or filter anywhere in tenant project tables; the resolved connection is the only tenant boundary.
- A schema change is applied by a migration runner over every `tenant_projects` row, never a single `ALTER TABLE` against one shared database.
- Route handlers stay thin, delegating to `models/`/`fyo` for business logic, the same way `main/registerIpcMainActionListeners.ts` stays thin on Desktop.

**Security model**: Every doc CRUD route runs after Clerk session verification and tenant resolution (feature 06); there is no route that accepts a client supplied tenant identifier.

**Critical test scenarios**:
- Happy path: an org's tenant project provisions, the schema migration succeeds, and a document can be created, read, updated, and deleted through the generic routes. Verifies **AC-1, AC-2**.
- Failure case: the schema migration fails; `tenant_projects.status` stays out of `READY` and provisioning is surfaced as failed, not silently half done. Verifies **AC-1**.
- Data isolation: two different orgs' doc CRUD calls resolve to two different Neon connections and never touch each other's data. Verifies **AC-3**.

## Build plan

1. Write the accounting schema migration script and wire it into `clerk-org-created.ts` as the final provisioning step. Satisfies **AC-1**.
2. Build generic `worker/routes/` doc CRUD handlers mirroring Desktop's IPC actions, each behind the feature 06 tenant resolution middleware. Satisfies **AC-2, AC-3**.
3. Run `models/**`/`reports/**` against a real tenant Neon project and fix any Postgres versus SQLite query differences found. Satisfies **AC-4**.
4. Build a migration runner utility that iterates `tenant_projects` for future schema rollouts. Satisfies **AC-5**.

## Consequences

**Positive**:
- The existing accounting UI and business logic work on Web with no rewrite, confirming the platform abstraction design holds.

**Negative / tradeoffs**:
- Every future schema change is now a fan out migration across N tenant projects instead of one shared database statement, adding operational complexity as tenant count grows.

**Neutral**:
- Postgres versus SQLite query differences discovered here may require small, targeted fixes in `models/`/`reports/`, shared code that also runs on Desktop; any such fix must not change Desktop's behavior.

## Follow-up

- [ ] None currently identified beyond the migration runner scaling question already tracked on feature 06.
