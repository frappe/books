/**
 * Provisions a new, isolated Neon project the moment a Clerk organization
 * is created, and records it in the control plane. This is the heart of
 * feature 0001 — everything else in the web migration depends on an org
 * having a READY tenant project.
 *
 * Called from worker/routes/webhooks/organization-created.ts AFTER the
 * webhook signature has already been verified there — this function trusts
 * its input and does not re-verify anything.
 *
 * Never import custom/licensing/ (Keymint) from this file or anything it
 * calls — the web target has no device-bound licensing.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import {
  claimTenantProject,
  type ControlDb,
  failTenantProjectClaim,
  getControlDb,
  insertOrganization,
  insertTenantProject,
} from '../../../worker/db/control';
import { encrypt } from '../../../worker/lib/encryption';

// Deliberately NOT importing @clerk/backend's OrganizationJSON here: this
// file lives under custom/ (the root package's tree), not worker/, and
// @clerk/backend is only installed in worker/node_modules — the two are
// separate packages (see worker/package.json vs the root package.json).
// worker/routes/webhooks/organization-created.ts maps the real, fully
// typed Clerk event down to this minimal shape at the boundary.
export interface ClerkOrganizationCreatedEvent {
  data: {
    id: string; // Clerk org ID
    name: string;
  };
}

export interface NeonProvisioningClient {
  /** Wraps @neon/sdk's neon.projects.createAndConnect(). The Neon account
   * org (NEON_ACCOUNT_ORG_ID) is configured once at client construction
   * (worker/lib/neon-client.ts), not passed per call — it is NOT the
   * tenant's Clerk org. */
  createAndConnect(params: { name: string }): Promise<{
    neonProjectId: string;
    connectionString: string;
    region: string;
  }>;
}

export interface HandleOrgCreatedEnv {
  CONTROL_DATABASE_URL: string;
  TENANT_ENCRYPTION_KEY: string;
}

export async function handleOrganizationCreated(
  event: ClerkOrganizationCreatedEvent,
  env: HandleOrgCreatedEnv,
  neonClient: NeonProvisioningClient,
  controlDb: ControlDb = getControlDb(env)
): Promise<void> {
  const orgId = event.data.id;

  // 1. Record the org itself, before attempting to provision anything.
  await insertOrganization(controlDb, { id: orgId, name: event.data.name });

  const claimId = crypto.randomUUID();
  const claimed = await claimTenantProject(controlDb, { orgId, claimId });
  if (!claimed) {
    return;
  }

  try {
    // 2. Provision a dedicated, isolated Neon project for this org.
    //    This is a real network call to Neon's API — see Follow-up in
    //    docs/specs/0001 re: confirming the exact Workers-compatible
    //    client package before this runs against a live Neon account.
    const provisioned = await neonClient.createAndConnect({
      name: `rarebooks-tenant-${orgId}`,
    });

    // 3. Encrypt the connection string before it ever touches storage.
    const encryptedConnectionString = await encrypt(
      provisioned.connectionString,
      env.TENANT_ENCRYPTION_KEY
    );

    const completed = await insertTenantProject(controlDb, {
      orgId,
      claimId,
      neonProjectId: provisioned.neonProjectId,
      encryptedConnectionString,
      region: provisioned.region,
    });
    if (!completed) {
      throw new Error('Tenant provisioning claim was lost before completion');
    }

    // NOTE: status stays PROVISIONING here — feature 0002 (tenant schema
    // & data layer) applies the accounting schema and is the one that
    // flips status to READY, per docs/specs/0001 AC-1 and docs/specs/0002.
  } catch (err) {
    await failTenantProjectClaim(controlDb, { orgId, claimId });
    throw err;
  }
}
