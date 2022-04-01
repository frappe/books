import { Frappe } from 'frappe';

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
  frappe: Frappe;

  constructor(frappe: Frappe) {
    this.frappe = frappe;
    this.#config = {
      serverURL: '',
      backend: 'sqlite',
      port: 8000,
    };

    this.#session = {
      user: '',
      token: '',
    };
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

  #getServerURL() {
    return this.#config.serverURL || '';
  }
}
