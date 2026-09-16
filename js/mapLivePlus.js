/* =====================================================================
   ULPIN 3D â€” ADD-ONLY live-map extras (new file, touches nothing existing)
   FEATURE 1: real-time location search via free Nominatim geocoding
   (OpenStreetMap, no API key) on the existing #map-search box.
   FEATURE 2: real-time GPS / My Location button via standard
   navigator.geolocation API with position watching. In-memory only.
   Existing demo-index search + Locate control keep working untouched.
   ===================================================================== */
(function () {
  "use strict";

  /* Real OpenStreetMap gazetteer â€” free, no API key. countrycodes=in keeps
     results focused on India (states, districts, towns, VILLAGES, localities).
     addressdetails=1 lets us choose a sensible zoom per place type. */
  var NOMINATIM = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=en&countrycodes=in&";
  /* Nominatim usage policy: at most 1 request per second. */
  var lastGeoReq = 0;
  function geoThrottle(ms) {
    var now = Date.now();
    if (now - lastGeoReq < (ms || 1100)) return false;
    lastGeoReq = now;
    return true;
  }
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
      ".ulpin-gmark div{width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0ea5e9;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);margin:6px 0 0 6px}" +
      /* --- Nearby POI panel + search badges (light GovTech palette only) --- */
      ".ulpin-poi-panel{margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0}" +
      ".ulpin-poi-grid{display:flex;flex-wrap:wrap;gap:4px;align-items:center}" +
      ".ulpin-poi-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;font-size:11px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#334155;cursor:pointer;font-weight:600;font-family:inherit;transition:background .15s,border-color .15s}" +
      ".ulpin-poi-btn:hover{background:#f1f5f9}" +
      ".ulpin-poi-btn.on{background:#eff6ff;border-color:#2563eb;color:#1d4ed8}" +
      ".ulpin-poi-clear{margin-left:auto;background:none;border:0;color:#2563eb;font-size:10.5px;font-weight:700;cursor:pointer;padding:2px 4px;font-family:inherit}" +
      ".ulpin-poi-clear:hover{text-decoration:underline}" +
      ".poi-dot{width:8px;height:8px;border-radius:50%;display:inline-block;flex:none;box-shadow:0 0 0 1px rgba(255,255,255,.9)}" +
      ".ulpin-suggest .poi-dot{margin-right:5px;margin-bottom:-1px}" +
      ".poi-badge{display:inline-block;font-size:9px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;margin-left:4px;vertical-align:1px}" +
      ".ulpin-poi-status{font-size:10.5px;color:#64748b;margin-top:6px;line-height:1.45}";
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
  function showGeoResult(map, lat, lon, label, bbox, zoomHint, poi) {
    var isPoi = !!(poi && poi.color);
    if (!map || !isFinite(lat) || !isFinite(lon)) return;
    ensureGeoLayer(map);
    if (geoMarker) { try { geoLayer.removeLayer(geoMarker); } catch (e) {} geoMarker = null; }
    geoMarker = L.marker([lat, lon], {
      title: String((isPoi && poi.name) || label || "Search result"),
      icon: L.divIcon({ className: "ulpin-geo-pin-wrap",
        html: '<div class="ulpin-geo-pin"' + (isPoi ? ' style="background:' + poi.color + '"' : "") + "></div>",
        iconSize: [26, 34], iconAnchor: [13, 32] })
    }).addTo(geoLayer);
    geoMarker.bindPopup(isPoi
      ? '<div class="map-popup"><strong>' + escSafe(String(poi.name || label || "Place of interest")) + "</strong>" +
        '<div class="mp-row"><span>Category</span><b>' + escSafe(poi.label || "Place of interest") + "</b></div>" +
        (poi.context ? '<div class="mp-row"><span>Where</span><b>' + escSafe(poi.context) + "</b></div>" : "") +
        '<div class="mp-note">Real mapped place &middot; data &copy; OpenStreetMap contributors</div></div>'
      : "<b>Search result</b><br>" +
        escSafe(label || (lat.toFixed(4) + ", " + lon.toFixed(4)))).openPopup();
    try {
      if (bbox && bbox.length === 4) {
        map.flyToBounds([[parseFloat(bbox[0]), parseFloat(bbox[2])],
          [parseFloat(bbox[1]), parseFloat(bbox[3])]], { maxZoom: isPoi ? 17 : 16, duration: 0.9 });
      } else {
        /* zoomHint: type-aware zoom so VILLAGES/localities land at z14-15,
           states at z7, districts at z9, towns at z12, roads z16, buildings z18;
           POIs (schools, hospitals, shops, ATMs...) open at street level (z17). */
        map.flyTo([lat, lon], zoomHint || (isPoi ? 17 : Math.max(map.getZoom(), 14)), { duration: 0.9 });
      }
    } catch (e) { try { map.setView([lat, lon], 14); } catch (e2) {} }
    toastSafe("Showing: <b>" + escSafe(String((isPoi && poi.name) || label || "location").split(",").slice(0, 2).join(",")) + "</b>", "ok");
  }
  /* Pick a useful zoom from the real OSM place type â€” India hierarchy:
     village/locality -> town/city -> taluk/district -> state.
     NOTE: in India nearly every result carries state_district (the containing
     district), so the most SPECIFIC place key must be checked first. */
  function zoomForNominatim(it) {
    var a = (it && it.address) || {};
    var t = String((it && it.type) || "").toLowerCase();
    if (/village|hamlet|locality|isolated_dwelling|farm/.test(t) || a.village || a.hamlet || a.locality) return 14;
    if (/building|house/.test(t) || a.house) return 18;
    if (/road|street|residential/.test(t) || a.road || a.pedestrian) return 16;
    if (/suburb|neighbourhood|quarter|borough|city_district/.test(t) || a.suburb || a.neighbourhood || a.city_district) return 15;
    if (/city|town|municipality/.test(t) || a.city || a.town || a.municipality) return 12;
    if (a.county || /county/.test(t)) return 10; /* taluk / tehsil / mandal */
    if (a.state_district || a.district || /district/.test(t)) return 9;
    if (a.state && !a.city && !a.town && !a.village) return 7;
    return 14;
  }
  function runGeocode(q) {
    var map = leafletMap();
    if (!map) { toastSafe("Open the Map view first, then search.", "info"); return; }
    if (!window.fetch) { toastSafe("Search needs network fetch support in this browser.", "err"); return; }
    if (!geoThrottle()) { toastSafe("Hold on a second&hellip; (search rate limit)", "info", 1600); return; }
    toastSafe("Searching for <b>" + escSafe(q) + "</b>&hellip;", "info", 1800);
    /* limit=8: India has MANY villages/towns sharing the same name â€” show the
       real matches as a list (state/district context) instead of guessing. */
    fetch(NOMINATIM + "limit=8&q=" + encodeURIComponent(q), { headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (list) {
        hideSuggest();
        if (!list || !list.length) {
          /* No gazetteer hit â€” try the REAL named-place fallback (Overpass
             name match around the map view) before giving up. */
          namedPlaceFallback(q);
          return;
        }
        if (list.length === 1) {
          var it = list[0];
          showGeoResult(leafletMap(), parseFloat(it.lat), parseFloat(it.lon), it.display_name, it.boundingbox, zoomForNominatim(it), poiInfoOf(it));
          return;
        }
        renderSuggest(list);
        toastSafe("<b>" + list.length + " real matches</b> found â€” pick one from the list under the search box.", "info", 4200);
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
    items.slice(0, 8).forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button";
      var pi = poiInfoOf(it);
      var title = String(it.display_name || "").split(",").slice(0, 2).join(",");
      b.innerHTML =
        (pi ? '<span class="poi-dot" style="background:' + pi.color + '"></span>' : "") +
        "<b>" + escSafe(title) + "</b>" +
        (pi ? ' <span class="poi-badge" style="color:' + pi.color + '">' + escSafe(pi.label) + "</span>" : "") +
        "<small>" + escSafe(it.display_name || "") + "</small>";
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () {
        input.value = it.display_name || "";
        hideSuggest();
        var m = leafletMap(); if (!m) return;
        showGeoResult(m, parseFloat(it.lat), parseFloat(it.lon), it.display_name, it.boundingbox, zoomForNominatim(it), pi);
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
      gpsBtn.title = on ? "My Location (tracking ON â€” click to stop)" : "My Location";
      gpsBtn.setAttribute("aria-pressed", on ? "true" : "false");
    } catch (e) {}
  }
  function gpsErrorMessage(err) {
    if (!err) return "Could not determine your location.";
    if (err.code === 1) return "Location permission denied â€” allow location access and retry. Sample markers stay visible.";
    if (err.code === 2) return "Location unavailable â€” your device could not determine a position.";
    if (err.code === 3) return "Location request timed out â€” try again.";
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
        toastSafe("GPS accuracy is very poor right now (&plusmn;" + Math.round(acc) + " m). Move outdoors and retry â€” the map was not moved.", "info", 5200);
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
        ? " Accuracy is &plusmn;" + Math.round(acc) + " m â€” approximate, move outdoors for a better fix."
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
      if (!geoThrottle()) return; /* Nominatim policy: max 1 request/second */
      fetch(NOMINATIM + "limit=8&q=" + encodeURIComponent(q), { headers: { Accept: "application/json" } })
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
      /* Category search: "school", "hospital", "atm in Guntur", "petrol pump"â€¦
         Routes to real OSM POI data (Overpass); named searches keep using Nominatim. */
      var pk = parsePoiQuery(q);
      if (pk) { runPoiQuery(pk, q); return; }
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
  var baseMode = "osm", satLayer = null, hybridLbl = null, terrainLayer = null, hotLayer = null;
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
      /* "Villages": CARTO Voyager (rendered from real OpenStreetMap data) â€”
         prominent, high-contrast place labels down to villages, localities
         and rural roads. Free community tiles, no API key, retina-ready. */
      hotLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 20, subdomains: "abcd",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      });
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
      if (!silent) toastSafe("Google satellite needs a Maps browser key â€” paste it in <b>GOOGLE_MAPS_API_KEY</b> (js/mapGooglePlus.js). Showing OpenStreetMap.", "info", 6500);
      mode = "osm";
    }
    [osm, satLayer, hybridLbl, terrainLayer, hotLayer, gHybrid].forEach(function (lyr) {
      if (!lyr) return;
      try { if (map.hasLayer(lyr)) map.removeLayer(lyr); } catch (e) {}
    });
    try {
      if (mode === "sat") satLayer.addTo(map);
      else if (mode === "hybrid") { satLayer.addTo(map); hybridLbl.addTo(map); }
      else if (mode === "villages") hotLayer.addTo(map);
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
    div.title = "Basemap: Streets / Villages (label-rich) / Satellite (latest available) / Hybrid / Terrain / Google (needs key)";
    div.innerHTML = '<button class="seg-btn active" data-base="osm">Streets</button>' +
      '<button class="seg-btn" data-base="villages" title="Label-rich style â€” shows many more villages, small towns and localities">Villages</button>' +
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
      /* Property markers stay selected â€” Street View never clears ULPIN state. */
      if (window.__ulpinStreetView) { try { window.__ulpinStreetView(target.lat, target.lng != null ? target.lng : target.lon, label); return; } catch (e2) {} }
      toastSafe("Street View needs a Google Maps browser key â€” set <b>GOOGLE_MAPS_API_KEY</b> in js/mapGooglePlus.js. The 2D map keeps working.", "info", 6000);
    });
    panel.appendChild(btn);
  }

  /* ================= REAL POI DISCOVERY (OpenStreetMap / Overpass) ========
     ADD-ONLY. Real Points of Interest around the current map view or around
     a searched place: schools, colleges, hospitals, shops, banks/ATMs, fuel
     & transport, government offices, religious places, parks, industry.
     - viewport-based, lazy, throttled (Overpass policy), cached, capped
     - NO POI is ever invented: only features actually mapped in OSM appear
     - category colours follow the approved light GovTech palette
     ======================================================================= */
  var OVERPASS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ];
  var POI_CATS = [
    { id: "schools", label: "Schools", color: "#2563EB", sel: ['amenity~"^(school|kindergarten)$"'] },
    { id: "colleges", label: "Colleges", color: "#15803D", sel: ['amenity~"^(college|university|library)$"'] },
    { id: "health", label: "Hospitals & Clinics", color: "#DC2626", sel: ['amenity~"^(hospital|clinic|doctors|pharmacy)$"'] },
    { id: "shops", label: "Shops & Markets", color: "#EAB308", sel: ["shop"] },
    { id: "food", label: "Food & Stay", color: "#EA580C", sel: ['amenity~"^(restaurant|cafe|fast_food)$"', 'tourism~"^(hotel|guest_house)$"'] },
    { id: "banks", label: "Banks & ATMs", color: "#2563EB", sel: ['amenity~"^(bank|atm)$"'] },
    { id: "transport", label: "Fuel & Transport", color: "#EA580C", sel: ['amenity~"^(fuel|bus_station)$"', 'railway~"^(station|halt)$"', "aeroway=aerodrome"] },
    { id: "gov", label: "Gov & Public", color: "#15803D", sel: ['amenity~"^(townhall|police|fire_station|post_office|government|community_centre|courthouse)$"'] },
    { id: "religious", label: "Religious", color: "#7C3AED", sel: ["amenity=place_of_worship"] },
    { id: "parks", label: "Parks & Tourism", color: "#16A34A", sel: ['leisure~"^(park|garden|sports_centre|stadium|pitch|playground)$"', 'tourism~"^(attraction|museum|zoo)$"'] },
    { id: "industry", label: "Industry & Warehouses", color: "#64748B", sel: ['landuse=industrial', 'building~"^(industrial|warehouse)$"', "man_made=warehouse"] }
  ];
  /* search keywords -> category id (longest match wins, word-boundary safe) */
  var POI_KEYWORDS = [
    ["petrol pump", "transport"], ["petrol station", "transport"], ["fuel station", "transport"],
    ["railway station", "transport"], ["train station", "transport"], ["bus station", "transport"], ["bus stand", "transport"],
    ["government office", "gov"], ["community centre", "gov"], ["community center", "gov"],
    ["shopping centre", "shops"], ["shopping center", "shops"], ["shopping mall", "shops"],
    ["fire station", "gov"], ["post office", "gov"], ["police station", "gov"],
    ["medical college", "colleges"], ["industrial area", "industry"], ["industrial estate", "industry"],
    ["medical store", "health"],
    ["sports facility", "parks"], ["sports centre", "parks"], ["sports center", "parks"],
    ["tourist place", "parks"],
    ["airport", "transport"], ["railway", "transport"],
    ["hospital", "health"], ["hospitals", "health"], ["clinic", "health"], ["clinics", "health"],
    ["pharmacy", "health"], ["pharmacies", "health"], ["chemist", "health"], ["medical", "health"],
    ["school", "schools"], ["schools", "schools"],
    ["college", "colleges"], ["colleges", "colleges"], ["university", "colleges"], ["universities", "colleges"],
    ["library", "colleges"], ["libraries", "colleges"],
    ["atm", "banks"], ["atms", "banks"], ["bank", "banks"], ["banks", "banks"],
    ["shop", "shops"], ["shops", "shops"], ["market", "shops"], ["markets", "shops"],
    ["supermarket", "shops"], ["supermarkets", "shops"], ["mall", "shops"], ["malls", "shops"],
    ["store", "shops"], ["stores", "shops"],
    ["restaurant", "food"], ["restaurants", "food"], ["hotel", "food"], ["hotels", "food"],
    ["cafe", "food"], ["dhaba", "food"], ["canteen", "food"],
    ["temple", "religious"], ["temples", "religious"], ["mosque", "religious"], ["mosques", "religious"],
    ["masjid", "religious"], ["church", "religious"], ["churches", "religious"],
    ["gurudwara", "religious"], ["gurudwaras", "religious"], ["gurdwara", "religious"], ["shrine", "religious"],
    ["park", "parks"], ["parks", "parks"], ["garden", "parks"], ["stadium", "parks"],
    ["playground", "parks"], ["museum", "parks"], ["zoo", "parks"], ["tourist", "parks"],
    ["fuel", "transport"], ["petrol", "transport"],
    ["police", "gov"], ["court", "gov"],
    ["factory", "industry"], ["warehouse", "industry"], ["warehouses", "industry"], ["godown", "industry"]
  ];
  var poiLayer = null, poiRenderer = null, poiActive = null, poiAbort = null,
      poiCache = new Map(), poiCacheKeys = [], lastPoiReq = 0, poiLast = null;
  function poiCatById(id) {
    for (var i = 0; i < POI_CATS.length; i++) if (POI_CATS[i].id === id) return POI_CATS[i];
    return null;
  }
  function prettyTag(v) {
    v = String(v || "").replace(/_/g, " ");
    return v.charAt(0).toUpperCase() + v.slice(1);
  }
  /* Nominatim (class,type) -> category accent, for POI-styled search results */
  function poiClassInfo(cls, typ) {
    var t = String(typ || "").toLowerCase(), c = String(cls || "").toLowerCase();
    if (c === "amenity") {
      if (/^(school|kindergarten)$/.test(t)) return { color: "#2563EB", label: t === "kindergarten" ? "Kindergarten" : "School" };
      if (t === "college" || t === "university" || t === "library") return { color: "#15803D", label: prettyTag(t) };
      if (t === "hospital") return { color: "#DC2626", label: "Hospital" };
      if (t === "clinic" || t === "doctors") return { color: "#DC2626", label: "Clinic" };
      if (t === "pharmacy") return { color: "#DC2626", label: "Pharmacy" };
      if (t === "atm") return { color: "#2563EB", label: "ATM" };
      if (t === "bank") return { color: "#2563EB", label: "Bank" };
      if (t === "fuel") return { color: "#EA580C", label: "Petrol pump" };
      if (t === "bus_station") return { color: "#EA580C", label: "Bus station" };
      if (t === "marketplace") return { color: "#EAB308", label: "Market" };
      if (t === "restaurant" || t === "cafe" || t === "fast_food") return { color: "#EA580C", label: "Restaurant" };
      if (t === "place_of_worship") return { color: "#7C3AED", label: "Place of worship" };
      if (/^(police|fire_station|post_office|townhall|courthouse|government|community_centre)$/.test(t)) return { color: "#15803D", label: "Government" };
      if (/^(parking|bench|shelter|toilets)$/.test(t)) return { color: "#64748B", label: prettyTag(t) };
      return { color: "#2563EB", label: prettyTag(t) };
    }
    if (c === "shop") {
      if (t === "mall") return { color: "#EAB308", label: "Shopping centre" };
      if (t === "supermarket") return { color: "#EAB308", label: "Supermarket" };
      return { color: "#EAB308", label: "Shop Â· " + prettyTag(t) };
    }
    if (c === "tourism") {
      if (t === "hotel" || t === "guest_house") return { color: "#EA580C", label: "Hotel" };
      if (t === "museum") return { color: "#16A34A", label: "Museum" };
      if (t === "zoo") return { color: "#16A34A", label: "Zoo" };
      return { color: "#16A34A", label: "Tourist place" };
    }
    if (c === "leisure") {
      if (t === "park" || t === "garden") return { color: "#16A34A", label: "Park" };
      return { color: "#16A34A", label: "Sports & recreation" };
    }
    if (c === "railway" && (t === "station" || t === "halt")) return { color: "#EA580C", label: "Railway station" };
    if (c === "aeroway") return { color: "#EA580C", label: "Airport" };
    if (c === "healthcare") return { color: "#DC2626", label: "Healthcare" };
    if (c === "office") return { color: "#15803D", label: "Office" };
    if (c === "landuse" || c === "man_made") return { color: "#64748B", label: prettyTag(t) };
    return null;
  }
  function poiInfoOf(it) {
    var info = poiClassInfo(it && it.class, it && it.type);
    if (!info) return null;
    var a = (it && it.address) || {};
    var context = [a.village, a.town, a.city, a.suburb, a.county, a.state_district, a.state].filter(Boolean).slice(0, 3).join(", ");
    return { color: info.color, label: info.label, name: (it && it.name) || "", context: context };
  }
  function parsePoiQuery(q) {
    var s = String(q || "").toLowerCase().trim();
    if (!s) return null;
    var hit = null, idx = -1, len = 0;
    POI_KEYWORDS.forEach(function (k) {
      var re = new RegExp("\\b" + k[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b");
      var m = re.exec(s);
      if (m && k[0].length > len) { hit = k; idx = m.index; len = k[0].length; }
    });
    if (!hit) return null;
    var rest = (s.slice(0, idx) + " " + s.slice(idx + len))
      .replace(/\b(in|near|nearby|at|around|me|close|by|from|the|a|an)\b/g, " ")
      .replace(/[,]+/g, " ").replace(/\s+/g, " ").trim();
    return { cat: poiCatById(hit[1]), place: rest || "" };
  }
  /* ---- Overpass loader: viewport-based, throttled, cached, endpoint-failover ---- */
  /* fetch with a client-side timeout so a hanging endpoint falls over to the mirror */
  function timedFetch(url, opts, ms) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var t = setTimeout(function () { if (!done) { done = true; reject(new Error("timeout")); } }, ms);
      fetch(url, opts).then(function (r) {
        if (!done) { done = true; clearTimeout(t); resolve(r); }
      }, function (e) {
        if (!done) { done = true; clearTimeout(t); reject(e); }
      });
    });
  }
  function loadPois(cat, s, w, n, e, onOk, onErr) {
    var key = cat.id + "|" + s.toFixed(3) + "|" + w.toFixed(3) + "|" + n.toFixed(3) + "|" + e.toFixed(3);
    if (poiCache.has(key)) { onOk(poiCache.get(key)); return; }
    var run = function () {
      lastPoiReq = Date.now();
      if (poiAbort) { try { poiAbort.abort(); } catch (eA) {} }
      poiAbort = (typeof AbortController !== "undefined") ? new AbortController() : null;
      var bb = [s, w, n, e].join(",");
      var selParts = [];
      cat.sel.forEach(function (t) {
        selParts.push("node[" + t + "](" + bb + ");");
        selParts.push("way[" + t + "](" + bb + ");");
      });
      var body = "data=" + encodeURIComponent('[out:json][timeout:25];(' + selParts.join("") + ');out center 150;');
      var tryEp = function (i) {
        if (i >= OVERPASS.length) { onErr && onErr(new Error("all endpoints failed")); return; }
        timedFetch(OVERPASS[i], {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body,
          signal: poiAbort ? poiAbort.signal : undefined
        }, 35000)
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
          .then(function (data) {
            var els = ((data && data.elements) || []).filter(function (el) {
              var la = el.lat != null ? el.lat : (el.center && el.center.lat);
              var lo = el.lon != null ? el.lon : (el.center && el.center.lon);
              return isFinite(la) && isFinite(lo);
            }).map(function (el) {
              return {
                el: el, tags: el.tags || {},
                lat: el.lat != null ? el.lat : el.center.lat,
                lon: el.lon != null ? el.lon : el.center.lon
              };
            });
            poiCache.set(key, els); poiCacheKeys.push(key);
            if (poiCacheKeys.length > 40) { var old = poiCacheKeys.shift(); poiCache.delete(old); }
            onOk(els);
          })
          .catch(function (err) {
            if (err && err.name === "AbortError") return;
            tryEp(i + 1);
          });
      };
      tryEp(0);
    };
    var wait = Math.max(0, 2600 - (Date.now() - lastPoiReq)); /* Overpass courtesy: >=2.6s between requests */
    if (wait > 0) setTimeout(run, wait); else run();
  }
  /* ---- POI popups (reuse the existing light-theme .map-popup card) ---- */
  function poiPopupHtml(p, cat) {
    var t = p.tags || {};
    var name = t.name || (p._cluster ? p._cluster + " " + cat.label : cat.label);
    var typeKey = ["amenity", "shop", "tourism", "leisure", "railway", "aeroway", "landuse", "man_made", "building"].filter(function (k) { return t[k]; })[0];
    var typeName = typeKey ? prettyTag(t[typeKey]) : cat.label;
    var where = [t["addr:street"], t["addr:suburb"], t["addr:village"], t["addr:town"], t["addr:city"], t["addr:district"], t["addr:state"]].filter(Boolean).join(", ");
    var h = '<div class="map-popup"><strong>' + escSafe(name) + "</strong>";
    h += '<div class="mp-row"><span>Category</span><b>' + escSafe(cat.label) + "</b></div>";
    h += '<div class="mp-row"><span>Type</span><b>' + escSafe(typeName) + "</b></div>";
    if (where) h += '<div class="mp-row"><span>Where</span><b>' + escSafe(where) + "</b></div>";
    if (t.operator) h += '<div class="mp-row"><span>Operator</span><b>' + escSafe(t.operator) + "</b></div>";
    h += '<div class="mp-note">Real mapped place &middot; data &copy; OpenStreetMap contributors</div></div>';
    return h;
  }
  /* ---- Render fetched POIs; grid-cluster when very dense ---- */
  function renderPois(cat, els, bbox4) {
    var map = leafletMap(); if (!map) return;
    if (!poiLayer) { poiRenderer = L.canvas({ padding: 0.3 }); poiLayer = L.layerGroup().addTo(map); }
    poiLayer.clearLayers();
    poiActive = cat.id;
    paintPoiButtons();
    var pts = els, clustered = false;
    if (pts.length > 100) {
      clustered = true;
      var sN = Math.max(1e-6, bbox4[2] - bbox4[0]), sE = Math.max(1e-6, bbox4[3] - bbox4[1]);
      var gx = 14, gy = 10, cells = {};
      pts.forEach(function (p) {
        var cx = Math.min(gx - 1, Math.max(0, Math.floor((p.lon - bbox4[1]) / sE * gx)));
        var cy = Math.min(gy - 1, Math.max(0, Math.floor((p.lat - bbox4[0]) / sN * gy)));
        var k = cx + ":" + cy;
        (cells[k] = cells[k] || []).push(p);
      });
      pts = Object.keys(cells).map(function (k) {
        var g = cells[k], la = 0, lo = 0;
        g.forEach(function (p) { la += p.lat; lo += p.lon; });
        return { lat: la / g.length, lon: lo / g.length, tags: {}, _cluster: g.length };
      });
    }
    pts.forEach(function (p) {
      var m = L.circleMarker([p.lat, p.lon], {
        radius: p._cluster ? 9 : 5,
        color: "#ffffff", weight: 1.5,
        fillColor: cat.color, fillOpacity: 0.95,
        renderer: poiRenderer
      }).addTo(poiLayer);
      m.bindPopup(poiPopupHtml(p, cat), { maxWidth: 260 });
      if (p._cluster) m.on("click", function () { try { map.flyTo([p.lat, p.lon], Math.min(19, map.getZoom() + 2)); } catch (eZ) {} });
    });
    var capped = !clustered && els.length >= 150;
    showPoiStatus(pts.length + " " + cat.label.toLowerCase() + (clustered ? " (clustered â€” zoom in for detail)" : " in this area") +
      " Â· real OpenStreetMap data" + (capped ? " Â· showing the first 150 â€” zoom in for more" : ""));
    toastSafe("<b>" + els.length + "</b> real " + cat.label.toLowerCase() + " found nearby" + (clustered ? " â€” clustered, zoom in for detail." : "."), "ok", 3400);
    poiLast = {
      cat: cat.id, color: cat.color, label: cat.label, items: els,
      center: [(bbox4[0] + bbox4[2]) / 2, (bbox4[1] + bbox4[3]) / 2]
    };
  }
  /* ---- Category search: "school", "atm in Guntur", "petrol pump"â€¦ ---- */
  function runPoiQuery(pk, origQ) {
    var map = leafletMap();
    if (!map) { toastSafe("Open the Map view first, then search.", "info"); return; }
    if (!window.fetch) { toastSafe("POI search needs network fetch support in this browser.", "err"); return; }
    var cat = pk.cat;
    var doAround = function (lat, lon, placeLabel) {
      var s = Math.max(-90, lat - 0.05), n = Math.min(90, lat + 0.05);
      var w = Math.max(-180, lon - 0.06), e = Math.min(180, lon + 0.06);
      showPoiStatus("Loading real " + cat.label.toLowerCase() + " near " + (placeLabel || "the map view") + "â€¦");
      loadPois(cat, s, w, n, e, function (els) {
        renderPois(cat, els, [s, w, n, e]);
        try { map.flyToBounds([[s, w], [n, e]], { maxZoom: 15, duration: 0.9 }); } catch (eF) {}
        listPoisInDropdown();
      }, function () {
        showPoiStatus("");
        toastSafe("Could not load " + cat.label.toLowerCase() + " right now â€” please try again shortly.", "err");
      });
    };
    if (pk.place) {
      if (!geoThrottle()) { toastSafe("Hold on a second&hellip; (search rate limit)", "info", 1600); return; }
      toastSafe("Finding real " + cat.label.toLowerCase() + " near <b>" + escSafe(pk.place) + "</b>&hellip;", "info", 2600);
      fetch(NOMINATIM + "limit=1&q=" + encodeURIComponent(pk.place), { headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (list) {
          if (!list || !list.length) {
            /* not a place â€” fall back to a normal named search of the full query */
            runGeocode(origQ);
            return;
          }
          var it = list[0];
          var pa = it.address || {};
          var tooBig = !pa.city && !pa.town && !pa.village && !pa.suburb && !pa.county && !pa.state_district;
          if (tooBig) {
            /* the place part resolved to a state/country â€” search the full
               query by NAME instead (e.g. "Andhra University") */
            runGeocode(origQ);
            return;
          }
          showGeoResult(map, parseFloat(it.lat), parseFloat(it.lon), it.display_name, it.boundingbox, zoomForNominatim(it), poiInfoOf(it));
          doAround(parseFloat(it.lat), parseFloat(it.lon), String(it.display_name || "").split(",")[0]);
        })
        .catch(function () { toastSafe("Search service unavailable &mdash; check connection and retry.", "err"); });
      return;
    }
    if (map.getZoom() < 13) {
      toastSafe("Zoom in to city/town level first â€” real POIs load for the visible area only (or search e.g. <b>\u201cschools in Guntur\u201d</b>).", "info", 6000);
      return;
    }
    var c = map.getCenter();
    doAround(c.lat, c.lng, "");
  }
  /* ---- NAMED-PLACE FALLBACK (real OSM data only, nothing invented) -------
     When a proper-noun search (e.g. a named college) gets NO Nominatim hit,
     query Overpass for real NAMED features around the current map view and
     fuzzy-match their OSM names against the query. This rescues spelling
     variants: OSM may map "Audhishankara Engineering College" while the user
     types "Audisankara College of Engineering & Technology". Only names
     actually mapped in OSM, inside the visible (clamped) bbox, are shown. */
  var FB_STOP = { the: 1, of: 1, and: 1, at: 1, in: 1, near: 1, a: 1, an: 1, co: 1, or: 1, for: 1 };
  var FB_GENERIC = {
    engineering: 1, technology: 1, technological: 1, college: 1, collegium: 1,
    university: 1, school: 1, schools: 1, institute: 1, institution: 1,
    polytechnic: 1, medical: 1, arts: 1, science: 1, sciences: 1, degree: 1,
    junior: 1, higher: 1, secondary: 1, senior: 1, public: 1, central: 1,
    international: 1, national: 1, vidyalaya: 1, vidyalayam: 1, academy: 1,
    education: 1, educational: 1, campus: 1, department: 1, studies: 1,
    research: 1, management: 1, boys: 1, girls: 1, womens: 1, ladies: 1
  };
  function fbTokens(s) {
    return String(s || "").toLowerCase().replace(/&/g, " and ")
      .replace(/[^a-z0-9\u0900-\u097F]+/g, " ").split(" ")
      .filter(function (t) { return t && t.length > 1 && !FB_STOP[t]; });
  }
  function fbEditWithin(a, b, maxD) {
    if (a === b) return true;
    if (Math.abs(a.length - b.length) > maxD) return false;
    var prev = [], cur, i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur = [i];
      var rowMin = i;
      for (j = 1; j <= b.length; j++) {
        var d = Math.min(prev[j] + 1, cur[j - 1] + 1,
          prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        cur[j] = d;
        if (d < rowMin) rowMin = d;
      }
      if (rowMin > maxD) return false;
      prev = cur;
    }
    return prev[b.length] <= maxD;
  }
  function fbTokCost(qt, ct) {
    if (qt === ct) return 0;
    if (ct.indexOf(qt) !== -1 || qt.indexOf(ct) !== -1) return 0; /* prefix/substring */
    var maxD = qt.length >= 8 ? 2 : (qt.length >= 5 ? 1 : 0);
    if (maxD > 0 && fbEditWithin(qt, ct, maxD)) return maxD;
    return -1;
  }
  /* every DISTINCTIVE query token must be found; generic academic words may
     stay unmatched. Lower score = better (0 = exact token match). */
  function fbNameScore(qToks, name) {
    var cToks = fbTokens(name);
    if (!cToks.length) return -1;
    var matched = 0, penalty = 0, unmatchedGeneric = 0;
    for (var i = 0; i < qToks.length; i++) {
      var best = -1;
      for (var j = 0; j < cToks.length; j++) {
        var cst = fbTokCost(qToks[i], cToks[j]);
        if (cst === 0) { best = 0; break; }
        if (cst > 0 && (best < 0 || cst < best)) best = cst;
      }
      if (best >= 0) { matched++; penalty += best; }
      else if (FB_GENERIC[qToks[i]]) unmatchedGeneric++;
      else return -1; /* a distinctive token is missing -> not this place */
    }
    if (matched < 1 || matched * 2 < qToks.length) return -1;
    return penalty + unmatchedGeneric * 0.5;
  }

  function namedPlaceFallback(q) {
    var map = leafletMap();
    var qToks = fbTokens(q);
    if (!map || !qToks.length) {
      toastSafe("Location not found for <b>" + escSafe(q) +
        "</b>. Try a nearby city, tehsil or landmark.", "info", 4200);
      return;
    }
    if (!window.fetch) { toastSafe("Search needs network fetch support in this browser.", "err"); return; }
    if (map.getZoom() < 10) {
      toastSafe("No map match for <b>" + escSafe(q) + "</b>. Zoom in to city/district level and search again â€” real named-place search covers the visible area.", "info", 5600);
      return;
    }
    var b = map.getBounds();
    var s = b.getSouth(), n = b.getNorth(), w = b.getWest(), e = b.getEast();
    var MAX_SPAN = 0.4; /* keep the Overpass query bounded */
    if (n - s > MAX_SPAN) { var mLat = (s + n) / 2; s = mLat - MAX_SPAN / 2; n = mLat + MAX_SPAN / 2; }
    if (e - w > MAX_SPAN) { var mLng = (w + e) / 2; w = mLng - MAX_SPAN / 2; e = mLng + MAX_SPAN / 2; }
    var bb = [s, w, n, e].join(",");
    var sel = [];
    ["amenity", "office", "shop", "tourism", "leisure", "healthcare"].forEach(function (t) {
      sel.push("node[" + t + "][name](" + bb + ");");
      sel.push("way[" + t + "][name](" + bb + ");");
    });
    ["building=college", "building=university", "building=school", "building=institute"].forEach(function (t) {
      sel.push("node[" + t + "][name](" + bb + ");");
      sel.push("way[" + t + "][name](" + bb + ");");
    });
    var body = "data=" + encodeURIComponent('[out:json][timeout:25];(' + sel.join("") + ');out center 200;');
    showPoiStatus("Searching real named places matching \u201c" + q + "\u201dâ€¦");
    toastSafe("Looking for real mapped places named like <b>" + escSafe(q) + "</b>&hellip;", "info", 3000);
    var run = function () {
      lastPoiReq = Date.now();
      var tryEp = function (i) {
        if (i >= OVERPASS.length) {
          showPoiStatus("");
          toastSafe("Named-place search is busy right now â€” please retry in a moment.", "err", 3600);
          return;
        }
        timedFetch(OVERPASS[i], {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body
        }, 35000)
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
          .then(function (data) {
            showPoiStatus("");
            var seen = {}, hits = [];
            ((data && data.elements) || []).forEach(function (el) {
              var t = el.tags || {};
              if (!t.name) return;
              var k = (el.type || "n") + "/" + el.id;
              if (seen[k]) return;
              seen[k] = 1;
              var la = el.lat != null ? el.lat : (el.center && el.center.lat);
              var lo = el.lon != null ? el.lon : (el.center && el.center.lon);
              if (!isFinite(la) || !isFinite(lo)) return;
              var sc = fbNameScore(qToks, t.name);
              if (sc < 0) return;
              var key = ["amenity", "shop", "office", "tourism", "leisure", "healthcare", "building"].filter(function (kk) { return t[kk]; })[0];
              var info = (key && poiClassInfo(key, t[key])) || { color: "#2563EB", label: "Named place" };
              hits.push({
                name: t.name, color: info.color, label: info.label,
                lat: la, lon: lo, score: sc,
                context: info.label + " Â· real OpenStreetMap match"
              });
            });
            if (!hits.length) {
              toastSafe("No real mapped place matching <b>" + escSafe(q) + "</b> in this area â€” zoom to its locality or search a nearby town.", "info", 5200);
              return;
            }
            hits.sort(function (x, y) { return x.score - y.score; });
            hits = hits.slice(0, 8);
            if (hits.length === 1) {
              showGeoResult(map, hits[0].lat, hits[0].lon, hits[0].name, null, 17,
                { color: hits[0].color, label: hits[0].label, name: hits[0].name, context: hits[0].context });
              return;
            }
            renderPoiList(hits);
            toastSafe("<b>" + hits.length + " real named matches</b> found â€” pick one from the list under the search box.", "ok", 4600);
          })
          .catch(function () { tryEp(i + 1); });
      };
      tryEp(0);
    };
    var wait = Math.max(0, 2600 - (Date.now() - lastPoiReq)); /* same Overpass courtesy as loadPois */
    if (wait > 0) setTimeout(run, wait); else run();
  }

  /* ---- Named-POI result list under the search box (closest first) ---- */
  function renderPoiList(list) {
    hideSuggest();
    var box = $(".map-search-box");
    if (!box || !list || !list.length) return;
    var dd = document.createElement("div");
    dd.className = "ulpin-suggest"; dd.id = "ulpin-suggest";
    list.forEach(function (p) {
      var b = document.createElement("button");
      b.type = "button";
      b.innerHTML = '<span class="poi-dot" style="background:' + p.color + '"></span><b>' + escSafe(p.name) + "</b>" +
        ' <span class="poi-badge" style="color:' + p.color + '">' + escSafe(p.label) + "</span>" +
        "<small>" + escSafe(p.context || "") + "</small>";
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.addEventListener("click", function () {
        hideSuggest();
        var m = leafletMap(); if (!m) return;
        showGeoResult(m, p.lat, p.lon, p.name, null, 17, { color: p.color, label: p.label, name: p.name, context: p.context });
      });
      dd.appendChild(b);
    });
    if (dd.children.length) box.appendChild(dd);
  }
  function listPoisInDropdown() {
    var L0 = poiLast;
    if (!L0 || !L0.items || !L0.items.length) return;
    var named = L0.items.filter(function (p) { return p.tags && p.tags.name; });
    if (!named.length) return;
    named.sort(function (a, b) {
      var da = (a.lat - L0.center[0]) * (a.lat - L0.center[0]) + (a.lon - L0.center[1]) * (a.lon - L0.center[1]);
      var db = (b.lat - L0.center[0]) * (b.lat - L0.center[0]) + (b.lon - L0.center[1]) * (b.lon - L0.center[1]);
      return da - db;
    });
    var list = named.slice(0, 8).map(function (p) {
      var t = p.tags;
      var typeKey = ["amenity", "shop", "tourism", "leisure", "railway", "aeroway", "landuse", "man_made", "building"].filter(function (k) { return t[k]; })[0];
      var loc = t["addr:city"] || t["addr:town"] || t["addr:village"] || t["addr:suburb"] || "";
      return {
        name: t.name, color: L0.color, label: L0.label, lat: p.lat, lon: p.lon,
        context: prettyTag(typeKey ? t[typeKey] : "") + (loc ? " Â· " + loc : "")
      };
    });
    renderPoiList(list);
  }
  /* ---- "Nearby places" panel (lazy, viewport-only discovery) ---- */
  function showPoiStatus(msg) {
    var el = document.getElementById("ulpin-poi-status");
    if (el) el.textContent = msg || "Nearby real places â€” pick a category (loads the visible area only).";
  }
  function paintPoiButtons() {
    var btns = document.querySelectorAll("#ulpin-poi-panel .ulpin-poi-btn");
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle("on", btns[i].dataset.cat === poiActive);
  }
  function clearPois(silent) {
    if (poiLayer) poiLayer.clearLayers();
    poiActive = null;
    paintPoiButtons();
    showPoiStatus("");
    if (!silent) toastSafe("Nearby POI layer cleared.", "info", 1800);
  }
  function poiBboxAround(map) {
    var c = map.getCenter(), b = map.getBounds();
    var sN = Math.min(0.12, Math.max(0.02, b.getNorth() - b.getSouth()));
    var sE = Math.min(0.13, Math.max(0.02, b.getEast() - b.getWest()));
    return [c.lat - sN / 2, c.lng - sE / 2, c.lat + sN / 2, c.lng + sE / 2];
  }
  function addNearbyPanel() {
    if (document.getElementById("ulpin-poi-panel")) return;
    var panel = document.getElementById("map-layers-panel");
    if (!panel) return;
    var wrap = document.createElement("div");
    wrap.id = "ulpin-poi-panel"; wrap.className = "ulpin-poi-panel";
    var grid = document.createElement("div"); grid.className = "ulpin-poi-grid";
    POI_CATS.forEach(function (cat) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "ulpin-poi-btn"; b.dataset.cat = cat.id;
      b.title = "Load real " + cat.label.toLowerCase() + " (OpenStreetMap) around the current map view";
      b.innerHTML = '<span class="poi-dot" style="background:' + cat.color + '"></span>' + escSafe(cat.label);
      b.addEventListener("click", function () {
        var map = leafletMap();
        if (!map) { toastSafe("Open the Map view first, then load nearby places.", "info"); return; }
        if (poiActive === cat.id) { clearPois(); return; }
        if (map.getZoom() < 13) {
          toastSafe("Zoom in to city/town level first â€” real POIs load for the visible area only.", "info", 4200);
          return;
        }
        var b4 = poiBboxAround(map);
        showPoiStatus("Loading real " + cat.label.toLowerCase() + "â€¦");
        loadPois(cat, b4[0], b4[1], b4[2], b4[3], function (els) { renderPois(cat, els, b4); listPoisInDropdown(); },
          function () { showPoiStatus(""); toastSafe("Could not load POIs right now â€” please try again shortly.", "err"); });
      });
      grid.appendChild(b);
    });
    var clearB = document.createElement("button");
    clearB.type = "button"; clearB.className = "ulpin-poi-clear"; clearB.textContent = "Clear";
    clearB.title = "Remove the nearby POI layer";
    clearB.addEventListener("click", function () { clearPois(); });
    grid.appendChild(clearB);
    var status = document.createElement("div");
    status.id = "ulpin-poi-status"; status.className = "ulpin-poi-status";
    wrap.appendChild(grid); wrap.appendChild(status);
    panel.appendChild(wrap);
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
        try { addNearbyPanel(); } catch (e6) {}
        try {
          if (window.__ulpinHasGoogleKey && window.__ulpinHasGoogleKey() && window.__ulpinLoadGoogleApi && window.__ulpinWirePlaces) {
            window.__ulpinLoadGoogleApi(true).then(function () { try { window.__ulpinWirePlaces(); } catch (e4) {} }).catch(function () {});
          }
        } catch (e5) {}
        if (window.__ulpinGpsCtlAdded && document.getElementById("ulpin-basemap") && document.getElementById("ulpin-sv-btn") && document.getElementById("ulpin-poi-panel")) clearInterval(t);
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
