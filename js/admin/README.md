# LGD Administrative Data Framework

## IMPORTANT NOTICE

**Official LGD administrative data has NOT yet been imported.**

This framework is designed to import, validate, and manage real administrative
hierarchy data from the **Local Government Directory (LGD)** when a verified
bulk dataset is provided.

---

## Data Source

| Attribute | Value |
|-----------|-------|
| **Official Source** | Local Government Directory (LGD) |
| **Publisher** | Ministry of Panchayati Raj, Government of India |
| **URL** | https://lgdirectory.gov.in/ |
| **Maintained By** | National Informatics Centre (NIC) |
| **Collaboration** | Office of Registrar General of India (ORGI), MHA |

---

## Data NOT Used

| Source | Reason |
|--------|--------|
| Census 2011 | Historical data (15+ years old), not current administrative boundaries |
| GitHub mirrors | Not authoritative government sources |
| Third-party datasets | Cannot verify authenticity |
| Fabricated data | Strictly prohibited |

---

## Administrative Hierarchy

```
State (rajya)
  └── District (zilla)
        └── Sub-District / Tehsil / Taluk / Mandal
              └── Village (gaon)
```

---

## Required Fields

### State
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `stateCode` | string | LGD State Code | `"27"` |
| `stateName` | string | Official state name | `"Maharashtra"` |

### District
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `districtCode` | string | LGD District Code | `"517"` |
| `districtName` | string | Official district name | `"Pune"` |

### Sub-District
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `subDistrictCode` | string | LGD Sub-District Code | `"0403"` |
| `subDistrictName` | string | Official name | `"Haveli"` |
| `subDistrictType` | string | Type identifier | `"Tehsil"` |

### Village
| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `villageCode` | string | LGD Village Code | `"599803"` |
| `villageName` | string | Official village name | `"Shivapur"` |

---

## Code Preservation Rules

LGD codes MUST be preserved **exactly** as provided by the source.

**NEVER:**
- Truncate codes
- Hash or encrypt codes
- Convert to fixed-length values
- Pad artificially
- Rename or remap codes
- Mix with Census 2011 codes
- Generate replacement codes for missing values

---

## Framework Architecture

```
js/admin/
├── README.md                 # This documentation
├── lgdSchema.js              # Field definitions and validation rules
├── lgdValidator.js           # Data validation module
├── lgdImporter.js            # Data import/parse module
├── lgdHierarchy.js           # Hierarchy builder
├── lgdLoader.js              # Data loading with caching
├── tests/
│   ├── testValidator.js      # Validator unit tests
│   └── testLgdData.json      # TEST DATA ONLY - NOT REAL LGD DATA
└── data/
    ├── states.json           # To be populated with real LGD data
    ├── districts.json        # To be populated with real LGD data
    ├── subdistricts/
    │   └── subdistricts-{stateCode}.json
    └── villages/
        └── villages-{stateCode}-{districtCode}.json
```

---

## Validation Rules

### Required Fields
All fields listed above MUST be present and non-empty.

### Code Format Validation
- `stateCode`: 1-2 digits
- `districtCode`: 1-3 digits (varies by state)
- `subDistrictCode`: 1-4 digits (varies by district)
- `villageCode`: 1-6 digits (varies by sub-district)

### Uniqueness Constraints
- `stateCode` must be unique across all states
- `districtCode` must be unique within a state
- `subDistrictCode` must be unique within a district
- `villageCode` must be unique within a sub-district

### Hierarchy Integrity
- Every district must reference a valid stateCode
- Every sub-district must reference a valid districtCode
- Every village must reference a valid subDistrictCode

---

## Status: FRAMEWORK ONLY

**Current State:** Framework structure created, NO real LGD data imported.

**Next Steps:**
1. Obtain verified bulk LGD dataset from official source
2. Use `lgdImporter.js` to parse the dataset
3. Run `lgdValidator.js` to validate all records
4. Generate indexed JSON files in `data/` directories
5. Integrate with ULPIN generator (future step)

---

## Legal Notice

This framework uses LGD codes as mandated by the Cabinet Secretariat
letter dated 04th November 2016 for standardization of location codes
in e-Governance applications.

LGD is the authoritative source for administrative hierarchy data in India.
This framework does NOT claim to contain or generate official government ULPINs.
