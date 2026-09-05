/**
 * The single, fixed connection to the shared control plane project.
 * This is the ONLY file that talks to CONTROL_DATABASE_URL. Every other
 * query in worker/ goes through resolve-tenant.ts against a tenant's own
 * Neon project instead. Never query accounting data through this client.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

export type ControlDb = NeonQueryFunction<false, false>;

let cached: ControlDb | null = null;

export function getControlDb(env: { CONTROL_DATABASE_URL: string }): ControlDb {
  if (!cached) {
    cached = neon(env.CONTROL_DATABASE_URL);
  }
  return cached;
}

export interface OrganizationRow {
  id: string;
  name: string;
  plan_seat_limit: number | null;
  created_at: string;
}

export interface TenantProjectRow {
  org_id: string;
  neon_project_id: string;
  connection_string: string; // still encrypted here — decrypt only in resolve-tenant.ts, in memory, per request
  region: string;
  provisioning_claim_id: string | null;
  status: 'PROVISIONING' | 'READY' | 'SUSPENDED' | 'FAILED';
  created_at: string;
}

export async function insertOrganization(
  db: ControlDb,
  org: { id: string; name: string }
): Promise<void> {
  await db`
    INSERT INTO organizations (id, name)
    VALUES (${org.id}, ${org.name})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function insertTenantProject(
  db: ControlDb,
  row: {
    orgId: string;
    claimId: string;
    neonProjectId: string;
    encryptedConnectionString: string;
    region: string;
  }
): Promise<boolean> {
  const rows = (await db`
    UPDATE tenant_projects
    SET
      neon_project_id = ${row.neonProjectId},
      connection_string = ${row.encryptedConnectionString},
      region = ${row.region},
      provisioning_claim_id = NULL
    WHERE org_id = ${row.orgId}
      AND status = 'PROVISIONING'
      AND provisioning_claim_id = ${row.claimId}
    RETURNING org_id
  `) as unknown as Array<{ org_id: string }>;
  return rows.length === 1;
}

export async function claimTenantProject(
  db: ControlDb,
  claim: { orgId: string; claimId: string }
): Promise<boolean> {
  const rows = (await db`
    INSERT INTO tenant_projects (
      org_id,
      neon_project_id,
      connection_string,
      region,
      status,
      provisioning_claim_id
    )
    VALUES (${claim.orgId}, '', '', '', 'PROVISIONING', ${claim.claimId})
    ON CONFLICT (org_id) DO UPDATE SET
      neon_project_id = '',
      connection_string = '',
      region = '',
      status = 'PROVISIONING',
      provisioning_claim_id = EXCLUDED.provisioning_claim_id
    WHERE tenant_projects.status = 'FAILED'
    RETURNING org_id
  `) as unknown as Array<{ org_id: string }>;
  return rows.length === 1;
}

export async function failTenantProjectClaim(
  db: ControlDb,
  claim: { orgId: string; claimId: string }
): Promise<boolean> {
  const rows = (await db`
    UPDATE tenant_projects
    SET status = 'FAILED', provisioning_claim_id = NULL
    WHERE org_id = ${claim.orgId}
      AND status = 'PROVISIONING'
      AND provisioning_claim_id = ${claim.claimId}
    RETURNING org_id
  `) as unknown as Array<{ org_id: string }>;
  return rows.length === 1;
}

export async function setTenantProjectStatus(
  db: ControlDb,
  orgId: string,
  status: TenantProjectRow['status']
): Promise<void> {
  await db`
    UPDATE tenant_projects SET status = ${status} WHERE org_id = ${orgId}
  `;
}

export async function getTenantProject(
  db: ControlDb,
  orgId: string
): Promise<TenantProjectRow | null> {
  const rows = (await db`
    SELECT * FROM tenant_projects WHERE org_id = ${orgId}
  `) as unknown as TenantProjectRow[];
  return rows[0] ?? null;
}
