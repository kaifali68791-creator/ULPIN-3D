/* =====================================================================
   ULPIN 3D - Google Maps browser-key config (PUBLIC key only, additive)
   Paste ONLY a browser-restricted PUBLIC Google Maps JavaScript API key:
       var GOOGLE_MAPS_API_KEY = "YOUR_KEY_HERE";
   Restrict it in Google Cloud Console: HTTP referrers = your site only,
   APIs = Maps JavaScript API + Places API (Street View is included).
   While the placeholder below is unchanged, Google stays DISABLED and the
   site runs 100% on OSM / Nominatim / Esri / OpenTopoMap. Nothing breaks.
   NEVER put here: Google OAuth Client Secret, Supabase service_role /
   secret key, or any private credential.
   ===================================================================== */
var GOOGLE_MAPS_API_KEY = "YOUR_GOOGLE_MAPS_API_KEY";

/* ADD-ONLY Google integration (lazy, single-load, optional).
   No map is created here. The existing Leaflet lmap stays the only map. */
(function () {
  "use strict";
  function hasKey() {
    return typeof GOOGLE_MAPS_API_KEY === "string" &&
      GOOGLE_MAPS_API_KEY.length > 12 &&
      GOOGLE_MAPS_API_KEY.indexOf("YOUR_GOOGLE_MAPS_API_KEY") === -1;
  }
  window.__ulpinHasGoogleKey = hasKey;
  var apiPromise = null;
  function loadApi(needPlaces) {
    if (!hasKey()) return Promise.reject(new Error("missing-key"));
    if (apiPromise) return apiPromise;
    apiPromise = new Promise(function (resolve, reject) {
      try {
        if (document.querySelector('script[data-ulpin-gmaps="1"]')) {
          var n = 0;
          var t = setInterval(function () {
            n++;
            if (window.google && window.google.maps) { clearInterval(t); resolve(window.google.maps); }
            else if (n > 150) { clearInterval(t); reject(new Error("load-timeout")); }
          }, 100);
          return;
        }
        window.__ulpinGmapsReady = function () { resolve(window.google.maps); };
        window.gm_authFailure = function () {
          apiPromise = null;
          if (typeof toast === "function") {
            try { toast("Google Maps rejected the browser key (check APIs, referrer restrictions &amp; billing). OpenStreetMap remains active.", "err", 7000); } catch (e) {}
          }
        };
        var s = document.createElement("script");
        s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(GOOGLE_MAPS_API_KEY) +
          "&v=weekly&loading=async" + (needPlaces ? "&libraries=places" : "") + "&callback=__ulpinGmapsReady";
        s.async = true; s.defer = true;
        s.setAttribute("data-ulpin-gmaps", "1");
        s.onerror = function () { apiPromise = null; reject(new Error("load-failed")); };
        document.head.appendChild(s);
      } catch (e) { apiPromise = null; reject(e); }
    });
    return apiPromise;
  }
  window.__ulpinLoadGoogleApi = loadApi;
  function mapObj() {
    try {
      if (typeof L === "undefined") return null;
      if (typeof lmap === "undefined" || !lmap) return null;
      return lmap;
    } catch (e) { return null; }
  }


  /* Real Google satellite (hybrid) tiles inside the existing Leaflet map. */
  var googleHybrid = null;
  function ensureGoogleHybrid() {
    if (googleHybrid) return googleHybrid;
    googleHybrid = L.tileLayer("https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}&key=" + encodeURIComponent(GOOGLE_MAPS_API_KEY), {
      maxZoom: 20,
      attribution: "Imagery &copy; Google, Maxar, Airbus"
    });
    googleHybrid.on("tileerror", function () {
      if (typeof toast === "function") {
        try { toast("Google satellite tiles failed to load (check key, APIs &amp; billing). OpenStreetMap remains active.", "err", 6000); } catch (e) {}
      }
      try {
        if (window.__ulpinBaseMode && window.__ulpinBaseMode() === "google" && window.__ulpinSetBaseMode) window.__ulpinSetBaseMode("osm", true);
      } catch (e2) {}
    });
    return googleHybrid;
  }
  window.__ulpinGoogleHybridLayer = function () {
    if (!hasKey()) return null;
    try { return ensureGoogleHybrid(); } catch (e) { return null; }
  };
  /* Real Google Places Autocomplete on the existing #map-search box. */
  var wired = false, autocomplete = null;
  function wirePlaces() {
    if (wired) return;
    var input = document.getElementById("map-search");
    if (!input || !hasKey()) return;
    if (!window.google || !window.google.maps || !window.google.maps.places) return;
    try {
      var P = window.google.maps.places;
      if (!P.Autocomplete) return;
      var map = mapObj();
      autocomplete = new P.Autocomplete(input, { fields: ["geometry", "name", "formatted_address"] });
      if (map) {
        try {
          var c = map.getCenter();
          autocomplete.setBounds(new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(c.lat - 2, c.lng - 2),
            new window.google.maps.LatLng(c.lat + 2, c.lng + 2)));
        } catch (e) {}
      }
      autocomplete.addListener("place_changed", function () {
        var pl = null;
        try { pl = autocomplete.getPlace(); } catch (e2) {}
        if (!pl || !pl.geometry || !pl.geometry.location) {
          if (typeof toast === "function") { try { toast("Place search is temporarily unavailable.", "err", 3200); } catch (e3) {} }
          return;
        }
        var m = mapObj(); if (!m) return;
        var lat = pl.geometry.location.lat(), lng = pl.geometry.location.lng();
        if (window.__ulpinShowSearchResult) {
          try { window.__ulpinShowSearchResult(lat, lng, pl.name || "Selected place", pl.formatted_address || ""); } catch (e4) {}
        } else {
          try { m.flyTo([lat, lng], 14, { duration: 0.9 }); } catch (e5) { try { m.setView([lat, lng], 14); } catch (e6) {} }
        }
      });
      wired = true;
    } catch (e) {}
  }
  window.__ulpinWirePlaces = wirePlaces;

  /* Real Google Street View panorama inside the additive modal. */
  var pano = null;
  function ensureOverlay() {
    var ov = document.getElementById("ulpin-sv-overlay");
    if (ov) return ov;
    ov = document.createElement("div");
    ov.className = "ulpin-sv-overlay";
    ov.id = "ulpin-sv-overlay";
    ov.innerHTML = "<div class=\"ulpin-sv-card\" role=\"dialog\" aria-label=\"Street View\">" +
      "<div class=\"ulpin-sv-tag\" id=\"ulpin-sv-tag\">Street View</div>" +
      "<button class=\"ulpin-sv-close\" id=\"ulpin-sv-close\">Close &#10005;</button>" +
      "<div id=\"ulpin-sv-pano\"></div></div>";
    document.body.appendChild(ov);
    document.getElementById("ulpin-sv-close").addEventListener("click", function () {
      ov.classList.remove("open");
      try { if (pano && window.google) window.google.maps.event.clearInstanceListeners(pano); } catch (e) {}
    });
    ov.addEventListener("click", function (e) {
      if (e.target === ov) {
        ov.classList.remove("open");
        try { if (pano && window.google) window.google.maps.event.clearInstanceListeners(pano); } catch (e2) {}
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && ov.classList.contains("open")) ov.classList.remove("open");
    });
    return ov;
  }
  window.__ulpinStreetView = function (lat, lng, label) {
    if (!hasKey()) {
      if (typeof toast === "function") { try { toast("Street View needs a Google Maps browser key — set <b>GOOGLE_MAPS_API_KEY</b> in js/mapGooglePlus.js. The 2D map keeps working.", "info", 6000); } catch (e) {} }
      return;
    }
    loadApi(false).then(function (maps) {
      var svc = new maps.StreetViewService();
      svc.getPanorama({ location: new maps.LatLng(lat, lng), radius: 80, source: maps.StreetViewSource.OUTDOOR }, function (data, status) {
        if (status !== maps.StreetViewStatus.OK || !data || !data.location || !data.location.latLng) {
          if (typeof toast === "function") { try { toast("No Street View imagery is available for this location.", "info", 4200); } catch (e2) {} }
          return;
        }
        var ov = ensureOverlay();
        document.getElementById("ulpin-sv-tag").textContent = "Street View — " + (label || (Number(lat).toFixed(5) + ", " + Number(lng).toFixed(5)));
        ov.classList.add("open");
        try {
          pano = new maps.StreetViewPanorama(document.getElementById("ulpin-sv-pano"), {
            position: data.location.latLng, pov: { heading: 0, pitch: 0 }, zoom: 1,
            addressControl: true, fullscreenControl: true
          });
        } catch (e3) {
          if (typeof toast === "function") { try { toast("No Street View imagery is available for this location.", "info", 4200); } catch (e4) {} }
          ov.classList.remove("open");
        }
      });
    }).catch(function (err) {
      if (typeof toast === "function") {
        try {
          toast(err && err.message === "missing-key"
            ? "Street View needs a Google Maps browser key — set <b>GOOGLE_MAPS_API_KEY</b> in js/mapGooglePlus.js."
            : "Google Maps is currently unavailable. OpenStreetMap remains active.", err && err.message === "missing-key" ? "info" : "err", 6000);
        } catch (e5) {}
      }
    });
  };
})();
