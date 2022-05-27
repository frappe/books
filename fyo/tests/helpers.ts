import { AuthDemuxBase } from 'utils/auth/types';
import { Creds } from 'utils/types';

export class DummyAuthDemux extends AuthDemuxBase {
  async getCreds(): Promise<Creds> {
    return { errorLogUrl: '', tokenString: '', telemetryUrl: '' };
  }
}
