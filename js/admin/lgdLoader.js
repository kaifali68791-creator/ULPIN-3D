/**
 * LGD Data Loader
 * 
 * Loads and caches administrative data with lazy-loading support.
 * Designed for browser environment using fetch API.
 * 
 * IMPORTANT: This loader does NOT contain any actual data.
 * Data files must be provided separately.
 */

"use strict";

/**
 * LGD Data Loader class
 */
class LGDLoader {
  constructor() {
    this.cache = {
      states: null,
      districts: new Map(),
      subDistricts: new Map(),
      villages: new Map()
    };
    this.basePath = "js/admin/data/";
    this.loadingPromises = new Map();
  }

  setBasePath(path) {
    this.basePath = path;
  }

  async loadStates() {
    if (this.cache.states) {
      return this.cache.states;
    }
    if (this.loadingPromises.has("states")) {
      return this.loadingPromises.get("states");
    }

    const promise = this._fetchJSON(this.basePath + "states.json")
      .then(data => {
        this.cache.states = data.states || data;
        this.loadingPromises.delete("states");
        return this.cache.states;
      })
      .catch(error => {
        this.loadingPromises.delete("states");
        throw new Error("Failed to load states: " + error.message);
      });

    this.loadingPromises.set("states", promise);
    return promise;
  }

  async loadDistricts(stateCode) {
    if (this.cache.districts.has(stateCode)) {
      return this.cache.districts.get(stateCode);
    }

    const cacheKey = "districts:" + stateCode;
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    const promise = this._fetchJSON(this.basePath + "districts.json")
      .then(data => {
        const allDistricts = data.districts || data;
        const stateDistricts = allDistricts.filter(d => d.stateCode === stateCode);
        this.cache.districts.set(stateCode, stateDistricts);
        this.loadingPromises.delete(cacheKey);
        return stateDistricts;
      })
      .catch(error => {
        this.loadingPromises.delete(cacheKey);
        throw new Error("Failed to load districts for state " + stateCode);
      });

    this.loadingPromises.set(cacheKey, promise);
    return promise;
  }

  async loadSubDistricts(stateCode) {
    if (this.cache.subDistricts.has(stateCode)) {
      return this.cache.subDistricts.get(stateCode);
    }

    const cacheKey = "subDistricts:" + stateCode;
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    const promise = this._fetchJSON(this.basePath + "subdistricts/subdistricts-" + stateCode + ".json")
      .then(data => {
        this.cache.subDistricts.set(stateCode, data.subDistricts || data);
        this.loadingPromises.delete(cacheKey);
        return this.cache.subDistricts.get(stateCode);
      })
      .catch(error => {
        this.loadingPromises.delete(cacheKey);
        throw new Error("Failed to load sub-districts for state " + stateCode);
      });

    this.loadingPromises.set(cacheKey, promise);
    return promise;
  }

  async loadVillages(stateCode, districtCode) {
    const cacheKey = stateCode + ":" + districtCode;
    if (this.cache.villages.has(cacheKey)) {
      return this.cache.villages.get(cacheKey);
    }

    const loadingKey = "villages:" + cacheKey;
    if (this.loadingPromises.has(loadingKey)) {
      return this.loadingPromises.get(loadingKey);
    }

    const promise = this._fetchJSON(this.basePath + "villages/villages-" + stateCode + "-" + districtCode + ".json")
      .then(data => {
        this.cache.villages.set(cacheKey, data.villages || data);
        this.loadingPromises.delete(loadingKey);
        return this.cache.villages.get(cacheKey);
      })
      .catch(error => {
        this.loadingPromises.delete(loadingKey);
        throw new Error("Failed to load villages for district " + districtCode);
      });

    this.loadingPromises.set(loadingKey, promise);
    return promise;
  }

  getVillagesForSubDistrict(stateCode, districtCode, subDistrictCode) {
    const cacheKey = stateCode + ":" + districtCode;
    const villages = this.cache.villages.get(cacheKey);
    if (!villages) return [];
    return villages.filter(v => v.subDistrictCode === subDistrictCode);
  }

  isDataAvailable() {
    return this.cache.states !== null;
  }

  getStatus() {
    return {
      statesLoaded: this.cache.states !== null,
      districtsLoaded: this.cache.districts.size,
      subDistrictsLoaded: this.cache.subDistricts.size,
      villagesLoaded: this.cache.villages.size,
      pendingRequests: this.loadingPromises.size
    };
  }

  clearCache() {
    this.cache = {
      states: null,
      districts: new Map(),
      subDistricts: new Map(),
      villages: new Map()
    };
    this.loadingPromises.clear();
  }

  async _fetchJSON(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("HTTP " + response.status);
      }
      return await response.json();
    } catch (error) {
      if (error.message.includes("Failed to fetch") || error.message.includes("404")) {
        throw new Error("Data file not found: " + url + ". LGD data has not been imported yet.");
      }
      throw error;
    }
  }
}

// Create global instance
const lgdLoader = new LGDLoader();

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LGDLoader, lgdLoader };
}

// Also make available globally for browser
if (typeof window !== "undefined") {
  window.LGDLoader = LGDLoader;
  window.lgdLoader = lgdLoader;
}