-- Control plane schema (0001: web platform foundation & control plane).
-- Applied once, by hand or via a migration runner, against CONTROL_DATABASE_URL.
-- This is the ONE shared Neon project. It never holds accounting data —
-- accounting data lives only in each org's own tenant project (feature 0002).

CREATE TABLE IF NOT EXISTS organizations (
  id text PRIMARY KEY,               -- Clerk organization ID
  name text NOT NULL,
  plan_seat_limit integer,           -- record of intent, synced to Clerk's maxAllowedMemberships (0003); never re-checked per request
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_projects (
  org_id text PRIMARY KEY REFERENCES organizations(id),
  neon_project_id text NOT NULL,
  connection_string text NOT NULL,   -- AES-256-GCM encrypted at rest with TENANT_ENCRYPTION_KEY; never logged or returned in an API response
  region text NOT NULL,
  provisioning_claim_id text,
  status text NOT NULL DEFAULT 'PROVISIONING'
    CHECK (status IN ('PROVISIONING', 'READY', 'SUSPENDED', 'FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- subscriptions and payments are created here (0001) but populated by
-- 0004 (PayPal) and 0005 (Lipa Namba); kept here since they are control
-- plane, cross-tenant tables, not per-tenant accounting data.

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES organizations(id),
  provider text NOT NULL CHECK (provider IN ('paypal', 'lipa_namba')),
  status text NOT NULL
    CHECK (status IN ('ACTIVE', 'PAST_DUE', 'EXPIRED', 'PENDING_REVIEW', 'SUSPENDED', 'CANCELLED')),
  paypal_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id text NOT NULL REFERENCES organizations(id),
  provider text NOT NULL CHECK (provider IN ('paypal', 'lipa_namba')),
  amount numeric NOT NULL,
  status text NOT NULL,
  reference text,
  reviewed_by text,                  -- Clerk user ID of the approving super admin (lipa_namba only)
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
