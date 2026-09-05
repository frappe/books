/**
 * RareBooks web platform API — Cloudflare Workers, Hono.
 * Web only. Must never import Electron-only code (main/, custom/licensing/).
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import { Hono } from 'hono';
import { clerkMiddleware } from '@clerk/hono';
import type { WorkerEnv } from './types';
import { meRoute } from './routes/me';
import { dashboardRoute } from './routes/dashboard';
import { organizationCreatedRoute } from './routes/webhooks/organization-created';

const app = new Hono<{ Bindings: WorkerEnv }>();

// Injects the Clerk session into context for every route below; routes that
// need it enforce it themselves via requireOrgSession (worker/middleware/clerk-auth.ts).
app.use('*', clerkMiddleware());

app.get('/', (c) => c.json({ ok: true, service: 'rarebooks-web' }));

app.route('/api/me', meRoute);
app.route('/api/dashboard', dashboardRoute);
app.route('/webhooks/clerk/organization-created', organizationCreatedRoute);

export default app;