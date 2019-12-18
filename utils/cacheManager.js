class CacheManager {
  constructor() {
    this.keyValueCache = {};
    this.hashCache = {};
  }

  getValue(key) {
    return this.keyValueCache[key];
  }

  setValue(key, value) {
    this.keyValueCache[key] = value;
  }

  clearValue(key) {
    this.keyValueCache[key] = null;
  }

  hget(hashName, key) {
    return (this.hashCache[hashName] || {})[key];
  }

  hset(hashName, key, value) {
    this.hashCache[hashName] = this.hashCache[hashName] || {};
    this.hashCache[hashName][key] = value;
  }

  hclear(hashName, key) {
    if (key) {
      (this.hashCache[hashName] || {})[key] = null;
    } else {
      this.hashCache[hashName] = {};
    }
  }

  hexists(hashName) {
    return this.hashCache[hashName] != null;
  }
}

module.exports = CacheManager;
