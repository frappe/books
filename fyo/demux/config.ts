import config from 'utils/config';

export class Config {
  #useElectronConfig: boolean;
  fallback: Map<string, unknown> = new Map();
  constructor(isElectron: boolean) {
    this.#useElectronConfig = isElectron;
  }

  get store(): Record<string, unknown> {
    if (this.#useElectronConfig) {
      return config.store;
    } else {
      const store: Record<string, unknown> = {};

      for (const key of this.fallback.keys()) {
        store[key] = this.fallback.get(key);
      }

      return store;
    }
  }

  get(key: string, defaultValue?: unknown): unknown {
    if (this.#useElectronConfig) {
      return config.get(key, defaultValue);
    } else {
      return this.fallback.get(key) ?? defaultValue;
    }
  }

  set(key: string, value: unknown) {
    if (this.#useElectronConfig) {
      config.set(key, value);
    } else {
      this.fallback.set(key, value);
    }
  }

  delete(key: string) {
    if (this.#useElectronConfig) {
      config.delete(key);
    } else {
      this.fallback.delete(key);
    }
  }

  clear() {
    if (this.#useElectronConfig) {
      config.clear();
    } else {
      this.fallback.clear();
    }
  }
}
