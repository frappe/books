import type Store from 'electron-store';
import { ConfigMap } from 'fyo/core/types';

export class Config {
  config: Map<string, unknown> | Store;
  constructor(isElectron: boolean) {
    this.config = new Map();
    if (isElectron) {
      const Config = require('electron-store') as typeof Store;
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

  get<K extends keyof ConfigMap>(
    key: K,
    defaultValue?: ConfigMap[K]
  ): ConfigMap[K] | undefined {
    const value = this.config.get(key) as ConfigMap[K] | undefined;
    return value ?? defaultValue;
  }

  set<K extends keyof ConfigMap>(key: K, value: ConfigMap[K]) {
    this.config.set(key, value);
  }

  delete(key: keyof ConfigMap) {
    this.config.delete(key);
  }

  clear() {
    this.config.clear();
  }
}
