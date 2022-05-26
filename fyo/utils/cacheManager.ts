export default class CacheManager {
  _keyValueCache: Map<string, unknown | undefined>;
  _hashCache: Map<string, Map<string, unknown> | undefined>;

  constructor() {
    this._keyValueCache = new Map();
    this._hashCache = new Map();
  }

  // Regular Cache Ops
  getValue(key: string) {
    return this._keyValueCache.get(key);
  }

  setValue(key: string, value: unknown) {
    this._keyValueCache.set(key, value);
  }

  clearValue(key: string) {
    this._keyValueCache.delete(key);
  }

  // Hash Cache Ops
  hget(hashName: string, key: string) {
    const hc = this._hashCache.get(hashName);
    if (hc === undefined) {
      return hc;
    }
    return hc.get(key);
  }

  hset(hashName: string, key: string, value: unknown) {
    const hc = this._hashCache.get(hashName);
    if (hc === undefined) {
      this._hashCache.set(hashName, new Map());
    }

    this._hashCache.get(hashName)!.set(key, value);
  }

  hclear(hashName: string, key?: string) {
    if (key) {
      this._hashCache.get(hashName)?.delete(key);
    } else {
      this._hashCache.get(hashName)?.clear();
    }
  }

  hexists(hashName: string) {
    return this._hashCache.get(hashName) !== undefined;
  }
}
