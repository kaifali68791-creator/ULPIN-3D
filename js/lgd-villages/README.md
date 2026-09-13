# LGD Village Data (lazy per-state chunks)

AUTO-GENERATED - DO NOT EDIT these files directly. Regenerate with:

```
python _gen_lgd_villages.py [path-to-zip-or-csv]
```

## Source
- **Dataset:** `list-of-states-districts-sub-districts-and-villages-along-with-their-lgd-codes-as-of-2-july-2026.csv`
- **Snapshot date:** 2026-07-02
- **Publisher:** Ministry of Panchayati Raj / Local Government Directory (data.gov.in)

## Content
Each `villages-<stateCode>.js` registers `window.LGD_VILLAGE_INDEX["<stateCode>"]`
as a map of `"<districtCode>:<subDistrictCode>"` -> `[["<villageCode>","<villageName>"], ...]`.

Uploaded dataset: 676891 village rows | 7073 sub-districts | 781 districts | 35 state codes

Compatibility with the current `js/lgd-data.js` hierarchy (exact string match):
- matched parents (villages attached): 6188 (629002 villages)
- uploaded-only parents (ISOLATED, NOT attached, never merged): 885 (47889 villages)
- current-only tehsils (keep SAMPLE fallback): 733

All codes are kept as STRINGS (leading zeroes preserved). LGD codes are never truncated,
hashed, padded or converted. The RULPIN generated from a real village is a PROTOTYPE
identifier - NOT an official government-issued ULPIN.

## Files
| File | State | Parent tehsils | Villages |
|------|-------|----------------|----------|
| `villages-1.js` | JAMMU AND KASHMIR | 202 | 6735 |
| `villages-10.js` | BIHAR | 534 | 48833 |
| `villages-11.js` | SIKKIM | 12 | 314 |
| `villages-12.js` | ARUNACHAL PRADESH | 202 | 5242 |
| `villages-13.js` | NAGALAND | 101 | 1240 |
| `villages-14.js` | MANIPUR | 65 | 3850 |
| `villages-15.js` | MIZORAM | 26 | 836 |
| `villages-16.js` | TRIPURA | 23 | 898 |
| `villages-17.js` | MEGHALAYA | 44 | 6237 |
| `villages-18.js` | ASSAM | 152 | 28172 |
| `villages-19.js` | WEST BENGAL | 345 | 41005 |
| `villages-2.js` | HIMACHAL PRADESH | 177 | 20781 |
| `villages-20.js` | JHARKHAND | 263 | 32737 |
| `villages-21.js` | ODISHA | 256 | 42902 |
| `villages-22.js` | CHHATTISGARH | 135 | 12833 |
| `villages-23.js` | MADHYA PRADESH | 416 | 54064 |
| `villages-24.js` | GUJARAT | 263 | 17919 |
| `villages-27.js` | MAHARASHTRA | 355 | 44770 |
| `villages-28.js` | ANDHRA PRADESH | 325 | 7384 |
| `villages-29.js` | KARNATAKA | 230 | 30213 |
| `villages-3.js` | PUNJAB | 92 | 12472 |
| `villages-30.js` | GOA | 8 | 324 |
| `villages-31.js` | LAKSHADWEEP | 10 | 27 |
| `villages-32.js` | KERALA | 78 | 1666 |
| `villages-33.js` | TAMIL NADU | 313 | 18504 |
| `villages-34.js` | PUDUCHERRY | 6 | 118 |
| `villages-35.js` | ANDAMAN AND NICOBAR ISLANDS | 9 | 559 |
| `villages-36.js` | TELANGANA | 585 | 10960 |
| `villages-37.js` | LADAKH | 12 | 196 |
| `villages-38.js` | THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU | 3 | 101 |
| `villages-4.js` | CHANDIGARH | 0 | 0 |
| `villages-5.js` | UTTARAKHAND | 128 | 17327 |
| `villages-6.js` | HARYANA | 139 | 6993 |
| `villages-7.js` | DELHI | 10 | 77 |
| `villages-8.js` | RAJASTHAN | 319 | 42405 |
| `villages-9.js` | UTTAR PRADESH | 350 | 110308 |
