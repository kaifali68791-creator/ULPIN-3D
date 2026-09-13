/* =====================================================================
   ULPIN 3D — Mock data (demo workspace)
   ---------------------------------------------------------------------
   Everything here is SAMPLE data for the hackathon UI. Replace each
   collection with live API responses in later phases.
   ===================================================================== */

"use strict";

// ---- Administrative hierarchy used by the ULPIN generator -------------
const ADMIN = [
  { name: "Maharashtra", code: "27", districts: [
      { name: "Pune", code: "06", tehsils: [
          { name: "Haveli", code: "03", villages: [
              { name: "Shivapur", code: "21" },
              { name: "Wadgaon", code: "27" }
          ]}
      ]}
  ]},
  { name: "Gujarat", code: "24", districts: [
      { name: "Ahmedabad", code: "07", tehsils: [
          { name: "Daskroi", code: "24", villages: [
              { name: "Transavad", code: "12" },
              { name: "Rampura", code: "08" }
          ]}
      ]}
  ]},
  { name: "Karnataka", code: "29", districts: [
      { name: "Bengaluru Urban", code: "54", tehsils: [
          { name: "Bengaluru East", code: "11", villages: [
              { name: "Doddakannelli", code: "33" },
              { name: "Varthur", code: "29" }
          ]}
      ]}
  ]},
  { name: "Telangana", code: "36", districts: [
      { name: "Hyderabad", code: "13", tehsils: [
          { name: "Secunderabad", code: "41", villages: [
              { name: "Begumpet", code: "08" },
              { name: "Ameerpet", code: "18" }
          ]}
      ]}
  ]},
  { name: "Rajasthan", code: "08", districts: [
      { name: "Jaipur", code: "25", tehsils: [
          { name: "Sanganer", code: "40", villages: [
              { name: "Goner", code: "31" },
              { name: "Bagru", code: "14" }
          ]}
      ]}
  ]}
];

const DEFAULT_ADMIN = {
  state: ADMIN[0],
  district: ADMIN[0].districts[0],
  tehsil: ADMIN[0].districts[0].tehsils[0],
  village: ADMIN[0].districts[0].tehsils[0].villages[0]
};

// ---- Extra helpers & vocabulary ----------------------------------------
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const USES = ["Residential", "Agricultural", "Commercial", "Institutional"];
const STATUSES = ["Titled", "Pending survey", "Disputed"];

// ---- Map geometry (760 x 460 viewBox) ----------------------------------
function geoAt(x, y) {
  // crude mock mapping canvas -> decimal degrees around Pune
  return { lat: +(18.5392 - (y / 460) * 0.0128).toFixed(6), lng: +(73.8123 + (x / 760) * 0.0224).toFixed(6) };
}

const PARCEL_RAW = [
  { id: "P-01", survey: "131/1", use: "Residential",    owner: "Suresh Kulkarni",          area: 452,  status: "Titled",          poly: "30,35 150,35 150,240 30,240" },
  { id: "P-02", survey: "131/2", use: "Residential",    owner: "Meena Patil",              area: 388,  status: "Titled",          poly: "160,35 266,35 266,240 160,240" },
  { id: "P-03", survey: "127/3", use: "Agricultural",   owner: "Maruti Pawar",             area: 980,  status: "Titled",          poly: "292,35 432,35 432,240 292,240" },
  { id: "P-04", survey: "129/1", use: "Institutional",  owner: "Shivapur Gram Panchayat",  area: 410,  status: "Titled",          poly: "442,35 582,35 582,137 442,137" },
  { id: "P-05", survey: "129/2", use: "Residential",    owner: "Vidya Shinde",             area: 335,  status: "Disputed",        poly: "442,147 582,147 582,240 442,240" },
  { id: "P-06", survey: "128/6", use: "Agricultural",   owner: "Rekha Bansode",            area: 1120, status: "Pending survey", poly: "592,35 730,35 730,240 592,240" },
  { id: "P-07", survey: "132/1", use: "Residential",    owner: "Rahul Deshmukh",           area: 421,  status: "Titled",          poly: "30,270 135,270 135,430 30,430" },
  { id: "P-08", survey: "132/2", use: "Residential",    owner: "Anita Joshi",              area: 396,  status: "Titled",          poly: "145,270 260,270 260,430 145,430" },
  { id: "P-09", survey: "121/3", use: "Residential",    owner: "Krishna Constructions",    area: 640,  status: "Titled",          poly: "292,270 440,270 440,430 292,430" },
  { id: "P-10", survey: "134/1", use: "Commercial",     owner: "Green Valley Developers",  area: 512,  status: "Pending survey", poly: "450,270 580,270 580,430 450,430" },
  { id: "P-11", survey: "134/2", use: "Commercial",     owner: "Sakshi Naik",              area: 468,  status: "Titled",          poly: "590,270 730,270 730,430 590,430" }
];

function buildParcels() {
  return PARCEL_RAW.map((p) => {
    const pts = p.poly.split(" ").map((t) => {
      const [x, y] = t.split(",").map(Number);
      const c = geoAt(x, y);
      return { x, y, lat: c.lat, lng: c.lng };
    });
    return {
      ...p,
      pts,
      cx: pts.reduce((s, pt) => s + pt.x, 0) / pts.length,
      cy: pts.reduce((s, pt) => s + pt.y, 0) / pts.length,
      lat: pts[0].lat, lng: pts[0].lng,
      ulpin: null
    };
  });
}
const PARCELS = buildParcels();

// ---- 26-char ULPIN builder (SIMULATED format for the demo) -------------
function encodeGeo(lat, lng) {
  const b36 = (n) => Math.abs(Math.round(n * 100000)).toString(36).toUpperCase().padStart(5, "0").slice(-5);
  const a = b36(lat), b = b36(lng);
  let cs = "";
  for (let i = 0; i < 4; i++) {
    const c = ((a.charCodeAt(i) || 48) + (b.charCodeAt(i) || 48)) % 36;
    cs += (c < 10 ? String(c) : String.fromCharCode(65 + (c - 10)));
  }
  return (a + b + cs).toUpperCase();
}

function genUlpin(parcel, admin) {
  const st = admin.state.code, dt = admin.district.code, th = admin.tehsil.code, vg = admin.village.code;
  const survey = parcel.survey.replace(/\D/g, "").padStart(4, "0").slice(-4);
  const geo = encodeGeo(parcel.lat, parcel.lng).slice(0, 14);
  return (st + dt + th + vg + survey + geo).toUpperCase();
}

function ulpinParts(ulpin) {
  if (!ulpin || ulpin.length !== 26) return null;
  return [
    { label: "STATE", value: ulpin.slice(0, 2) },
    { label: "DISTRICT", value: ulpin.slice(2, 4) },
    { label: "TEHSIL", value: ulpin.slice(4, 6) },
    { label: "VILLAGE", value: ulpin.slice(6, 8) },
    { label: "PARCEL", value: ulpin.slice(8, 12) },
    { label: "GEO", value: ulpin.slice(12, 26) }
  ];
}

// ---- Roads / streams for the demo map ----------------------------------
const MAP_ROADS = [
  { d: "M0,257 L760,257", cls: "road" },
  { d: "M266,0 L266,460", cls: "road" }
];
const STREAMS = [
  { d: "M490,20 C610,44 690,64 740,98", cls: "stream" }
];

// ---- Buildings + floor plans -------------------------------------------
const BUILDING_DEFS = [
  { id: "B-001", name: "Vertex Heights",   parcelId: "P-09", addr: "Rajnagar Layout, Shivapur",      year: 2019, floors: ["B2", "B1", "G", "F1", "F2", "F3", "F4", "F5", "F6"], typeMap: { B2: "parking", B1: "utility", G: "retail" } },
  { id: "B-002", name: "Sai Residency",    parcelId: "P-10", addr: "Market Road, Shivapur",           year: 2017, floors: ["B1", "G", "F1", "F2", "F3"], typeMap: { B1: "parking", G: "retail" } },
  { id: "B-003", name: "Lakeview Enclave", parcelId: "P-01", addr: "Old Village Lane, Shivapur",      year: 2015, floors: ["G", "F1", "F2"], typeMap: { G: "retail" } },
  { id: "B-004", name: "Market Complex",   parcelId: "P-11", addr: "Market Road, Shivapur",           year: 2012, floors: ["G", "F1", "F2"], typeMap: {} },
  { id: "B-005", name: "Green Meadows",    parcelId: "P-07", addr: "Green Park, Shivapur",            year: 2021, floors: ["B1", "G", "F1", "F2", "F3", "F4"], typeMap: { B1: "parking", G: "retail" } },
  { id: "B-006", name: "Ashraya Heights",  parcelId: "P-08", addr: "Temple Street, Shivapur",         year: 2014, floors: ["G", "F1", "F2"], typeMap: { G: "parking" } },
  { id: "B-007", name: "Zilla Parishad School Block", parcelId: "P-04", addr: "School Compound, Shivapur", year: 2009, floors: ["G", "F1", "F2"], typeMap: {} },
  { id: "B-008", name: "Sunrise Towers",   parcelId: "P-02", addr: "Station Road, Shivapur",          year: 2022, floors: ["B1", "G", "F1", "F2", "F3", "F4", "F5", "F6"], typeMap: { B1: "parking", G: "retail" } }
];

const UNIT_STATUS = ["Occupied", "Vacant", "Under registration", "Occupied", "Vacant", "Disputed"];
const RES_TYPES = ["2 BHK", "2 BHK", "3 BHK", "3 BHK"];

function floorType(b, floor) {
  if (b.typeMap[floor]) return b.typeMap[floor];
  if (floor[0] === "B") return "parking";
  if (floor === "G") return floor === "G" && (b.id === "B-007") ? "institutional" : "retail";
  if (b.id === "B-007") return "institutional";
  return "residential";
}

function makeUnits(building, floor, ft) {
  const units = [];
  if (ft === "parking") {
    const slots = building.id === "B-001" ? 12 : 6;
    for (let i = 1; i <= slots; i++) { units.push({ no: "P" + String(i).padStart(2, "0"), type: "Parking slot", area: 148, status: pick(["Occupied", "Vacant", "Occupied"]) }); }
  } else if (ft === "utility") {
    ["Store A", "Store B", "Plant", "Lift"].forEach((n) => units.push({ no: n, type: "Utility", area: 120, status: "Vacant" }));
  } else if (ft === "retail") {
    ["Shop 1", "Shop 2"].forEach((n) => units.push({ no: n, type: "Retail", area: 760, status: pick(UNIT_STATUS.slice(0, 3)) }));
  } else if (ft === "institutional") {
    ["Room A", "Room B", "Hall"].forEach((n) => units.push({ no: n, type: "Classroom", area: 520, status: "Occupied" }));
  } else {
    ["A", "B", "C", "D"].forEach((s, i) => units.push({ no: s, type: "Flat", area: RES_TYPES[i].startsWith("2") ? 850 : 1120, status: pick(UNIT_STATUS) }));
  }
  return units;
}

function buildBuildings() {
  return BUILDING_DEFS.map((b) => {
    const parcel = PARCELS.find((p) => p.id === b.parcelId);
    const floors = b.floors.map((fl) => {
      const ft = floorType(b, fl);
      return { id: fl, name: fl, type: ft, units: makeUnits(b, fl, ft), unitsCount: ft === "residential" ? 4 : makeUnits(b, fl, ft).length };
    });
    const totalUnits = floors.reduce((s, f) => s + f.units.length, 0);
    const occ = Math.round(floors.flatMap((f) => f.units).filter((u) => u.status === "Occupied").length / totalUnits * 100);
    return { ...b, parcel, floors, totalUnits, occupancy: occ };
  });
}
const BUILDINGS = buildBuildings();
const ALL_UNITS = BUILDINGS.flatMap((b) => b.floors.flatMap((f) => f.units.map((u) => ({ ...u, building: b, floor: f }))));

// ---- Underground assets -------------------------------------------------
const UNDERGROUND = [
  { id: "UG-01", cat: "water",  name: "Drinking water main",  depth: "1.2 m",  dia: "200 mm",  operator: "Pune Municipal Corp.", status: "Active" },
  { id: "UG-02", cat: "sewer",  name: "Sewer trunk line",     depth: "2.4 m",  dia: "450 mm",  operator: "PMC Sewerage",       status: "Active" },
  { id: "UG-03", cat: "gas",    name: "Natural gas pipeline", depth: "1.5 m",  dia: "150 mm",  operator: "Mahanagar Gas",       status: "Active" },
  { id: "UG-04", cat: "power",  name: "HV power duct (11 kV)",depth: "2.8 m",  dia: "3 x 100", operator: "MSEDCL",              status: "Active" },
  { id: "UG-05", cat: "power",  name: "LV distribution line", depth: "0.9 m",  dia: "240 mm2", operator: "MSEDCL",              status: "Active" },
  { id: "UG-06", cat: "fiber",  name: "Optical fibre trunk",  depth: "0.8 m",  dia: "48 core", operator: "RailTel / ISP",       status: "Active" },
  { id: "UG-07", cat: "sewer",  name: "Storm water drain",    depth: "3.1 m",  dia: "600 mm",  operator: "PMC Stormwater",     status: "Mapped" },
  { id: "UG-08", cat: "water",  name: "Irrigation canal line",depth: "0.6 m",  dia: "300 mm",  operator: "Irrigation Dept.",   status: "Mapped" }
];

// ---- MUST-FIX #2 (additive): expose the already-existing demo arrays on window ----
// The AI module (js/aiAssistant.js) reads window.PARCELS / window.BUILDINGS /
// window.UNDERGROUND. Top-level `const` does not attach to window, so these three
// additive assignments make the SAME existing constants visible. No data is changed.
window.PARCELS = PARCELS;
window.BUILDINGS = BUILDINGS;
window.UNDERGROUND = UNDERGROUND;

// ---- Air-rights sample records ------------------------------------------
const AIR_RECORDS = [
  { id: "AR-01", holder: "Sun Telecom Ltd",       height: "12 – 60 m",   purpose: "Tower mast volume",  parcel: "P-09", status: "Granted" },
  { id: "AR-02", holder: "Govt. of Maharashtra",  height: "60 – 120 m",  purpose: "Drone corridor",     parcel: "P-03", status: "Reserved" },
  { id: "AR-03", holder: "Krishna Constructions", height: "0 – 45 m",    purpose: "FSI bank / future",  parcel: "P-09", status: "Pending" }
];

// ---- AI / ML planned modules ---------------------------------------------
const AI_MODULES = [
  { icon: "scan",   color: "blue",  name: "Parcel boundary detection",    desc: "HR satellite imagery + cadastral overlay to auto-digitise boundaries" },
  { icon: "box",    color: "vio",   name: "Roof & floor segmenter",       desc: "LiDAR point-cloud classification of roof planes and floor slabs" },
  { icon: "pulse",  color: "teal",  name: "Change detection",             desc: "Alerts on unauthorised construction or land-use violations" },
  { icon: "doc",    color: "amber", name: "Mutation OCR engine",          desc: "RoR / mutation documents read and cross-checked against maps" },
  { icon: "cube",   color: "blue",  name: "3D volumetric reconstruction", desc: "Structure-from-motion over drone imagery for LoD-2 models" },
  { icon: "tag",    color: "vio",   name: "Transaction price estimator",  desc: "ML valuation model grounded on ULPIN-linked transactions" }
];

// ---- Data source feed list ------------------------------------------------
const DATA_SOURCES = [
  { name: "DILRMP — Records of Rights", type: "API · National Informatics Centre", freq: "Real-time",  icon: "db",      chip: "Live",    chipCls: "ok",   last: "Synced 5 min ago" },
  { name: "Bhunaksha cadastral tiles",  type: "Raster / vector tiles",              freq: "Daily",      icon: "map",     chip: "Live",    chipCls: "ok",   last: "Synced 1 hr ago" },
  { name: "GNSS / CORS base stations",  type: "RTCM-3 streams · CORS Pune-08",      freq: "Continuous", icon: "pin",     chip: "Live",    chipCls: "ok",   last: "10 sats · RTK fix" },
  { name: "LiDAR / drone orthophotos",  type: "GeoTIFF · cm-level resolution",      freq: "Quarterly",  icon: "camera",  chip: "Sample",  chipCls: "warn", last: "Survey Jul 2026" },
  { name: "Property tax (ULC) export",  type: "DB export · ULC code ≥ 6 digits",    freq: "Weekly",     icon: "doc",     chip: "Sample",  chipCls: "warn", last: "Synced 2 days ago" },
  { name: "Survey of India DTMs",       type: "SRTM 1″ / Cartosat DEM",             freq: "As needed",  icon: "layers",  chip: "Sample",  chipCls: "warn", last: "Base map v2.1" },
  { name: "Field survey app (mobile)",  type: "PostGIS sync · surveyor crews",      freq: "Real-time",  icon: "smart",   chip: "Planned", chipCls: "warn", last: "Phase 2 onboarding" }
];

// ---- Activity timeline ----------------------------------------------------
const ACTIVITY = [
  { icon: "hash",  color: "blue",  text: "ULPIN generated for <b>131/2</b> (Meena Patil) and attached to its units.", time: "Today · 09:42" },
  { icon: "cube",  color: "vio",   text: "3D model rebuilt for <b>Vertex Heights</b> after drone revisit.",             time: "Today · 08:15" },
  { icon: "pulse", color: "teal",  text: "Change detection flagged new construction near <b>survey 128/6</b>.",        time: "Yesterday · 17:30" },
  { icon: "pin",   color: "amber", text: "RTK boundary survey uploaded for <b>Green Meadows</b> parcel.",               time: "Yesterday · 11:05" },
  { icon: "doc",   color: "blue",  text: "Mutation 2026/118 OCR-verified against RoR for village <b>Shivapur</b>.",     time: "2 days ago" }
];

// ---- ULPIN issuance trend (monthly, mock) --------------------------------
const ULPIN_TREND = [
  { m: "Oct", v: 182 }, { m: "Nov", v: 214 }, { m: "Dec", v: 198 },
  { m: "Jan", v: 241 }, { m: "Feb", v: 268 }, { m: "Mar", v: 305 },
  { m: "Apr", v: 296 }, { m: "May", v: 352 }
];