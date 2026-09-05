/**
 * Requires a verified Clerk session and an active organization. Every
 * tenant-scoped route runs behind this — the org_id it reads off the
 * session is the ONLY source of tenant identity anywhere in worker/,
 * never a client-supplied value (path param, body field, header).
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import { createMiddleware } from 'hono/factory';
import { getAuth } from '@clerk/hono';
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

  // isAuthenticated is Clerk's documented discriminant for this check
  // (https://clerk.com/docs/reference/backend/types/auth-object) — a
  // truthy userId check works too, but isAuthenticated is what Clerk's
  // own examples use and is what correctly narrows the auth object's
  // type in the SDK's discriminated union.
  if (!auth?.isAuthenticated) {
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