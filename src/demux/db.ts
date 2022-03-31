import { ipcRenderer } from 'electron';
import { DatabaseMethod } from 'utils/db/types';
import { IPC_ACTIONS } from 'utils/messages';
import { DatabaseResponse } from '../../utils/ipc/types';

export class DatabaseDemux {
  #isElectron: boolean = false;
  constructor(isElectron: boolean) {
    this.#isElectron = isElectron;
  }

  async createNewDatabase(dbPath: string, countryCode?: string): Promise<void> {
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
  }

  async connectToDatabase(dbPath: string, countryCode?: string): Promise<void> {
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
}
