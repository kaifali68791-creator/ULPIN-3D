/**
 * LGD Validator Tests
 * 
 * Tests the validation framework using TEST DATA ONLY.
 * 
 * IMPORTANT: This test file uses fabricated data.
 * It does NOT contain or test real LGD administrative data.
 */

"use strict";

/**
 * Run validation tests on test data
 */
function runValidatorTests() {
  let LGDValidator, ValidationResult;
  try {
    const validatorModule = require("../lgdValidator.js");
    LGDValidator = validatorModule.LGDValidator;
    ValidationResult = validatorModule.ValidationResult;
  } catch (e) {
    console.log("Running in browser mode - tests require Node.js module exports");
    return runBrowserTests();
  }

  const testResults = { passed: 0, failed: 0, tests: [] };
  const testData = require("./testLgdData.json");

  // Test 1: Valid state validation
  console.log("\n=== Test 1: Valid State Validation ===");
  const validator1 = new LGDValidator();
  const stateErrors = validator1.validateState(testData.states[0]);
  if (stateErrors.length === 0) {
    console.log("PASS: Valid state passes validation");
    testResults.passed++;
    testResults.tests.push({ name: "Valid State", status: "PASS" });
  } else {
    console.log("FAIL: Valid state failed validation", stateErrors);
    testResults.failed++;
    testResults.tests.push({ name: "Valid State", status: "FAIL", errors: stateErrors });
  }

  // Test 2: Missing stateCode should fail
  console.log("\n=== Test 2: Missing stateCode ===");
  const validator2 = new LGDValidator();
  const missingCodeErrors = validator2.validateState({ stateName: "Test" });
  const hasMissingCodeError = missingCodeErrors.some(e => e.errorCode === "MISSING_STATE_CODE");
  if (hasMissingCodeError) {
    console.log("PASS: Missing stateCode correctly detected");
    testResults.passed++;
    testResults.tests.push({ name: "Missing stateCode", status: "PASS" });
  } else {
    console.log("FAIL: Missing stateCode not detected", missingCodeErrors);
    testResults.failed++;
    testResults.tests.push({ name: "Missing stateCode", status: "FAIL" });
  }

  // Test 3: Invalid stateCode format should fail
  console.log("\n=== Test 3: Invalid stateCode Format ===");
  const validator3 = new LGDValidator();
  const invalidCodeErrors = validator3.validateState({ stateCode: "ABC", stateName: "Test" });
  const hasInvalidCodeError = invalidCodeErrors.some(e => e.errorCode === "INVALID_STATE_CODE");
  if (hasInvalidCodeError) {
    console.log("PASS: Invalid stateCode format correctly detected");
    testResults.passed++;
    testResults.tests.push({ name: "Invalid stateCode Format", status: "PASS" });
  } else {
    console.log("FAIL: Invalid stateCode format not detected", invalidCodeErrors);
    testResults.failed++;
    testResults.tests.push({ name: "Invalid stateCode Format", status: "FAIL" });
  }

  // Test 4: Duplicate stateCode should fail
  console.log("\n=== Test 4: Duplicate stateCode ===");
  const validator4 = new LGDValidator();
  validator4.validateState({ stateCode: "99", stateName: "First" });
  const dupErrors = validator4.validateState({ stateCode: "99", stateName: "Duplicate" });
  const hasDupError = dupErrors.some(e => e.errorCode === "DUPLICATE_STATE_CODE");
  if (hasDupError) {
    console.log("PASS: Duplicate stateCode correctly detected");
    testResults.passed++;
    testResults.tests.push({ name: "Duplicate stateCode", status: "PASS" });
  } else {
    console.log("FAIL: Duplicate stateCode not detected", dupErrors);
    testResults.failed++;
    testResults.tests.push({ name: "Duplicate stateCode", status: "FAIL" });
  }

  // Test 5: Valid district validation
  console.log("\n=== Test 5: Valid District Validation ===");
  const validator5 = new LGDValidator();
  const districtErrors = validator5.validateDistrict(testData.districts[0]);
  if (districtErrors.length === 0) {
    console.log("PASS: Valid district passes validation");
    testResults.passed++;
    testResults.tests.push({ name: "Valid District", status: "PASS" });
  } else {
    console.log("FAIL: Valid district failed validation", districtErrors);
    testResults.failed++;

  // Test 6: Missing district reference should fail
  console.log("\n=== Test 6: Missing District stateCode Reference ===");
  const validator6 = new LGDValidator();
  const missingRefErrors = validator6.validateDistrict({ districtCode: "901", districtName: "Test" });
  const hasMissingRefError = missingRefErrors.some(e => e.errorCode === "MISSING_STATE_REFERENCE");
  if (hasMissingRefError) {
    console.log("PASS: Missing stateCode reference correctly detected");
    testResults.passed++;
    testResults.tests.push({ name: "Missing District Reference", status: "PASS" });
  } else {
    console.log("FAIL: Missing stateCode reference not detected", missingRefErrors);
    testResults.failed++;
    testResults.tests.push({ name: "Missing District Reference", status: "FAIL" });
  }

  // Test 7: Valid village validation
  console.log("\n=== Test 7: Valid Village Validation ===");
  const validator7 = new LGDValidator();
  const villageErrors = validator7.validateVillage(testData.villages[0]);
  if (villageErrors.length === 0) {
    console.log("PASS: Valid village passes validation");
    testResults.passed++;
    testResults.tests.push({ name: "Valid Village", status: "PASS" });
  } else {
    console.log("FAIL: Valid village failed validation", villageErrors);
    testResults.failed++;
    testResults.tests.push({ name: "Valid Village", status: "FAIL", errors: villageErrors });
  }

  // Test 8: Missing village name should fail
  console.log("\n=== Test 8: Missing Village Name ===");
  const validator8 = new LGDValidator();
  const missingNameErrors = validator8.validateVillage({
    villageCode: "999901",
    subDistrictCode: "9001",
    districtCode: "901",
    stateCode: "99"
  });
  const hasMissingNameError = missingNameErrors.some(e => e.errorCode === "MISSING_VILLAGE_NAME");
  if (hasMissingNameError) {
    console.log("PASS: Missing villageName correctly detected");
    testResults.passed++;
    testResults.tests.push({ name: "Missing Village Name", status: "PASS" });
  } else {
    console.log("FAIL: Missing villageName not detected", missingNameErrors);
    testResults.failed++;
    testResults.tests.push({ name: "Missing Village Name", status: "FAIL" });
  }

  // Summary
  console.log("\n=== TEST SUMMARY ===");
  console.log("Total Tests: " + (testResults.passed + testResults.failed));
  console.log("Passed: " + testResults.passed);
  console.log("Failed: " + testResults.failed);
  console.log("All tests use fabricated TEST DATA only - NOT real LGD data");

  return testResults;
}

/**
 * Browser-compatible test runner (simplified)
 */
function runBrowserTests() {
  console.log("Browser test mode - simplified validation check");
  console.log("For full tests, run with Node.js: node js/admin/tests/testValidator.js");
  return { passed: 0, failed: 0, tests: [], note: "Use Node.js for full tests" };
}

// Run tests if executed directly
if (typeof require !== "undefined" && require.main === module) {
  runValidatorTests();
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runValidatorTests, runBrowserTests };
}

    testResults.tests.push({ name: "Valid District", status: "FAIL", errors: districtErrors });
  }