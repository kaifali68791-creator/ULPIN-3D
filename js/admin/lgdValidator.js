/**
 * LGD Data Validator
 * 
 * Validates administrative data against the LGD schema.
 * Performs field presence, format, uniqueness, and hierarchy checks.
 * 
 * IMPORTANT: This validator does NOT repair or modify data.
 * Invalid records are flagged for manual review.
 */

"use strict";

/**
 * Validation result object
 */
class ValidationResult {
  constructor() {
    this.isValid = true;
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      errorTypes: {}
    };
  }

  addError(recordIndex, field, message, errorCode) {
    this.isValid = false;
    this.errors.push({ record: recordIndex, field, message, errorCode });
    this.stats.invalidRecords++;
    this.stats.errorTypes[errorCode] = (this.stats.errorTypes[errorCode] || 0) + 1;
  }

  addWarning(recordIndex, field, message) {
    this.warnings.push({ record: recordIndex, field, message });
  }

  addValidRecord() {
    this.stats.validRecords++;
  }

  getSummary() {
    return {
      isValid: this.isValid,
      totalRecords: this.stats.totalRecords,
      validRecords: this.stats.validRecords,
      invalidRecords: this.stats.invalidRecords,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errorTypes: this.stats.errorTypes
    };
  }
}

/**
 * LGD Data Validator class
 */
class LGDValidator {
  constructor() {
    this.seenCodes = {
      state: new Set(),
      district: new Set(),
      subDistrict: new Set(),
      village: new Set()
    };
  }

  validateState(record) {
    const errors = [];
    if (!record.stateCode && record.stateCode !== "0") {
      errors.push({ field: "stateCode", message: "stateCode is required", errorCode: "MISSING_STATE_CODE" });
    }
    if (!record.stateName || record.stateName.trim() === "") {
      errors.push({ field: "stateName", message: "stateName is required", errorCode: "MISSING_STATE_NAME" });
    }
    if (record.stateCode && !/^\d{1,2}$/.test(record.stateCode)) {
      errors.push({ field: "stateCode", message: "Invalid stateCode format", errorCode: "INVALID_STATE_CODE" });
    }
    if (record.stateCode) {
      if (this.seenCodes.state.has(record.stateCode)) {
        errors.push({ field: "stateCode", message: "Duplicate stateCode", errorCode: "DUPLICATE_STATE_CODE" });
      }
      this.seenCodes.state.add(record.stateCode);
    }
    return errors;
  }

  validateDistrict(record) {
    const errors = [];
    if (!record.districtCode && record.districtCode !== "0") {
      errors.push({ field: "districtCode", message: "districtCode is required", errorCode: "MISSING_DISTRICT_CODE" });
    }
    if (!record.districtName || record.districtName.trim() === "") {
      errors.push({ field: "districtName", message: "districtName is required", errorCode: "MISSING_DISTRICT_NAME" });
    }
    if (!record.stateCode && record.stateCode !== "0") {
      errors.push({ field: "stateCode", message: "stateCode reference is required", errorCode: "MISSING_STATE_REFERENCE" });
    }
    if (record.districtCode && !/^\d{1,3}$/.test(record.districtCode)) {
      errors.push({ field: "districtCode", message: "Invalid districtCode format", errorCode: "INVALID_DISTRICT_CODE" });
    }
    if (record.districtCode && record.stateCode) {
      const key = record.stateCode + ":" + record.districtCode;
      if (this.seenCodes.district.has(key)) {
        errors.push({ field: "districtCode", message: "Duplicate districtCode in state", errorCode: "DUPLICATE_DISTRICT_CODE" });
      }
      this.seenCodes.district.add(key);
    }
    return errors;
  }

  validateSubDistrict(record) {
    const errors = [];
    if (!record.subDistrictCode && record.subDistrictCode !== "0") {
      errors.push({ field: "subDistrictCode", message: "subDistrictCode is required", errorCode: "MISSING_SUBDISTRICT_CODE" });
    }
    if (!record.subDistrictName || record.subDistrictName.trim() === "") {
      errors.push({ field: "subDistrictName", message: "subDistrictName is required", errorCode: "MISSING_SUBDISTRICT_NAME" });
    }
    if (!record.districtCode && record.districtCode !== "0") {
      errors.push({ field: "districtCode", message: "districtCode reference is required", errorCode: "MISSING_DISTRICT_REFERENCE" });
    }
    if (!record.stateCode && record.stateCode !== "0") {
      errors.push({ field: "stateCode", message: "stateCode reference is required", errorCode: "MISSING_STATE_REFERENCE" });
    }
    if (record.subDistrictCode && !/^\d{1,4}$/.test(record.subDistrictCode)) {
      errors.push({ field: "subDistrictCode", message: "Invalid subDistrictCode format", errorCode: "INVALID_SUBDISTRICT_CODE" });
    }
    if (record.subDistrictCode && record.districtCode && record.stateCode) {
      const key = record.stateCode + ":" + record.districtCode + ":" + record.subDistrictCode;
      if (this.seenCodes.subDistrict.has(key)) {
        errors.push({ field: "subDistrictCode", message: "Duplicate subDistrictCode", errorCode: "DUPLICATE_SUBDISTRICT_CODE" });
      }
      this.seenCodes.subDistrict.add(key);
    }
    return errors;
  }

  validateVillage(record) {
    const errors = [];
    if (!record.villageCode && record.villageCode !== "0") {
      errors.push({ field: "villageCode", message: "villageCode is required", errorCode: "MISSING_VILLAGE_CODE" });
    }
    if (!record.villageName || record.villageName.trim() === "") {
      errors.push({ field: "villageName", message: "villageName is required", errorCode: "MISSING_VILLAGE_NAME" });
    }
    if (!record.subDistrictCode && record.subDistrictCode !== "0") {
      errors.push({ field: "subDistrictCode", message: "subDistrictCode reference is required", errorCode: "MISSING_SUBDISTRICT_REFERENCE" });
    }
    if (!record.districtCode && record.districtCode !== "0") {
      errors.push({ field: "districtCode", message: "districtCode reference is required", errorCode: "MISSING_DISTRICT_REFERENCE" });
    }
    if (!record.stateCode && record.stateCode !== "0") {
      errors.push({ field: "stateCode", message: "stateCode reference is required", errorCode: "MISSING_STATE_REFERENCE" });
    }
    if (record.villageCode && !/^\d{1,6}$/.test(record.villageCode)) {
      errors.push({ field: "villageCode", message: "Invalid villageCode format", errorCode: "INVALID_VILLAGE_CODE" });
    }
    if (record.villageCode && record.subDistrictCode && record.districtCode && record.stateCode) {
      const key = record.stateCode + ":" + record.districtCode + ":" + record.subDistrictCode + ":" + record.villageCode;
      if (this.seenCodes.village.has(key)) {
        errors.push({ field: "villageCode", message: "Duplicate villageCode", errorCode: "DUPLICATE_VILLAGE_CODE" });
      }
      this.seenCodes.village.add(key);
    }
    return errors;
  }

  reset() {
    this.seenCodes = {
      state: new Set(),
      district: new Set(),
      subDistrict: new Set(),
      village: new Set()
    };
  }
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = { LGDValidator, ValidationResult };
}
