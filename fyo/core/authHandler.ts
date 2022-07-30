import { Fyo } from 'fyo';
import { AuthDemux } from 'fyo/demux/auth';
import { AuthDemuxBase } from 'utils/auth/types';
import { Creds } from 'utils/types';
import { AuthDemuxConstructor } from './types';

interface AuthConfig {
  serverURL: string;
  backend: string;
  port: number;
}

interface Session {
  user: string;
  token: string;
}

export class AuthHandler {
  #config: AuthConfig;
  #session: Session;
  fyo: Fyo;
  #demux: AuthDemuxBase;
  #creds?: Creds;

  constructor(fyo: Fyo, Demux?: AuthDemuxConstructor) {
    this.fyo = fyo;
    this.#config = {
      serverURL: '',
      backend: 'sqlite',
      port: 8000,
    };

    this.#session = {
      user: '',
      token: '',
    };

    if (Demux !== undefined) {
      this.#demux = new Demux(fyo.isElectron);
    } else {
      this.#demux = new AuthDemux(fyo.isElectron);
    }
  }

  set user(value: string) {
    this.#session.user = value;
  }

  get user(): string {
    return this.#session.user;
  }

  get session(): Readonly<Session> {
    return { ...this.#session };
  }

  get config(): Readonly<AuthConfig> {
    return { ...this.#config };
  }

  init() {}
  async login(email: string, password: string) {
    if (email === 'Administrator') {
      this.#session.user = 'Administrator';
      return;
    }

    const response = await fetch(this.#getServerURL() + '/api/login', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.status === 200) {
      const res = await response.json();

      this.#session.user = email;
      this.#session.token = res.token;

      return res;
    }

    return response;
  }

  async signup(email: string, fullName: string, password: string) {
    const response = await fetch(this.#getServerURL() + '/api/signup', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, fullName, password }),
    });

    if (response.status === 200) {
      return await response.json();
    }

    return response;
  }

  async logout() {
    // TODO: Implement this with auth flow
  }

  async purgeCache() {}

  #getServerURL() {
    return this.#config.serverURL || '';
  }

  async getCreds(): Promise<Creds> {
    if (!this.#creds) {
      this.#creds = await this.#demux.getCreds();
    }

    return this.#creds;
  }
}
