/**
 * Resolves the signed-in session's org to ITS OWN Neon project connection.
 * This is the only place a tenant's connection string is decrypted, and it
 * happens in memory, per request, from a short-TTL cache keyed on org_id —
 * never cached across different orgs, never logged, never returned to the
 * client.
 *
 * Every later feature that touches tenant data (0002 onward) calls this
 * first. There is no `org_id` column anywhere in a tenant project: the
 * connection returned here IS the tenant boundary.
 *
 * Spec: docs/specs/0001-web-platform-foundation-control-plane.md
 */
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { getControlDb, getTenantProject } from './control';
import { decrypt } from '../lib/encryption';

export type TenantDb = NeonQueryFunction<false, false>;

interface CacheEntry {
  db: TenantDb;
  status: 'PROVISIONING' | 'READY' | 'SUSPENDED' | 'FAILED';
  expiresAt: number;
}

// Per-isolate, in-memory only — never persisted, never shared across orgs.
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;

export class TenantNotReadyError extends Error {
  constructor(public readonly status: string) {
    super(`Tenant project is not READY (status: ${status})`);
  }
}

export async function resolveTenantDb(
  orgId: string,
  env: { CONTROL_DATABASE_URL: string; TENANT_ENCRYPTION_KEY: string }
): Promise<TenantDb> {
  const cached = cache.get(orgId);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.status !== 'READY') throw new TenantNotReadyError(cached.status);
    return cached.db;
  }

  const controlDb = getControlDb(env);
  const row = await getTenantProject(controlDb, orgId);
  if (!row) {
    throw new Error(`No tenant project provisioned for org ${orgId}`);
  }

  if (row.status !== 'READY') {
    cache.set(orgId, {
      db: null as unknown as TenantDb,
      status: row.status,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    throw new TenantNotReadyError(row.status);
  }

  const connectionString = await decrypt(row.connection_string, env.TENANT_ENCRYPTION_KEY);
  const db = neon(connectionString);

  cache.set(orgId, { db, status: row.status, expiresAt: Date.now() + CACHE_TTL_MS });
  return db;
}
