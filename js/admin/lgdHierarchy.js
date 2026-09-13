/**
 * LGD Hierarchy Builder
 * 
 * Builds parent-child relationships for administrative hierarchy.
 * Provides lookup and navigation functions.
 * 
 * IMPORTANT: This module operates on validated data only.
 */

"use strict";

/**
 * Hierarchy node for tree structure
 */
class HierarchyNode {
  constructor(data, level) {
    this.data = data;
    this.level = level;
    this.children = new Map();
    this.parent = null;
  }

  addChild(key, childNode) {
    this.children.set(key, childNode);
    childNode.parent = this;
  }

  getChild(key) {
    return this.children.get(key) || null;
  }
}

/**
 * Main hierarchy builder class
 */
class LGDHierarchyBuilder {
  constructor() {
    this.root = new HierarchyNode(null, "root");
    this.index = {
      states: new Map(),
      districts: new Map(),
      subDistricts: new Map(),
      villages: new Map()
    };
    this.stateMap = new Map(); // stateCode -> state node
  }

  /**
   * Build complete hierarchy from flat datasets
   */
  buildHierarchy(dataset) {
    // Clear existing data
    this.root = new HierarchyNode(null, "root");
    this.index = {
      states: new Map(),
      districts: new Map(),
      subDistricts: new Map(),
      villages: new Map()
    };
    this.stateMap = new Map();

    // Build states
    if (dataset.states) {
      dataset.states.forEach(state => {
        const node = new HierarchyNode(state, "state");
        this.index.states.set(state.stateCode, node);
        this.stateMap.set(state.stateCode, state);
        this.root.addChild(state.stateCode, node);
      });
    }

    // Build districts
    if (dataset.districts) {
      dataset.districts.forEach(district => {
        const node = new HierarchyNode(district, "district");
        this.index.districts.set(district.stateCode + ":" + district.districtCode, node);

        // Link to parent state
        const parentState = this.root.getChild(district.stateCode);
        if (parentState) {
          parentState.addChild(district.districtCode, node);
        }
      });
    }

    // Build sub-districts
    if (dataset.subDistricts) {
      dataset.subDistricts.forEach(subDistrict => {
        const node = new HierarchyNode(subDistrict, "subDistrict");
        const key = subDistrict.stateCode + ":" + subDistrict.districtCode + ":" + subDistrict.subDistrictCode;
        this.index.subDistricts.set(key, node);

        // Link to parent district
        const parentKey = subDistrict.stateCode + ":" + subDistrict.districtCode;
        const parentDistrict = this.index.districts.get(parentKey);
        if (parentDistrict) {
          parentDistrict.addChild(subDistrict.subDistrictCode, node);
        }
      });
    }

    // Build villages
    if (dataset.villages) {
      dataset.villages.forEach(village => {
        const node = new HierarchyNode(village, "village");
        const key = village.stateCode + ":" + village.districtCode + ":" + village.subDistrictCode + ":" + village.villageCode;
        this.index.villages.set(key, node);

        // Link to parent sub-district
        const parentKey = village.stateCode + ":" + village.districtCode + ":" + village.subDistrictCode;
        const parentSubDistrict = this.index.subDistricts.get(parentKey);
        if (parentSubDistrict) {
          parentSubDistrict.addChild(village.villageCode, node);
        }
      });
    }

    return this;
  }

  /**
   * Get all states
   */
  getStates() {
    return Array.from(this.index.states.values()).map(node => node.data);
  }

  /**
   * Get districts for a state
   */
  getDistricts(stateCode) {
    const stateNode = this.root.getChild(stateCode);
    if (!stateNode) return [];
    return Array.from(stateNode.children.values()).map(node => node.data);
  }

  /**
   * Get sub-districts for a district
   */
  getSubDistricts(stateCode, districtCode) {
    const districtKey = stateCode + ":" + districtCode;
    const districtNode = this.index.districts.get(districtKey);
    if (!districtNode) return [];
    return Array.from(districtNode.children.values()).map(node => node.data);
  }

  /**
   * Get villages for a sub-district
   */
  getVillages(stateCode, districtCode, subDistrictCode) {
    const subDistrictKey = stateCode + ":" + districtCode + ":" + subDistrictCode;
    const subDistrictNode = this.index.subDistricts.get(subDistrictKey);
    if (!subDistrictNode) return [];
    return Array.from(subDistrictNode.children.values()).map(node => node.data);
  }

  /**
   * Get full hierarchy path for a village
   */
  getHierarchyPath(stateCode, districtCode, subDistrictCode, villageCode) {
    const state = this.stateMap.get(stateCode);
    const districtKey = stateCode + ":" + districtCode;
    const district = this.index.districts.get(districtKey)?.data;
    const subDistrictKey = stateCode + ":" + districtCode + ":" + subDistrictCode;
    const subDistrict = this.index.subDistricts.get(subDistrictKey)?.data;
    const villageKey = stateCode + ":" + districtCode + ":" + subDistrictCode + ":" + villageCode;
    const village = this.index.villages.get(villageKey)?.data;

    return {
      state: state || null,
      district: district || null,
      subDistrict: subDistrict || null,
      village: village || null
    };
  }

  /**
   * Get hierarchy statistics
   */
  getStats() {
    return {
      totalStates: this.index.states.size,
      totalDistricts: this.index.districts.size,
      totalSubDistricts: this.index.subDistricts.size,
      totalVillages: this.index.villages.size
    };
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LGDHierarchyBuilder, HierarchyNode };
}
