/* =====================================================================
   GeoService — lightweight geographic (SPATIAL) data adapter.
   ---------------------------------------------------------------------
   Provides REAL building footprints for a viewport via the public
   OpenStreetMap Overpass API (free, no API key). This is spatial/map
   data ONLY — it contains NO ownership/cadastral information.

   SWAP POINT FOR PHASE 2: replace `fetchBuildingsInBBox` with
   state land-record APIs / authorized cadastral DBs / GIS parcel
   services. Callers only rely on:
     GeoService.fetchBuildingsInBBox(s, w, n, e, signal) -> [{ id, latlngs, tags, centerLat, centerLng }]
     GeoService.describeTags(tags)                       -> { name, address, type, levels, height }
     GeoService.footprintAreaM2(latlngs)                 -> approx m2
   ===================================================================== */
"use strict";

const GeoService = {
  source: "building footprints © OpenStreetMap (Overpass)",
  _endpoints: [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ],

  /* Real building footprints inside the bbox. Throws on failure. */
  async fetchBuildingsInBBox(south, west, north, east, signal) {
    const query = '[out:json][timeout:20];way["building"](' +
      south + "," + west + "," + north + "," + east + ');out geom 120;';
    let lastErr = null;
    for (const ep of this._endpoints) {
      try {
        const res = await fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "data=" + encodeURIComponent(query),
          signal
        });
        if (!res.ok) throw new Error("Overpass HTTP " + res.status);
        const data = await res.json();
        return (data.elements || [])
          .filter((el) => el.type === "way" && el.geometry && el.geometry.length > 2)
          .slice(0, 120)
          .map((el) => {
            const latlngs = el.geometry.map((pt) => [pt.lat, pt.lon]);
            const mid = latlngs[Math.floor(latlngs.length / 2)];
            return { id: el.type + "/" + el.id, latlngs, tags: el.tags || {}, centerLat: mid[0], centerLng: mid[1] };
          });
      } catch (err) {
        lastErr = err;
        if (err && err.name === "AbortError") throw err;
      }
    }
    throw lastErr || new Error("All geo endpoints failed");
  },

  /* Human-readable info from OSM tags (spatial attributes only). */
  describeTags(tags) {
    const street = tags["addr:street"] ? tags["addr:street"] + (tags["addr:housenumber"] ? " " + tags["addr:housenumber"] : "") : "";
    const address = [street, tags["addr:suburb"], tags["addr:city"]].filter(Boolean).join(", ");
    const BT = {
      yes: "Building", residential: "Residential building", house: "House", apartments: "Apartment building",
      commercial: "Commercial building", retail: "Retail building", office: "Office building",
      industrial: "Industrial building", school: "School", hospital: "Hospital", hotel: "Hotel",
      government: "Government building", construction: "Under construction", shed: "Shed",
      garage: "Garages", hut: "Hut", terrace: "Terrace housing", warehouse: "Warehouse",
      university: "University", college: "College", service: "Service building", temple: "Temple", mosque: "Mosque"
    };
    const type = BT[tags.building] || (tags.building ? tags.building.charAt(0).toUpperCase() + tags.building.slice(1) : "");
    let height = "";
    if (tags.height) height = String(tags.height).replace(/\s*m\s*$/i, "") + " m";
    else if (tags["building:levels"]) height = "";
    return {
      name: tags.name || "",
      address,
      type,
      levels: tags["building:levels"] || "",
      height
    };
  },

  /* Approximate polygon area in m2 (planar equirectangular around first point). */
  footprintAreaM2(latlngs) {
    if (!latlngs || latlngs.length < 3) return 0;
    const lat0 = latlngs[0][0], lng0 = latlngs[0][1];
    const KX = 111320 * Math.cos(lat0 * Math.PI / 180), KY = 110540;
    let a = 0;
    for (let i = 0; i < latlngs.length; i++) {
      const p = latlngs[i], q = latlngs[(i + 1) % latlngs.length];
      const x1 = (p[1] - lng0) * KX, y1 = (p[0] - lat0) * KY;
      const x2 = (q[1] - lng0) * KX, y2 = (q[0] - lat0) * KY;
      a += x1 * y2 - x2 * y1;
    }
    return Math.abs(a / 2);
  }
};
