/* =====================================================================
   ULPIN 3D — AI Cadastral Assistant & Analyzer (Demo Mode)
   ===================================================================== */
"use strict";

/* ---------- AI Knowledge Base & Helpers ---------- */
const AI_KB = {
  ulpinParts(ulpin) {
    if (!ulpin || ulpin.length !== 26) return null;
    return [
      { label: "STATE", value: ulpin.slice(0, 2) },
      { label: "DISTRICT", value: ulpin.slice(2, 4) },
      { label: "TEHSIL", value: ulpin.slice(4, 6) },
      { label: "VILLAGE", value: ulpin.slice(6, 8) },
      { label: "PARCEL", value: ulpin.slice(8, 12) },
      { label: "BUILDING", value: ulpin.slice(12, 15) },
      { label: "FLOOR", value: ulpin.slice(15, 18) },
      { label: "UNIT", value: ulpin.slice(18, 21) },
      { label: "GEO", value: ulpin.slice(21, 26) }
    ];
  },

  topologyRules: [
    { id: "overlap", name: "Parcel Boundary Overlap", severity: "high", desc: "Adjacent parcels must not overlap" },
    { id: "gap", name: "Cadastral Gap Detection", severity: "medium", desc: "Check for unmapped gaps between parcels" },
    { id: "dup", name: "Duplicate Geometry", severity: "high", desc: "Identical geometries indicate data duplication" },
    { id: "selfint", name: "Self-Intersection", severity: "high", desc: "Polygon edges must not cross" },
    { id: "vert", name: "Vertical Volume Conflict", severity: "medium", desc: "3D volumes must not intersect between floors" }
  ],

  ownershipRules: [
    { id: "dupown", name: "Duplicate Ownership", severity: "high", desc: "Identical ownership across multiple survey numbers" },
    { id: "gapown", name: "Ownership Gap", severity: "medium", desc: "Missing ownership records for individual floors" }
  ],

  dataQuality: {
    geometry: { score: 94, label: "Geometry Completeness", issues: 3 },
    coordinates: { score: 98.4, label: "Coordinate Accuracy", issues: 2 },
    elevation: { score: 84, label: "Elevation Data Coverage", issues: 8 },
    ownership: { score: 91, label: "Ownership Completeness", issues: 5 },
    vertical: { score: 93, label: "Vertical Mapping", issues: 4 },
    ulpin: { score: 97, label: "ULPIN Consistency", issues: 1 }
  },

  confidence: {
    high: { label: "High", threshold: 90, color: "var(--teal)" },
    medium: { label: "Medium", threshold: 75, color: "var(--amber)" },
    low: { label: "Low", threshold: 0, color: "var(--rose)" }
  }
};

function getConfidence(score) {
  if (score >= AI_KB.confidence.high.threshold) return AI_KB.confidence.high;
  if (score >= AI_KB.confidence.medium.threshold) return AI_KB.confidence.medium;
  return AI_KB.confidence.low;
}

/* ---------- Cadastral Analyzer Engine ---------- */
class CadastralAnalyzer {
  constructor() {
    this.scannedRecords = 0;
    this.issues = [];
    this.recommendations = [];
    this.startTime = null;
  }

  async runAnalysis(type, data = null) {
    this.startTime = Date.now();
    this.issues = [];
    this.recommendations = [];
    this.scannedRecords = Array.isArray(data) ? data.length : (window.PARCELS?.length || 0);

    switch (type) {
      case "parcel": return await this.analyzeParcels();
      case "building": return await this.analyzeBuildings();
      case "extraction": return await this.buildingExtraction();
      case "floorseg": return await this.floorSegmentation();
      case "vertical": return await this.verticalParcelDelineation();
      case "topology": return await this.validateTopology();
      case "ulpin": return await this.validateUlpins();
      case "ownership": return await this.detectOwnershipConflicts();
      case "infrastructure": return await this.analyzeInfrastructure();
      case "planning": return await this.infrastructurePlanning();
      default: return await this.fullAnalysis();
    }
  }

  async processStep(message) {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  }

  addIssue(severity, description, ref) {
    this.issues.push({ 
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
      severity, 
      description, 
      ref 
    });
  }

  addRecommendation(text) {
    this.recommendations.push(text);
  }

  
  async analyzeParcels() {
    await this.processStep("Loading parcel geometry");
    await this.processStep("Validating survey metadata");
    await this.processStep("Checking coordinate accuracy");

    const parcels = window.PARCELS || [];
    let highRisk = 0, mediumRisk = 0;

    parcels.forEach(p => {
      if (p.status === "Disputed") {
        this.addIssue("high", `Parcel ${p.id} (${p.survey}) has disputed ownership`, p.id);
        highRisk++;
      }
      if (!p.ulpin && p.status === "Pending survey") {
        this.addIssue("medium", `Parcel ${p.id} missing ULPIN (pending survey)`, p.id);
        mediumRisk++;
      }
      if (p.area < 100) {
        this.addIssue("low", `Parcel ${p.id} has unusually small area (${p.area} sq.yd)`, p.id);
      }
    });

    if (parcels.length > 0) {
      this.addIssue("medium", "Boundary alignment requires verification for P-04/P-05 junction", "P-04, P-05");
      mediumRisk++;
    }

    const score = Math.max(70, 100 - highRisk * 5 - mediumRisk * 2);
    this.addRecommendation("Run automated topology validation on disputed parcels");
    this.addRecommendation("Assign ULPINs to all surveyed parcels");
    return this.buildResult("Parcel Analysis", score, "parcel", highRisk + mediumRisk);
  }

  async analyzeBuildings() {
    await this.processStep("Loading building geometry");
    await this.processStep("Inspecting vertical structure");
    await this.processStep("Validating floor boundaries");

    const buildings = window.BUILDINGS || [];
    let highRisk = 0, mediumRisk = 0;

    buildings.forEach(b => {
      const floors = b.floors || [];
      const hasBasement = floors.some(f => f.id.startsWith("B"));

      if (!hasBasement) {
        this.addIssue("low", `Building ${b.id} (${b.name}) has no basement designation`, b.id);
      }
      if (floors.length > 6) {
        this.addIssue("medium", `Building ${b.id} has ${floors.length} floors - verify structural compliance`, b.id);
        mediumRisk++;
      }

      floors.forEach(f => {
        const units = f.units || [];
        if (units.length === 0) {
          this.addIssue("high", `Building ${b.id}, Floor ${f.id} has no unit definitions`, `${b.id}-${f.id}`);
          highRisk++;
        }
      });
    });

    const vertexHeights = buildings.find(b => b.id === "B-001");
    if (vertexHeights) {
      const f4 = vertexHeights.floors?.find(f => f.id === "F4");
      if (f4) {
        this.addIssue("high", `Possible vertical boundary overlap on ${f4.id} of ${vertexHeights.name}`, vertexHeights.id);
        highRisk++;
        this.addRecommendation(`Run detailed topology check on Floor ${f4.id} of ${vertexHeights.name}`);
      }
    }

    const score = Math.max(65, 100 - highRisk * 8 - mediumRisk * 5);
    this.addRecommendation("Validate structural compliance for buildings >6 floors");
        this.addRecommendation("Complete missing unit definitions");
    return this.buildResult("Building Analysis", score, "building", highRisk + mediumRisk);
  }

  async validateTopology() {
    const steps = [
      "Loading parcel geometry",
      "Checking spatial topology",
      "Validating elevation data",
      "Inspecting vertical units",
      "Comparing ownership boundaries",
      "Checking ULPIN consistency",
      "Running anomaly detection"
    ];
    for (const step of steps) await this.processStep(step);

    this.addIssue("high", "Possible overlap between P-01 and P-02 boundaries", "P-01, P-02");
    this.addIssue("medium", "Missing elevation metadata for 3 buildings", "B-003, B-005, B-006");
    this.addIssue("medium", "Self-intersection detected in polygon P-10", "P-10");
    this.addRecommendation("Run topology repair tool on affected parcels");
    this.addRecommendation("Update elevation information using GNSS/CORS or LiDAR data");
    return this.buildResult("Topology Validation", 89, "topology", 3);
  }

  async validateUlpins() {
    await this.processStep("Loading ULPIN registry");
    await this.processStep("Validating ULPIN format");
    await this.processStep("Cross-referencing survey data");

    const validFormat = (ulpin) => ulpin && ulpin.length === 26 && /^[A-Z0-9]+$/.test(ulpin);
    const parcels = window.PARCELS || [];
    let assigned = 0, total = parcels.length;

    parcels.forEach(p => {
      if (p.ulpin && validFormat(p.ulpin)) assigned++;
      else if (!p.ulpin) this.addIssue("low", `Parcel ${p.id} has no ULPIN assigned`, p.id);
      else if (!validFormat(p.ulpin)) this.addIssue("high", `Parcel ${p.id} has invalid ULPIN format`, p.id);
    });

    this.addRecommendation(`${total - assigned} parcels need ULPIN assignment`);
    const score = total > 0 ? (assigned / total) * 100 : 0;
    return this.buildResult("ULPIN Validation", score, "ulpin", 0);
  }

  async detectOwnershipConflicts() {
    await this.processStep("Loading ownership records");
    await this.processStep("Detecting conflicts");

    const parcels = window.PARCELS || [];
    let conflicts = 0;
    const disputed = parcels.filter(p => p.status === "Disputed");

    disputed.forEach(p => {
      this.addIssue("high", `Disputed ownership: ${p.owner}`, p.id);
      conflicts++;
    });

    const ownerMap = {};
    parcels.forEach(p => {
      if (p.owner && p.status !== "Disputed") {
        if (!ownerMap[p.owner]) ownerMap[p.owner] = [];
        ownerMap[p.owner].push(p.id);
      }
    });

    Object.entries(ownerMap).forEach(([owner, parcels]) => {
      if (parcels.length > 1) {
        this.addIssue("medium", `Owner "${owner}" appears across ${parcels.length} parcels`, parcels.join(", "));
        conflicts++;
      }
    });

    this.addIssue("high", "Ownership ambiguity: Potential duplicate ownership for P-09", "P-09");
    conflicts++;

    const score = Math.max(70, 100 - conflicts * 10);
    this.addRecommendation("Review ownership chains for flagged parcels");
    this.addRecommendation("Verify duplicate ownership records");
    return this.buildResult("Ownership Conflict Detection", score, "ownership", conflicts);
  }

  async analyzeInfrastructure() {
    await this.processStep("Scanning underground utilities");
    await this.processStep("Checking infrastructure layers");

    const assets = window.UNDERGROUND || [];
    let issues = 0;

    assets.forEach(a => {
      if (a.status === "Pending inspection") {
        this.addIssue("medium", `Asset ${a.name} requires inspection`, a.id);
        issues++;
      }
      if (a.depth && a.depth > 10) {
        this.addIssue("low", `Asset ${a.name} at significant depth (${a.depth})`, a.id);
      }
    });

    this.addIssue("medium", "Underground conflict potential near P-03/P-04 junction", "P-03, P-04");
    issues++;
    const score = Math.max(75, 100 - issues * 5);
    this.addRecommendation("Verify utility line depths before construction");
    return this.buildResult("Infrastructure Analysis", score, "infrastructure", issues);
  }

  /* A. Automated Building Extraction (demo: drone/LiDAR → detected footprints) */
  async buildingExtraction() {
    await this.processStep("Loading drone/LiDAR imagery");
    await this.processStep("Classifying point cloud");
    await this.processStep("Detecting building geometry");
    await this.processStep("Generating footprints");
    await this.processStep("Calculating confidence");

    const buildings = window.BUILDINGS || [];
    const detected = buildings.length;
    let totalConf = 0;
    buildings.forEach((b, i) => {
      const conf = 88 + ((i * 3 + b.floors) % 9); // deterministic 88-96%
      totalConf += conf;
      this.addIssue("low", `Building ${b.id} (${b.name}) — confidence ${conf}%`, b.id);
    });
    const avgConf = detected ? Math.round(totalConf / detected) : 0;
    const score = avgConf;
    this.addRecommendation(`${detected} buildings detected with average confidence ${avgConf}%`);
    this.addRecommendation("Review low-confidence detections manually");
    return this.buildResult("AI Building Extraction", score, "extraction", 0);
  }

  /* B. Floor Segmentation (demo: automatic floor identification) */
  async floorSegmentation() {
    await this.processStep("Loading building geometry");
    await this.processStep("Running floor segmentation");
    await this.processStep("Identifying floor boundaries");
    await this.processStep("Validating floor heights");

    const buildings = window.BUILDINGS || [];
    let totalFloors = 0;
    buildings.forEach((b) => {
      const floors = b.floors || [];
      totalFloors += floors.length;
      const hasBasement = floors.some((f) => f.id.startsWith("B"));
      const floorIds = floors.map((f) => f.id).join(", ");
      this.addIssue("low", `Building ${b.id}: ${floors.length} floors detected [${floorIds}]`, b.id);
      if (!hasBasement) {
        this.addIssue("medium", `Building ${b.id} has no basement designation`, b.id);
      }
    });
    const score = 94;
    this.addRecommendation(`${totalFloors} floors segmented across ${buildings.length} buildings`);
    this.addRecommendation("Verify floor height consistency against LiDAR data");
    return this.buildResult("AI Floor Segmentation", score, "floorseg", 0);
  }

  /* C. Vertical Parcel Delineation (demo: 3D cadastral volumes) */
  async verticalParcelDelineation() {
    await this.processStep("Loading parcel geometry");
    await this.processStep("Computing vertical extents");
    await this.processStep("Delineating 3D volumes");
    await this.processStep("Validating volume boundaries");

    const buildings = window.BUILDINGS || [];
    let volumes = 0;
    buildings.forEach((b) => {
      const floors = b.floors || [];
      const height = floors.length * 3.2;
      floors.forEach((f) => {
        (f.units || []).forEach((u) => {
          volumes++;
          this.addIssue("low", `Volume ${b.id}-${f.id}-${u.no}: EL +${(f.id === "G" ? 0 : parseInt(f.id.slice(1)) * 3.2).toFixed(1)}m to +${(f.id === "G" ? 3.2 : (parseInt(f.id.slice(1)) + 1) * 3.2).toFixed(1)}m`, u.no);
        });
      });
      this.addIssue("low", `Building ${b.id} vertical extent: EL +0.0m to +${height.toFixed(1)}m`, b.id);
    });
    const score = 91;
    this.addRecommendation(`${volumes} vertical property volumes delineated`);
    this.addRecommendation("Cross-reference with municipal FSI records");
    return this.buildResult("Vertical Parcel Delineation", score, "vertical", 0);
  }

  /* Infrastructure Planning conflict detection */
  async infrastructurePlanning() {
    await this.processStep("Loading infrastructure layers");
    await this.processStep("Simulating proposed pipeline route");
    await this.processStep("Checking spatial conflicts");
    await this.processStep("Computing clearance analysis");

    const assets = window.UNDERGROUND || [];
    let conflicts = 0;
    // Demo: proposed pipeline crosses existing utilities
    this.addIssue("medium", "Proposed Pipeline PL-PROP-01 crosses Water Pipeline WP-002 at -2.1m depth", "WP-002");
    this.addIssue("high", "Proposed Pipeline PL-PROP-01 conflicts with Building B-001 underground parking B1", "B-001");
    this.addIssue("low", "Vertical clearance 1.2m to Sewer Line SL-003 — within tolerance", "SL-003");
    conflicts = 2;
    const score = Math.max(70, 100 - conflicts * 12);
    this.addRecommendation("Reroute proposed pipeline around Building B-001 foundation");
    this.addRecommendation("Verify utility line depths before construction");
    this.addRecommendation("Schedule pre-construction utility survey");
    return this.buildResult("Infrastructure Planning", score, "planning", conflicts);
  }

  async fullAnalysis() {
    await this.analyzeParcels();
    await this.analyzeBuildings();
    return this.buildResult("Full System Analysis", 92, "full", 0);
  }
}

/* ---------- AI Chat Assistant ---------- */
class AIAssistant {
  constructor() {
    this.analyzer = new CadastralAnalyzer();
    this.context = { parcel: null, building: null, floor: null, ulpin: null };
  }

  setContext(context) { this.context = { ...this.context, ...context }; }

  generateResponse(query) {
    const q = query.toLowerCase().trim();
    const ctx = this.context;

    if ((q.includes("this property") || q.includes("this parcel") || q.includes("current")) && ctx.parcel) {
      return this.analyzeProperty(ctx.parcel);
    }
    if (q.includes("ulpin")) return this.explainULPIN();
    if (q.includes("topology") || q.includes("overlap") || q.includes("boundary")) return this.explainTopology();
    if (q.includes("ownership") || q.includes("conflict") || q.includes("owner")) return this.explainOwnership();
    if (q.includes("data quality") || q.includes("quality") || q.includes("missing")) return this.explainDataQuality();
    if (q.includes("analyze") || q.includes("analysis")) return this.suggestAnalyses();
    if (q.includes("floor") || q.includes("vertical") || q.includes("unit")) return this.explainVertical();
    if (q.includes("underground") || q.includes("infrastructure")) return this.explainInfrastructure();
    if (q.includes("air right")) return this.explainAirRights();
    return this.defaultResponse();
  }

  analyzeProperty(parcel) {
    const building = (window.BUILDINGS || []).find(b => b.parcelId === parcel.id);
    const floors = building?.floors || [];
    const totalUnits = floors.reduce((s, f) => s + (f.units?.length || 0), 0);
    const issues = [];
    if (parcel.status === "Disputed") issues.push("⚠️ Disputed ownership status");
    if (!parcel.ulpin) issues.push("ℹ️ No ULPIN assigned yet");

    let content = `Analysis for Parcel ${parcel.id} (${parcel.survey}):\n\n`;
    content += `Owner: ${parcel.owner}\nUse: ${parcel.use}\nArea: ${parcel.area} sq.yd\nStatus: ${parcel.status}\n`;

    if (building) {
      content += `\nBuilding: ${building.name} (${building.id})\nYear: ${building.year}\n`;
      content += `Floors: ${floors.length} (${floors.map(f => f.id).join(", ")})\n`;
      content += `Units: ${totalUnits}\nOccupancy: ${building.occupancy}%\n`;
      if (issues.length > 0) content += `\nIssues:\n${issues.join("\n")}\n`;
      const conf = getConfidence(building.occupancy);
      content += `\nAI Confidence: ${conf.label} (${conf.threshold}%+)`;
    } else {
      content += "\n\nℹ️ No building data. AI Confidence: High.";
    }

    return {
      type: "property_analysis",
      title: `Analysis: Parcel ${parcel.id}`,
      content,
      recommendations: [
        parcel.status === "Disputed" ? "Review dispute resolution" : "Run topology validation",
        !parcel.ulpin ? "Assign ULPIN to this parcel" : "Validate ULPIN structure"
      ]
    };
  }

  explainULPIN() {
    return { type: "explanation", title: "ULPIN", content: "26-char unique ID for Indian parcels.\nFormat: STATE-DISTRICT-TEHSIL-VILLAGE-SURVEY-BUILDING-FLOOR-UNIT-GEO", recommendations: ["Use ULPIN Generator", "Validate format"] };
  }

  explainTopology() {
    /* MUST-FIX #3: read the real score from the existing CADASTRE dataset so the
       chat cannot contradict the AI analysis page. Falls back to the previous
       text only if the engine is not loaded (never invents a number). */
    const t = (typeof CADASTRE !== "undefined" && CADASTRE.DATASET && CADASTRE.DATASET.topology) ? CADASTRE.DATASET.topology : null;
    if (t) {
      const high = t.issues.filter(i => i.severity === "HIGH").length;
      const medium = t.issues.filter(i => i.severity === "MEDIUM").length;
      const low = t.issues.filter(i => i.severity === "LOW").length;
      const label = t.score >= 90 ? "Good" : t.score >= 70 ? "Moderate" : "Needs Attention";
      let content = "Checks: overlaps, gaps, duplicates, self-intersections.\n";
      content += `Score: ${t.score}% (${label})\n`;
      content += `Issues: ${t.issues.length} (HIGH: ${high}, MEDIUM: ${medium}, LOW: ${low})`;
      const recs = t.issues.map(i => `${i.severity}: ${i.desc}`);
      return { type: "explanation", title: "Topology Validation", content, recommendations: recs.length ? recs : ["Run repair tool", "Update elevation"] };
    }
    return { type: "explanation", title: "Topology Validation", content: "Checks: overlaps, gaps, duplicates, self-intersections.\nScore: 89% (Good)", recommendations: ["Run repair tool", "Update elevation"] };
  }

  explainOwnership() {
    /* MUST-FIX #3: derive from the existing ownership conflict records; no invented score. */
    const oc = (typeof CADASTRE !== "undefined" && CADASTRE.DATASET && CADASTRE.DATASET.ownershipConflicts) ? CADASTRE.DATASET.ownershipConflicts : null;
    if (oc) {
      let content = `Detects: duplicates, missing records, disputes.\nConflicts: ${oc.length}`;
      const recs = oc.map(c => `${c.severity}: ${c.parcel} · ${c.floor} · ${c.unit} — ${c.recordA} vs ${c.recordB} (${c.confidence}%)`);
      return { type: "explanation", title: "Ownership Intelligence", content, recommendations: recs.length ? recs : ["Review flagged parcels"] };
    }
    return { type: "explanation", title: "Ownership Intelligence", content: "Detects: duplicates, missing records, disputes.\nScore: 88% (Medium)", recommendations: ["Review flagged parcels"] };
  }

  explainDataQuality() {
    /* MUST-FIX #3: the CADASTRE dataset has no data-quality field, so the existing
       AI_KB table is preserved; the overall score is now COMPUTED from those same
       entries (genuine aggregation) instead of a hardcoded constant. */
    const dq = AI_KB.dataQuality;
    let content = "Data Quality:\n";
    let total = 0, n = 0;
    Object.entries(dq).forEach(([k, m]) => { content += `${m.label}: ${m.score}%\n`; total += m.score; n++; });
    content += `\nOverall: ${n ? Math.round(total / n) : 0}%`;
    return { type: "quality_report", title: "Data Quality", content, recommendations: ["Update elevation", "Assign ULPINs"] };
  }

  explainVertical() {
    return { type: "explanation", title: "Vertical Mapping", content: "Structure: Parcel → Building → Floor → Unit\nScore: 93%", recommendations: ["Validate boundaries", "Check heights"] };
  }

  explainInfrastructure() {
    return { type: "explanation", title: "Infrastructure", content: "Assets: Fibre, Water, Gas, Sewer, Power\nScore: 94%", recommendations: ["Verify depths"] };
  }

  explainAirRights() {
    return { type: "explanation", title: "Air Rights", content: "ID: AIR-DEMO-00045\nElevation: 25m-60m\nVolume: 4,500 m³", recommendations: ["Check FSI compliance"] };
  }

  suggestAnalyses() {
    return { type: "analysis_summary", title: "Available AI Analyses", content: "Parcel, Building, Topology, ULPIN, Ownership, Infrastructure", recommendations: ["Run full analysis", "Check topology"] };
  }

  defaultResponse() {
    return { type: "default", title: "ULPIN AI Assistant", content: "Help with: property analysis, topology, ULPIN, ownership, data quality.\nTry: 'Analyze property', 'Check topology'", prompt: "Type your question..." };
  }

  async runAnalysis(type) { return await this.analyzer.runAnalysis(type); }
}

/* ---------- Export ---------- */
window.AI_ASSISTANT = new AIAssistant();
window.CADASTRAL_ANALYZER = window.AI_ASSISTANT.analyzer;

/* ---------- UI Initialization ---------- */
function initAIAssistantUI() {
  const promptsContainer = document.getElementById('ai-suggested-prompts');
  if (promptsContainer) {
    const prompts = ["Analyze Current Parcel", "Check Topology", "Explain ULPIN", "Analyze Building", "Find Ownership Conflicts", "Data Quality Report"];
    promptsContainer.innerHTML = prompts.map(p => 
      `<button class="ai-suggested-btn" onclick="handleAIPrompt('${p}')">${p}</button>`
    ).join('');
  }

  const toggleBtn = document.getElementById('ai-toggle-btn');
  const closeBtn = document.getElementById('ai-close-btn');
  const panel = document.getElementById('ai-chat-panel');
  const sendBtn = document.getElementById('ai-send-btn');
  const inputField = document.getElementById('ai-input');

  if (toggleBtn && panel) toggleBtn.onclick = () => panel.classList.toggle('active');
  if (closeBtn && panel) closeBtn.onclick = () => panel.classList.remove('active');
  if (sendBtn && inputField) {
    /* MUST-FIX #1: route ALL chat input (Send + Enter) through ONE engine.
       app.js enhanceChatbot() overrides Send's onclick to handleCadastreQuery();
       Enter routes through routeAIQuery() which prefers the same engine. */
    sendBtn.onclick = () => { const q = inputField.value.trim(); if (q) routeAIQuery(q); };
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { const q = inputField.value.trim(); if (q) routeAIQuery(q); }
    });
  }
}

/* MUST-FIX #1: single chat entry point. Prefers the existing cadastral engine
   handleCadastreQuery() (js/app.js) so Send, Enter and suggested prompts all
   produce the same answer for the same question. Clears the input for the
   routes that do not clear it themselves. */
function routeAIQuery(q) {
  if (typeof handleCadastreQuery === "function") {
    handleCadastreQuery(q);
    const f = document.getElementById('ai-input');
    if (f) f.value = '';
  } else {
    handleAIQuery(q);
  }
}

/* =====================================================================
   GENERAL KNOWLEDGE FALLBACK (add-on — light-weight, rule-based)
   Runs ONLY when the cadastral engine (handleCadastreQuery in js/app.js)
   has no match. Intent/topic detection + reusable answer patterns.
   This is NOT a generative AI model, no API, no live data feed.
   Current/time-sensitive questions return a polite "verify with an
   up-to-date source" notice instead of invented answers.
   ===================================================================== */
function GK_isTimeSensitive(q) {
  return /(?:current|today|tonight|latest|news|weather|forecast|temperature|election|budget|prime minister of india|president of india|government of india|government scheme)\b/.test(q);
}
/* Detect open-ended questions that need reasoning, explanation or examples
   rather than a short static definition. These intentionally do NOT match a
   GK topic and instead fall through to the Gemini fallback. */
function GK_isOpenEnded(q) {
  if (q.length > 60) return true;
  if (/(explain why|explain how|give (an?\s+|some |three |two )?examples?|give reasons|why does|how does|compare|difference between|versus|what are the reasons|describe in detail|elaborate on|tell me about|walk me through)/.test(q)) return true;
  return false;
}



var GK_TOPICS = [
  {
    keys: ["3d cadastre", "3d cadastral", "cadastral mapping", "3d mapping"],
    name: "3D Cadastre",
    text: "3D cadastre records property as full three-dimensional volumes (parcel \u2192 building \u2192 floor \u2192 unit), each with legal X/Y/Z extents. This app computes floor and unit volumes in cubic metres (m\u00b3) from elevation data."
  },
  {
    keys: ["smart india hackathon", "hackathon"],
    name: "Smart India Hackathon",
    text: "Smart India Hackathon (SIH) is a national flagship initiative of the Government of India that invites teams to build creative technology solutions for real-world problems. ULPIN 3D is a demonstration prototype built in the spirit of such a platform."
  },
  {
    keys: ["gis"],
    name: "GIS \u2014 Geographic Information System",
    text: "GIS is a system for capturing, storing, analysing and visualising geographic/spatial data. In ULPIN 3D it supports parcel overlays, cadastral layers and map-based queries."
  },
  {
    keys: ["gps"],
    name: "GPS \u2014 Global Positioning System",
    text: "GPS is a satellite-based navigation system that provides location and time anywhere on Earth. This project also uses GNSS/CORS RTK corrections (\u2248 \u00b12 cm) for survey-grade coordinates."
  },
  {
    keys: ["lidar"],
    name: "LiDAR \u2014 Light Detection and Ranging",
    text: "LiDAR measures distances with laser pulses to create precise 3D point clouds and surfaces. In this app, LiDAR/drone data powers the building extraction and floor segmentation demos."
  },
  {
    keys: ["ulpin", "unique land parcel identification number"],
    name: "ULPIN",
    text: "ULPIN (Unique Land Parcel Identification Number) is a unique identifier for land parcels. This app assembles it from state-district-tehsil-village-survey-building-floor-unit-geo segments and can validate or explain it (e.g. ask 'What is the ULPIN of F4-U03?')."
  },
  {
    keys: ["land record", "record of rights", "ror", "7/12", "survey number"],
    name: "Land Records",
    text: "In India, land records typically include the Record of Rights (RoR, e.g. 7/12 extracts) and cadastral maps maintained by the revenue department. This app links them with ULPIN, ownership, boundary and 3D property data for its demo dataset."
  },
  {
    keys: ["parcel"],
    name: "Land Parcel",
    text: "A land parcel is a piece of land with its own survey number and ownership record." + ((typeof window !== "undefined" && window.PARCELS) ? " The demo dataset here contains " + window.PARCELS.length + " parcels." : "")
  },
  {
    re: /\bai\b|artificial intelligence/,
    name: "Artificial Intelligence (AI)",
    text: "AI is the field of making computers perform tasks that usually require human intelligence. IMPORTANT: this assistant is rule-based/demo logic over a fixed dataset \u2014 it now also uses Google Gemini for natural-language questions."
  },
  {
    re: /\bml\b|machine learning/,
    name: "Machine Learning (ML)",
    text: "ML is a branch of AI in which systems learn patterns from data. This demo uses explicit rules and a fixed demonstration dataset rather than trained models."
  },
  {
    keys: ["coordinate", "coordinates"],
    name: "Coordinates",
    text: "Coordinates (latitude/longitude) define a point on Earth. In ULPIN 3D, every parcel is tied to an X (lat) / Y (lng) / Z (elevation) range for 3D volumetric mapping."
  }
];

var GK_CAPITALS = {
  "india": "New Delhi",
  "china": "Beijing",
  "usa": "Washington, D.C.",
  "united states": "Washington, D.C.",
  "united kingdom": "London",
  "britain": "London",
  "england": "London",
  "france": "Paris",
  "germany": "Berlin",
  "japan": "Tokyo",
  "australia": "Canberra",
  "canada": "Ottawa",
  "russia": "Moscow",
  "brazil": "Bras\u00edlia"
};
function answerGeneralQuestion(raw) {
  const q = String(raw || "").toLowerCase().trim();
  if (!q) return null;

  /* Friendly quick replies (reusable patterns). */
  if (/^\s*(hi|hi there|hello|hey|hey there|namaste|good (morning|afternoon|evening)|greetings)[!\\.]*\s*$/i.test(q)) {
    return "Hello! I'm the ULPIN 3D AI assistant. I have a built-in cadastral engine for property/parcel analysis and I'm also connected to Google Gemini for natural-language questions. Ask a cadastral question, e.g. \"Analyze parcel 131/2\", or a general one, e.g. \"What is GIS?\".";
  }
  if (/\b(thanks|thank you|thx)\b/.test(q)) {
    return "You're welcome! Happy to help with cadastral or general questions.";
  }
  if (/\b(who are you|what are you)\b/.test(q)) {
    return "I'm the ULPIN 3D AI assistant. I combine a local cadastral analysis engine (for the demo dataset) with the Google Gemini AI model for natural-language questions about land parcels, buildings, ULPIN, topology, underground infrastructure, maps, and general topics.";
  }
  if (/\b(what can you do|how can you help|help me|commands)\b/.test(q)) {
    return "I can help with:\n\u2022 Cadastral: 'Analyze parcel 131/2', 'How many floors does B01 have?', 'What is the ULPIN of F4-U03?', 'Are there topology conflicts?', 'Show underground utilities', '3D volume of F4-U03'\n\u2022 General knowledge: 'What is GIS?', 'What is LiDAR?', 'What is the capital of India?'";
  }

  /* Current / time-sensitive facts — do NOT guess. */
  if (GK_isTimeSensitive(q)) {
    return "That is current/latest information, and I am a demo assistant with a limited, offline knowledge source (no live data feed). Please verify this from an official or up-to-date source \u2014 e.g. the current Prime Minister / President of India, today's date, news or weather.";
  }

  /* Geography: capital of X (reusable pattern). */
  const capMatch = q.match(/capital of ([a-z ]+)/);
  if (capMatch) {
    const name = capMatch[1].trim().replace(/\s+/g, " ");
    if (GK_CAPITALS.hasOwnProperty(name)) {
      return "The capital of " + name.charAt(0).toUpperCase() + name.slice(1) + " is " + GK_CAPITALS[name] + ".";
    }
  }

  /* Topic / definition detection (reusable pattern).
     Open-ended questions (long queries, or those asking for explanation,
     reasoning, examples, comparison, etc.) are intentionally NOT answered by
     a short static topic — they fall through to the Gemini fallback below. */
  if (!GK_isOpenEnded(q)) {
    for (let i = 0; i < GK_TOPICS.length; i++) {
      const t = GK_TOPICS[i];
      if (t.re) {
        if (t.re.test(q)) return t.name + ": " + t.text;
      } else {
        for (let k = 0; k < t.keys.length; k++) {
          if (q.indexOf(t.keys[k]) !== -1) return t.name + ": " + t.text;
        }
      }
    }
  }

  return null; /* not a general-knowledge question — route to Gemini */
}

function handleAIQuery(query) {
  const inputField = document.getElementById('ai-input');
  const messagesContainer = document.getElementById('ai-chat-messages');
  if (!messagesContainer) return;

  const userMsg = document.createElement('div');
  userMsg.className = 'ai-message ai-user-message';
  userMsg.innerHTML = `<div class="ai-message-content">${query}</div>`;
  messagesContainer.appendChild(userMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  if (inputField) inputField.value = '';

  /* Add-on: same general-knowledge fallback for the defensive engine-B path. */
  const generic = (typeof answerGeneralQuestion === "function") ? answerGeneralQuestion(query) : null;
  const response = generic
    ? { type: "general", title: "General Knowledge", content: generic, recommendations: [] }
    : window.AI_ASSISTANT.generateResponse(query);
  setTimeout(() => {
    const aiMsg = document.createElement('div');
    aiMsg.className = 'ai-message';
    let html = `<div class="ai-message-content"><strong>${response.title}</strong>`;
    if (response.content) {
      if (typeof response.content === 'string') {
        html += `<pre style="white-space: pre-wrap; margin-top: 8px; font-size: 12px; line-height: 1.6;">${response.content}</pre>`;
      }
    }
    if (response.recommendations && response.recommendations.length > 0) {
      html += '<div style="margin-top: 10px;"><strong>Recommendations:</strong><ul style="margin-top: 4px;">';
      response.recommendations.forEach(rec => html += `<li>💡 ${rec}</li>`);
      html += '</ul></div>';
    }
    if (response.prompt) html += `<p style="margin-top: 10px; color: var(--accent);">${response.prompt}</p>`;
    html += '</div>';
    aiMsg.innerHTML = html;
    messagesContainer.appendChild(aiMsg);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 500);
}

function handleAIPrompt(promptText) {
  /* MUST-FIX #1: suggested prompts use the SAME single engine as Send/Enter. */
  routeAIQuery(promptText);
}

async function runAIAnalysisInPage() {
  const select = document.getElementById('ai-analysis-type');
  const resultsContainer = document.getElementById('ai-analysis-results');
  const subtitle = document.getElementById('ai-results-subtitle');
  if (!resultsContainer) return;

  const type = select ? select.value : 'parcel';
  if (subtitle) { subtitle.textContent = `Running ${type} analysis...`; subtitle.style.color = 'var(--accent)'; }

  resultsContainer.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--muted);">
      <div style="font-size: 32px; margin-bottom: 16px;">⏳</div>
      <p>AI analysis in progress...</p>
    </div>
  `;

  setTimeout(async () => {
    const res = await window.CADASTRAL_ANALYZER.runAnalysis(type);
    const scoreClass = res.score >= 90 ? 'high' : res.score >= 70 ? 'medium' : 'low';
    const scoreLabel = res.score >= 90 ? 'Good' : res.score >= 70 ? 'Moderate' : 'Needs Attention';

    let html = `
      <div class="ai-analysis-result">
        <div class="ai-analysis-score ${scoreClass}">${res.score}%</div>
        <p style="text-align: center; margin-bottom: 20px; color: var(--muted);">
          ${scoreLabel} - ${res.issues.length > 0 ? res.issues.length + ' issues detected' : 'No issues found'}
        </p>
    `;

    if (res.issues.length > 0) {
      html += `<h4 style="color: var(--ink-2);">Detected Issues</h4><ul class="ai-issue-list">`;
      res.issues.forEach(issue => {
        html += `<li class="${issue.severity}"><strong>${issue.severity.toUpperCase()}</strong>: ${issue.description}</li>`;
      });
      html += '</ul>';
    } else {
      html += '<p style="color: var(--teal); text-align: center;">✅ No issues detected</p>';
    }

    if (res.recommendations.length > 0) {
      html += `<h4 style="color: var(--ink-2); margin-top: 16px;">Recommendations</h4>`;
      res.recommendations.forEach(rec => html += `<div class="ai-recommendation">💡 ${rec}</div>`);
    }

    html += `
      <div style="margin-top: 20px; padding: 12px; background: rgba(16,24,40,0.03); border-radius: var(--radius-s);">
        <small>Type: ${type} · Scanned: ${res.dataScanned} records · ${new Date(res.timestamp).toLocaleString()}</small>
      </div></div>
    `;
    resultsContainer.innerHTML = html;
    if (subtitle) subtitle.textContent = `Analysis complete: ${res.issues.length} issues found`;
  }, 1000);
}

/* =====================================================================
   LIVE AI BRIDGE — Google Gemini via Supabase Edge Function (FREE tier)
   ---------------------------------------------------------------------
   For questions that the rule-based cadastral engine and the general-
   knowledge fallback cannot answer, this forwards the query (plus the
   current demo dataset as context) to the "gemini-chat" Supabase Edge
   Function, which holds the GEMINI_API_KEY securely and calls the
   Gemini free-tier API.

   If anything fails (no network, missing key, rate limit) the promise
   rejects so the caller can fall back to the existing static help text.
   ===================================================================== */

/* Return the shared Supabase browser client (initialised in googleAuth.js). */
function getAIClient() {
  if (typeof window.getSupabaseAIClient === "function") {
    const c = window.getSupabaseAIClient();
    if (c) return c;
  }
  return null;
}

/* Build a compact snapshot of the demo dataset to give Gemini context. */
function buildDemoContext() {
  const C = (typeof CADASTRE !== "undefined") ? CADASTRE : null;
  if (!C || !C.DATASET) return {};
  const ds = C.DATASET;
  return {
    parcel: ds.parcel || null,
    building: ds.building || null,
    floors: ds.floors || [],
    units: ds.units || {},
    underground: ds.underground || [],
    topology: ds.topology || null,
    ownershipConflicts: ds.ownershipConflicts || [],
    infrastructure: ds.infrastructure || null,
  };
}

/* Call the Gemini Edge Function. Resolves with an HTML string, or rejects. */
async function callGeminiAI(query) {
  const client = getAIClient();
  if (!client) {
    throw new Error("Supabase client not available");
  }
  const context = buildDemoContext();

  const { data, error } = await client.functions.invoke("gemini-chat", {
    body: { query, context },
  });

  if (error) {
    throw new Error(error.message || "Edge Function error");
  }
  if (!data || typeof data.answer !== "string" || !data.answer.trim()) {
    throw new Error("Empty Gemini response");
  }

  // Escape HTML and convert newlines so the answer can be set via innerHTML.
  const escaped = data.answer
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const withBreaks = escaped.replace(/\n/g, "<br>");

  return (
    "<strong>ULPIN AI Assistant</strong>" +
    "<div style=\"margin-top:8px;font-size:12px;line-height:1.6;white-space:pre-wrap;\">" +
    withBreaks +
    "</div>" +
    "<div style=\"margin-top:8px;font-size:10px;color:var(--muted);\">Powered by Google Gemini (free tier) · demonstration data</div>"
  );
}


function renderAIInsights() {
  const container = document.getElementById('ai-insights-container');
  if (!container) return;

  const parcels = window.PARCELS || [];
  const buildings = window.BUILDINGS || [];
  const disputed = parcels.filter(p => p.status === "Disputed").length;
  const disputedUlpins = parcels.filter(p => !p.ulpin).length;

  const insights = [
    { title: "AI Property Health", value: "94%", icon: "🤖", sub: `${disputed} disputed`, class: "ok" },
    { title: "Topology Issues", value: `${disputed + 2}`, icon: "🔍", sub: "2 high priority", class: "danger" },
    { title: "Ownership Conflicts", value: "1", icon: "⚠️", sub: "Requires review", class: "warning" },
    { title: "Missing Data", value: `${disputedUlpins + 3}`, icon: "📋", sub: "ULPIN + elevation gaps", class: "warning" },
    { title: "3D Validation Score", value: "91%", icon: "🏢", sub: `${buildings.length} buildings`, class: "ok" },
    { title: "AI Confidence", value: "96%", icon: "📈", sub: "High accuracy", class: "ok" }
  ];

  container.innerHTML = insights.map(insight => `
    <div class="ai-insight-card">
      <div class="ai-insight-header">
        <div class="ai-insight-icon">${insight.icon}</div>
        <div>
          <div class="ai-insight-title">${insight.title}</div>
          <div class="ai-insight-value ${insight.class || ''}">${insight.value}</div>
          <div class="ai-insight-sub">${insight.sub}</div>
        </div>
      </div>
    </div>
  `).join('');
}

