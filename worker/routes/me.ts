import { Hono } from 'hono';
import { requireOrgSession, type AuthedVariables } from '../middleware/clerk-auth';
import type { WorkerEnv } from '../types';

export const meRoute = new Hono<{ Bindings: WorkerEnv; Variables: AuthedVariables }>();

meRoute.get('/', requireOrgSession, (c) => {
  return c.json({
    userId: c.get('userId'),
    orgId: c.get('orgId'),
    orgRole: c.get('orgRole'),
  });
});
