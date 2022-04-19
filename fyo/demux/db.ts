import { ipcRenderer } from 'electron';
import { DEFAULT_COUNTRY_CODE } from 'fyo/utils/consts';
import { SchemaMap } from 'schemas/types';
import { DatabaseDemuxBase, DatabaseMethod } from 'utils/db/types';
import { DatabaseResponse } from 'utils/ipc/types';
import { IPC_ACTIONS } from 'utils/messages';

export class DatabaseDemux extends DatabaseDemuxBase {
  #isElectron: boolean = false;
  constructor(isElectron: boolean) {
    super();
    this.#isElectron = isElectron;
  }

  async getSchemaMap(): Promise<SchemaMap> {
    let response: DatabaseResponse;
    if (this.#isElectron) {
      response = await ipcRenderer.invoke(IPC_ACTIONS.DB_SCHEMA);
    } else {
      // TODO: API Call
      response = { error: '', data: undefined };
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data as SchemaMap;
  }

  async createNewDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    let response: DatabaseResponse;
    if (this.#isElectron) {
      response = await ipcRenderer.invoke(
        IPC_ACTIONS.DB_CREATE,
        dbPath,
        countryCode
      );
    } else {
      // TODO: API Call
      response = { error: '', data: undefined };
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return (response.data ?? DEFAULT_COUNTRY_CODE) as string;
  }

  async connectToDatabase(
    dbPath: string,
    countryCode?: string
  ): Promise<string> {
    let response: DatabaseResponse;
    if (this.#isElectron) {
      response = await ipcRenderer.invoke(
        IPC_ACTIONS.DB_CONNECT,
        dbPath,
        countryCode
      );
    } else {
      // TODO: API Call
      response = { error: '', data: undefined };
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return (response.data ?? DEFAULT_COUNTRY_CODE) as string;
  }

  async call(method: DatabaseMethod, ...args: unknown[]): Promise<unknown> {
    let response: DatabaseResponse;
    if (this.#isElectron) {
      response = await ipcRenderer.invoke(IPC_ACTIONS.DB_CALL, method, ...args);
    } else {
      // TODO: API Call
      response = { error: '', data: undefined };
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }

  async callBespoke(method: string, ...args: unknown[]): Promise<unknown> {
    let response: DatabaseResponse;
    if (this.#isElectron) {
      response = await ipcRenderer.invoke(
        IPC_ACTIONS.DB_BESPOKE,
        method,
        ...args
      );
    } else {
      // TODO: API Call
      response = { error: '', data: undefined };
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response.data;
  }
}
