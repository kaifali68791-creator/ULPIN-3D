#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const LGD_DIR = path.join(__dirname);

const FILES = { states: '1-state.csv', districts: '2-district.csv', subdistricts: '3-subdistrict.csv' };

const EXPECTED = {
  states: ['S.No.','State Code','State Version','State Name','State Name','Census 2001 Code','Census 2011 Code','State or UT'],
  districts: ['State Code','State Name','District Code','District Name','Census 2001 Code','Census 2011 Code'],
  subdistricts: ['S.No.','State Code','State Name','District Code','District Name','Sub-district Code','Sub-district Version','Sub-district Name','Census 2001 code','Census 2011 code']
};

const results = { passed: 0, failed: 0, errors: [] };

function check(cond, msg) {
  if (cond) { results.passed++; console.log('  OK  ' + msg); }
  else { results.failed++; results.errors.push(msg); console.log('  FAIL ' + msg); }
}

function parseLine(line) {
  const fields = [];
  let cur = '', q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === ',' && !q) { fields.push(cur); cur = ''; }
    else cur += ch;
  }
  fields.push(cur);
  return fields.map(f => f.replace(/^"|"$/g, ''));
}

function readCSV(file) {
  const content = fs.readFileSync(path.join(LGD_DIR, file), 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  const header = parseLine(lines[0]);
  const records = [];
  for (let i = 1; i < lines.length; i++) records.push(parseLine(lines[i]));
  return { header, records };
}

console.log('LGD Data Validator (Read-Only)');
console.log('==============================');
console.log('');

// 1. File existence
console.log('[1] File existence');
const data = {};
for (const [key, file] of Object.entries(FILES)) {
  const exists = fs.existsSync(path.join(LGD_DIR, file));
  check(exists, file + ' exists');
  if (exists) {
    const d = readCSV(file);
    data[key] = d;
    console.log('      Size: ' + (fs.statSync(path.join(LGD_DIR, file)).size / 1024).toFixed(1) + ' KB');
  }
}
console.log('');

// 2. Header validation
console.log('[2] Header validation');
for (const key of Object.keys(data)) {
  const expected = EXPECTED[key];
  const actual = data[key].header;
  const match = expected.length === actual.length && expected.every((v, i) => v === actual[i]);
  check(match, key + ' header matches official format');
  if (!match) {
    console.log('      Expected: ' + expected.join(', '));
    console.log('      Actual:   ' + actual.join(', '));
  }
}
console.log('');

// 3. Record counts
console.log('[3] Record counts');
for (const key of Object.keys(data)) {
  check(data[key].records.length > 0, key + ': ' + data[key].records.length + ' records');
}
console.log('');

// 4. Duplicate codes
console.log('[4] Duplicate code check');
if (data.states) {
  const codes = data.states.records.map(r => r[1]);
  const dupes = codes.length - new Set(codes).size;
  check(dupes === 0, 'State codes: ' + new Set(codes).size + ' unique, ' + dupes + ' dupes');
}
if (data.districts) {
  const codes = data.districts.records.map(r => r[2]);
  const dupes = codes.length - new Set(codes).size;
  check(dupes === 0, 'District codes: ' + new Set(codes).size + ' unique, ' + dupes + ' dupes');
}
if (data.subdistricts) {
  const codes = data.subdistricts.records.map(r => r[5]);
  const dupes = codes.length - new Set(codes).size;
  check(dupes === 0, 'Sub-district codes: ' + new Set(codes).size + ' unique, ' + dupes + ' dupes');
}
console.log('');

// 5. Referential integrity
console.log('[5] Referential integrity');
if (data.states && data.districts) {
  const stateCodes = new Set(data.states.records.map(r => r[1]));
  const missing = [...new Set(data.districts.records.map(r => r[0]).filter(c => !stateCodes.has(c)))];
  check(missing.length === 0, 'District->State refs valid (' + missing.length + ' broken)');
  if (missing.length) console.log('      Missing state codes: ' + missing.join(', '));
}
if (data.districts && data.subdistricts) {
  const distCodes = new Set(data.districts.records.map(r => r[2]));
  const missing = [...new Set(data.subdistricts.records.map(r => r[3]).filter(c => !distCodes.has(c)))];
  check(missing.length === 0, 'Sub-district->District refs valid (' + missing.length + ' broken)');
  if (missing.length) console.log('      Missing district codes: ' + missing.join(', '));
}
console.log('');

// 6. Leading zero check
console.log('[6] Leading zero preservation');
if (data.states) {
  const codes = data.states.records.map(r => r[6]);
  const withZero = codes.filter(c => c && c.startsWith('0')).length;
  console.log('  State Census 2011 codes with leading zero: ' + withZero);
}
if (data.subdistricts) {
  const codes = data.subdistricts.records.map(r => r[9]);
  const withZero = codes.filter(c => c && c.startsWith('0')).length;
  console.log('  Sub-district Census 2011 codes with leading zero: ' + withZero);
}
console.log('');

// Summary
console.log('==============================');
console.log('Passed: ' + results.passed + ' | Failed: ' + results.failed);
if (results.errors.length) {
  console.log('ERRORS:');
  results.errors.forEach(e => console.log('  - ' + e));
  process.exit(1);
} else {
  console.log('VALIDATION PASSED');
  process.exit(0);
}
