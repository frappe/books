import config from 'utils/config';

export class Config {
  #isElectron: boolean;
  fallback: Map<string, unknown> = new Map();
  constructor(isElectron: boolean) {
    this.#isElectron = isElectron;
  }

  get store(): Record<string, unknown> {
    if (this.#isElectron) {
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
    if (this.#isElectron) {
      return config.get(key, defaultValue);
    } else {
      return this.fallback.get(key) ?? defaultValue;
    }
  }

  set(key: string, value: unknown) {
    if (this.#isElectron) {
      config.set(key, value);
    } else {
      this.fallback.set(key, value);
    }
  }

  delete(key: string) {
    if (this.#isElectron) {
      config.delete(key);
    } else {
      this.fallback.delete(key);
    }
  }

  clear() {
    if (this.#isElectron) {
      config.clear();
    } else {
      this.fallback.clear();
    }
  }
}
