import { ipcRenderer } from 'electron';
import { AuthDemuxBase, TelemetryCreds } from 'utils/auth/types';
import { IPC_ACTIONS } from 'utils/messages';

export class AuthDemux extends AuthDemuxBase {
  #isElectron: boolean = false;
  constructor(isElectron: boolean) {
    super();
    this.#isElectron = isElectron;
  }

  async getTelemetryCreds(): Promise<TelemetryCreds> {
    if (this.#isElectron) {
      const creds = await ipcRenderer.invoke(IPC_ACTIONS.GET_CREDS);
      const url: string = creds?.telemetryUrl ?? '';
      const token: string = creds?.tokenString ?? '';
      return { url, token };
    } else {
      return { url: '', token: '' };
    }
  }
}
