# -*- coding: utf-8 -*-
js = """
"use strict";

const INDIA_BOUNDS = { sw: [6.0, 68.0], ne: [37.5, 97.5] };
function isInIndia(lat, lng) {
  return lat >= INDIA_BOUNDS.sw[0] && lat <= INDIA_BOUNDS.ne[0] &&
         lng >= INDIA_BOUNDS.sw[1] && lng <= INDIA_BOUNDS.ne[1];
}

let lmap = null, propsLayer, parcelsLayer, infraLayer, airLayer, surveyLayer;
const propMarkers = {};
const propPolys = {};
let selMarker = null, selPoly = null;
const CLUSTER_ZOOM_STATE = 6, CLUSTER_ZOOM_CITY = 11;

function propIcon(sel) {
  return L.divIcon({
    className: "",
    html: '<div class="prop-pin' + (sel ? " sel" : "") + '">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">' +
      '<path d="M3 21h18M5 21V10l7-5 7 5v11M10 21v-6h4v6"/></svg></div>',
    iconSize: [30, 38], iconAnchor: [15, 36]
  });
}
const PROP_PANEL_EMPTY =
  '<div class="pd-empty"><div class="pd-ico"><span class="ni-ico" data-i="pin"></span></div>' +
  '<p>Click any parcel or property marker on the map to inspect its details.</p></div>';

function initLeafletMap() {
  const el = document.getElementById("map");
  if (!el || typeof L === "undefined") return;
  if (lmap) { if (state.view === "map") lmap.invalidateSize(); return; }
  lmap = L.map(el, { center: [20.5937, 78.9629], zoom: 5, worldCopyJump: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(lmap);
  propsLayer = L.layerGroup().addTo(lmap);
  parcelsLayer = L.layerGroup().addTo(lmap);
  infraLayer = L.layerGroup();
  airLayer = L.layerGroup();
  surveyLayer = L.layerGroup();
  lmap.on("moveend zoomend", refreshPropertyLayers);
  wireMapSearch(); wireLayerPanel(); addMapControls();
  refreshPropertyLayers();
}

function clearDemoLayers() {
  propsLayer.clearLayers(); parcelsLayer.clearLayers();
  for (const k in propMarkers) delete propMarkers[k];
  for (const k in propPolys) delete propPolys[k];
}
function refreshPropertyLayers() {
  if (!lmap || state.view !== "map" || state.mapMode3d) return;
  clearDemoLayers();
  const z = lmap.getZoom();
  const list = DEMO.filterProperties(state.mapFilters || {});
  if (z < CLUSTER_ZOOM_STATE) renderStateClusters(list);
  else if (z < CLUSTER_ZOOM_CITY) renderCityClusters(list);
  else renderParcels(list);
}
function renderStateClusters(list) {
  const g = {};
  list.forEach((p) => { (g[p.state] = g[p.state] || []).push(p); });
  Object.keys(g).forEach((st) => {
    const it = g[st], c = centroidOf(it);
    const mk = L.marker(c, { icon: clusterIcon(it.length, "state") }).addTo(propsLayer);
    mk.bindTooltip(st + " (" + it.length + " properties)");
    mk.on("click", () => lmap.flyTo(c, CLUSTER_ZOOM_CITY, { duration: 0.8 }));
  });
}
function renderCityClusters(list) {
  const g = {};
  list.forEach((p) => { (g[p.city] = g[p.city] || []).push(p); });
  Object.keys(g).forEach((ci) => {
    const it = g[ci], c = centroidOf(it);
    const mk = L.marker(c, { icon: clusterIcon(it.length, "city") }).addTo(propsLayer);
    mk.bindTooltip(ci + ", " + it[0].state + " (" + it.length + " properties)");
    mk.on("click", () => lmap.flyTo(c, CLUSTER_ZOOM_CITY + 2, { duration: 0.8 }));
  });
}
function renderParcels(list) {
  list.forEach((p) => {
    if (!isInIndia(p.latitude, p.longitude)) return;
    if (p.hasBuilding && p.footprint && p.footprint.length > 2) {
      const poly = L.polygon(p.footprint, { color: "#1d4ed8", weight: 1.5, fillColor: "#3b82f6", fillOpacity: 0.28 }).addTo(parcelsLayer);
      poly.bindTooltip(p.id + " - " + p.city);
      poly.on("click", (e) => { L.DomEvent.stopPropagation(e); selectDemoProperty(p); });
      propPolys[p.id] = poly;
    } else {
      const mk = L.marker([p.latitude, p.longitude], { icon: propIcon(false), title: p.id }).addTo(propsLayer);
      mk.bindTooltip(p.id + " - " + p.city);
      mk.on("click", () => selectDemoProperty(p));
      propMarkers[p.id] = mk;

function selectDemoProperty(p) {
  if (!p) return;
  if (!isInIndia(p.latitude, p.longitude)) { toast("Property records are available within India only.", "info", 3200); return; }
  state.selectedProperty = p; state.selectedParcel = null;
  applySelectionVisual(p.id);
  renderPropertyPanel(p);
}
function closePropertyPanel() {
  state.selectedProperty = null;
  if (selPoly) { selPoly.setStyle({ color: "#1d4ed8", weight: 1.5, fillOpacity: 0.28 }); selPoly = null; }
  Object.keys(propMarkers).forEach((k) => propMarkers[k].setIcon(propIcon(false)));

function renderPropertyPanel(p) {
  const box = $("#parcel-detail");
  if (!box || !p) return;
  const floorsHtml = (p.floorsArr || []).map((f) =>
    '<div class="floor-card"><em>' + esc(f.name) + '</em>' +
    '<div class="fr"><span>Floor ID</span><b>' + esc(f.fId) + '</b></div>' +
    '<div class="fr"><span>Elevation</span><b>' + f.elevation + ' m</b></div>' +
    '<div class="fr"><span>Units</span><b>' + f.units.length + '</b></div>' +
    '<div class="fr"><span>Area</span><b>' + esc(f.area) + '</b></div></div>'
  ).join("");
  box.innerHTML =
    '<div class="prop-card">' +
      '<div class="prop-head"><div>' +
        '<span class="pp-tag">DEMO DATA</span>' +
        '<h4>' + esc(p.id) + '</h4>' +
        '<p class="sub">' + esc(p.propertyType) + ' &middot; ' + esc(p.landUse) + '</p>' +
      '</div>' +
      '<button type="button" class="prop-close" data-close-prop title="Close">&times;</button></div>' +
      '<div class="prop-grid two">' +
        itm("ULPIN", p.ulpin) + itm("Status", p.registrationStatus) +
        itm("Type", p.propertyType) + itm("Land Use", p.landUse) +
        itm("State", p.state) + itm("District", p.district) +
        itm("City", p.city) + itm("Village / Ward", p.village + " / " + p.ward) +
        itm("Survey No.", p.surveyNumber) + itm("Parcel No.", p.parcelNumber) +
      '</div>' +
      '<div class="prop-sec"><strong>Ownership</strong></div>' +
      '<div class="prop-grid two">' + itm("Owner", p.ownerName) + itm("Ownership", p.ownershipType) +
        itm("Registration", p.registrationStatus) + itm("Cadastral", p.cadastralStatus) + '</div>' +
      '<div class="prop-sec"><strong>Land</strong></div>' +
      '<div class="prop-grid two">' + itm("Land Area", p.landArea) + itm("Built-up", p.builtUpArea) +
        itm("Plot Size", p.plotDims) + itm("Basement", p.basement) + '</div>' +
      '<div class="prop-sec"><strong>Building</strong></div>' +
      '<div class="prop-grid two">' + itm("Height", p.buildingHeight + " m") + itm("Floors", p.numberOfFloors) +
        itm("Units", p.numberOfUnits) + itm("Parking", p.parking) + '</div>' +
      '<div class="prop-sec"><strong>3D / Vertical</strong></div>' +
      '<div class="prop-grid two">' + itm("Ground Elev.", p.elevation + " m") +
        itm("Top Elev.", +(p.elevation + p.buildingHeight).toFixed(1) + " m") +
        itm("Vertical Extent", p.verticalExtent) + itm("CRS", p.crs) + '</div>' +
      '<div class="prop-sec"><strong>Coordinates</strong></div>' +
      '<div class="prop-grid two">' + itm("Latitude", p.latitude.toFixed(6)) + itm("Longitude", p.longitude.toFixed(6)) +
        itm("Elevation", p.elevation + " m") + itm("CRS", p.crs) + '</div>' +
      '<div class="prop-sec"><strong>Survey</strong></div>' +
      '<div class="prop-grid two">' + itm("GNSS", p.gnssStatus) + itm("CORS Base", p.corsBase) +
        itm("Survey Date", p.surveyDate) + itm("Accuracy", p.accuracy) + '</div>' +
      '<div class="prop-sec"><strong>Floor Details (' + (p.floorsArr || []).length + ')</strong>' + floorsHtml + '</div>' +
      '<div class="prop-actions">' +
        '<button class="btn btn-primary sm" data-act="3d"><span class="ni-ico" data-i="cube"></span>View 3D</button>' +
        '<button class="btn btn-ghost sm" data-act="copy"><span class="ni-ico" data-i="copy"></span>Copy ULPIN</button>' +
        '<button class="btn btn-ghost sm" data-act="ulpin"><span class="ni-ico" data-i="hash"></span>Gen ULPIN</button>' +
      '</div>' +
    '</div>';
  const cb = box.querySelector("[data-close-prop]");

/* ---------- layer controls ---------- */
function wireLayerPanel() {
  const props = document.getElementById("layer-properties");
  const parc = document.getElementById("layer-parcels");
  const infra = document.getElementById("layer-infra");
  const air = document.getElementById("layer-air");
  const surv = document.getElementById("layer-survey");
  if (props) props.addEventListener("change", () => { state.layers.props = props.checked; refreshPropertyLayers(); });
  if (parc) parc.addEventListener("change", () => { state.layers.parcels = parc.checked; refreshPropertyLayers(); });
  if (infra) infra.addEventListener("change", () => { state.layers.infra = infra.checked; toggleInfra(); });
  if (air) air.addEventListener("change", () => { state.layers.air = air.checked; toggleAir(); });
  if (surv) surv.addEventListener("change", () => { state.layers.survey = surv.checked; toggleSurvey(); });
  toggleInfra(); toggleAir(); toggleSurvey();
}
function toggleInfra() { if (!lmap) return; if (state.layers.infra) { if (!lmap.hasLayer(infraLayer)) infraLayer.addTo(lmap); renderInfra(); } else if (lmap.hasLayer(infraLayer)) { infraLayer.clearLayers(); lmap.removeLayer(infraLayer); } }
function renderInfra() {
  infraLayer.clearLayers();
  DEMO.getInfra().forEach((i) => {
    const line = L.polyline([i.start, i.end], { color: i.color, weight: 3, opacity: 0.8, dashArray: "6 4" }).addTo(infraLayer);
    line.bindTooltip(i.type + " (" + i.depth + ") - " + i.status);
    line.on("click", () => { if (typeof openInfraModal === "function") openInfraModal(i); });
  });
}
function toggleAir() { if (!lmap) return; if (state.layers.air) { if (!lmap.hasLayer(airLayer)) airLayer.addTo(lmap); renderAir(); } else if (lmap.hasLayer(airLayer)) { airLayer.clearLayers(); lmap.removeLayer(airLayer); } }
function renderAir() {
  airLayer.clearLayers();
  DEMO.getAirRights().forEach((a) => {
    const c = DEMO.getPropertyById(a.propertyId);
    if (!c || !c.footprint || c.footprint.length < 3) return;
    const poly = L.polygon(c.footprint, { color: "#a78bfa", weight: 1, fillColor: "#a78bfa", fillOpacity: 0.12, dashArray: "4 3" }).addTo(airLayer);
    poly.bindTooltip(a.id + " (" + a.minElev + "m - " + a.maxElev + "m)");
    poly.on("click", () => { if (typeof openAirModal === "function") openAirModal(a); });
  });
}
function toggleSurvey() { if (!lmap) return; if (state.layers.survey) { if (!lmap.hasLayer(surveyLayer)) surveyLayer.addTo(lmap); renderSurvey(); } else if (lmap.hasLayer(surveyLayer)) { surveyLayer.clearLayers(); lmap.removeLayer(surveyLayer); } }
function renderSurvey() {
  surveyLayer.clearLayers();
  DEMO.getStations().forEach((s) => {
    const mk = L.circleMarker([s.lat, s.lng], { radius: 8, color: "#fff", weight: 2, fillColor: "#10b981", fillOpacity: 0.9 }).addTo(surveyLayer);
    mk.bindTooltip("CORS " + s.code + " - " + s.city);
    mk.on("click", () => { if (typeof openSurveyModal === "function") openSurveyModal(s); });
  });
}

/* ---------- search + controls ---------- */
function wireMapSearch() {
  const input = document.getElementById("map-search");
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !lmap) return;
    const q = input.value.trim(); if (!q) return;
    const res = DEMO.searchProperties(q);
    if (res.length) { const p = res[0]; lmap.flyTo([p.latitude, p.longitude], 14, { duration: 0.8 }); selectDemoProperty(p); }
    else { const city = DEMO.properties.find((x) => x.city.toLowerCase().includes(q.toLowerCase())); if (city) lmap.flyTo([city.latitude, city.longitude], 12, { duration: 0.8 }); else toast("No demo property found for \"" + q + "\""); }
  });
}
function addMapControls() {
  const LocateCtl = L.Control.extend({
    options: { position: "topleft" },
    onAdd() {

with open(r"C:\Users\lenovo\OneDrive\Desktop\SIH26011\js\map.js", "w", encoding="utf-8") as f:
    f.write(js)
print("map.js written:", len(js), "bytes")

      const div = L.DomUtil.create("div", "leaflet-bar");
      const a = L.DomUtil.create("a", "", div);
      a.href = "#"; a.innerHTML = "&#8982;"; a.title = "Locate me";
      L.DomEvent.on(a, "click", (e) => {
        L.DomEvent.preventDefault(e);
        if (!navigator.geolocation) return toast("Geolocation not available", "err");
        navigator.geolocation.getCurrentPosition(
          (pos) => lmap.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 1 }),
          () => toast("Location permission denied", "info"));
      });
      return div;
    }
  });
  lmap.addControl(new LocateCtl());
}
window.refreshDemoLayers = refreshPropertyLayers;

  if (cb) cb.addEventListener("click", closePropertyPanel);
  box.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => handlePropAction(b.dataset.act, p)));
  if (typeof mountIcons === "function") mountIcons(box);
}
function handlePropAction(act, p) {
  if (act === "3d") { if (typeof openProp3D === "function") openProp3D(p); }
  else if (act === "copy") { copyText(p.ulpin, "ULPIN copied to clipboard"); }
  else if (act === "ulpin") { if (typeof prefillUlpin === "function") prefillUlpin(p); goto("ulpin"); }
}

  selMarker = null;
  const box = $("#parcel-detail");
  if (box) { box.innerHTML = PROP_PANEL_EMPTY; if (typeof mountIcons === "function") mountIcons(box); }
}
function itm(l, v) { return '<div class="prop-item"><span>' + l + '</span><b>' + esc(v) + '</b></div>'; }

    }
    if (state.selectedProperty && state.selectedProperty.id === p.id) applySelectionVisual(p.id);
  });
}
function applySelectionVisual(id) {
  if (propPolys[id]) {
    if (selPoly && selPoly !== propPolys[id]) selPoly.setStyle({ color: "#1d4ed8", weight: 1.5, fillOpacity: 0.28 });
    selPoly = propPolys[id];
    selPoly.setStyle({ color: "#f59e0b", weight: 2.5, fillColor: "#f59e0b", fillOpacity: 0.5 });
    if (selPoly.bringToFront) selPoly.bringToFront();
  }
  Object.keys(propMarkers).forEach((k) => propMarkers[k].setIcon(propIcon(k === id)));
  selMarker = propMarkers[id] || selMarker;
}
function centroidOf(list) {
  let la = 0, lo = 0; list.forEach((p) => { la += p.latitude; lo += p.longitude; });
  return [la / list.length, lo / list.length];
}
function clusterIcon(n, kind) {
  const sz = kind === "state" ? 46 : 36;
  const col = kind === "state" ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "linear-gradient(135deg,#0ea5e9,#06b6d4)";
  return L.divIcon({ className: "", html: '<div class="cluster-pin" style="width:' + sz + "px;height:" + sz + "px;background:" + col + '">' + n + "</div>", iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] });
}
