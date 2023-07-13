import { AuthDemuxBase } from 'utils/auth/types';
import { Creds } from 'utils/types';

export class AuthDemux extends AuthDemuxBase {
  #isElectron = false;
  constructor(isElectron: boolean) {
    super();
    this.#isElectron = isElectron;
  }

  async getCreds(): Promise<Creds> {
    if (this.#isElectron) {
      return await ipc.getCreds();
    } else {
      return { errorLogUrl: '', tokenString: '', telemetryUrl: '' };
    }
  }
}
