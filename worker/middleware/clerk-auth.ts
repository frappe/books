/**
 * Requires a verified Clerk session and an active organization. Every
 * tenant-scoped route runs behind this — the org_id it reads off the
 * session is the ONLY source of tenant identity anywhere in worker/,
 * never a client-supplied value (path param, body field, header).
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import { createMiddleware } from 'hono/factory';
import { getAuth } from '@hono/clerk-auth';
import type { WorkerEnv } from '../types';

export interface AuthedVariables {
  userId: string;
  orgId: string;
  orgRole: string;
}

export const requireOrgSession = createMiddleware<{
  Bindings: WorkerEnv;
  Variables: AuthedVariables;
}>(async (c, next) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({ error: 'Unauthenticated' }, 401);
  }
  if (!auth.orgId) {
    return c.json({ error: 'No active organization on this session' }, 403);
  }

  c.set('userId', auth.userId);
  c.set('orgId', auth.orgId);
  c.set('orgRole', auth.orgRole ?? '');

  await next();
});
