import test from 'tape';
import {
  handleOrganizationCreated,
  type HandleOrgCreatedEnv,
  type NeonProvisioningClient,
} from '../custom/web/auth/handleOrganizationCreated';
import type {
  ControlDb,
  TenantProjectRow,
} from '../worker/db/control';

const env: HandleOrgCreatedEnv = {
  CONTROL_DATABASE_URL: 'unused-in-tests',
  TENANT_ENCRYPTION_KEY: btoa('\0'.repeat(32)),
};

interface ControlDbState {
  organizations: Set<string>;
  tenant: TenantProjectRow | null;
}

function createControlDb(): { db: ControlDb; state: ControlDbState } {
  const state: ControlDbState = {
    organizations: new Set(),
    tenant: null,
  };

  const db = (async (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<Array<{ org_id: string }>> => {
    const sql = strings.join('?').replace(/\s+/g, ' ').trim();

    if (sql.startsWith('INSERT INTO organizations')) {
      state.organizations.add(values[0] as string);
      return [];
    }

    if (sql.startsWith('INSERT INTO tenant_projects')) {
      const orgId = values[0] as string;
      const claimId = values[1] as string;
      if (state.tenant && state.tenant.status !== 'FAILED') {
        return [];
      }

      state.tenant = {
        org_id: orgId,
        neon_project_id: '',
        connection_string: '',
        region: '',
        provisioning_claim_id: claimId,
        status: 'PROVISIONING',
        created_at: new Date().toISOString(),
      };
      return [{ org_id: orgId }];
    }

    if (sql.includes("SET status = 'FAILED'")) {
      const orgId = values[0] as string;
      const claimId = values[1] as string;
      if (
        state.tenant?.org_id !== orgId ||
        state.tenant.status !== 'PROVISIONING' ||
        state.tenant.provisioning_claim_id !== claimId
      ) {
        return [];
      }

      state.tenant.status = 'FAILED';
      state.tenant.provisioning_claim_id = null;
      return [{ org_id: orgId }];
    }

    if (sql.startsWith('UPDATE tenant_projects')) {
      const orgId = values[3] as string;
      const claimId = values[4] as string;
      if (
        state.tenant?.org_id !== orgId ||
        state.tenant.status !== 'PROVISIONING' ||
        state.tenant.provisioning_claim_id !== claimId
      ) {
        return [];
      }

      state.tenant.neon_project_id = values[0] as string;
      state.tenant.connection_string = values[1] as string;
      state.tenant.region = values[2] as string;
      state.tenant.provisioning_claim_id = null;
      return [{ org_id: orgId }];
    }

    throw new Error(`Unexpected control-plane query: ${sql}`);
  }) as unknown as ControlDb;

  return { db, state };
}

test('concurrent organization deliveries provision one tenant project', async (t) => {
  const { db, state } = createControlDb();
  let provisionCount = 0;
  let releaseProvisioning: (() => void) | undefined;
  let markProvisioningStarted: (() => void) | undefined;
  const provisioningStarted = new Promise<void>((resolve) => {
    markProvisioningStarted = resolve;
  });
  const provisioningReleased = new Promise<void>((resolve) => {
    releaseProvisioning = resolve;
  });
  const neonClient: NeonProvisioningClient = {
    async createAndConnect() {
      provisionCount += 1;
      markProvisioningStarted?.();
      await provisioningReleased;
      return {
        neonProjectId: 'project-1',
        connectionString: 'postgres://tenant-1',
        region: 'aws-us-east-2',
      };
    },
  };
  const event = { data: { id: 'org-1', name: 'Organization 1' } };

  const firstDelivery = handleOrganizationCreated(event, env, neonClient, db);
  await provisioningStarted;
  await handleOrganizationCreated(event, env, neonClient, db);

  t.equal(provisionCount, 1, 'only the delivery owning the claim provisions');
  releaseProvisioning?.();
  await firstDelivery;
  t.equal(state.tenant?.neon_project_id, 'project-1');
  t.equal(state.tenant?.provisioning_claim_id, null);
  t.end();
});

test('a delivery retries an atomically reclaimed failed tenant', async (t) => {
  const { db, state } = createControlDb();
  let provisionCount = 0;
  const neonClient: NeonProvisioningClient = {
    async createAndConnect() {
      provisionCount += 1;
      if (provisionCount === 1) {
        throw new Error('transient Neon failure');
      }
      return {
        neonProjectId: 'project-after-retry',
        connectionString: 'postgres://tenant-after-retry',
        region: 'aws-us-east-2',
      };
    },
  };
  const event = { data: { id: 'org-retry', name: 'Retry Organization' } };

  let firstError: unknown;
  try {
    await handleOrganizationCreated(event, env, neonClient, db);
  } catch (error) {
    firstError = error;
  }

  t.ok(firstError instanceof Error, 'the transient failure is reported');
  t.equal(state.tenant?.status, 'FAILED', 'the failed claim is recorded');

  await handleOrganizationCreated(event, env, neonClient, db);

  t.equal(provisionCount, 2, 'the next delivery provisions after reclaiming');
  t.equal(state.tenant?.status, 'PROVISIONING');
  t.equal(state.tenant?.neon_project_id, 'project-after-retry');
  t.equal(state.tenant?.provisioning_claim_id, null);
  t.end();
});
