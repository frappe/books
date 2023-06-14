import { AuthDemuxBase } from 'utils/auth/types';
import { IPC_ACTIONS } from 'utils/messages';
import { Creds } from 'utils/types';
const { ipcRenderer } = require('electron');

export class AuthDemux extends AuthDemuxBase {
  #isElectron: boolean = false;
  constructor(isElectron: boolean) {
    super();
    this.#isElectron = isElectron;
  }

  async getCreds(): Promise<Creds> {
    if (this.#isElectron) {
      return (await ipcRenderer.invoke(IPC_ACTIONS.GET_CREDS)) as Creds;
    } else {
      return { errorLogUrl: '', tokenString: '', telemetryUrl: '' };
    }
  }
}
