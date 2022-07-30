import { ipcRenderer } from 'electron';
import { DatabaseError, NotImplemented } from 'fyo/utils/errors';
import { SchemaMap } from 'schemas/types';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { BackendResponse } from 'utils/ipc/types';
import { IPC_ACTIONS } from 'utils/messages';

export class DatabaseDemux extends DatabaseDemuxBase {
  #isElectron: boolean = false;
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

  async getSchemaMap(): Promise<SchemaMap> {
    if (this.#isElectron) {
      return (await this.#handleDBCall(async function dbFunc() {
        return await ipcRenderer.invoke(IPC_ACTIONS.DB_SCHEMA);
      })) as SchemaMap;
    }

    throw new NotImplemented();
  }

  async createNewDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    if (this.#isElectron) {
      return (await this.#handleDBCall(async function dbFunc() {
        return await ipcRenderer.invoke(
          IPC_ACTIONS.DB_CREATE,
          dbPath,
          countryCode
        );
      })) as string;
    }

    throw new NotImplemented();
  }

  async connectToDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    if (this.#isElectron) {
      return (await this.#handleDBCall(async function dbFunc() {
        return await ipcRenderer.invoke(
          IPC_ACTIONS.DB_CONNECT,
          dbPath,
          countryCode
        );
      })) as string;
    }

    throw new NotImplemented();
  }

  async call(method: DatabaseMethod, ...args: unknown[]): Promise<unknown> {
    if (this.#isElectron) {
      return (await this.#handleDBCall(async function dbFunc() {
        return await ipcRenderer.invoke(IPC_ACTIONS.DB_CALL, method, ...args);
      })) as unknown;
    }

    throw new NotImplemented();
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    if (this.#isElectron) {
      return (await this.#handleDBCall(async function dbFunc() {
        return await ipcRenderer.invoke(
          IPC_ACTIONS.DB_BESPOKE,
          method,
          ...args
        );
      })) as unknown;
    }

    throw new NotImplemented();
  }
}
