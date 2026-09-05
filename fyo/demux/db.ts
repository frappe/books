import { DatabaseError, NotImplemented } from 'fyo/utils/errors';
import { SchemaMap } from 'schemas/types';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { BackendResponse } from 'utils/ipc/types';

export class DatabaseDemux extends DatabaseDemuxBase {
  #isElectron = false;
  constructor(isElectron: boolean) {
    super();
    this.#isElectron = isElectron;
  }

  async #handleDBCall(func: () => Promise<BackendResponse>): Promise<unknown> {
    const response = await func();

    if (response.error?.name) {
      const { name, message, stack } = response.error;
      const dberror = new DatabaseError(`${name}\n${message}`);
      dberror.stack = stack;

      throw dberror;
    }

    return response.data;
  }

  /**
   * Web equivalent of an ipc call: fetch() against worker/, translated into
   * the same { data, error } shape #handleDBCall already expects, so both
   * platforms share one error-handling path.
   *
   * Spec: docs/specs/0001-web-platform-foundation-control-plane.md (AC-6)
   */
  async #fetchBackend(path: string, init?: RequestInit): Promise<BackendResponse> {
    try {
      const res = await fetch(path, {
        ...init,
        credentials: 'include', // sends the Clerk session cookie
        headers: { 'Content-Type': 'application/json', ...init?.headers },
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        return {
          error: {
            name: `HTTP${res.status}`,
            message: body.error ?? res.statusText,
          },
        };
      }

      return { data: await res.json() };
    } catch (err) {
      return {
        error: {
          name: 'NetworkError',
          message: err instanceof Error ? err.message : String(err),
        },
      };
    }
  }

  async getSchemaMap(): Promise<SchemaMap> {
    if (!this.#isElectron) {
      // Applying/serving the tenant schema is feature 0002 (tenant schema
      // & data layer), not this feature — see docs/specs/0002. This
      // feature (0001) only needs the fetch plumbing (#fetchBackend) to
      // exist and work, proven by getDashboardStatus() below.
      throw new NotImplemented(
        'getSchemaMap on web is implemented by feature 0002 (tenant schema & data layer)'
      );
    }

    return (await this.#handleDBCall(async () => {
      return await ipc.db.getSchema();
    })) as SchemaMap;
  }

  async createNewDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    if (!this.#isElectron) {
      // No equivalent on web: a tenant's "database" is provisioned once,
      // automatically, on organization creation (feature 0001's webhook),
      // never created on demand from the client the way Desktop's
      // "new company" flow does.
      throw new NotImplemented('createNewDatabase has no web equivalent');
    }

    return (await this.#handleDBCall(async () => {
      return ipc.db.create(dbPath, countryCode);
    })) as string;
  }

  async connectToDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    if (!this.#isElectron) {
      // NOTE: DatabaseHandler.connectToDatabase() (fyo/core/dbHandler.ts)
      // unconditionally calls init() -> getSchemaMap() right after this
      // resolves, and getSchemaMap()'s web branch is NotImplemented until
      // feature 0002. So this method is real (proves AC-6's fetch()
      // plumbing) but isn't safe to call from application code yet —
      // Dashboard.vue checks tenant readiness via a direct fetch() to
      // /api/dashboard instead of fyo.db.connectToDatabase(), specifically
      // to avoid that unconditional getSchemaMap() call. This becomes the
      // real connection path once feature 0002 lands.
      const response = await this.#fetchBackend('/api/dashboard');
      const data = (await this.#handleDBCall(async () => response)) as {
        status?: string;
      };
      return data?.status ?? 'UNKNOWN';
    }

    return (await this.#handleDBCall(async () => {
      return ipc.db.connect(dbPath, countryCode);
    })) as string;
  }

  async call(method: DatabaseMethod, ...args: unknown[]): Promise<unknown> {
    if (!this.#isElectron) {
      // Generic doc CRUD (worker/routes/doc/*) is feature 0002 — see
      // docs/specs/0002-tenant-schema-data-layer.md.
      throw new NotImplemented(
        `call('${method}') on web is implemented by feature 0002 (tenant schema & data layer)`
      );
    }

    return await this.#handleDBCall(async () => {
      return await ipc.db.call(method, ...args);
    });
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    if (!this.#isElectron) {
      throw new NotImplemented(
        `callBespoke('${method}') on web is implemented by feature 0002 (tenant schema & data layer)`
      );
    }

    return await this.#handleDBCall(async () => {
      return await ipc.db.bespoke(method, ...args);
    });
  }
}
