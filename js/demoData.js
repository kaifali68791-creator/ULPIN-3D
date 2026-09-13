/* =====================================================================
   DEMO - centralized All-India mock data layer for the ULPIN 3D demo.
   Single source of truth for demo properties / floors / units /
   underground infra / air rights / GNSS stations + query helpers.
   Seeded (deterministic). Replace this module with real APIs later;
   the UI only consumes the exported functions. ALL DATA SIMULATED.
   ===================================================================== */
"use strict";

const DEMO = (function () {
  /* deterministic RNG (mulberry32) */
  let _s = 20260904;
  function rnd() { _s |= 0; _s = _s + 0x6D2B79F5 | 0; let t = Math.imul(_s ^ _s >>> 15, 1 | _s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function pick(a) { return a[Math.floor(rnd() * a.length)]; }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }

  /* [city, state, stateCode, district, lat, lng, elevM] */
  const CITIES = [
    ["New Delhi", "Delhi", "DEL", "South West Delhi", 28.5600, 77.1600, 216],
    ["Mumbai", "Maharashtra", "MH", "Mumbai Suburban", 19.0596, 72.8295, 14],
    ["Pune", "Maharashtra", "MH", "Pune", 18.5074, 73.8077, 560],
    ["Nagpur", "Maharashtra", "MH", "Nagpur", 21.1458, 79.0882, 310],
    ["Bengaluru", "Karnataka", "KA", "Bengaluru Urban", 12.9784, 77.6408, 920],
    ["Hyderabad", "Telangana", "TG", "Hyderabad", 17.4126, 78.4392, 542],
    ["Chennai", "Tamil Nadu", "TN", "Chennai", 13.0418, 80.2341, 6],
    ["Kolkata", "West Bengal", "WB", "Kolkata", 22.5726, 88.3639, 9],
    ["Ahmedabad", "Gujarat", "GJ", "Ahmedabad", 23.0225, 72.5714, 53],
    ["Surat", "Gujarat", "GJ", "Surat", 21.1702, 72.8311, 13],
    ["Jaipur", "Rajasthan", "RJ", "Jaipur", 26.8567, 75.8141, 431],
    ["Lucknow", "Uttar Pradesh", "UP", "Lucknow", 26.8500, 81.0080, 123],
    ["Noida", "Uttar Pradesh", "UP", "Gautam Buddha Nagar", 28.5355, 77.3910, 200],
    ["Varanasi", "Uttar Pradesh", "UP", "Varanasi", 25.3176, 82.9739, 81],
    ["Ghaziabad", "Uttar Pradesh", "UP", "Ghaziabad", 28.6692, 77.4538, 214],
    ["Patna", "Bihar", "BR", "Patna", 25.6165, 85.1370, 53],
    ["Ranchi", "Jharkhand", "JH", "Ranchi", 23.3441, 85.3096, 651],
    ["Bhopal", "Madhya Pradesh", "MP", "Bhopal", 23.2599, 77.4126, 527],
    ["Indore", "Madhya Pradesh", "MP", "Indore", 22.7196, 75.8577, 553],
    ["Chandigarh", "Chandigarh", "CHD", "Chandigarh", 30.7333, 76.7794, 321],
    ["Guwahati", "Assam", "AS", "Kamrup", 26.1445, 91.7362, 55],
    ["Bhubaneswar", "Odisha", "OD", "Khordha", 20.2961, 85.8245, 45],
    ["Kochi", "Kerala", "KL", "Ernakulam", 9.9312, 76.2673, 0],
    ["Thiruvananthapuram", "Kerala", "KL", "Thiruvananthapuram", 8.5241, 76.9366, 5],
    ["Dehradun", "Uttarakhand", "UK", "Dehradun", 30.3165, 78.0322, 640],
    ["Gurugram", "Haryana", "HR", "Gurugram", 28.4595, 77.0266, 217]
  ];

  const LOCALITIES = ["Model Town", "Gandhi Nagar", "Civil Lines", "Rajendra Nagar", "Vidya Vihar", "Ashok Nagar", "Kalyani Nagar", "Shastri Nagar", "Sarojini Colony", "Nehru Gardens", "Tagore Marg", "Subhash Chowk", "Azad Layout", "Patel Nagar", "Laxmi Vihar", "Rani Bagh", "Jawahar Puram", "Tilak Marg", "Bapu Bazaar", "Indira Awas"];
  const FIRST = ["Rajesh", "Anita", "Suresh", "Meena", "Vikram", "Poonam", "Arjun", "Deepak", "Kavita", "Ramesh", "Sunita", "Amit", "Priya", "Sanjay", "Neha", "Manoj", "Rekha", "Vijay", "Farhan", "Lakshmi", "Karthik", "Gurpreet", "Mohd. Asif", "Debasis", "Nirmala", "Tenzin"];
  const LAST = ["Kumar", "Sharma", "Patel", "Reddy", "Iyer", "Singh", "Das", "Mishra", "Verma", "Joshi", "Kulkarni", "Deshpande", "Nair", "Menon", "Bose", "Chatterjee", "Yadav", "Gupta", "Mehta", "Shah", "Kaur", "Khan", "Pillai", "Rao", "Saikia", "Mahato"];
  const LANDUSE = ["Residential", "Commercial", "Agricultural", "Mixed Use", "Public"];
  const OWNERSHIP = ["Freehold", "Leasehold", "Government Lease", "Joint Ownership"];
  const UNIT_USE = ["Residential", "Retail", "Office", "Storage", "Parking", "Clinic"];

  const usedUlp = {};
  function mkUlpin(code) { let n; do { n = ri(100000, 999999); } while (usedUlp[code + n]); usedUlp[code + n] = 1; return "ULPIN-IN-DEMO-" + code + "-" + n; }

  function parcelPolygon(lat, lng, sizeM, rot) {
    const KX = 111320 * Math.cos(lat * Math.PI / 180), KY = 110540, r = sizeM / 2, pts = [];
    for (let i = 0; i < 4; i++) {
      const a = rot + i * Math.PI / 2;
      const x = Math.cos(a) * r * (i % 2 ? 1.22 : 1), y = Math.sin(a) * r;
      pts.push([+(lat + y / KY).toFixed(6), +(lng + x / KX).toFixed(6)]);
    }
    return pts;
  }

  /* ---------- generate properties across all cities ---------- */
  const properties = [];
  (function generate() {
    CITIES.forEach(function (C) {
      const count = 4 + ri(0, 1);
      for (let k = 0; k < count; k++) {
        const city = C[0], state = C[1], code = C[2], district = C[3];
        const landUse = pick(LANDUSE);
        const ptype = landUse === "Public" ? "Institutional" : (landUse === "Agricultural" ? "Agricultural" : (landUse === "Mixed Use" ? "Mixed Use" : (rnd() > 0.5 ? "Residential" : "Commercial")));
        const floors = ptype === "Agricultural" ? 0 : ri(1, 12);
        const landSqft = ri(12, 90) * 100;
        const unitsPer = floors ? ri(1, 4) : 0;
        const units = floors * unitsPer;
        const builtUp = floors ? Math.round(landSqft * (0.85 + floors * 0.5)) : 0;
        const seq = properties.length + 1;
        const ulpin = mkUlpin(code);
        const lat = +(C[4] + (rnd() - 0.5) * 0.036).toFixed(6);
        const lng = +(C[5] + (rnd() - 0.5) * 0.036).toFixed(6);
        const owner = pick(FIRST) + " " + pick(LAST);

        const floorsArr = [];
        for (let f = 0; f < floors; f++) {
          const fu = [];
          for (let u = 0; u < unitsPer; u++) {
            fu.push({
              id: (f === 0 ? "G" : "F" + f) + "-0" + (u + 1),
              area: ri(320, 1450) + " sq.ft.",
              use: landUse === "Mixed Use" ? pick(UNIT_USE) : (ptype === "Commercial" ? pick(["Retail", "Office", "Storage"]) : "Residential"),
              owner: rnd() > 0.62 ? pick(FIRST) + " " + pick(LAST) : owner,
              elevBase: +(f * 3.2).toFixed(1),
              elevTop: +((f + 1) * 3.2).toFixed(1),
              vId: ulpin + "-F" + String(f).padStart(2, "0") + "-U" + String(u + 1).padStart(2, "0")
            });
          }
          floorsArr.push({
            id: "F" + String(f).padStart(2, "0"),
            name: f === 0 ? "Ground Floor" : "Floor " + f,
            elevation: +(f * 3.2).toFixed(1),
            fId: ulpin + "-F" + String(f).padStart(2, "0"),
            area: builtUp ? Math.round(builtUp / floors).toLocaleString("en-IN") + " sq.ft." : "-",
            units: fu
          });
        }

        properties.push({
          id: "PROP-" + String(seq).padStart(3, "0"),
          ulpin: ulpin,
          state: state, district: district, city: city,
          village: pick(LOCALITIES), ward: "Ward " + ri(1, 42),
          surveyNumber: "Survey-" + ri(100, 480), parcelNumber: "P-" + ri(1000, 9999),
          propertyType: ptype, landUse: landUse,
          ownerName: owner, ownershipType: pick(OWNERSHIP),
          landArea: landSqft.toLocaleString("en-IN") + " sq.ft.",
          builtUpArea: builtUp ? builtUp.toLocaleString("en-IN") + " sq.ft." : "-",
          latitude: lat, longitude: lng,
          elevation: +(C[6] + (rnd() - 0.5) * 6).toFixed(1),
          buildingHeight: +(floors * 3.2).toFixed(1),
          numberOfFloors: floors, numberOfUnits: units,
          floorsArr: floorsArr,
          buildingId: floors ? "B-" + String(1000 + seq) : null,
          registrationStatus: pick(["Registered", "Registered", "Mutation Pending"]),
          cadastralStatus: pick(["Verified", "Verified", "Pending Survey"]),
          createdAt: "2026-0" + ri(1, 8) + "-" + String(ri(10, 28)),
          updatedAt: "2026-08-" + String(ri(10, 28)),
          crs: "EPSG:4326 (WGS 84)",
          gnssStatus: pick(["RTK Fix", "RTK Fix", "RTK Float"]),
          corsBase: "CORS-" + code + "-0" + ri(1, 9),
          surveyDate: "2026-0" + ri(1, 8) + "-" + String(ri(10, 28)),
          accuracy: "\u00B1" + (1 + rnd() * 3).toFixed(1) + " cm",
          plotDims: Math.round(Math.sqrt(landSqft)) + " ft \u00D7 " + Math.round(Math.sqrt(landSqft) * 1.18) + " ft",
          basement: floors >= 4 ? (rnd() > 0.5 ? "Yes - 1 level (parking)" : "No") : "No",
          parking: floors >= 2 ? (rnd() > 0.35 ? "Yes - " + ri(2, 18) + " slots" : "No") : "No",
          footprint: parcelPolygon(lat, lng, Math.sqrt(landSqft) * 0.30, rnd() * Math.PI),
          hasBuilding: floors > 0,
          verticalExtent: floors ? "EL +0.0 m to +" + (floors * 3.2).toFixed(1) + " m" : "Surface parcel only"
        });
      }
    });
  })();

  /* ---------- underground infrastructure (demo) ---------- */
  const INFRA_TYPES = [
    { type: "Water Pipeline", icon: "pipe", color: "#0ea5e9", authority: "Municipal Water Board" },
    { type: "Sewer Line", icon: "pipe", color: "#a16207", authority: "City Sewerage Dept" },
    { type: "Electrical Cable", icon: "pulse", color: "#eab308", authority: "State Electricity Board" },
    { type: "Gas Pipeline", icon: "pipe", color: "#f97316", authority: "City Gas Distribution" },
    { type: "Metro Tunnel", icon: "box", color: "#8b5cf6", authority: "Metro Rail Corporation" },
    { type: "Utility Duct", icon: "pipe", color: "#64748b", authority: "Smart City SPV" }
  ];
  const infra = [];
  for (let i = 0; i < 24; i++) {
    const p1 = properties[ri(0, properties.length - 1)];
    const p2 = properties[ri(0, properties.length - 1)];
    const t = INFRA_TYPES[i % INFRA_TYPES.length];
    const dLat = (p2.latitude - p1.latitude), dLng = (p2.longitude - p1.longitude);
    const lenM = Math.round(Math.sqrt(Math.pow(dLat * 110540, 2) + Math.pow(dLng * 111320 * Math.cos(p1.latitude * Math.PI / 180), 2)));
    infra.push({
      id: "UWI-DEMO-" + String(100 + i),
      type: t.type, icon: t.icon, color: t.color, authority: t.authority,
      depth: ri(2, 28) + " m",
      start: [p1.latitude, p1.longitude], end: [p2.latitude, p2.longitude],
      lengthM: lenM ? lenM : ri(80, 600),
      status: pick(["Operational", "Operational", "Under Repair", "Planned"]),
      parentParcel: p1.id, parentUlpin: p1.ulpin, city: p1.city, state: p1.state
    });
  }

  /* ---------- air rights (demo) ---------- */
  const airRights = [];
  const builtProps = properties.filter((p) => p.hasBuilding);
  for (let i = 0; i < 18; i++) {
    const p = builtProps[i % builtProps.length];
    const minE = +(p.elevation + p.buildingHeight + ri(4, 18)).toFixed(1);
    const maxE = +(minE + ri(15, 60)).toFixed(1);
    airRights.push({
      id: "AIR-DEMO-" + String(1000 + i), propertyId: p.id, ulpin: p.ulpin,
      minElev: minE, maxElev: maxE, volumeM3: ri(800, 9800),
      use: pick(["FSI Bank", "Drone Corridor", "Sky Terrace", "Signal Tower Zone", "Overhead Utility"]),
      status: pick(["Registered", "Reserved", "Pending"]),
      holder: pick(["Municipal Corp", "Telecom Operator", "State Aviation", "FSI Developer"]),
      city: p.city, state: p.state, baseParcel: p.id
    });
  }

  /* ---------- GNSS / CORS stations (demo) ---------- */
  const stations = [
    { code: "CORS-PUNE-08", city: "Pune", state: "Maharashtra", lat: 18.5074, lng: 73.8077 },
    { code: "CORS-DEL-01", city: "New Delhi", state: "Delhi", lat: 28.5600, lng: 77.1600 },
    { code: "CORS-BLR-03", city: "Bengaluru", state: "Karnataka", lat: 12.9784, lng: 77.6408 },
    { code: "CORS-CHN-02", city: "Chennai", state: "Tamil Nadu", lat: 13.0418, lng: 80.2341 },
    { code: "CORS-HYD-04", city: "Hyderabad", state: "Telangana", lat: 17.4126, lng: 78.4392 },
    { code: "CORS-KOL-05", city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 }
  ];

  const stats = {
    parcels: properties.length,
    buildings: properties.filter((p) => p.hasBuilding).length,
    floors: properties.reduce((s, p) => s + p.numberOfFloors, 0),
    units: properties.reduce((s, p) => s + p.numberOfUnits, 0),
    infra: infra.length, air: airRights.length, states: CITIES.length, cities: CITIES.length
  };
  function matches(p, f) {
    if (f.state && f.state !== p.state) return false;
    if (f.city && f.city !== p.city) return false;
    if (f.district && f.district !== p.district) return false;
    if (f.propertyType && f.propertyType !== p.propertyType) return false;
    if (f.landUse && f.landUse !== p.landUse) return false;
    if (f.ownershipType && f.ownershipType !== p.ownershipType) return false;
    if (f.minFloors && p.numberOfFloors < parseInt(f.minFloors, 10)) return false;
    return true;
  }
  var api = {
    CITIES: CITIES, properties: properties, infra: infra, airRights: airRights,
    stations: stations, stats: stats,
    getAllProperties: function () { return properties; },
    getPropertyById: function (id) { return properties.find((p) => p.id === id) || null; },
    getPropertyByULPIN: function (u) { return properties.find((p) => p.ulpin === u) || null; },
    getBuildingByProperty: function (id) { var p = api.getPropertyById(id); return p ? { id: p.buildingId, property: p, floors: p.floorsArr } : null; },
    getFloorsByBuilding: function (id) { var p = api.getPropertyById(id); return p ? p.floorsArr : []; },
    getUnitsByFloor: function (id, fid) { var p = api.getPropertyById(id); if (!p) return []; var f = p.floorsArr.find((x) => x.id === fid); return f ? f.units : []; },
    searchProperties: function (q) {
      var s = (q || '').trim().toLowerCase(); if (!s) return [];
      return properties.filter((p) => p.id.toLowerCase().includes(s) || p.ulpin.toLowerCase().includes(s) || p.ownerName.toLowerCase().includes(s) || p.surveyNumber.toLowerCase().includes(s) || p.parcelNumber.toLowerCase().includes(s) || p.city.toLowerCase().includes(s) || p.district.toLowerCase().includes(s) || p.state.toLowerCase().includes(s) || p.village.toLowerCase().includes(s));
    },
    filterProperties: function (f) { f = f || {}; return properties.filter((p) => matches(p, f)); },
    getStates: function () { return CITIES.map((c) => c[1]).filter((v, i, a) => a.indexOf(v) === i).sort(); },
    getCities: function (state) { return CITIES.filter((c) => !state || c[1] === state).map((c) => c[0]).sort(); },
    getDistricts: function (state) { return CITIES.filter((c) => !state || c[1] === state).map((c) => c[3]).filter((v, i, a) => a.indexOf(v) === i).sort(); },
    generateDemoULPIN: function (stateCode) { var n; do { n = ri(100000, 999999); } while (usedUlp[(stateCode || 'XX') + n]); usedUlp[(stateCode || 'XX') + n] = 1; return 'ULPIN-IN-DEMO-' + (stateCode || 'XX') + '-' + n; },
    getInfra: function () { return infra; },
    getAirRights: function () { return airRights; },
    getStations: function () { return stations; }
  };
  return api;
})();
