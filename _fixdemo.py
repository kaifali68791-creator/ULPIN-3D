# -*- coding: utf-8 -*-
import io
f = 'js/demoData.js'
content = io.open(f, encoding='utf-8').read()
lines = content.split('\n')
head = lines[:195]
tail = """
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
"""
io.open(f, 'w', encoding='utf-8').write('\n'.join(head) + tail)
print('OK', f, '->', len(io.open(f, encoding='utf-8').read().split('\n')), 'lines')