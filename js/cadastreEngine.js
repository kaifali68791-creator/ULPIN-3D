/* =====================================================================
   ULPIN 3D — Centralized Cadastre Engine (Demo Processing)
   ---------------------------------------------------------------------
   Single source of truth for ALL demo cadastral data + AI processing.
   Every module (map, 3D, AI, ULPIN, underground, infrastructure)
   consumes this same dataset so selections stay synchronized.
   ===================================================================== */
"use strict";
(function () {

  /* ===================================================================
     1. CENTRALIZED DEMO DATASET
     =================================================================== */
  const DATASET = {
    parcel: {
      id: "P-02", survey: "131/2", use: "Residential", owner: "Meena Patil",
      area: 388, areaUnit: "sq m", status: "Titled",
      lat: 18.5456, lng: 73.8234, elevation: 562.4,
      crs: "EPSG:4326 (WGS 84)", gnssStatus: "RTK Fix", corsBase: "CORS-PUNE-08",
      accuracy: "±2.1 cm", surveyDate: "2026-03-15",
      plotDims: "19.7m × 19.7m", poly: "160,35 266,35 266,240 160,240"
    },
    building: {
      id: "B01", name: "Shivapur Residency", year: 2018, type: "Residential",
      height: 21.4, floors: 6, units: 24, occupancy: 92,
      footprint: "18.2m × 16.8m", basement: "B1 (parking)", parking: "8 slots"
    },
    floors: [
      { id: "G", name: "Ground Floor", elevation: 0.0, height: 3.2, units: 4, usage: "Residential", confidence: 96 },
      { id: "F1", name: "1st Floor", elevation: 3.2, height: 3.0, units: 4, usage: "Residential", confidence: 95 },
      { id: "F2", name: "2nd Floor", elevation: 6.2, height: 3.0, units: 4, usage: "Residential", confidence: 94 },
      { id: "F3", name: "3rd Floor", elevation: 9.2, height: 3.0, units: 4, usage: "Residential", confidence: 93 },
      { id: "F4", name: "4th Floor", elevation: 12.2, height: 3.0, units: 4, usage: "Residential", confidence: 94 },
      { id: "F5", name: "5th Floor", elevation: 15.2, height: 3.0, units: 4, usage: "Residential", confidence: 91 }
    ],
    units: {
      "F4": [
        { no: "U01", type: "2 BHK", area: "850 sq.ft.", owner: "Rajesh Kumar", status: "Occupied", elevBase: 12.2, elevTop: 15.2 },
        { no: "U02", type: "1 BHK", area: "620 sq.ft.", owner: "Priya Sharma", status: "Occupied", elevBase: 12.2, elevTop: 15.2 },
        { no: "U03", type: "2 BHK", area: "850 sq.ft.", owner: "Demo Owner", status: "Occupied", elevBase: 12.2, elevTop: 15.2 },
        { no: "U04", type: "3 BHK", area: "1,100 sq.ft.", owner: "Anil Deshmukh", status: "Vacant", elevBase: 12.2, elevTop: 15.2 }
      ]
    },
    underground: [
      { id: "WP-104", type: "Water Pipeline", authority: "Municipal Water Board", depth: -3.5, status: "Active", serves: 18, length: 240 },
      { id: "SL-007", type: "Sewer Line", authority: "City Sewerage Dept", depth: -4.2, status: "Active", serves: 24, length: 180 },
      { id: "EC-012", type: "Electric Cable", authority: "State Electricity Board", depth: -1.8, status: "Active", serves: 31, length: 150 },
      { id: "GP-003", type: "Gas Pipeline", authority: "City Gas Distribution", depth: -2.4, status: "Active", serves: 12, length: 90 },
      { id: "UT-001", type: "Utility Tunnel", authority: "Smart City SPV", depth: -5.8, status: "Planned", serves: 8, length: 320 },
      { id: "B1-PARK", type: "Underground Parking", authority: "Building B01", depth: -3.0, status: "Active", serves: 1, length: 0 }
    ],
    infrastructure: {
      proposed: { id: "PP-204", type: "Proposed Pipeline", route: "Along Survey Road", depth: -2.0, length: 150 },
      conflicts: [
        { severity: "HIGH", asset: "B1-PARK", desc: "Proposed pipeline conflicts with Building B01 underground parking B1", clearance: "1.2m", risk: "MEDIUM" },
        { severity: "MEDIUM", asset: "WP-104", desc: "Proposed pipeline crosses Water Pipeline WP-104 at -2.1m depth", clearance: "0.9m", risk: "MEDIUM" }
      ]
    },
    topology: {
      score: 92,
      issues: [
        { severity: "HIGH", type: "Vertical overlap", desc: "Possible vertical boundary overlap on Floor F4 between units U03 and U04", ref: "F4" },
        { severity: "MEDIUM", type: "Missing elevation", desc: "Building B02 missing elevation metadata for floors F5-F6", ref: "B02" },
        { severity: "LOW", type: "Geometry precision", desc: "Parcel P-07 boundary has sub-meter precision issue", ref: "P-07" }
      ]
    },
    ownershipConflicts: [
      { severity: "HIGH", parcel: "131/2", floor: "F4", unit: "U03", recordA: "Rajesh Kumar", recordB: "Demo Owner", confidence: 87, status: "Requires Review" },
      { severity: "MEDIUM", parcel: "131/1", floor: "F2", unit: "U02", recordA: "Suresh Kulkarni", recordB: "Joint Ownership Claim", confidence: 72, status: "Under Review" }
    ]
  };

  /* ===================================================================
     2. DATA SOURCE CENTER
     =================================================================== */
  const DATASOURCES = [
    { id: "drone", name: "Drone Imagery", type: "GeoTIFF · RGB + NIR", status: "Available", resolution: "2.5 cm/px", coverage: "Demo districts", lastUpdated: "Survey Jul 2026", quality: 94, records: "12,400 tiles" },
    { id: "lidar", name: "LiDAR / Point Cloud", type: "LAS · classified", status: "Available", resolution: "42 pts/m²", coverage: "Demo districts", lastUpdated: "Survey Jul 2026", quality: 96, records: "8.2M points" },
    { id: "gis", name: "GIS Parcel Layer", type: "GeoJSON · cadastral", status: "Loaded", resolution: "1:1000 scale", coverage: "24 states", lastUpdated: "Synced 1 hr ago", quality: 98, records: "2.4M parcels" },
    { id: "floorplans", name: "Building Floor Plans", type: "CAD / PDF", status: "Available", resolution: "1:100 scale", coverage: "Demo buildings", lastUpdated: "Updated Mar 2026", quality: 91, records: "156 plans" },
    { id: "gnss", name: "GNSS / CORS", type: "RTCM-3 streams", status: "Connected", resolution: "±2 cm RTK", coverage: "Pan-India network", lastUpdated: "10 sats · RTK fix", quality: 99, records: "1,200 stations" },
    { id: "dem", name: "Digital Elevation Model", type: "SRTM 1\" / Cartosat", status: "Loaded", resolution: "1 m", coverage: "National", lastUpdated: "Base map v2.1", quality: 88, records: "Full coverage" },
    { id: "dsm", name: "Digital Surface Model", type: "LiDAR-derived", status: "Loaded", resolution: "1 m", coverage: "Demo districts", lastUpdated: "Survey Jul 2026", quality: 92, records: "Full coverage" }
  ];

  function loadDataSource(id) {
    const src = DATASOURCES.find((s) => s.id === id);
    if (!src) return { error: "Unknown data source" };
    return {
      source: src,
      steps: ["Loading " + src.name + " dataset...", "Validating data integrity...", "Checking spatial reference...", "Indexing " + src.records + " records...", "Ready for analysis"],
      result: { loaded: true, quality: src.quality, records: src.records, resolution: src.resolution, coverage: src.coverage }
    };
  }

  /* ===================================================================
     3. AI PROCESSING ENGINES
     =================================================================== */
  function runBuildingExtraction() {
    const buildings = [
      { id: "B01", name: "Shivapur Residency", confidence: 96, height: 21.4, floors: 6, footprint: "18.2m × 16.8m" },
      { id: "B02", name: "Green Meadows", confidence: 92, height: 17.8, floors: 5, footprint: "15.4m × 14.2m" },
      { id: "B03", name: "Sunrise Apartments", confidence: 89, height: 28.2, floors: 8, footprint: "22.1m × 18.6m" },
      { id: "B04", name: "Patel Complex", confidence: 91, height: 12.6, floors: 3, footprint: "28.4m × 20.2m" },
      { id: "B05", name: "Tech Park Block A", confidence: 88, height: 36.0, floors: 10, footprint: "32.0m × 24.0m" },
      { id: "B06", name: "Heritage House", confidence: 94, height: 9.6, floors: 2, footprint: "16.8m × 12.4m" }
    ];
    return { steps: ["Loading imagery...", "Loading point cloud...", "Detecting structures...", "Extracting footprints...", "Calculating confidence..."], result: { detected: buildings.length, buildings: buildings, avgConfidence: Math.round(buildings.reduce((s, b) => s + b.confidence, 0) / buildings.length) } };
  }

  function runFloorSegmentation(buildingId) {
    const b = DATASET.building;
    return { steps: ["Loading building geometry...", "Running floor segmentation...", "Identifying floor boundaries...", "Validating floor heights..."], result: { building: b.id, name: b.name, floors: b.floors, totalFloors: b.floors.length, avgConfidence: Math.round(b.floors.reduce((s, f) => s + f.confidence, 0) / b.floors.length) } };
  }

  function runVerticalDelineation(parcelId, buildingId, floorId, unitId) {
    const p = DATASET.parcel, b = DATASET.building;
    const f = DATASET.floors.find((x) => x.id === floorId) || DATASET.floors[0];
    const u = (DATASET.units[f.id] || []).find((x) => x.no === unitId) || (DATASET.units[f.id] || [])[0];
    const lowerE = f.elevation, upperE = f.elevation + f.height;
    const footprintArea = 18.2 * 16.8;
    const volume = Math.round(footprintArea * f.height);
    const unitVolume = u ? Math.round(parseInt(u.area) * f.height / 100) : volume;
    return {
      steps: ["Parcel boundary loaded", "Building footprint loaded", "Floor elevation calculated", "Upper boundary calculated", "Lower boundary calculated", "Vertical volume generated"],
      result: { parcel: p, building: b, floor: f, unit: u, lowerElevation: lowerE, upperElevation: upperE, volume: volume, unitVolume: unitVolume, valid: true, ulpin: genVerticalUlpin(p, b, f, u) }
    };
  }

  function runTopologyValidation() {
    const t = DATASET.topology;
    return { steps: ["Loading parcel geometry", "Checking spatial topology", "Validating elevation data", "Inspecting vertical units", "Comparing ownership boundaries", "Checking ULPIN consistency", "Running anomaly detection"], result: { score: t.score, issues: t.issues, totalIssues: t.issues.length, high: t.issues.filter((i) => i.severity === "HIGH").length, medium: t.issues.filter((i) => i.severity === "MEDIUM").length, low: t.issues.filter((i) => i.severity === "LOW").length } };
  }

  function runOwnershipAnalysis() {
    return { steps: ["Loading ownership records", "Cross-referencing parcel data", "Detecting duplicate ownership", "Checking floor-level conflicts", "Analyzing unit ownership"], result: { conflicts: DATASET.ownershipConflicts, totalConflicts: DATASET.ownershipConflicts.length, highConfidence: DATASET.ownershipConflicts.filter((c) => c.confidence >= 80).length } };
  }

  function runInfrastructurePlanning() {
    return { steps: ["Loading infrastructure layers", "Simulating proposed pipeline route", "Checking spatial conflicts", "Computing clearance analysis"], result: { proposed: DATASET.infrastructure.proposed, conflicts: DATASET.infrastructure.conflicts, totalConflicts: DATASET.infrastructure.conflicts.length } };
  }

  /* ===================================================================
     4. VOLUMETRIC CALCULATIONS
     =================================================================== */
  function calcVolume(parcelId, buildingId, floorId, unitId) {
    const p = DATASET.parcel, b = DATASET.building;
    const f = DATASET.floors.find((x) => x.id === floorId) || DATASET.floors[0];
    const u = (DATASET.units[f.id] || []).find((x) => x.no === unitId) || (DATASET.units[f.id] || [])[0];
    const footprint = 18.2 * 16.8;
    const floorVolume = Math.round(footprint * f.height);
    const unitArea = u ? parseInt(u.area) : footprint;
    const unitVolume = Math.round(unitArea * f.height / 100);
    return {
      parcel: p, building: b, floor: f, unit: u,
      xRange: { min: +(p.lat - 0.00009).toFixed(6), max: +(p.lat + 0.00009).toFixed(6) },
      yRange: { min: +(p.lng - 0.0001).toFixed(6), max: +(p.lng + 0.0001).toFixed(6) },
      zRange: { min: f.elevation, max: +(f.elevation + f.height).toFixed(1) },
      floorVolume: floorVolume, unitVolume: unitVolume, totalBuildingVolume: Math.round(footprint * b.height)
    };
  }

  /* ===================================================================
     5. ULPIN GENERATION
     =================================================================== */
  function genVerticalUlpin(parcel, building, floor, unit) {
    const st = "MH", dt = "PN", th = "HV", vg = "SV";
    const survey = parcel.survey.replace(/\D/g, "").padStart(4, "0").slice(-4);
    const geo = btoa(parcel.lat + "," + parcel.lng).replace(/[^A-Z0-9]/gi, "").slice(0, 6).toUpperCase().padEnd(6, "X");
    const surface = (st + dt + th + vg + survey + geo).toUpperCase();
    return surface + "-" + building.id + "-" + floor.id + (unit ? "-" + unit.no : "");
  }

  /* ===================================================================
     6. UTILITY MANAGEMENT
     =================================================================== */
  function getUtilitySummary() {
    const u = DATASET.underground;
    const grouped = {};
    u.forEach((a) => { if (!grouped[a.type]) grouped[a.type] = []; grouped[a.type].push(a); });
    return { total: u.length, active: u.filter((a) => a.status === "Active").length, byType: grouped, types: Object.keys(grouped), totalServes: u.reduce((s, a) => s + a.serves, 0) };
  }

  /* ===================================================================
     7. CADASTRAL SUMMARY (for AI chatbot)
     =================================================================== */
  function getCadastralSummary() {
    const p = DATASET.parcel, b = DATASET.building;
    const f4 = DATASET.floors.find((f) => f.id === "F4");
    const u3 = (DATASET.units["F4"] || []).find((u) => u.no === "U03");
    return {
      parcel: p, building: b, floors: b.floors, totalFloors: b.floors.length, totalUnits: b.units,
      selectedFloor: f4, selectedUnit: u3,
      underground: DATASET.underground, topology: DATASET.topology,
      ownershipConflicts: DATASET.ownershipConflicts, infrastructure: DATASET.infrastructure,
      ulpin: u3 ? genVerticalUlpin(p, b, f4, u3) : null
    };
  }

  /* ===================================================================
     EXPORT
     =================================================================== */
  window.CADASTRE = {
    DATASET: DATASET, DATASOURCES: DATASOURCES,
    loadDataSource: loadDataSource,
    runBuildingExtraction: runBuildingExtraction,
    runFloorSegmentation: runFloorSegmentation,
    runVerticalDelineation: runVerticalDelineation,
    runTopologyValidation: runTopologyValidation,
    runOwnershipAnalysis: runOwnershipAnalysis,
    runInfrastructurePlanning: runInfrastructurePlanning,
    calcVolume: calcVolume, genVerticalUlpin: genVerticalUlpin,
    getUtilitySummary: getUtilitySummary, getCadastralSummary: getCadastralSummary
  };

})();