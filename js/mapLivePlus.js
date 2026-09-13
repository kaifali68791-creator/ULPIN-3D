/* =====================================================================
   ULPIN 3D — ADD-ONLY live-map extras (new file, touches nothing existing)
   FEATURE 1: real-time location search via free Nominatim geocoding
   (OpenStreetMap, no API key) on the existing #map-search box.
   FEATURE 2: real-time GPS / My Location button via standard
   navigator.geolocation API with position watching. In-memory only.
   Existing demo-index search + Locate control keep working untouched.
   ===================================================================== */
(function () {
  "use strict";

  var NOMINATIM = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&accept-language=en&";
  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  function toastSafe(msg, type, ms) {
    if (typeof toast === "function") { try { toast(msg, type, ms); } catch (e) {} }
  }
  function escSafe(s) {
    if (typeof esc === "function") { try { return esc(s); } catch (e) {} }
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function leafletMap() {
    try {
      if (typeof L === "undefined") return null;
      if (typeof lmap === "undefined" || !lmap) return null;
      return lmap;
    } catch (e) { return null; }
  }
  function injectStyles() {
    if (document.getElementById("ulpin-liveplus-css")) return;
    var st = document.createElement("style");
    st.id = "ulpin-liveplus-css";
    st.textContent =
      ".map-search-box{position:relative}" +
      ".ulpin-suggest{position:absolute;top:calc(100% + 6px);left:0;right:0;background:#fff;border:1px solid #e2e8f0;" +
      "border-radius:10px;box-shadow:0 12px 32px rgba(15,23,42,.18);z-index:1300;max-height:250px;overflow-y:auto}" +
      ".ulpin-suggest button{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid #f1f5f9;" +
      "padding:9px 12px;font-size:12.5px;color:#0f172a;cursor:pointer;font-family:inherit}" +
      ".ulpin-suggest button:last-child{border-bottom:0}" +
      ".ulpin-suggest button:hover{background:#f1f5f9}" +
      ".ulpin-suggest button small{display:block;color:#64748b;font-size:11px;margin-top:2px}" +
      ".ulpin-geo-pin-wrap{background:none;border:0}" +
      ".ulpin-geo-pin{width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);" +
      "background:#ef4444;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);margin:8px 0 0 8px}" +
      ".ulpin-gps-wrap{background:none;border:0}" +
      ".ulpin-gps-dot{width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;" +
      "box-shadow:0 0 0 6px rgba(37,99,235,.25),0 2px 8px rgba(0,0,0,.35);animation:ulpinGpsPulse 1.8s ease-out infinite}" +
      "@keyframes ulpinGpsPulse{0%{box-shadow:0 0 0 0 rgba(37,99,235,.45)}" +
      "70%{box-shadow:0 0 0 14px rgba(37,99,235,0)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}" +
      ".ulpin-gps-bar a.ulpin-gps-on{background:#2563eb !important;color:#fff !important}" +
      "#ulpin-gps-btn{font-size:17px;line-height:26px;text-align:center;cursor:pointer}" +
      "#ulpin-basemap{display:flex;gap:4px;margin-left:8px}" +
      "#ulpin-basemap .seg-btn{white-space:nowrap}" +
      ".ulpin-sv-overlay{position:fixed;inset:0;background:rgba(2,6,23,.72);z-index:2000;display:none;align-items:center;justify-content:center;padding:20px}" +
      ".ulpin-sv-overlay.open{display:flex}" +
      ".ulpin-sv-card{width:min(920px,94vw);height:min(560px,86vh);background:#0f172a;border:1px solid rgba(255,255,255,.14);border-radius:14px;overflow:hidden;position:relative;box-shadow:0 30px 80px rgba(0,0,0,.5)}" +
      ".ulpin-sv-card #ulpin-sv-pano{position:absolute;inset:0}" +
      ".ulpin-sv-close{position:absolute;top:10px;right:10px;z-index:3;border:1px solid rgba(255,255,255,.25);background:rgba(15,23,42,.85);color:#fff;border-radius:9px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer}" +
      ".ulpin-sv-tag{position:absolute;left:10px;top:10px;z-index:3;background:rgba(15,23,42,.85);border:1px solid rgba(255,255,255,.18);color:#e2e8f0;border-radius:9px;padding:7px 12px;font-size:11.5px;max-width:70%}" +
      "@media (max-width:700px){#ulpin-basemap .seg-btn{padding:6px 8px;font-size:11px}}" +
      ".ulpin-gmark{background:none;border:0}" +
      ".ulpin-gmark div{width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0ea5e9;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);margin:6px 0 0 6px}";
    document.head.appendChild(st);
  }
  function matchesDemoIndex(q) {
    var needle = String(q || "").trim().toLowerCase();
    if (!needle) return false;
    try {
      if (typeof INDIA_PROPERTIES !== "undefined" && INDIA_PROPERTIES) {
        var hit = INDIA_PROPERTIES.find(function (x) {
          return (x.locality || "").toLowerCase().indexOf(needle) > -1 ||
            (x.state || "").toLowerCase().indexOf(needle) > -1 ||
            (x.id || "").toLowerCase().indexOf(needle) > -1 ||
            (x.ownerName || "").toLowerCase().indexOf(needle) > -1;
        });
        if (hit) return true;
      }
      if (typeof PARCELS !== "undefined" && PARCELS) {
        var p = PARCELS.find(function (x) {
          return (x.survey || "").toLowerCase().indexOf(needle) > -1 ||
            (x.owner || "").toLowerCase().indexOf(needle) > -1;
        });
        if (p) return true;
      }
    } catch (e) {}
    return false;
  }

  var geoLayer = null, geoMarker = null;
  function ensureGeoLayer(map) {
    if (!geoLayer) geoLayer = L.layerGroup().addTo(map);
    return geoLayer;
  }
  function showGeoResult(map, lat, lon, label, bbox) {
    if (!map || !isFinite(lat) || !isFinite(lon)) return;
    ensureGeoLayer(map);
    if (geoMarker) { try { geoLayer.removeLayer(geoMarker); } catch (e) {} geoMarker = null; }
    geoMarker = L.marker([lat, lon], {
      title: String(label || "Search result"),
      icon: L.divIcon({ className: "ulpin-geo-pin-wrap",
        html: '<div class="ulpin-geo-pin"></div>', iconSize: [26, 34], iconAnchor: [13, 32] })
    }).addTo(geoLayer);
    geoMarker.bindPopup("<b>Search result</b><br>" +
      escSafe(label || (lat.toFixed(4) + ", " + lon.toFixed(4)))).openPopup();
    try {
      if (bbox && bbox.length === 4) {
        map.flyToBounds([[parseFloat(bbox[0]), parseFloat(bbox[2])],
          [parseFloat(bbox[1]), parseFloat(bbox[3])]], { maxZoom: 16, duration: 0.9 });
      } else {
        map.flyTo([lat, lon], Math.max(map.getZoom(), 14), { duration: 0.9 });
      }
    } catch (e) { try { map.setView([lat, lon], 14); } catch (e2) {} }
    toastSafe("Showing: <b>" + escSafe(String(label || "location").split(",").slice(0, 2).join(",")) + "</b>", "ok");
  }
  function runGeocode(q) {
    var map = leafletMap();
    if (!map) { toastSafe("Open the Map view first, then search.", "info"); return; }
    if (!window.fetch) { toastSafe("Search needs network fetch support in this browser.", "err"); return; }
    toastSafe("Searching for <b>" + escSafe(q) + "</b>&hellip;", "info", 1800);
    fetch(NOMINATIM + "limit=1&q=" + encodeURIComponent(q), { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (list) {
        hideSuggest();
        if (!list || !list.length) {
          toastSafe("Location not found for <b>" + escSafe(q) +
            "</b>. Try a nearby city or landmark.", "info", 4200);
          return;
        }
        var it = list[0];
        showGeoResult(leafletMap(), parseFloat(it.lat), parseFloat(it.lon), it.display_name, it.boundingbox);
      })
      .catch(function () { toastSafe("Search service unavailable &mdash; check connection and retry.", "err"); });
  }
  var sugTimer = null, sugSeq = 0;
  function hideSuggest() {
    var dd = document.getElementById("ulpin-suggest");
    if (dd && dd.parentNode) dd.parentNode.removeChild(dd);
  }
  function renderSuggest(items) {
    hideSuggest();
    if (!items || !items.length) return;
    var box = $(".map-search-box"), input = document.getElementById("map-search");
    if (!box || !input) return;
    var dd = document.createElement("div");
    dd.className = "ulpin-suggest"; dd.id = "ulpin-suggest";
    items.slice(0, 5).forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      var title = String(it.display_name || "").split(",").slice(0, 2).join(",");
      b.innerHTML = "<b>" + escSafe(title) + "</b><small>" + escSafe(it.display_name || "") + "</small>";
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () {
        input.value = it.display_name || "";
        hideSuggest();
        var m = leafletMap(); if (!m) return;
        showGeoResult(m, parseFloat(it.lat), parseFloat(it.lon), it.display_name, it.boundingbox);
      });
      dd.appendChild(b);
    });
    box.appendChild(dd);
  }

  var gpsLayer = null, gpsMarker = null, gpsAccCircle = null, gpsWatchId = null, gpsBtn = null,
    gpsPending = false, gpsHasFix = false, gpsFirstSeq = 0, gpsStatusEl = null;
  function ensureGpsLayer(map) {
    if (!gpsLayer) gpsLayer = L.layerGroup().addTo(map);
    return gpsLayer;
  }
  function setGpsBtn(on) {
    if (!gpsBtn) return;
    try {
      gpsBtn.classList.toggle("ulpin-gps-on", !!on);
      gpsBtn.title = on ? "My Location (tracking ON — click to stop)" : "My Location";
      gpsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    } catch (e) {}
  }
  function gpsErrorMessage(err) {
    if (!err) return "Could not determine your location.";
    if (err.code === 1) return "Location permission denied — allow location access and retry. Sample markers stay visible.";
    if (err.code === 2) return "Location unavailable — your device could not determine a position.";
    if (err.code === 3) return "Location request timed out — try again.";
    return "Could not determine your location.";
  }
  function setGpsStatus(msg) {
    try {
      if (!gpsStatusEl || !document.body.contains(gpsStatusEl)) gpsStatusEl = null;
      if (msg && !gpsStatusEl) {
        gpsStatusEl = document.createElement("div");
        gpsStatusEl.id = "ulpin-gps-status";
        gpsStatusEl.setAttribute("role", "status");
        gpsStatusEl.style.cssText = "position:absolute;left:50%;bottom:18px;transform:translateX(-50%);z-index:1200;" +
          "background:rgba(15,23,42,.92);color:#e2e8f0;border:1px solid rgba(255,255,255,.16);border-radius:10px;" +
          "padding:8px 14px;font-size:12.5px;font-weight:600;box-shadow:0 10px 28px rgba(2,6,23,.4);pointer-events:none;" +
          "max-width:88%;text-align:center;font-family:inherit;display:none";
        var stage = document.querySelector(".leaflet-stage") || document.getElementById("map");
        (stage || document.body).appendChild(gpsStatusEl);
        try { if (stage && getComputedStyle(stage).position === "static") stage.style.position = "relative"; } catch (e0) {}
      }
      if (gpsStatusEl) {
        if (msg) { gpsStatusEl.textContent = msg; gpsStatusEl.style.display = "block"; }
        else { gpsStatusEl.style.display = "none"; }
      }
    } catch (e) {}
  }
  function showGpsPosition(map, lat, lon, accuracy, recenter) {
    /* GPS-only: never fall back to map centre / search / IP / demo coords. */
    if (!isFinite(lat) || !isFinite(lon)) return false;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
    ensureGpsLayer(map);
    var acc = Number(accuracy);
    if (!isFinite(acc) || acc <= 0) acc = 0;
    if (gpsAccCircle) {
      try { gpsAccCircle.setLatLng([lat, lon]); gpsAccCircle.setRadius(acc || 25); } catch (eAcc) {}
    } else if (acc > 0) {
      try {
        gpsAccCircle = L.circle([lat, lon], {
          radius: acc, color: "#2563eb", weight: 1.5, opacity: 0.7,
          fillColor: "#2563eb", fillOpacity: 0.12, interactive: false, keyboard: false
        }).addTo(gpsLayer);
      } catch (eAcc2) { gpsAccCircle = null; }
    }
    if (gpsMarker) {
      try { gpsMarker.setLatLng([lat, lon]); } catch (e) {}
    } else {
      gpsMarker = L.marker([lat, lon], {
        title: "My location",
        icon: L.divIcon({ className: "ulpin-gps-wrap",
          html: '<div class="ulpin-gps-dot"></div>', iconSize: [24, 24], iconAnchor: [12, 12] }),
        zIndexOffset: 500, interactive: false, keyboard: false
      }).addTo(gpsLayer);
    }
    if (recenter) {
      try { map.flyTo([lat, lon], Math.max(map.getZoom(), 15), { duration: 1 }); }
      catch (e) { try { map.setView([lat, lon], 15); } catch (e2) {} }
    }
    gpsHasFix = true;
    gpsPending = false;
    setGpsStatus("");
    return true;
  }
  function stopGpsWatch(silent) {
    gpsPending = false;
    setGpsStatus("");
    try {
      if (gpsWatchId !== null && navigator.geolocation && navigator.geolocation.clearWatch) {
        navigator.geolocation.clearWatch(gpsWatchId);
      }
    } catch (e) {}
    gpsWatchId = null;
    setGpsBtn(false);
    if (!silent) toastSafe("Stopped tracking your location.", "info", 2200);
  }
  function onGpsFix(seq, pos, first) {
    if (seq !== gpsFirstSeq) return;
    var c = (pos && pos.coords) || {};
    if (!isFinite(c.latitude) || !isFinite(c.longitude)) return;
    if (isFinite(pos.timestamp) && (Date.now() - Number(pos.timestamp)) > 60000) {
      if (first && !gpsHasFix) toastSafe("Waiting for a fresh GPS fix&hellip; (ignored one stale cached reading).", "info", 2600);
      return;
    }
    var acc = Number(c.accuracy);
    if (isFinite(acc) && acc > 5000) {
      if (first && !gpsHasFix) {
        gpsPending = false; setGpsStatus("");
        try { if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId); } catch (ePoor) {}
        gpsWatchId = null; setGpsBtn(false);
        toastSafe("GPS accuracy is very poor right now (&plusmn;" + Math.round(acc) + " m). Move outdoors and retry — the map was not moved.", "info", 5200);
      }
      return;
    }
    var m = leafletMap(); if (!m) return;
    var ok = showGpsPosition(m, Number(c.latitude), Number(c.longitude), acc, first);
    if (!ok) return;
    setGpsBtn(true);
    if (!window.__ulpinGpsToastShown) {
      window.__ulpinGpsToastShown = true;
      var extra = (isFinite(acc) && acc > 100)
        ? " Accuracy is &plusmn;" + Math.round(acc) + " m — approximate, move outdoors for a better fix."
        : ((isFinite(acc) && acc > 0) ? " Accuracy &plusmn;" + Math.round(acc) + " m." : "");
      toastSafe("Showing your current location." + extra, "ok", 4200);
    }
  }
  function onGpsError(seq, err) {
    if (seq !== gpsFirstSeq) return;
    gpsPending = false;
    setGpsStatus("");
    var hadFix = gpsHasFix;
    stopGpsWatch(true);
    if (!hadFix) toastSafe(gpsErrorMessage(err), "info", 4200);
  }
  function startGpsWatch() {
    var map = leafletMap();
    if (!map) { toastSafe("Open the Map view first, then tap My Location.", "info"); return; }
    if (!navigator.geolocation) { toastSafe("Geolocation is not available in this browser.", "err"); return; }
    if (gpsWatchId !== null || gpsPending) { stopGpsWatch(false); return; }
    gpsPending = true;
    setGpsStatus("Getting your current location\u2026");
    toastSafe("Getting your current location&hellip;", "info", 2200);
    var seq = ++gpsFirstSeq;
    var first = true;
    var settled = function () { first = false; };
    try {
      navigator.geolocation.getCurrentPosition(
        function (pos) { onGpsFix(seq, pos, true); settled(); },
        function (err) { if (!gpsHasFix) onGpsError(seq, err); settled(); },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    } catch (eGet) {}
    try {
      gpsWatchId = navigator.geolocation.watchPosition(
        function (pos) { onGpsFix(seq, pos, first); settled(); },
        function (err) { onGpsError(seq, err); settled(); },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
      );
    } catch (e) {
      gpsWatchId = null;
      if (!gpsHasFix) { gpsPending = false; setGpsStatus(""); toastSafe("Geolocation is not available in this browser.", "err"); }
    }
  }
  function addGpsControl() {
    if (window.__ulpinGpsCtlAdded) return;
    var map = leafletMap();
    if (!map || typeof L === "undefined") return;
    window.__ulpinGpsCtlAdded = true;
    var GpsCtl = L.Control.extend({
      options: { position: "topleft" },
      onAdd: function () {
        var div = L.DomUtil.create("div", "leaflet-bar ulpin-gps-bar");
        var a = L.DomUtil.create("a", "", div);
        a.href = "#"; a.id = "ulpin-gps-btn";
        a.innerHTML = "&#9673;";
        a.title = "My Location";
        a.setAttribute("role", "button");
        a.setAttribute("aria-label", "Show my current location");
        a.setAttribute("aria-pressed", "false");
        L.DomEvent.on(a, "click", function (e) {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          startGpsWatch();
        });
        L.DomEvent.disableClickPropagation(div);
        gpsBtn = a;
        return div;
      }
    });
    try { map.addControl(new GpsCtl()); } catch (e) { window.__ulpinGpsCtlAdded = false; }
  }
  function onSearchInput() {
    var input = document.getElementById("map-search");
    if (!input || !window.fetch) return;
    var q = input.value.trim();
    hideSuggest();
    if (q.length < 3 || matchesDemoIndex(q)) return;
    if (sugTimer) clearTimeout(sugTimer);
    var my = ++sugSeq;
    sugTimer = setTimeout(function () {
      fetch(NOMINATIM + "limit=5&q=" + encodeURIComponent(q), { headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (list) { if (my === sugSeq) renderSuggest(list); })
        .catch(function () {});
    }, 450);
  }
  function wireSearchExtras() {
    if (window.__ulpinSearchPlusWired) return;
    var input = document.getElementById("map-search");
    if (!input) return;
    window.__ulpinSearchPlusWired = true;
    input.addEventListener("keydown", function (e) {
      if (e.key !== "Enter") return;
      var q = input.value.trim();
      if (!q) return;
      if (matchesDemoIndex(q)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      var dd = document.getElementById("ulpin-suggest");
      var first = dd ? dd.querySelector("button") : null;
      if (first) { first.click(); return; }
      runGeocode(q);
    });
    input.addEventListener("input", onSearchInput);
    input.addEventListener("search", hideSuggest);
    input.addEventListener("blur", function () { setTimeout(hideSuggest, 150); });
    input.addEventListener("keydown", function (e) { if (e.key === "Escape") hideSuggest(); });
  }
  /* ADD-ONLY basemap modes: OSM Streets (default) + Esri latest-available
     satellite/hybrid + OpenTopoMap terrain. Google hybrid plugs in via
     js/mapGooglePlus.js only when an optional key is set; never labelled
     real-time because providers serve cached tiles, not live imagery. */
  var baseMode = "osm", satLayer = null, hybridLbl = null, terrainLayer = null;
  window.__ulpinBaseMode = function () { return baseMode; };
  window.__ulpinShowSearchResult = function (lat, lng, title, sub) {
    var m = leafletMap(); if (!m) return;
    showGeoResult(m, Number(lat), Number(lng), sub ? (title + ", " + sub) : title, null);
  };
  function getOsmLayer(map) {
    var found = null;
    try {
      map.eachLayer(function (lyr) {
        if (found || !lyr || !lyr.getTileUrl) return;
        try { if (String(lyr.getTileUrl({ x: 0, y: 0, z: 0 })).indexOf("tile.openstreetmap.org") !== -1) found = lyr; } catch (e) {}
      });
    } catch (e) {}
    return found;
  }
  function ensureBaseLayers() {
    if (!satLayer) {
      /* Latest imagery each provider publishes: Esri refreshes World Imagery
         from Maxar/Airbus sources; OSM Standard stays the live vector default. */
      satLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics (latest available, not live)" });
      hybridLbl = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, opacity: 0.9 });
      terrainLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", { maxZoom: 17, attribution: "Map data &copy; OpenStreetMap contributors, SRTM | style &copy; OpenTopoMap (CC-BY-SA)" });
    }
  }
  function paintBaseSeg() {
    try { document.querySelectorAll("#ulpin-basemap .seg-btn").forEach(function (b) { b.classList.toggle("active", b.dataset.base === baseMode); }); } catch (e) {}
  }
  window.__ulpinSetBaseMode = function (mode, silent) {
    var map = leafletMap(); if (!map) return false;
    ensureBaseLayers();
    var osm = getOsmLayer(map);
    var gHybrid = null;
    try { if (window.__ulpinGoogleHybridLayer) gHybrid = window.__ulpinGoogleHybridLayer(); } catch (e) {}
    if (mode === "google" && !gHybrid) {
      if (!silent) toastSafe("Google satellite needs a Maps browser key — paste it in <b>GOOGLE_MAPS_API_KEY</b> (js/mapGooglePlus.js). Showing OpenStreetMap.", "info", 6500);
      mode = "osm";
    }
    [osm, satLayer, hybridLbl, terrainLayer, gHybrid].forEach(function (lyr) {
      if (!lyr) return;
      try { if (map.hasLayer(lyr)) map.removeLayer(lyr); } catch (e) {}
    });
    try {
      if (mode === "sat") satLayer.addTo(map);
      else if (mode === "hybrid") { satLayer.addTo(map); hybridLbl.addTo(map); }
      else if (mode === "terrain") terrainLayer.addTo(map);
      else if (mode === "google" && gHybrid) gHybrid.addTo(map);
      else { mode = "osm"; if (osm) osm.addTo(map); }
    } catch (e) { return false; }
    baseMode = mode;
    try { map.invalidateSize(); } catch (e2) {}
    paintBaseSeg();
    return true;
  };

  function addBasemapControl() {
    if (document.getElementById("ulpin-basemap")) return;
    var seg = document.getElementById("map-layers");
    if (!seg || !seg.parentNode) return;
    var div = document.createElement("div");
    div.className = "seg"; div.id = "ulpin-basemap";
    div.setAttribute("role", "group"); div.setAttribute("aria-label", "Basemap style");
    div.title = "Basemap: Streets / Satellite (latest available) / Hybrid / Terrain / Google (needs key)";
    div.innerHTML = '<button class="seg-btn active" data-base="osm">Streets</button>' +
      '<button class="seg-btn" data-base="sat">Satellite</button>' +
      '<button class="seg-btn" data-base="hybrid">Hybrid</button>' +
      '<button class="seg-btn" data-base="terrain">Terrain</button>' +
      '<button class="seg-btn" data-base="google" title="Google satellite (needs Maps browser key)">Google</button>';
    seg.parentNode.insertBefore(div, seg.nextSibling);
    div.querySelectorAll(".seg-btn").forEach(function (b) {
      b.addEventListener("click", function () {
        if (!leafletMap()) { toastSafe("Open the Map view first, then switch the basemap.", "info"); return; }
        window.__ulpinSetBaseMode(b.dataset.base, false);
      });
    });
  }
  function addStreetViewButton() {
    if (document.getElementById("ulpin-sv-btn")) return;
    var panel = document.getElementById("map-layers-panel");
    if (!panel) return;
    var btn = document.createElement("button");
    btn.id = "ulpin-sv-btn"; btn.type = "button"; btn.className = "seg-btn";
    btn.style.cssText = "margin-top:6px;width:100%;justify-content:center";
    btn.textContent = "Street View";
    btn.title = "Open Google Street View at the search result / GPS fix / map centre (needs Maps key)";
    btn.addEventListener("click", function () {
      var m = leafletMap(); if (!m) { toastSafe("Open the Map view first, then try Street View.", "info"); return; }
      var target = null, label = "";
      try {
        if (geoMarker) { target = geoMarker.getLatLng(); label = "search result"; }
        else if (gpsMarker) { target = gpsMarker.getLatLng(); label = "my location"; }
        else { var c = m.getCenter(); target = { lat: c.lat, lng: c.lng }; label = "map centre"; }
      } catch (e) { return; }
      /* Property markers stay selected — Street View never clears ULPIN state. */
      if (window.__ulpinStreetView) { try { window.__ulpinStreetView(target.lat, target.lng != null ? target.lng : target.lon, label); return; } catch (e2) {} }
      toastSafe("Street View needs a Google Maps browser key — set <b>GOOGLE_MAPS_API_KEY</b> in js/mapGooglePlus.js. The 2D map keeps working.", "info", 6000);
    });
    panel.appendChild(btn);
  }
  function boot() {
    injectStyles();
    wireSearchExtras();
    var tries = 0;
    var t = setInterval(function () {
      tries++;
      if (leafletMap()) {
        tries = 0;
        try { addGpsControl(); } catch (e) {}
        try { addBasemapControl(); } catch (e2) {}
        try { addStreetViewButton(); } catch (e3) {}
        try {
          if (window.__ulpinHasGoogleKey && window.__ulpinHasGoogleKey() && window.__ulpinLoadGoogleApi && window.__ulpinWirePlaces) {
            window.__ulpinLoadGoogleApi(true).then(function () { try { window.__ulpinWirePlaces(); } catch (e4) {} }).catch(function () {});
          }
        } catch (e5) {}
        if (window.__ulpinGpsCtlAdded && document.getElementById("ulpin-basemap") && document.getElementById("ulpin-sv-btn")) clearInterval(t);
      } else if (tries > 120) {
        clearInterval(t); /* ~2 min: map never opened this session; stop polling */
      }
    }, 1000);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
