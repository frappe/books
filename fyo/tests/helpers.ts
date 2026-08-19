import { AuthDemuxBase } from 'utils/auth/types';
import { Creds } from 'utils/types';

export class DummyAuthDemux extends AuthDemuxBase {
  // eslint-disable-next-line @typescript-eslint/require-await
  async getCreds(): Promise<Creds> {
    return { errorLogUrl: '', tokenString: '', telemetryUrl: '' };
  }
}
