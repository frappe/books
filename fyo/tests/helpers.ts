import { AuthDemuxBase, TelemetryCreds } from 'utils/auth/types';

export class DummyAuthDemux extends AuthDemuxBase {
  async getTelemetryCreds(): Promise<TelemetryCreds> {
    return { url: '', token: '' };
  }
}
