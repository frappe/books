import { Creds } from 'utils/types';

export abstract class AuthDemuxBase {
  abstract getCreds(): Promise<Creds>;
}
