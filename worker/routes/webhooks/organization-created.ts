/**
 * Thin Hono route: verify the Clerk webhook signature, then delegate to
 * custom/web/auth/handleOrganizationCreated.ts for the actual provisioning
 * logic. This file should stay thin — business logic belongs in custom/web/,
 * matching how main/registerIpcMainActionListeners.ts stays thin on Desktop.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md (AC-2, AC-4)
 */
import { Hono } from 'hono';
import { Webhook } from 'svix';
import {
  handleOrganizationCreated,
  type ClerkOrganizationCreatedEvent,
} from '../../../custom/web/auth/handleOrganizationCreated';
import { createNeonProvisioningClient } from '../../lib/neon-client';
import { getControlDb, getTenantProject } from '../../db/control';
import type { WorkerEnv } from '../../types';

export const organizationCreatedRoute = new Hono<{ Bindings: WorkerEnv }>();

organizationCreatedRoute.post('/', async (c) => {
  const svixId = c.req.header('svix-id');
  const svixTimestamp = c.req.header('svix-timestamp');
  const svixSignature = c.req.header('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: 'Missing svix headers' }, 400);
  }

  const rawBody = await c.req.text();

  let verified: { type: string; data: unknown };
  try {
    const wh = new Webhook(c.env.CLERK_WEBHOOK_SIGNING_SECRET);
    // verify() throws on a bad signature and otherwise returns undefined —
    // it does not parse the payload (this route passes format defaults,
    // no jsonParse option). Parse rawBody ourselves, only after
    // verification has already thrown or not.
    wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
    verified = JSON.parse(rawBody) as { type: string; data: unknown };
  } catch {
    // Never act on an unverified (or unparseable) payload — AC-4.
    return c.json({ error: 'Invalid webhook signature' }, 400);
  }

  if (verified.type !== 'organization.created') {
    // We only registered this endpoint for organization.created, but be
    // defensive if Clerk's dashboard config ever changes underneath us.
    return c.json({ received: true, ignored: verified.type }, 200);
  }

  try {
    await handleOrganizationCreated(
      verified as ClerkOrganizationCreatedEvent,
      c.env,
      createNeonProvisioningClient(c.env)
    );
  } catch (err) {
    console.error('organization.created provisioning failed', err);
    try {
      const tenant = await getTenantProject(
        getControlDb(c.env),
        (verified.data as { id: string }).id
      );
      if (tenant?.status === 'FAILED') {
        return c.json({ received: true, provisioning: 'failed' }, 200);
      }
    } catch (statusError) {
      console.error(
        'organization.created provisioning status lookup failed',
        statusError
      );
    }
    return c.json({ received: false, provisioning: 'retry' }, 500);
  }

  return c.json({ received: true }, 200);
});
