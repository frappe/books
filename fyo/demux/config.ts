import type Store from 'electron-store';

export class Config {
  config: Map<string, unknown> | Store;
  constructor(isElectron: boolean) {
    this.config = new Map();
    if (isElectron) {
      const Config: typeof Store = require('electron-store');
      this.config = new Config();
    }
  }

  get store() {
    if (this.config instanceof Map) {
      const store: Record<string, unknown> = {};
      for (const key of this.config.keys()) {
        store[key] = this.config.get(key);
      }

      return store;
    } else {
      return this.config;
    }
  }

  get(key: string, defaultValue?: unknown): unknown {
    return this.config.get(key) ?? defaultValue;
  }

  set(key: string, value: unknown) {
    this.config.set(key, value);
  }

  delete(key: string) {
    this.config.delete(key);
  }

  clear() {
    this.config.clear();
  }
}
