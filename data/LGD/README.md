# Local Government Directory (LGD) — Administrative Hierarchy Datasets

## Source
- **Platform:** Government Open Data Platform (data.gov.in)
- **Dataset:** Local Government Directory (LGD)
- **Publisher:** Ministry of Panchayati Raj, Government of India

## Description
These datasets represent the **administrative hierarchy** of India — States/UTs, Districts, and Sub-Districts (Tehsils/Blocks) — as defined in the Local Government Directory.

## Contents
| File | Description | Records |
|------|-------------|---------|
| `1-state.csv` | States and Union Territories | 36 |
| `2-district.csv` | Districts | 763 |
| `3-subdistrict.csv` | Sub-Districts (Tehsils/Blocks) | 6,921 |

## Important Disclaimers
- These datasets represent **administrative hierarchy only**.
- They do **NOT** represent:
  - Cadastral parcel boundaries
  - Land ownership records
  - Record of Rights (RoR)
  - Survey ownership data
  - Official ULPIN (Unique Land Parcel Identification Number)
- The **village dataset has NOT been added yet**.
- Village-level data is **not** currently available locally.
- Do **not** claim that all village data is currently available locally.

## Data Integrity Rules
- All administrative codes are stored and must be treated as **strings**.
- Leading zeroes in codes (e.g., Census 2001/2011 codes) are preserved.
- Codes are never truncated, hashed, or converted to numeric values.
- Original CSV values are preserved exactly as published by the source.

## Column Reference

### States (`1-state.csv`)
- `S.No.` — Serial number
- `State Code` — LGD state code (string)
- `State Version` — Version identifier
- `State Name` — State name in English (first occurrence)
- `State Name` — State name in local language (second occurrence; may match English)
- `Census 2001 Code` — Census 2001 code
- `Census 2011 Code` — Census 2011 code (string, preserve leading zeroes)
- `State or UT` — S = State, U = Union Territory

### Districts (`2-district.csv`)
- `State Code` — LGD state code (string, references States)
- `State Name` — State name in English
- `District Code` — LGD district code (string)
- `District Name` — District name in English
- `Census 2001 Code` — Census 2001 code
- `Census 2011 Code` — Census 2011 code (string)

### Sub-Districts (`3-subdistrict.csv`)
- `S.No.` — Serial number
- `State Code` — LGD state code (string, references States)
- `State Name` — State name in English
- `District Code` — LGD district code (string, references Districts)
- `District Name` — District name in English
- `Sub-district Code` — LGD sub-district code (string)
- `Sub-district Version` — Version identifier
- `Sub-district Name` — Sub-district name in English
- `Census 2001 code` — Census 2001 code (string)
- `Census 2011 code` — Census 2011 code (string, preserve leading zeroes)

## Notes
- These files are an **isolated data foundation**.
- They are **not connected** to the website UI or ULPIN generation yet.
- Any future integration must respect data integrity rules and disclaimers above.
