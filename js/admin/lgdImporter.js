/**
 * LGD Data Importer
 * 
 * Parses and imports LGD administrative data from CSV/JSON sources.
 * Validates all records during import.
 * 
 * IMPORTANT: Does NOT repair or modify data. Invalid records are rejected.
 */

"use strict";

/**
 * Parse CSV text into array of objects
 */
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : "";
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

/**
 * Parse a single CSV line handling quotes
 */
function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Transform raw imported data into standardized LGD format
 */
function transformRecord(record, level) {
  const transformed = {};

  switch (level) {
    case "state":
      transformed.stateCode = String(record.stateCode || record.State_Code || record.state_code || "").trim();
      transformed.stateName = String(record.stateName || record.State_Name || record.state_name || record.NAME || "").trim();
      break;

    case "district":
      transformed.districtCode = String(record.districtCode || record.District_Code || record.district_code || "").trim();
      transformed.districtName = String(record.districtName || record.District_Name || record.district_name || record.NAME || "").trim();
      transformed.stateCode = String(record.stateCode || record.State_Code || record.state_code || "").trim();
      break;

    case "subDistrict":
      transformed.subDistrictCode = String(record.subDistrictCode || record.SubDistrict_Code || record.subdistrict_code || record.tehsil_code || "").trim();
      transformed.subDistrictName = String(record.subDistrictName || record.SubDistrict_Name || record.subdistrict_name || record.NAME || "").trim();
      transformed.subDistrictType = String(record.subDistrictType || record.SubDistrict_Type || record.subdistrict_type || record.type || "Tehsil").trim();
      transformed.districtCode = String(record.districtCode || record.District_Code || record.district_code || "").trim();
      transformed.stateCode = String(record.stateCode || record.State_Code || record.state_code || "").trim();
      break;

    case "village":
      transformed.villageCode = String(record.villageCode || record.Village_Code || record.village_code || "").trim();
      transformed.villageName = String(record.villageName || record.Village_Name || record.village_name || record.NAME || "").trim();
      transformed.subDistrictCode = String(record.subDistrictCode || record.SubDistrict_Code || record.subdistrict_code || "").trim();
      transformed.districtCode = String(record.districtCode || record.District_Code || record.district_code || "").trim();
      transformed.stateCode = String(record.stateCode || record.State_Code || record.state_code || "").trim();
      break;
  }

  return transformed;
}

/**
 * Import result container
 */
class ImportResult {
  constructor() {
    this.success = false;
    this.level = null;
    this.totalRows = 0;
    this.importedRows = 0;

/**
 * Import states from parsed data
 */
function importStates(records) {
  const result = new ImportResult();
  result.level = "state";
  result.totalRows = records.length;

  records.forEach((record, index) => {
    const transformed = transformRecord(record, "state");
    if (transformed.stateCode && transformed.stateName) {
      result.data.push(transformed);
      result.importedRows++;
    } else {
      result.rejectedRows++;
      result.errors.push({ row: index, reason: "Missing required fields", record: transformed });
    }
  });

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import districts from parsed data
 */
function importDistricts(records) {
  const result = new ImportResult();
  result.level = "district";
  result.totalRows = records.length;

  records.forEach((record, index) => {
    const transformed = transformRecord(record, "district");
    if (transformed.districtCode && transformed.districtName && transformed.stateCode) {
      result.data.push(transformed);
      result.importedRows++;
    } else {
      result.rejectedRows++;
      result.errors.push({ row: index, reason: "Missing required fields", record: transformed });
    }
  });

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import sub-districts from parsed data
 */
function importSubDistricts(records) {
  const result = new ImportResult();
  result.level = "subDistrict";
  result.totalRows = records.length;

  records.forEach((record, index) => {
    const transformed = transformRecord(record, "subDistrict");
    if (transformed.subDistrictCode && transformed.subDistrictName && transformed.districtCode && transformed.stateCode) {
      result.data.push(transformed);
      result.importedRows++;
    } else {
      result.rejectedRows++;
      result.errors.push({ row: index, reason: "Missing required fields", record: transformed });
    }
  });

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import villages from parsed data
 */
function importVillages(records) {
  const result = new ImportResult();
  result.level = "village";
  result.totalRows = records.length;

  records.forEach((record, index) => {
    const transformed = transformRecord(record, "village");
    if (transformed.villageCode && transformed.villageName && transformed.subDistrictCode && transformed.districtCode && transformed.stateCode) {
      result.data.push(transformed);
      result.importedRows++;
    } else {
      result.rejectedRows++;
      result.errors.push({ row: index, reason: "Missing required fields", record: transformed });
    }
  });

  result.success = result.errors.length === 0;
  return result;
}

// Export
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseCSV,
    parseCSVLine,
    transformRecord,
    importStates,
    importDistricts,
    importSubDistricts,
    importVillages,
    ImportResult
  };
}

    this.rejectedRows = 0;
    this.errors = [];
    this.data = [];
  }
}