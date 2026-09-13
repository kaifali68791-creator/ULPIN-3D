/**
 * LGD Administrative Data Schema
 * 
 * Defines the field structure, types, and validation rules
 * for Local Government Directory administrative data.
 * 
 * Source: https://lgdirectory.gov.in/
 * Publisher: Ministry of Panchayati Raj, Government of India
 * 
 * IMPORTANT: This file defines schema ONLY. It contains NO actual data.
 */

"use strict";

/**
 * Schema definition for LGD administrative hierarchy.
 * All codes are stored as strings to preserve exact values from source.
 */
const LGD_SCHEMA = {
  /**
   * State level schema
   */
  state: {
    fields: {
      stateCode: {
        type: "string",
        required: true,
        description: "LGD State Code - exact code from source",
        pattern: /^\d{1,2}$/,
        maxLength: 2,
        unique: true,
        examples: ["01", "09", "27", "33"]
      },
      stateName: {
        type: "string",
        required: true,
        description: "Official state name from LGD",
        minLength: 1,
        maxLength: 100
      }
    },
    // Parent level: none (top of hierarchy)
    parent: null
  },

  /**
   * District level schema
   */
  district: {
    fields: {
      districtCode: {
        type: "string",
        required: true,
        description: "LGD District Code - exact code from source",
        pattern: /^\d{1,3}$/,
        maxLength: 3,
        uniqueWithin: "stateCode",
        examples: ["01", "19", "517"]
      },
      districtName: {
        type: "string",
        required: true,
        description: "Official district name from LGD",
        minLength: 1,
        maxLength: 100
      },
      stateCode: {
        type: "string",
        required: true,
        description: "Reference to parent state code",
        reference: "state.stateCode"
      }
    },
    parent: "state"
  },

  /**
   * Sub-District level schema
   * Also known as: Tehsil, Taluk, Mandal, Block
   */
  subDistrict: {
    fields: {
      subDistrictCode: {
        type: "string",
        required: true,
        description: "LGD Sub-District Code - exact code from source",
        pattern: /^\d{1,4}$/,
        maxLength: 4,
        uniqueWithin: "districtCode",
        examples: ["001", "0403", "1234"]
      },
      subDistrictName: {
        type: "string",
        required: true,
        description: "Official sub-district name from LGD",
        minLength: 1,
        maxLength: 100
      },
      subDistrictType: {
        type: "string",
        required: true,
        description: "Type of sub-district unit",
        allowedValues: ["Tehsil", "Taluk", "Mandal", "Block", "Sub-Division", "Circle"],
        examples: ["Tehsil", "Taluk", "Mandal"]
      },
      districtCode: {
        type: "string",
        required: true,
        description: "Reference to parent district code",
        reference: "district.districtCode"
      },
      stateCode: {
        type: "string",
        required: true,
        description: "Reference to grandparent state code",
        reference: "state.stateCode"
      }
    },
    parent: "district"
  },

  /**
   * Village level schema
   */
  village: {
    fields: {
      villageCode: {
        type: "string",
        required: true,
        description: "LGD Village Code - exact code from source",
        pattern: /^\d{1,6}$/,
        maxLength: 6,
        uniqueWithin: "subDistrictCode",
        examples: ["1", "123", "599803"]
      },
      villageName: {
        type: "string",
        required: true,
        description: "Official village name from LGD",
        minLength: 1,
        maxLength: 150
      },
      subDistrictCode: {
        type: "string",
        required: true,
        description: "Reference to parent sub-district code",
        reference: "subDistrict.subDistrictCode"
      },
      districtCode: {
        type: "string",
        required: true,
        description: "Reference to grandparent district code",
        reference: "district.districtCode"
      },
      stateCode: {
        type: "string",
        required: true,
        description: "Reference to great-grandparent state code",
        reference: "state.stateCode"
      }
    },
    parent: "subDistrict"
  }
};

/**
 * Hierarchy definition for validation
 */
const LGD_HIERARCHY = {
  levels: ["state", "district", "subDistrict", "village"],
  parentMap: {
    state: null,
    district: "state",
    subDistrict: "district",
    village: "subDistrict"
  },
  // Required reference fields for each level
  requiredReferences: {
    state: [],
    district: ["stateCode"],
    subDistrict: ["districtCode", "stateCode"],
    village: ["subDistrictCode", "districtCode", "stateCode"]
  }
};

/**
 * Fields that must be unique (globally or within parent)
 */
const LGD_UNIQUENESS = {
  state: ["stateCode"],
  district: ["districtCode", "stateCode"],
  subDistrict: ["subDistrictCode", "districtCode", "stateCode"],
  village: ["villageCode", "subDistrictCode", "districtCode", "stateCode"]
};

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LGD_SCHEMA, LGD_HIERARCHY, LGD_UNIQUENESS };
}
