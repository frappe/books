/**
 * Thin Hono route: verify the Clerk webhook signature, then delegate to
 * custom/web/auth/handleOrganizationCreated.ts for the actual provisioning
 * logic. This file should stay thin — business logic belongs in custom/web/,
 * matching how main/registerIpcMainActionListeners.ts stays thin on Desktop.
 *
 * Uses @clerk/hono/webhooks' verifyWebhook rather than a manual svix
 * integration: it verifies AND parses the payload in one call (reads the
 * body itself via c.req.text(), so don't read c.req.text()/json()
 * separately before calling it — the request body can only be consumed
 * once). Originally built by hand with the svix package directly; swapped
 * after @hono/clerk-auth's deprecation warning pointed at @clerk/hono,
 * which turned out to also fix an actual bug in the original code (see
 * git history: svix's own verify() doesn't parse the payload the way this
 * route first assumed).
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md (AC-2, AC-4)
 */
import { Hono } from 'hono';
import { verifyWebhook } from '@clerk/hono/webhooks';
import type { OrganizationJSON, WebhookEvent } from '@clerk/backend';
import {
  handleOrganizationCreated,
  type ClerkOrganizationCreatedEvent,
} from '../../../custom/web/auth/handleOrganizationCreated';
import { createNeonProvisioningClient } from '../../lib/neon-client';
import { getControlDb, getTenantProject } from '../../db/control';
import type { WorkerEnv } from '../../types';

export const organizationCreatedRoute = new Hono<{ Bindings: WorkerEnv }>();

organizationCreatedRoute.post('/', async (c) => {
  let event: WebhookEvent;
  try {
    // Explicitly pass signingSecret rather than relying on verifyWebhook's
    // process.env fallback — Workers has no process.env, only c.env.
    event = await verifyWebhook(c, {
      signingSecret: c.env.CLERK_WEBHOOK_SIGNING_SECRET,
    });
  } catch {
    // Never act on an unverified (or unparseable) payload — AC-4.
    return c.json({ error: 'Invalid webhook signature' }, 400);
  }

  if (event.type !== 'organization.created') {
    // We only registered this endpoint for organization.created, but be
    // defensive if Clerk's dashboard config ever changes underneath us.
    return c.json({ received: true, ignored: event.type }, 200);
  }

  // custom/web/auth/ lives outside worker/ and can't resolve @clerk/backend
  // (only installed here, in worker/node_modules) — map fields explicitly
  // at this boundary rather than passing the whole OrganizationJSON across.
  const orgEvent: ClerkOrganizationCreatedEvent = {
    data: { id: event.data.id, name: (event.data as OrganizationJSON).name },
  };

  try {
    await handleOrganizationCreated(
      orgEvent,
      c.env,
      createNeonProvisioningClient(c.env)
    );
  } catch (err) {
    console.error('organization.created provisioning failed', err);
    try {
      const tenant = await getTenantProject(
        getControlDb(c.env),
        event.data.id
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
