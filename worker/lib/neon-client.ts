/**
 * Wraps @neon/sdk to provision one Neon project per tenant.
 *
 * @neon/sdk (not @neondatabase/api-client) is the confirmed choice: it's
 * fetch-based, zero-dependency, ESM-only, and explicitly documented to
 * run in edge/Workers runtimes, unlike the older axios-based
 * @neondatabase/api-client. This resolves the "confirm the exact
 * Workers-compatible client" follow-up noted in docs/specs/0001.
 *
 * neon.projects.createAndConnect() provisions the project AND polls Neon's
 * async provisioning operation to completion AND returns a ready-to-use
 * connection string, all in one call — matching the ergonomic single
 * function assumed in docs/specs/0001's Build plan.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import { createNeonClient } from '@neon/sdk';
import type { NeonProvisioningClient } from '../../custom/web/auth/handleOrganizationCreated';
import type { WorkerEnv } from '../types';

export function createNeonProvisioningClient(env: WorkerEnv): NeonProvisioningClient {
  const neon = createNeonClient({
    apiKey: env.NEON_API_KEY,
    orgId: env.NEON_ACCOUNT_ORG_ID,
    throwOnError: true,
  });

  return {
    async createAndConnect({ name }) {
      const { project, connectionString } = await neon.projects.createAndConnect({ name });

      return {
        neonProjectId: project.id,
        connectionString,
        region: project.region_id,
      };
    },
  };
}
