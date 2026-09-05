/**
 * Cloudflare Workers bindings (secrets + vars) for the RareBooks web
 * platform. Configure the secret values with `wrangler secret put <NAME>`
 * — never commit real values. See wrangler.toml for [vars] (non-secret).
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md,
 * "Configuration required"
 */
export interface WorkerEnv {
  // Clerk
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_WEBHOOK_SIGNING_SECRET: string;

  // Neon
  NEON_API_KEY: string;
  NEON_ACCOUNT_ORG_ID: string;
  CONTROL_DATABASE_URL: string;

  // Tenant connection-string encryption (added during /develop, see spec 0001)
  TENANT_ENCRYPTION_KEY: string;
}
