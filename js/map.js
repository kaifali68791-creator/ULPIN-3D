/* =====================================================================
   ULPIN 3D — Real interactive Leaflet map (OpenStreetMap, no API key)
   Replaces the previous SVG placeholder in the Map Viewer only.
   ===================================================================== */
"use strict";

/* ---------- India-only demo property dataset (replace with API later) ---------- */
const INDIA_BOUNDS = { sw: [6.0, 68.0], ne: [37.5, 97.5] };

function isInIndia(lat, lng) {
  return lat >= INDIA_BOUNDS.sw[0] && lat <= INDIA_BOUNDS.ne[0] &&
         lng >= INDIA_BOUNDS.sw[1] && lng <= INDIA_BOUNDS.ne[1];
}

const INDIA_PROPERTIES = [
  {
    id: "PROP-001", ulpin: "ULPIN-DEMO-0101", ownerName: "Rajesh Malhotra",
    state: "Delhi (NCT)", district: "South West Delhi", locality: "Vasant Vihar",
    lat: 28.5600, lng: 77.1600, landArea: "280 sq.yd.", propertyType: "Residential",
    buildingType: "Independent House", floors: 3, builtUpArea: "1,850 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Verified",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Residential", area: "620 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Residential", area: "620 sq.ft." },
      { floor: "2nd Floor", unit: "F2-01", usage: "Residential", area: "610 sq.ft." }
    ]
  },
  {
    id: "PROP-002", ulpin: "ULPIN-DEMO-0202", ownerName: "Meera Iyer",
    state: "Maharashtra", district: "Mumbai Suburban", locality: "Bandra West",
    lat: 19.0596, lng: 72.8295, landArea: "1,150 sq.ft.", propertyType: "Commercial",
    buildingType: "Retail Showroom", floors: 2, builtUpArea: "2,240 sq.ft.",
    ownershipStatus: "Leasehold", verificationStatus: "Verified",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Retail", area: "1,120 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Storage", area: "1,120 sq.ft." }
    ]
  },
  {
    id: "PROP-003", ulpin: "ULPIN-DEMO-0303", ownerName: "Suresh Kumar Rao",
    state: "Karnataka", district: "Bengaluru Urban", locality: "Indiranagar",
    lat: 12.9784, lng: 77.6408, landArea: "2,400 sq.ft.", propertyType: "Residential",
    buildingType: "G+2 House", floors: 3, builtUpArea: "3,150 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Pending Verification",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Residential", area: "1,050 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Residential", area: "1,050 sq.ft." },
      { floor: "2nd Floor", unit: "F2-01", usage: "Residential", area: "1,050 sq.ft." }
    ]
  },
  {
    id: "PROP-004", ulpin: "ULPIN-DEMO-0404", ownerName: "Ananya Reddy",
    state: "Telangana", district: "Hyderabad", locality: "Banjara Hills",
    lat: 17.4126, lng: 78.4392, landArea: "500 sq.yd.", propertyType: "Residential",
    buildingType: "Villa", floors: 2, builtUpArea: "3,600 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Verified",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Residential", area: "1,800 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Residential", area: "1,800 sq.ft." }
    ]
  },
  {
    id: "PROP-005", ulpin: "ULPIN-DEMO-0505", ownerName: "R. Selvam (Selvam Textiles Pvt Ltd)",
    state: "Tamil Nadu", district: "Chennai", locality: "T. Nagar",
    lat: 13.0418, lng: 80.2341, landArea: "4,800 sq.ft.", propertyType: "Commercial",
    buildingType: "Commercial Complex", floors: 5, builtUpArea: "18,500 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Verified",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Retail", area: "4,200 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Retail", area: "3,900 sq.ft." },
      { floor: "2nd Floor", unit: "F2-01", usage: "Office", area: "3,600 sq.ft." },
      { floor: "3rd Floor", unit: "F3-01", usage: "Office", area: "3,500 sq.ft." },
      { floor: "4th Floor", unit: "F4-01", usage: "Office", area: "3,300 sq.ft." }
    ]
  },
  {
    id: "PROP-006", ulpin: "ULPIN-DEMO-0606", ownerName: "Vikram Kulkarni",
    state: "Maharashtra", district: "Pune", locality: "Kothrud",
    lat: 18.5074, lng: 73.8077, landArea: "3,500 sq.ft.", propertyType: "Residential",
    buildingType: "Row House", floors: 3, builtUpArea: "2,700 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Verified",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Residential + Parking", area: "950 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Residential", area: "900 sq.ft." },
      { floor: "2nd Floor", unit: "F2-01", usage: "Residential", area: "850 sq.ft." }
    ]
  },
  {
    id: "PROP-007", ulpin: "ULPIN-DEMO-0707", ownerName: "Arjun Singhania",
    state: "Rajasthan", district: "Jaipur", locality: "Malviya Nagar",
    lat: 26.8567, lng: 75.8141, landArea: "600 sq.yd.", propertyType: "Mixed Use",
    buildingType: "Mixed Use Building", floors: 4, builtUpArea: "5,200 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Pending Verification",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Retail", area: "1,500 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Office", area: "1,350 sq.ft." },
      { floor: "2nd Floor", unit: "F2-01", usage: "Residential", area: "1,250 sq.ft." },
      { floor: "3rd Floor", unit: "F3-01", usage: "Residential", area: "1,100 sq.ft." }
    ]
  },
  {
    id: "PROP-008", ulpin: "ULPIN-DEMO-0808", ownerName: "Poonam Devi",
    state: "Bihar", district: "Patna", locality: "Gandhi Maidan",
    lat: 25.6165, lng: 85.1370, landArea: "3,200 sq.ft.", propertyType: "Residential",
    buildingType: "Independent House", floors: 2, builtUpArea: "2,400 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Verified",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Residential", area: "1,200 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Residential", area: "1,200 sq.ft." }
    ]
  },
  {
    id: "PROP-009", ulpin: "ULPIN-DEMO-0909", ownerName: "Raghavendra Pratap Singh",
    state: "Uttar Pradesh", district: "Lucknow", locality: "Gomti Nagar",
    lat: 26.8500, lng: 81.0080, landArea: "4,000 sq.ft.", propertyType: "Residential",
    buildingType: "Villa", floors: 2, builtUpArea: "3,400 sq.ft.",
    ownershipStatus: "Freehold", verificationStatus: "Pending Verification",
    floorDetails: [
      { floor: "Ground Floor", unit: "GF-01", usage: "Residential", area: "1,700 sq.ft." },
      { floor: "1st Floor", unit: "F1-01", usage: "Residential", area: "1,700 sq.ft." }
    ]
  }
];

/* ---------- Cadastral mock DB (separate from spatial data) ----------
   Ownership records are LINKED to coordinates and resolved by
   proximity when a building footprint is clicked. Replace this
   object with state land-record APIs / authorized cadastral
   databases in Phase 2 — the panel rendering does not change.     */
const CadastralDB = {
  records: INDIA_PROPERTIES,
  lookup(lat, lng, radiusM) {
    let best = null, bestD = Infinity;
    this.records.forEach((r) => {
      const d = haversineM(lat, lng, r.lat, r.lng);
      if (d < bestD) { bestD = d; best = r; }
    });
    if (best && bestD <= radiusM) {
      const out = Object.assign({}, best);
      out._distM = Math.round(bestD);
      return out;
    }
    return null;
  }
};

function haversineM(la1, lo1, la2, lo2) {
  const R = 6371000, rad = Math.PI / 180;
  const dLa = (la2 - la1) * rad, dLo = (lo2 - lo1) * rad;
  const a = Math.sin(dLa / 2) * Math.sin(dLa / 2) +
            Math.cos(la1 * rad) * Math.cos(la2 * rad) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ---------- Demo parcel fill colours (match map legend) ---------- */
const PARCEL_FILL = { Residential: "#38bdf8", Agricultural: "#4ade80", Commercial: "#f472b6", Institutional: "#a78bfa" };

/* ---------- Leaflet state ---------- */
let lmap = null;
let propsLayer = null;
let parcelsLayer = null;
let undergroundLayer = null;
let surveyLayer = null;
const parcelPolygons = {};   // parcel id -> L.Polygon
const propMarkers = {};      // property id -> L.Marker
let selBld = null;           // currently selected building footprint polygon
const BLD = {                // India-wide footprint discovery (zoom-dependent)
  layer: null, renderer: null, statusEl: null,
  timer: null, ctrl: null, reqId: 0, cache: new Map()
};
const BLD_ZOOM_MIN = 16;     /* zoom level at which footprints are fetched */
const BLD_MAX_SPAN = 0.035;  /* max query bbox span (deg) around map centre */

/* ---------- Teardrop pin (default + selected highlight) ---------- */
function propIcon(selected) {
  return L.divIcon({
    className: "",
    html: '<div class="prop-pin' + (selected ? " sel" : "") + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-6h4v6"/></svg></div>',
    iconSize: [30, 38],
    iconAnchor: [15, 36]
  });
}

const PROP_PANEL_EMPTY =
  '<div class="pd-empty"><div class="pd-ico"><span class="ni-ico" data-i="pin"></span></div>' +
  "<p>Select a property marker or parcel on the map to view its details.</p></div>";

function parcelPopup(p) {
  return '<div class="map-popup">' +
    "<strong>Survey " + esc(p.survey) + "</strong>" +
    "<div class='mp-row'><span>Property ID</span><b>" + esc(p.id) + "</b></div>" +
    "<div class='mp-row'><span>ULPIN</span><b>" + esc(ulpinFor(p)) + "</b></div>" +
    "<div class='mp-row'><span>Type</span><b>" + esc(p.use) + "</b></div>" +
    "<div class='mp-row'><span>Area</span><b>" + fmtArea(p.area) + " sq.m</b></div>" +
    "<div class='mp-row'><span>Owner</span><b>" + esc(p.owner) + "</b></div>" +
    "<div class='mp-note'>Sample cadastral parcel — platform data</div>" +
    "</div>";
}

/* ---------- Map creation (once) ---------- */
function initLeafletMap(selected) {
  const el = document.getElementById("map");
  if (!el || typeof L === "undefined") return;

  if (!lmap) {
    el.innerHTML = "";
    lmap = L.map(el, { center: [20.5937, 78.9629], zoom: 5, worldCopyJump: true });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(lmap);

    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
    });

    /* India-only demo property markers -> Property Details panel */
    propsLayer = L.layerGroup().addTo(lmap);
    INDIA_PROPERTIES.filter((p) => isInIndia(p.lat, p.lng)).forEach((p) => {
      const mk = L.marker([p.lat, p.lng], { icon: propIcon(false), title: p.locality + " — " + p.id })
        .addTo(propsLayer);
      mk.on("click", () => selectProperty(p));
      propMarkers[p.id] = mk;
    });

    /* Sample parcel polygons (demo cadastral data around Pune) */
    parcelsLayer = L.layerGroup().addTo(lmap);
    PARCELS.forEach((p) => {
      const poly = L.polygon(p.pts.map((pt) => [pt.lat, pt.lng]), {
        color: "#1e3a5f", weight: 1.5,
        fillColor: PARCEL_FILL[p.use] || "#93c5fd", fillOpacity: 0.45
      }).addTo(parcelsLayer);
      poly.bindPopup(parcelPopup(p), { maxWidth: 260 });
      poly.on("click", () => selectParcel(p));
      parcelPolygons[p.id] = poly;
    });


    /* Underground infrastructure + Survey data layers (demo) */
    undergroundLayer = L.layerGroup();
    var demoCadastre = (typeof CADASTRE !== "undefined" && CADASTRE.DATASET && CADASTRE.DATASET.underground) ? CADASTRE.DATASET.underground : [];
    var demoParcelLat = (typeof CADASTRE !== "undefined" && CADASTRE.DATASET && CADASTRE.DATASET.parcel) ? CADASTRE.DATASET.parcel.lat : 18.5456;
    var demoParcelLng = (typeof CADASTRE !== "undefined" && CADASTRE.DATASET && CADASTRE.DATASET.parcel) ? CADASTRE.DATASET.parcel.lng : 73.8234;
    if (demoCadastre.length > 0) {
      var offsets = [[0.00012, 0.0001], [-0.0001, 0.00014], [0.00016, -0.00008], [-0.00014, -0.00012], [0, 0.0002], [0.00008, -0.00018]];
      demoCadastre.forEach(function(a, i) {
        var off = offsets[i % offsets.length];
        var m = L.marker([demoParcelLat + off[0], demoParcelLng + off[1]], {
          icon: L.divIcon({ className: "", html: "<div class='undg-pin'></div>", iconSize: [14, 14], iconAnchor: [7, 7] })
        });
        m.bindPopup("<b>" + (a.type || "Underground Asset") + "</b><br>ID: " + (a.id || "â€”") + "<br>Authority: " + (a.authority || "â€”") + "<br>Depth: " + (a.depth != null ? a.depth + " m" : "â€”") + "<br>Status: " + (a.status || "â€”"));
        m.addTo(undergroundLayer);
      });
    }
    surveyLayer = L.layerGroup();
    PARCELS.forEach(function(p) {
      var mk = L.circleMarker([p.pts[0].lat, p.pts[0].lng], { radius: 5, color: "#1e3a5f", fillColor: "#fbbf24", fillOpacity: 0.9, weight: 1.5 });
      mk.bindPopup("<b>Survey " + esc(p.survey) + "</b><br>Owner: " + esc(p.owner) + "<br>Use: " + esc(p.use) + "<br>Area: " + fmtArea(p.area) + " sq.m");
      mk.addTo(surveyLayer);
    });
    /* India-wide building-footprint discovery (zoom-dependent) */
    BLD.renderer = L.canvas({ padding: 0.3 });
    BLD.layer = L.layerGroup().addTo(lmap);
    const stage = lmap.getContainer().parentElement;
    if (stage && !document.getElementById("bld-status")) {
      BLD.statusEl = document.createElement("div");
      BLD.statusEl.id = "bld-status";
      BLD.statusEl.className = "bld-status";
      stage.appendChild(BLD.statusEl);
    }
    lmap.on("moveend zoomend", updateBuildingDiscovery);

    wireLayerPanel();
    wireMapSearch();
    addMapControls();
    updateBuildingDiscovery();
  }

  /* The container may have been display:none when first created.
     Fly to a parcel only after an explicit selection (state.mapFocusPending). */
  if (state.view === "map") {
    lmap.invalidateSize();
    if (selected && state.mapFocusPending) { focusParcel(selected); state.mapFocusPending = false; }
  }
}

/* ---------- Fly to / open a parcel on the real map ---------- */
function focusParcel(p) {
  if (!lmap) return;
  const poly = parcelPolygons[p.id];
  if (poly) {
    lmap.flyToBounds(poly.getBounds().pad(0.35), { maxZoom: 17, duration: 0.7 });
    poly.openPopup();
  }
}

/* ===================== INDIA-ONLY PROPERTY DETAILS ===================== */
function selectProperty(p) {
  if (!p) return;
  if (!isInIndia(p.lat, p.lng)) {
    toast("Property records are available within India only.", "info", 3200);
    return;
  }
  state.selectedProperty = p;
  clearSpatialSelection();
  Object.keys(propMarkers).forEach((id) => propMarkers[id].setIcon(propIcon(id === p.id)));
  renderPropertyPanel(p);
}

function closePropertyPanel() {
  state.selectedProperty = null;
  clearSpatialSelection();
  Object.keys(propMarkers).forEach((id) => propMarkers[id].setIcon(propIcon(false)));
  const box = $("#parcel-detail");
  if (box) {
    box.innerHTML = PROP_PANEL_EMPTY;
    if (typeof mountIcons === "function") mountIcons(box);
  }
}

function verBadge(status) {
  const ok = /verified/i.test(status) && !/pending/i.test(status);
  return '<b class="' + (ok ? "status-ok" : "status-warn") + '">' + (ok ? "&#10003; " : "&#8986; ") + esc(status) + "</b>";
}

function renderPropertyPanel(p) {
  const box = $("#parcel-detail");
  if (!box || !p) return;
  const floorsHtml = (p.floorDetails || []).map((f) =>
    '<div class="floor-card"><em>' + esc(f.floor) + "</em>" +
    "<div class='fr'><span>Unit</span><b>" + esc(f.unit) + "</b></div>" +
    "<div class='fr'><span>Usage</span><b>" + esc(f.usage) + "</b></div>" +
    "<div class='fr'><span>Area</span><b>" + esc(f.area) + "</b></div>" +
    "</div>"
  ).join("");

  box.innerHTML =
    '<div class="prop-card">' +
      '<div class="prop-head">' +
        "<div>" +
          '<span class="pp-tag">PLATFORM DATA</span>' +
          "<h4>" + esc(p.id) + "</h4>" +
          "<p class='sub'>" + esc(p.locality) + ", " + esc(p.state) + "</p>" +
        "</div>" +
        '<button type="button" class="prop-close" data-close-prop title="Close panel">&times;</button>' +
      "</div>" +
      (p.linkedNote ? '<div class="prop-link">' + esc(p.linkedNote) + "</div>" : "") +
      '<div class="prop-grid">' +
        '<div class="prop-item wide"><span>Owner Name</span><b>' + esc(p.ownerName) + "</b></div>" +
        '<div class="prop-item wide"><span>ULPIN</span><b class="prop-mono">' + esc(p.ulpin) + "</b></div>" +
        '<div class="prop-item"><span>State</span><b>' + esc(p.state) + "</b></div>" +
        '<div class="prop-item"><span>District</span><b>' + esc(p.district) + "</b></div>" +
        '<div class="prop-item wide"><span>Village / Locality</span><b>' + esc(p.locality) + "</b></div>" +
        '<div class="prop-item"><span>Latitude</span><b>' + p.lat.toFixed(4) + "</b></div>" +
        '<div class="prop-item"><span>Longitude</span><b>' + p.lng.toFixed(4) + "</b></div>" +
        '<div class="prop-item"><span>Land Area</span><b>' + esc(p.landArea) + "</b></div>" +
        '<div class="prop-item"><span>Property Type</span><b>' + esc(p.propertyType) + "</b></div>" +
        '<div class="prop-item wide"><span>Building Type</span><b>' + esc(p.buildingType) + "</b></div>" +
        '<div class="prop-item"><span>Number of Floors</span><b>' + p.floors + "</b></div>" +
        '<div class="prop-item"><span>Built-up Area</span><b>' + esc(p.builtUpArea) + "</b></div>" +
        '<div class="prop-item"><span>Ownership Status</span><b>' + esc(p.ownershipStatus) + "</b></div>" +
        '<div class="prop-item wide"><span>Verification Status</span>' + verBadge(p.verificationStatus) + "</div>" +
      "</div>" +
      '<div class="prop-floors"><strong>Floor Details</strong>' + floorsHtml + "</div>" +
      '<div class="pp-note">Sample records for demonstration only &mdash; not actual government ownership data. Coverage: India.</div>' +
    "</div>";

  const closeBtn = box.querySelector("[data-close-prop]");
  if (closeBtn) closeBtn.addEventListener("click", closePropertyPanel);
}

/* ===================== INDIA-WIDE BUILDING DISCOVERY (zoom-dependent) ===================== */
function spatialBaseStyle() {
  return { color: "#1d4ed8", weight: 1, fillColor: "#3b82f6", fillOpacity: 0.3, renderer: BLD.renderer };
}
function spatialSelStyle() {
  return { color: "#f59e0b", weight: 2.5, fillColor: "#f59e0b", fillOpacity: 0.55 };
}

function bldSetStatus(html, cls) {
  if (!BLD.statusEl) return;
  BLD.statusEl.className = "bld-status " + (cls || "");
  BLD.statusEl.innerHTML = html;
  BLD.statusEl.style.display = html ? "block" : "none";
}

/* Visible bounds clamped to India, capped around the centre for light queries. */
function bldQueryBBox() {
  const b = lmap.getBounds();
  let s = Math.max(b.getSouth(), INDIA_BOUNDS.sw[0]), w = Math.max(b.getWest(), INDIA_BOUNDS.sw[1]);
  let n = Math.min(b.getNorth(), INDIA_BOUNDS.ne[0]), e = Math.min(b.getEast(), INDIA_BOUNDS.ne[1]);
  if (s >= n || w >= e) return null;                        /* viewport outside India */
  const c = lmap.getCenter();
  if (n - s > BLD_MAX_SPAN) { s = Math.max(s, c.lat - BLD_MAX_SPAN / 2); n = Math.min(n, s + BLD_MAX_SPAN); }
  if (e - w > BLD_MAX_SPAN) { w = Math.max(w, c.lng - BLD_MAX_SPAN / 2); e = Math.min(e, w + BLD_MAX_SPAN); }
  return [s.toFixed(5), w.toFixed(5), n.toFixed(5), e.toFixed(5)];
}

function clearBldLayer() { if (BLD.layer) BLD.layer.clearLayers(); }

function updateBuildingDiscovery() {
  if (!lmap || !BLD.layer) return;
  if (state.view !== "map" || !state.buildingsEnabled || state.mapMode3d) {
    bldSetStatus("");
    if (lmap.hasLayer(BLD.layer)) lmap.removeLayer(BLD.layer);
    return;
  }
  if (!lmap.hasLayer(BLD.layer)) BLD.layer.addTo(lmap);
  const z = lmap.getZoom();
  if (z < BLD_ZOOM_MIN) {
    clearBldLayer();
    bldSetStatus("Zoom in to level " + BLD_ZOOM_MIN + "+ to discover building footprints", "muted");
    return;
  }
  const bb = bldQueryBBox();
  if (!bb) { clearBldLayer(); bldSetStatus("Outside India — property discovery unavailable", "warn"); return; }
  const key = bb.join(",");
  if (BLD.cache.has(key)) { renderFootprints(BLD.cache.get(key)); return; }
  if (BLD.timer) clearTimeout(BLD.timer);
  bldSetStatus("Loading building footprints…", "muted");
  BLD.timer = setTimeout(() => runDiscovery(key, bb), 350);   /* debounce pan */
}

async function runDiscovery(key, bb) {
  const myReq = ++BLD.reqId;
  if (BLD.ctrl) BLD.ctrl.abort();                            /* cancel in-flight */
  BLD.ctrl = new AbortController();
  try {
    const buildings = await GeoService.fetchBuildingsInBBox(bb[0], bb[1], bb[2], bb[3], BLD.ctrl.signal);
    if (myReq !== BLD.reqId) return;
    BLD.cache.set(key, buildings);
    if (BLD.cache.size > 40) BLD.cache.delete(BLD.cache.keys().next().value);
    renderFootprints(buildings);
  } catch (err) {
    if (myReq !== BLD.reqId || (err && err.name === "AbortError")) return;
    clearBldLayer();
    bldSetStatus('Building data unavailable for this area — <a href="#" id="bld-retry">Retry</a>', "warn");
    const r = document.getElementById("bld-retry");
    if (r) r.addEventListener("click", (ev) => { ev.preventDefault(); BLD.cache.delete(key); updateBuildingDiscovery(); });
  }
}

function renderFootprints(buildings) {
  if (!lmap || !BLD.layer || lmap.getZoom() < BLD_ZOOM_MIN) return;
  clearBldLayer();
  buildings.forEach((b) => {
    const info = GeoService.describeTags(b.tags);
    const poly = L.polygon(b.latlngs, spatialBaseStyle()).addTo(BLD.layer);
    poly.bindTooltip(info.name || info.address || "Building footprint", { direction: "top", sticky: true });
    poly._bld = b;
    poly._info = info;
    poly.on("click", () => selectSpatialProperty(poly));
    if (state.selectedSpatial && state.selectedSpatial._bld && state.selectedSpatial._bld.id === b.id) {
      selBld = poly;                                          /* re-apply selection after re-render */
      poly.setStyle(spatialSelStyle());
    }
  });
  bldSetStatus(buildings.length + " building" + (buildings.length === 1 ? "" : "s") + " in view · " + GeoService.source, "muted");
}

function clearSpatialSelection() {
  if (selBld) { selBld.setStyle(spatialBaseStyle()); selBld = null; }
  state.selectedSpatial = null;
}

/* Click on a footprint -> cadastral record if linked, spatial-only panel otherwise. */
function selectSpatialProperty(poly) {
  if (!poly || !poly._bld) return;
  if (selBld && selBld !== poly) selBld.setStyle(spatialBaseStyle());
  selBld = poly;
  poly.setStyle(spatialSelStyle());
  if (poly.bringToFront) poly.bringToFront();
  state.selectedSpatial = poly;
  state.selectedProperty = null;
  const b = poly._bld, info = poly._info;
  const rec = CadastralDB.lookup(b.centerLat, b.centerLng, 400);   /* demo proximity match */
  if (rec) {
    const linked = Object.assign({}, rec, {
      linkedNote: "Matched local cadastral record " + rec.id + " by proximity (~" + rec._distM + " m from the clicked footprint)."
    });
    renderPropertyPanel(linked);
  } else {
    renderSpatialPanel(b, info);
  }
}

/* No fabrication: spatial panel without owner/ULPIN. */
function renderSpatialPanel(b, info) {
  const box = $("#parcel-detail");
  if (!box || !b) return;
  const area = GeoService.footprintAreaM2(b.latlngs);
  const areaTxt = area ? area.toLocaleString("en-IN", { maximumFractionDigits: 0 }) + " m² (approx.)" : "—";
  box.innerHTML =
    '<div class="prop-card">' +
      '<div class="prop-head">' +
        "<div>" +
          '<span class="badge-na">CADASTRAL DATA NOT AVAILABLE</span>' +
          "<h4>Spatial property detected</h4>" +
          "<p class='sub'>" + esc(info.name || info.address || "Unnamed building footprint") + "</p>" +
        "</div>" +
        '<button type="button" class="prop-close" data-close-prop title="Close panel">&times;</button>' +
      "</div>" +
      '<div class="prop-callout">Government cadastral record is not connected for this location. Showing available spatial information only.</div>' +
      '<div class="prop-grid">' +
        '<div class="prop-item"><span>Latitude</span><b>' + b.centerLat.toFixed(6) + "</b></div>" +
        '<div class="prop-item"><span>Longitude</span><b>' + b.centerLng.toFixed(6) + "</b></div>" +
        '<div class="prop-item wide"><span>Address / Locality</span><b>' + esc(info.address || info.name || "Not available") + "</b></div>" +
        '<div class="prop-item"><span>Building Type</span><b>' + esc(info.type || "Not tagged") + "</b></div>" +
        '<div class="prop-item"><span>Floors (tagged)</span><b>' + esc(info.levels || "Not tagged") + "</b></div>" +
        '<div class="prop-item"><span>Height (tagged)</span><b>' + esc(info.height || "Not tagged") + "</b></div>" +
        '<div class="prop-item"><span>Footprint Area</span><b>' + areaTxt + "</b></div>" +
        '<div class="prop-item"><span>Spatial Source</span><b>OpenStreetMap</b></div>' +
      "</div>" +
      '<div class="pp-note">Geometry © OpenStreetMap contributors. Owner names / ULPIN are never invented for arbitrary locations — connect a state land-record API or GIS parcel service to show cadastral details here.</div>' +
    "</div>";
  const closeBtn = box.querySelector("[data-close-prop]");
  if (closeBtn) closeBtn.addEventListener("click", closePropertyPanel);
}

/* ---------- Layers panel (checkboxes) ---------- */
function wireLayerPanel() {
  const props = document.getElementById("layer-properties");
  const parc = document.getElementById("layer-parcels");
  const bld = document.getElementById("layer-buildings");
  const undg = document.getElementById("layer-underground");
  const surv = document.getElementById("layer-survey");
  if (props && propsLayer) props.addEventListener("change", () => { props.checked ? propsLayer.addTo(lmap) : lmap.removeLayer(propsLayer); });
  if (parc && parcelsLayer) parc.addEventListener("change", () => { parc.checked ? parcelsLayer.addTo(lmap) : lmap.removeLayer(parcelsLayer); });
  if (bld) bld.addEventListener("change", () => {
    state.buildingsEnabled = bld.checked;
    updateBuildingDiscovery();
  });
  if (undg) undg.addEventListener("change", () => {
    if (!undergroundLayer) return;
    if (undg.checked) {
      undergroundLayer.addTo(lmap);
      if (undergroundLayer.getLayers().length < 1) toast("No underground dataset loaded — connect a backend to plot assets.", "info", 3200);
    } else {
      lmap.removeLayer(undergroundLayer);
    }
  });
  if (surv) surv.addEventListener("change", () => {
    if (!surveyLayer) return;
    if (surv.checked) {
      surveyLayer.addTo(lmap);
      toast("Survey Data layer shown — " + PARCELS.length + " sample survey points.", "info", 2400);
    } else {
      lmap.removeLayer(surveyLayer);
    }
  });
}

/* ---------- Header seg buttons (Parcels / Underground) ---------- */
function setMapSegLayer(layer) {
  if (!lmap) return;
  if (layer === "underground") {
    if (!undergroundLayer) return;
    var cb = document.getElementById("layer-underground");
    if (cb && !cb.checked) {
      cb.checked = true;
      undergroundLayer.addTo(lmap);
      if (undergroundLayer.getLayers().length < 1) toast("No underground dataset loaded — connect a backend to plot assets.", "info", 3200);
      else toast("Underground Infrastructure layer shown.", "info", 2400);
    }
  }
}

/* ---------- Lightweight local search (no geocoding service) ---------- */
function wireMapSearch() {
  const input = document.getElementById("map-search");
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !lmap) return;
    const q = input.value.trim().toLowerCase();
    if (!q) return;
    const m = INDIA_PROPERTIES.find((x) =>
      x.locality.toLowerCase().includes(q) || x.state.toLowerCase().includes(q) ||
      x.id.toLowerCase().includes(q) || x.ownerName.toLowerCase().includes(q));
    if (m) {
      if (!isInIndia(m.lat, m.lng)) { toast("Property records are available within India only.", "info", 3200); return; }
      lmap.flyTo([m.lat, m.lng], 13, { duration: 0.8 });
      selectProperty(m);
      return;
    }
    const p = PARCELS.find((x) => x.survey.toLowerCase().includes(q) || x.owner.toLowerCase().includes(q));
    if (p) { selectParcel(p); focusParcel(p); }
    else toast("Location not found in the local index. Try <b>Delhi, Mumbai, Bengaluru, Hyderabad, Chennai</b> or a survey number.", "info", 4200);
  });
}

/* ---------- Locate + Fullscreen custom controls ---------- */
function addMapControls() {
  const LocateCtl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const div = L.DomUtil.create("div", "leaflet-bar");
      const a = L.DomUtil.create("a", "", div);
      a.href = "#"; a.innerHTML = "&#8982;"; a.title = "Locate me"; a.setAttribute("role", "button");
      L.DomEvent.on(a, "click", (e) => {
        L.DomEvent.preventDefault(e);
        if (!navigator.geolocation) return toast("Geolocation is not available in this browser.", "err");
        let watchId = null;
        const accuracyCircle = null;
        const onSuccess = (pos) => {
          const lat = pos.coords.latitude, lng = pos.coords.longitude;
          const acc = pos.coords.accuracy || 0;
          if (window._locateMarker) lmap.removeLayer(window._locateMarker);
          if (window._locateAccCircle) lmap.removeLayer(window._locateAccCircle);
          window._locateMarker = L.marker([lat, lng], {
            icon: L.divIcon({ className: "", html: "<div class='locate-pin'></div>", iconSize: [18, 18], iconAnchor: [9, 9] })
          }).addTo(lmap);
          window._locateAccCircle = L.circle([lat, lng], { radius: acc, color: "#2563eb", weight: 1, fillColor: "#2563eb", fillOpacity: 0.12 }).addTo(lmap);
          const zoom = acc < 50 ? 17 : acc < 200 ? 15 : 13;
          lmap.flyTo([lat, lng], zoom, { duration: 1 });
          if (acc > 500) toast("Location accuracy is low (~" + Math.round(acc) + " m). Try moving to an open area.", "info", 3500);
        };
        const onError = (err) => {
          const msg = err.code === 1 ? "Location permission denied — sample markers stay visible."
            : err.code === 2 ? "Location unavailable — sample markers stay visible."
            : "Location request timed out — sample markers stay visible.";
          toast(msg, "info");
        };
        navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        watchId = navigator.geolocation.watchPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: 0, maximumAge: 0 });
        setTimeout(() => { if (watchId != null) navigator.geolocation.clearWatch(watchId); }, 30000);
      });
      return div;
    }
  });
  const FullscreenCtl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {
      const div = L.DomUtil.create("div", "leaflet-bar");
      const a = L.DomUtil.create("a", "", div);
      a.href = "#"; a.innerHTML = "&#x26F6;"; a.title = "Toggle fullscreen"; a.setAttribute("role", "button");
      L.DomEvent.on(a, "click", (e) => {
        L.DomEvent.preventDefault(e);
        const stage = document.querySelector(".leaflet-stage");
        if (!document.fullscreenElement) stage.requestFullscreen().then(() => setTimeout(() => lmap.invalidateSize(), 250));
        else document.exitFullscreen().then(() => setTimeout(() => lmap.invalidateSize(), 250));
      });
      return div;
    }
  });
  lmap.addControl(new LocateCtl());
  lmap.addControl(new FullscreenCtl());
}
