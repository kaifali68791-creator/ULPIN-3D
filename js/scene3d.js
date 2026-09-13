/* =====================================================================
   ULPIN 3D — Basic 3D PROPERTY VIEW (Three.js demo scene, no build step)
   Lives INSIDE the Map Viewer next to the real Leaflet 2D map.
   Toggled by #map-mode (2D Map / 3D Property View) — wiring in app.js.
   Mock data only · simple block volumes · OrbitControls · labels.
   ===================================================================== */
"use strict";

/* ---------- Mock building dataset (reusable) ---------- */
const DEMO_BUILDINGS_3D = [
  { id: "BLD-001", propId: "PROP-001", ulpin: "DEMO-ULPIN-001", name: "Building A", floors: 5,  units: 10, height: 15, status: "Demo", x: -17, z: 5 },
  { id: "BLD-002", propId: "PROP-002", ulpin: "DEMO-ULPIN-002", name: "Building B", floors: 8,  units: 16, height: 24, status: "Demo", x: 0,   z: -7 },
  { id: "BLD-003", propId: "PROP-003", ulpin: "DEMO-ULPIN-003", name: "Building C", floors: 12, units: 24, height: 36, status: "Demo", x: 17,  z: 5 }
];

/* ---------- Scene state ---------- */
const S3 = {
  inited: false, active: false,
  renderer: null, scene: null, camera: null, controls: null,
  pickables: [], groups: {}, labels: [],
  selected: null, hovered: null,
  downX: 0, downY: 0, raycaster: null, pointer: null
};

const S3_COL = {
  bg: 0x0b1526, ground: 0x0e1a30, gridA: 0x1e3a5f, gridB: 0x14263f,
  pad: 0x13253f, padEdge: 0x2a4a70, slab: 0x9fb8d8,
  bodyA: 0xcfe0f5, bodyB: 0xd6d2f4, bodyC: 0xc6e9dc,
  edge: 0x3b82f6, edgeSel: 0xf59e0b, edgeHover: 0x7dd3fc
};

/* ---------- One-time scene setup ---------- */
function s3init() {
  const stage = document.getElementById("three-stage");
  if (!stage || S3.inited) return;
  if (typeof THREE === "undefined") {
    stage.innerHTML = '<div class="s3-fallback"><b>3D engine unavailable</b>' +
      '<span>The Three.js library could not be loaded. The 2D OpenStreetMap keeps working normally.</span></div>';
    return;
  }
  try {
    const w = stage.clientWidth || 640, h = stage.clientHeight || 420;
    S3.renderer = new THREE.WebGLRenderer({ antialias: true });
    S3.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    S3.renderer.setSize(w, h);
    S3.renderer.shadowMap.enabled = true;
    S3.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stage.appendChild(S3.renderer.domElement);

    S3.scene = new THREE.Scene();
    S3.scene.background = new THREE.Color(S3_COL.bg);
    S3.scene.fog = new THREE.Fog(S3_COL.bg, 90, 260);

    S3.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 600);
    S3.camera.position.set(42, 34, 46);

    S3.controls = new THREE.OrbitControls(S3.camera, S3.renderer.domElement);
    S3.controls.target.set(0, 9, 0);
    S3.controls.enableDamping = true;
    S3.controls.dampingFactor = 0.08;
    S3.controls.minDistance = 14;
    S3.controls.maxDistance = 170;
    S3.controls.maxPolarAngle = Math.PI / 2 - 0.06;   // stay above ground
    S3.controls.screenSpacePanning = false;

    /* Lighting */
    S3.scene.add(new THREE.AmbientLight(0xbcd3f5, 0.55));
    S3.scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0a1424, 0.5));
    const sun = new THREE.DirectionalLight(0xfff2d9, 0.95);
    sun.position.set(34, 55, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
    sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
    sun.shadow.camera.far = 180;
    S3.scene.add(sun);

    /* Ground plane + grid (GIS look) */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240),
      new THREE.MeshStandardMaterial({ color: S3_COL.ground, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    S3.scene.add(ground);
    const grid = new THREE.GridHelper(240, 60, S3_COL.gridA, S3_COL.gridB);
    grid.material.transparent = true;
    grid.material.opacity = 0.5;
    S3.scene.add(grid);

    /* Site pad */
    const site = new THREE.Mesh(new THREE.BoxGeometry(58, 0.4, 44),
      new THREE.MeshStandardMaterial({ color: S3_COL.pad, roughness: 0.95 }));
    site.position.y = 0.2;
    site.receiveShadow = true;
    S3.scene.add(site);
    const siteEdge = new THREE.LineSegments(new THREE.EdgesGeometry(site.geometry),
      new THREE.LineBasicMaterial({ color: S3_COL.padEdge }));
    siteEdge.position.copy(site.position);
    S3.scene.add(siteEdge);

    DEMO_BUILDINGS_3D.forEach((b) => s3BuildBuilding(b));

    S3.raycaster = new THREE.Raycaster();
    S3.pointer = new THREE.Vector2();

    /* Interaction: click selects, drag orbits (OrbitControls) */
    S3.renderer.domElement.addEventListener("pointerdown", (e) => { S3.downX = e.clientX; S3.downY = e.clientY; });
    S3.renderer.domElement.addEventListener("pointerup", (e) => {
      if (Math.hypot(e.clientX - S3.downX, e.clientY - S3.downY) > 6) return;  // was a drag
      s3Pick(e, true);
    });
    S3.renderer.domElement.addEventListener("pointermove", (e) => s3Pick(e, false));
    window.addEventListener("resize", s3Resize);

    S3.inited = true;
    s3Animate();
  } catch (err) {
    stage.innerHTML = '<div class="s3-fallback"><b>3D scene failed to start</b><span>' +
      esc(String((err && err.message) || err)) + "</span></div>";
  }
}

/* ---------- One demo building: stacked floor blocks + edges + pad ---------- */
function s3BuildBuilding(b) {
  const g = new THREE.Group();
  const w = 11, d = 11;                       // footprint (m)
  const fh = b.height / b.floors;             // 3 m per floor
  const gap = 0.16;                           // visible floor division
  const bodyCol = b.id === "BLD-001" ? S3_COL.bodyA : b.id === "BLD-002" ? S3_COL.bodyB : S3_COL.bodyC;
  const bodyMat = new THREE.MeshStandardMaterial({ color: bodyCol, roughness: 0.8, metalness: 0.05 });
  const edgeMat = new THREE.LineBasicMaterial({ color: S3_COL.edge });
  const pickables = [];

  for (let i = 0; i < b.floors; i++) {
    const h = fh - gap;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bodyMat);
    mesh.position.set(0, fh * i + h / 2 + 0.4, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.bld = b;
    g.add(mesh);
    pickables.push(mesh);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
    edge.position.copy(mesh.position);
    g.add(edge);
  }

  /* Roof slab */
  const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.35, d + 0.6),
    new THREE.MeshStandardMaterial({ color: S3_COL.slab, roughness: 0.9 }));
  roof.position.set(0, b.height + 0.55, 0);
  roof.castShadow = true;
  roof.userData.bld = b;
  g.add(roof);
  pickables.push(roof);

  /* Per-building ground pad */
  const pad = new THREE.Mesh(new THREE.BoxGeometry(w + 3, 0.3, d + 3),
    new THREE.MeshStandardMaterial({ color: S3_COL.pad, roughness: 0.95 }));
  pad.position.y = 0.15;
  pad.receiveShadow = true;
  g.add(pad);
  const padEdge = new THREE.LineSegments(new THREE.EdgesGeometry(pad.geometry),
    new THREE.LineBasicMaterial({ color: S3_COL.padEdge }));
  padEdge.position.copy(pad.position);
  g.add(padEdge);

  g.position.set(b.x, 0, b.z);
  S3.scene.add(g);
  S3.groups[b.id] = { def: b, group: g, bodyMat, edgeMat, pickables };
  S3.pickables.push.apply(S3.pickables, pickables);
  s3AddLabel(b);
}

/* ---------- HTML labels that track the buildings ---------- */
function s3AddLabel(b) {
  const wrap = document.getElementById("three-labels");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = "b3d-label";
  el.innerHTML = "<b>" + esc(b.id) + "</b>" + esc(b.name) +
    '<span class="h">' + b.height + " m · " + b.floors + "F</span>";
  wrap.appendChild(el);
  S3.labels.push({ el: el, b: b, y: b.height + 3.4 });
}

function s3UpdateLabels() {
  if (!S3.camera || !S3.renderer) return;
  const rect = S3.renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector3();
  S3.labels.forEach((L) => {
    v.set(L.b.x, L.y, L.b.z).project(S3.camera);
    const off = v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05;
    L.el.style.display = off ? "none" : "block";
    if (!off) {
      L.el.style.left = ((v.x * 0.5 + 0.5) * rect.width) + "px";
      L.el.style.top = ((-v.y * 0.5 + 0.5) * rect.height) + "px";
    }
  });
}

/* ---------- Raycast hover + click selection ---------- */
function s3Pick(e, isClick) {
  if (!S3.renderer || !S3.camera || !S3.raycaster) return;
  const rect = S3.renderer.domElement.getBoundingClientRect();
  S3.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  S3.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  S3.raycaster.setFromCamera(S3.pointer, S3.camera);
  const hits = S3.raycaster.intersectObjects(S3.pickables, false);
  const b = hits.length ? hits[0].object.userData.bld : null;
  S3.renderer.domElement.style.cursor = b ? "pointer" : "grab";
  if (isClick) s3Select(b ? b.id : null);
  else if (b !== S3.hovered) { S3.hovered = b; s3SetHighlights(); }
}

/* ---------- Selection state -> materials + labels + panel ---------- */
function s3SetHighlights() {
  Object.keys(S3.groups).forEach((id) => {
    const G = S3.groups[id];
    if (S3.selected && id === S3.selected.id) {
      G.edgeMat.color.setHex(S3_COL.edgeSel);
      G.bodyMat.emissive.setHex(0x5a3c00);
      G.bodyMat.emissiveIntensity = 0.35;
    } else if (S3.hovered && id === S3.hovered.id) {
      G.edgeMat.color.setHex(S3_COL.edgeHover);
      G.bodyMat.emissive.setHex(0x123a5c);
      G.bodyMat.emissiveIntensity = 0.3;
    } else {
      G.edgeMat.color.setHex(S3_COL.edge);
      G.bodyMat.emissive.setHex(0x000000);
      G.bodyMat.emissiveIntensity = 0;
    }
  });
  S3.labels.forEach((L) => L.el.classList.toggle("sel", !!(S3.selected && L.b.id === S3.selected.id)));
}

function s3Select(id) {
  S3.selected = id ? (DEMO_BUILDINGS_3D.find((x) => x.id === id) || null) : null;
  S3.hovered = null;
  s3SetHighlights();
  s3RenderPanel(S3.selected);
}

/* ---------- Property information panel (right side) ---------- */
function s3RenderPanel(b) {
  const empty = document.getElementById("pp-empty");
  const body = document.getElementById("pp-body");
  if (!empty || !body) return;
  if (!b) { empty.hidden = false; body.hidden = true; body.innerHTML = ""; return; }
  empty.hidden = true;
  body.hidden = false;
  body.innerHTML =
    '<div class="pd-title"><div><h4>' + esc(b.name) + "</h4>" +
    "<div class='sub'>Selected property · 3D view</div></div>" +
    '<span class="pp-tag">PLATFORM DATA</span></div>' +
    '<div class="pd-grid" style="margin-top:4px">' +
    '<div class="pd-item"><span>Property ID</span><b>' + esc(b.propId) + "</b></div>" +
    '<div class="pd-item"><span>Building ID</span><b>' + esc(b.id) + "</b></div>" +
    '<div class="pd-item" style="grid-column:1/-1"><span>ULPIN</span><div class="pd-ulpin" style="margin-top:5px">' + esc(b.ulpin) + "</div></div>" +
    '<div class="pd-item"><span>Floors</span><b>' + b.floors + "</b></div>" +
    '<div class="pd-item"><span>Units</span><b>' + b.units + "</b></div>" +
    '<div class="pd-item"><span>Height</span><b>' + b.height + " m</b></div>" +
    '<div class="pd-item"><span>Status</span><b>' + esc(b.status) + "</b></div>" +
    "</div>" +
    '<div class="pp-note">Simple block volumes with floor divisions only — real apartment geometry and cadastral data arrive in later phases.</div>';
}

/* ---------- Resize + render loop ---------- */
function s3Resize() {
  if (!S3.renderer || !S3.camera) return;
  const stage = document.getElementById("three-stage");
  if (!stage) return;
  const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
  S3.camera.aspect = w / h;
  S3.camera.updateProjectionMatrix();
  S3.renderer.setSize(w, h);
}

function s3Animate() {
  requestAnimationFrame(s3Animate);
  if (!S3.active || !S3.renderer || state.view !== "map") return;
  S3.controls.update();
  S3.renderer.render(S3.scene, S3.camera);
  s3UpdateLabels();
}

/* ---------- Public API used by app.js ---------- */
window.ulpin3d = {
  ready: () => typeof THREE !== "undefined",
  activate() {
    s3init();
    if (S3.renderer) { S3.active = true; s3Resize(); }
  },
  deactivate() { S3.active = false; },
  select(id) { if (S3.inited) s3Select(id); }
};

/* =====================================================================
   ISO3D — real interactive 3D building for the "3D volumetric property
   model" page (#view-view3d). One tower = stacked floor volumes.
   Orbit (rotate/zoom/pan) + click a floor to select it.
   ===================================================================== */
const ISO = {
  inited: false, active: false,
  renderer: null, scene: null, camera: null, controls: null,
  tower: null, floors: [], labels: [],
  raycaster: null, pointer: null,
  downX: 0, downY: 0, selectedFloorId: null, hovered: null,
  /* ADD-ONLY vertical-demo state: explode offset, unit overlay, selection */
  explode: 0, W: 11, D: 11, FH: 3.2,
  unitGroup: null, unitCells: [], selectedUnitNo: null
};

function isoInit(stage) {
  const w = stage.clientWidth || 640, h = stage.clientHeight || 480;
  ISO.renderer = new THREE.WebGLRenderer({ antialias: true });
  ISO.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  ISO.renderer.setSize(w, h);
  ISO.renderer.shadowMap.enabled = true;
  ISO.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(ISO.renderer.domElement);

  ISO.scene = new THREE.Scene();
  ISO.scene.background = new THREE.Color(0x0b1526);
  ISO.scene.fog = new THREE.Fog(0x0b1526, 90, 260);

  ISO.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 600);
  ISO.camera.position.set(34, 26, 40);

  ISO.controls = new THREE.OrbitControls(ISO.camera, ISO.renderer.domElement);
  ISO.controls.enableDamping = true;
  ISO.controls.dampingFactor = 0.08;
  ISO.controls.minDistance = 12;
  ISO.controls.maxDistance = 190;
  ISO.controls.maxPolarAngle = Math.PI / 2 - 0.05;   /* stay above ground */

  ISO.scene.add(new THREE.AmbientLight(0xbcd3f5, 0.55));
  ISO.scene.add(new THREE.HemisphereLight(0xbfd8ff, 0x0a1424, 0.5));
  const sun = new THREE.DirectionalLight(0xfff2d9, 0.95);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -50; sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 80; sun.shadow.camera.bottom = -20;
  sun.shadow.camera.far = 180;
  ISO.scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: 0x0e1a30, roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  ISO.scene.add(ground);
  const grid = new THREE.GridHelper(240, 60, 0x1e3a5f, 0x14263f);
  grid.material.transparent = true;
  grid.material.opacity = 0.5;
  ISO.scene.add(grid);

  ISO.raycaster = new THREE.Raycaster();
  ISO.pointer = new THREE.Vector2();

  ISO.renderer.domElement.addEventListener("pointerdown", (e) => { ISO.downX = e.clientX; ISO.downY = e.clientY; });
  ISO.renderer.domElement.addEventListener("pointerup", (e) => {
    if (Math.hypot(e.clientX - ISO.downX, e.clientY - ISO.downY) > 6) return;   /* was a drag */
    isoPick(e, true);
  });
  ISO.renderer.domElement.addEventListener("pointermove", (e) => isoPick(e, false));
  window.addEventListener("resize", isoResize);

  ISO.inited = true;
  isoAnimate();
}

/* ---------- (Re)build the tower for a building ---------- */
function isoBuild(b) {
  if (ISO.tower) {
    ISO.scene.remove(ISO.tower);
    ISO.tower.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    ISO.tower = null;
  }
  const wrap = document.getElementById("stage3d-labels");
  if (wrap) wrap.innerHTML = "";
  ISO.floors = [];
  ISO.labels = [];
  ISO.hovered = null;

  const g = new THREE.Group();
  const W = 11, D = 11, FH = 3.2, GAP = 0.18;
  const totalH = b.floors.length * FH;

  b.floors.forEach((f, i) => {
    const col = (typeof FACE_COLORS !== "undefined" && FACE_COLORS[f.type]) ? FACE_COLORS[f.type] : { f: "#60a5fa", r: "#2563eb" };
    const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(col.f), roughness: 0.75, metalness: 0.05 });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(W, FH - GAP, D), bodyMat);
    const yc = i * FH + (FH - GAP) / 2 + 0.3;
    mesh.position.set(0, yc, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.floorId = f.id;
    g.add(mesh);
    const edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(col.r) });
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
    edge.position.copy(mesh.position);
    g.add(edge);
    ISO.floors.push({ floorId: f.id, mesh, edge, bodyMat, edgeMat, baseEdge: new THREE.Color(col.r), baseY: yc, idx: i });

    const el = document.createElement("div");
    el.className = "iso3d-fl";
    el.textContent = (typeof floorDisplayName === "function") ? floorDisplayName(f.id) : f.id;
    el.style.display = "none";
    if (wrap) wrap.appendChild(el);
    ISO.labels.push({ el, x: W / 2 + 1.2, y: yc, z: D / 2 + 1.2, baseY: yc, floorId: f.id });
  });
  ISO.W = W; ISO.D = D; ISO.FH = FH;
  ISO.explode = 0; ISO.selectedUnitNo = null;

  /* site pad under the tower */
  const pad = new THREE.Mesh(new THREE.BoxGeometry(W + 6, 0.3, D + 6),
    new THREE.MeshStandardMaterial({ color: 0x13253f, roughness: 0.95 }));
  pad.position.y = 0.15;
  pad.receiveShadow = true;
  g.add(pad);
  const padE = new THREE.LineSegments(new THREE.EdgesGeometry(pad.geometry),
    new THREE.LineBasicMaterial({ color: 0x2a4a70 }));
  padE.position.copy(pad.position);
  g.add(padE);

  ISO.scene.add(g);
  ISO.tower = g;

  /* frame the camera on this tower */
  const dist = Math.max(26, totalH * 1.2 + 14);
  ISO.camera.position.set(dist * 0.72, totalH * 0.55 + 9, dist * 0.72);
  ISO.controls.target.set(0, totalH * 0.45, 0);
  ISO.controls.update();

  ISO.selectedFloorId = state.selectedFloor;
  isoClearUnitOverlay();
  isoApplyExplode();
  isoApplyHighlights();
}

/* =====================================================================
   ADD-ONLY vertical-property demo helpers (no existing logic rewritten):
   floor separation (explode), lightweight unit-divider overlay, unit
   highlight. Geometry of the original floor meshes is never modified —
   only their Y position offset; unit cells live in a separate group.
   ===================================================================== */
function isoApplyExplode() {
  if (!ISO.floors.length) return;
  ISO.floors.forEach(function (F) {
    var off = (F.idx || 0) * (ISO.explode || 0);
    try { F.mesh.position.y = (F.baseY || 0) + off; } catch (e) {}
  });
  /* Edges are stored per floor: re-sync directly (no geometry matching). */
  try {
    ISO.floors.forEach(function (F) {
      if (F.edge) F.edge.position.y = F.mesh.position.y;
    });
  } catch (e3) {}
  try {
    ISO.labels.forEach(function (L) {
      var F = null;
      ISO.floors.forEach(function (x) { if (x.floorId === L.floorId) F = x; });
      if (F) L.y = (L.baseY || 0) + (F.idx || 0) * (ISO.explode || 0);
    });
  } catch (e4) {}
}
function isoClearUnitOverlay() {
  try {
    if (ISO.unitGroup && ISO.tower) ISO.tower.remove(ISO.unitGroup);
    if (ISO.unitGroup) ISO.unitGroup.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.dispose) o.material.dispose(); });
  } catch (e) {}
  ISO.unitGroup = null; ISO.unitCells = [];
}
function isoBuildUnitOverlay(floorId) {
  isoClearUnitOverlay();
  if (!ISO.inited || !ISO.tower || typeof THREE === "undefined") return 0;
  var F = null;
  ISO.floors.forEach(function (x) { if (x.floorId === floorId) F = x; });
  if (!F) return 0;
  var b = null;
  try { b = (typeof state !== "undefined" && state.selectedBuilding) ? state.selectedBuilding : null; } catch (e) { b = null; }
  if (!b || !b.floors) return 0;
  var f = null;
  b.floors.forEach(function (x) { if (x.id === floorId) f = x; });
  var units = (f && f.units) ? f.units : [];
  if (!units.length) return 0;
  var n = units.length, cols = Math.ceil(Math.sqrt(n)), rows = Math.ceil(n / cols);
  var W = ISO.W || 11, D = ISO.D || 11;
  var g = new THREE.Group();
  var i;
  for (i = 0; i < n; i++) {
    var cx = (i % cols), rz = Math.floor(i / cols);
    var cw = W / cols, cd = D / rows;
    var px = -W / 2 + cw * (cx + 0.5), pz = -D / 2 + cd * (rz + 0.5);
    var isSel = (ISO.selectedUnitNo === units[i].no);
    var mat = new THREE.MeshBasicMaterial({ color: isSel ? 0xf59e0b : 0x0ea5e9, transparent: true, opacity: isSel ? 0.34 : 0.16, depthWrite: false });
    var cell = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.14, cd - 0.14), mat);
    cell.rotation.x = -Math.PI / 2;
    cell.position.set(px, 0.035, pz);
    cell.userData.unitNo = units[i].no;
    g.add(cell);
    var eg = new THREE.LineSegments(new THREE.EdgesGeometry(cell.geometry), new THREE.LineBasicMaterial({ color: isSel ? 0xfbbf24 : 0x7dd3fc, transparent: true, opacity: 0.95 }));
    eg.rotation.x = -Math.PI / 2;
    eg.position.copy(cell.position);
    eg.userData.unitNo = units[i].no;
    g.add(eg);
    ISO.unitCells.push({ no: units[i].no, cell: cell, edge: eg, mat: mat });
  }
  /* Divider grid lines across the slab top */
  var lx;
  for (lx = 1; lx < cols; lx++) {
    var lgx = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2 + (W / cols) * lx, 0.02, -D / 2), new THREE.Vector3(-W / 2 + (W / cols) * lx, 0.02, D / 2)]);
    g.add(new THREE.Line(lgx, new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 })));
  }
  var lz;
  for (lz = 1; lz < rows; lz++) {
    var lgz = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-W / 2, 0.02, -D / 2 + (D / rows) * lz), new THREE.Vector3(W / 2, 0.02, -D / 2 + (D / rows) * lz)]);
    g.add(new THREE.Line(lgz, new THREE.LineBasicMaterial({ color: 0x7dd3fc, transparent: true, opacity: 0.85 })));
  }
  g.position.y = F.mesh.position.y + (ISO.FH - 0.18) / 2 + 0.02;
  ISO.tower.add(g);
  ISO.unitGroup = g;
  return n;
}
function isoHighlightUnit(no) {
  ISO.selectedUnitNo = no || null;
  ISO.unitCells.forEach(function (c) {
    var sel = (c.no === ISO.selectedUnitNo);
    try {
      c.mat.color.setHex(sel ? 0xf59e0b : 0x0ea5e9);
      c.mat.opacity = sel ? 0.38 : 0.16;
      c.edge.material.color.setHex(sel ? 0xfbbf24 : 0x7dd3fc);
    } catch (e) {}
  });
}

/* ---------- Floor highlight state ---------- */
function isoApplyHighlights() {
  ISO.floors.forEach((F) => {
    if (F.floorId === ISO.selectedFloorId) {
      F.bodyMat.emissive.setHex(0x6a4400);
      F.bodyMat.emissiveIntensity = 0.45;
      F.edgeMat.color.setHex(0xf59e0b);
    } else if (ISO.hovered && F.floorId === ISO.hovered) {
      F.bodyMat.emissive.setHex(0x123a5c);
      F.bodyMat.emissiveIntensity = 0.35;
      F.edgeMat.color.copy(F.baseEdge);
    } else {
      F.bodyMat.emissive.setHex(0x000000);
      F.bodyMat.emissiveIntensity = 0;
      F.edgeMat.color.copy(F.baseEdge);
    }
  });
  ISO.labels.forEach((L) => L.el.classList.toggle("sel", L.floorId === ISO.selectedFloorId));
}

/* ---------- Raycast hover + click (click selects the floor) ---------- */
function isoPick(e, isClick) {
  if (!ISO.renderer || !ISO.raycaster || !ISO.floors.length) return;
  const rect = ISO.renderer.domElement.getBoundingClientRect();
  ISO.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  ISO.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  ISO.raycaster.setFromCamera(ISO.pointer, ISO.camera);
  const hits = ISO.raycaster.intersectObjects(ISO.floors.map((F) => F.mesh), false);
  const fid = hits.length ? hits[0].object.userData.floorId : null;
  ISO.renderer.domElement.style.cursor = fid ? "pointer" : "grab";
  if (isClick) {
    if (fid && typeof selectFloor === "function") selectFloor(fid);
  } else if (fid !== ISO.hovered) {
    ISO.hovered = fid;
    isoApplyHighlights();
  }
}

/* ---------- Labels that track the floors ---------- */
function isoUpdateLabels() {
  if (!ISO.camera || !ISO.renderer) return;
  const rect = ISO.renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector3();
  ISO.labels.forEach((L) => {
    v.set(L.x, L.y, L.z).project(ISO.camera);
    const off = v.z > 1 || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05;
    L.el.style.display = off ? "none" : "block";
    if (!off) {
      L.el.style.left = ((v.x * 0.5 + 0.5) * rect.width) + "px";
      L.el.style.top = ((-v.y * 0.5 + 0.5) * rect.height) + "px";
    }
  });
}

/* ---------- Resize + render loop ---------- */
function isoResize() {
  if (!ISO.renderer || !ISO.camera) return;
  const stage = document.getElementById("stage3d-gl");
  if (!stage) return;
  const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
  ISO.camera.aspect = w / h;
  ISO.camera.updateProjectionMatrix();
  ISO.renderer.setSize(w, h);
}

function isoAnimate() {
  requestAnimationFrame(isoAnimate);
  if (!ISO.active || !ISO.renderer || state.view !== "view3d") return;
  ISO.controls.update();
  ISO.renderer.render(ISO.scene, ISO.camera);
  isoUpdateLabels();
}

/* ---------- Public API used by app.js ---------- */
window.iso3d = {
  show(b) {
    const stage = document.getElementById("stage3d-gl");
    if (!stage) return;
    if (typeof THREE === "undefined") {
      stage.innerHTML = '<div class="s3-fallback"><b>3D engine unavailable</b>' +
        '<span>The Three.js library could not be loaded. The rest of the app keeps working normally.</span></div>';
      return;
    }
    if (!ISO.inited) {
      if ((stage.clientWidth || 0) < 40) return;   /* still hidden — builds on first visible render */
      isoInit(stage);
    }
    isoBuild(b);
    ISO.active = true;
  },
  highlight(id) {
    if (!ISO.inited) return;
    ISO.selectedFloorId = id;
    isoApplyHighlights();
  },
  /* ADD-ONLY demo API: explode, unit overlay, metrics (existing API untouched) */
  setExplode(v) {
    if (!ISO.inited) return;
    ISO.explode = Math.max(0, Math.min(3, Number(v) || 0));
    isoApplyExplode();
    if (ISO.unitGroup && ISO.selectedFloorId) {
      var F2 = null;
      ISO.floors.forEach(function (x) { if (x.floorId === ISO.selectedFloorId) F2 = x; });
      if (F2) ISO.unitGroup.position.y = F2.mesh.position.y + (ISO.FH - 0.18) / 2 + 0.02;
    }
  },
  showUnits(floorId) {
    if (!ISO.inited) return 0;
    return isoBuildUnitOverlay(floorId);
  },
  highlightUnit(no) {
    if (!ISO.inited) return;
    isoHighlightUnit(no);
  },
  metrics() {
    var n = ISO.floors.length, FH = ISO.FH || 3.2;
    var idx = 0, sel = ISO.selectedFloorId;
    ISO.floors.forEach(function (F) { if (F.floorId === sel) idx = F.idx || 0; });
    return { floors: n, floorH: FH, totalH: n * FH, selIdx: idx, selElev: idx * FH, gap: ISO.explode || 0 };
  }
};




