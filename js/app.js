/* =====================================================================
   ULPIN 3D — Front-end logic (vanilla JS, no build step)
   Renders all demo views + interactivity from mock data (see data.js)
   ===================================================================== */
"use strict";

/* ---------- ICON LIBRARY (lucide-style strokes) ---------- */
const ICONS = {
  dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  map: '<path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2z"/><path d="M9 3v16M15 5v16"/>',
  cube: '<path d="m21 16-9 5-9-5V8l9-5 9 5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01"/>',
  layout: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
  pipe: '<rect x="3" y="6" width="18" height="12" rx="6"/><path d="M7 12h10M12 6v6"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-.4-9 7 7 0 0 0-13.4 2A4 4 0 0 0 7 19z"/><path d="m8 13 4-4 4 4"/>',
  chip: '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/><rect x="9" y="9" width="6" height="6"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  srch: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/>',
  tag: '<path d="M20.6 13.4 12 22l-9-9V3h10l9.6 9.4a2 2 0 0 1 0 2.8z"/><path d="M7.5 7.5h.01"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
  smart: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  filetext: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
  building2: '<path d="M4 22h16M6 22V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01M10 22v-3h4v3"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  landmark: '<path d="M3 21h18M5 21V10M9 21V10M15 21V10M19 21V10M3 10 12 3l9 7M12 3v4"/>',
  compass: '<circle cx="12" cy="12" r="10"/><path d="m16 8-2 6-6 2 2-6z"/>'
};
const ICON_WRAP = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
function icon(n) { return ICON_WRAP + (ICONS[n] || ICONS.dashboard) + "</svg>"; }

/* ---------- HELPERS ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function statusBadge(status) {
  const map = {
    "Titled": ["ok", "Titled"], "Active": ["ok", "Active"], "Occupied": ["ok", "Occupied"],
    "Vacant": ["info", "Vacant"], "Pending survey": ["warn", "Pending survey"], "Disputed": ["danger", "Disputed"],
    "Under registration": ["warn", "Under reg."], "Granted": ["ok", "Granted"], "Reserved": ["info", "Reserved"],
    "Pending": ["warn", "Pending"], "Mapped": ["ok", "Mapped"]
  };
  const entry = map[status] || ["info", status];
  const cls = entry[0];
  const dotCls = cls === "ok" ? "teal" : cls === "warn" ? "amber" : cls === "danger" ? "rose" : "blue";
  return '<span class="badge ' + cls + '"><span class="dot ' + dotCls + '"></span>' + entry[1] + "</span>";
}

/* ---------- APP STATE ---------- */
const state = {
  view: "dashboard",
  admin: JSON.parse(JSON.stringify(DEFAULT_ADMIN)),
  selectedParcel: null,
  selectedBuilding: BUILDINGS[0] || null,
  selectedFloor: null,
  mapLayer: "parcels",
  mapMode3d: false,
  selectedProperty: null,
  selectedSpatial: null,
  buildingsEnabled: true,
  query: "",
  generated: null,
  /* Demo role key awaiting login through the modal (null = normal Sign in) */
  loginRole: null
};
const currentAdmin = () => state.admin;

/* ---------- VIEW META ---------- */
const VIEW_META = {
  dashboard: ["Dashboard", "Overview of the sample jurisdiction &mdash; <b>Village Shivapur, Haveli Taluka, Pune</b>"],
  map: ["Map Viewer", "2D cadastral map of the sample village &mdash; <b>click a parcel to inspect it</b>"],
  view3d: ["3D Property View", "Volumetric floors &amp; property units stacked over base parcels"],
  parcels: ["Land Parcels", "Sample Records-of-Rights merged with geo-coordinates"],
  buildings: ["Buildings", "Vertical property entities registered above their base parcels"],
  units: ["Floors &amp; Units", "Every flat, shop and slot carries a volumetric ULPIN link"],
  ulpin: ["ULPIN Generator", "Generate &amp; verify the 26-character land parcel identity"],
  underground: ["Underground Infrastructure", "Subsurface utilities tied to their host parcels"],
  air: ["Air Rights", "3D volumes of air space registered above land parcels"],
  reports: ["Report Problem", "Prototype citizen complaint &mdash; stored locally in this browser only"],
  ai: ["AI &amp; ML Analysis", "Planned model modules for the full system"],
  sources: ["Data Sources", "Feeds &amp; systems to be integrated in later phases"],
  settings: ["Settings", "Workspace preferences"],
  users: ["User Management", "Team &amp; account directory — local application data"],
  roles: ["Role Management", "The four platform roles and their access scope"],
  platform: ["System Overview", "Platform snapshot — local application data"]
};

/* ---------- DEMO-ONLY ROLE CREDENTIALS (front-end demo gate — not real auth) ----------
   Pre-fills & verifies the login modal when a role button is clicked.
   Demo accounts only — not connected to any real email account or backend. */
const DEMO_ROLE_CREDENTIALS = {
  admin:    { email: "admin.demo@example.com",    password: "Admin@123" },
  revenue:  { email: "land.demo@example.com",     password: "Land@123" },
  gis:      { email: "gis.demo@example.com",      password: "GIS@123" },
  planning: { email: "planning.demo@example.com", password: "Planning@123" }
};

/* ---------- ROLE-BASED ACCESS CONTROL (frontend demo — ADDITIVE RBAC) ----------
   Maps each demo role key to the navigation views it may open. This only
   hides/refuses navigation and actions for the signed-in role — every existing
   feature stays in the app untouched. No role signed in (guest / generic demo
   sign-in / "Skip to demo platform") keeps the original full demo access.
   This is UI-level demo gating, NOT real security. No backend exists. */
const ADMIN_ONLY_VIEWS = ["users", "roles", "platform"];
const VIEW_ONLY_BUTTON_IDS = ["btn-new-record", "btn-generate-vertical-ulpin", "btn-bulk-ulpin"];
const ROLE_PERMISSIONS = {
  /* Admin — complete platform: every existing feature + administration */
  admin: {
    views: ["dashboard", "map", "view3d", "parcels", "buildings", "units", "ulpin", "underground", "air", "reports", "ai", "sources", "settings", "users", "roles", "platform"],
    viewOnly: false
  },
  /* Surveyor — surveying, mapping & spatial/property data */
  gis: {
    views: ["dashboard", "map", "view3d", "parcels", "buildings", "units", "ulpin", "underground", "air", "ai", "sources"],
    viewOnly: false
  },
  /* Revenue Officer — revenue/property records & verification */
  revenue: {
    views: ["dashboard", "map", "view3d", "parcels", "buildings", "units", "ulpin", "underground", "air", "ai", "sources"],
    viewOnly: false
  },
  /* Citizen — safe view-oriented interface (no AI admin analysis, no data sources,
     no settings; create/generate buttons disabled) */
  planning: {
    views: ["dashboard", "map", "view3d", "parcels", "buildings", "units", "ulpin", "underground", "air", "reports"],
    viewOnly: true
  }
};

/* Friendly section labels + per-role access scope wording for Role Management.
   The section lists are derived from ROLE_PERMISSIONS above — no duplicate
   permission data is created here. */
const VIEW_LABELS = {
  dashboard: "Dashboard", map: "Live Map", view3d: "3D Property View",
  parcels: "Land Parcels & Ownership Records", buildings: "Buildings", units: "Floors & Units",
  ulpin: "ULPIN Generator & Verification", underground: "Underground Infrastructure",
  air: "Air Rights", ai: "AI & ML Analysis · Topology Validation", sources: "Data Sources",
  settings: "Settings", users: "User Management", roles: "Role Management", platform: "System Overview",
  reports: "Report Problem"
};
const ROLE_SCOPE = {
  admin: "Full platform access — all sections plus user, role and system management",
  gis: "Surveying and mapping access — spatial & property data",
  revenue: "Property, revenue and ULPIN access — records & verification",
  planning: "View-oriented property access — search and information only"
};

/* Local user directory for the Admin "User Management" view.
   Built only from existing local application data: the account credentials
   above and the existing team list. No external backend or database is
   connected. */
const DEMO_USERS = [
  { name: "Platform User", role: "Admin (standard sign-in)", email: "demo@ulpin.gov.in", status: "Active", source: "Standard account" },
  { name: "Administrator", role: "Admin", email: "admin.demo@example.com", status: "Active", source: "Role account" },
  { name: "Revenue Officer", role: "Revenue Officer", email: "land.demo@example.com", status: "Active", source: "Role account" },
  { name: "Surveyor", role: "Surveyor", email: "gis.demo@example.com", status: "Active", source: "Role account" },
  { name: "Citizen", role: "Citizen", email: "planning.demo@example.com", status: "Active", source: "Role account" },
  { name: "Kaif ali", role: "Team — Web Developer", email: "—", status: "Member", source: "Team directory" },
  { name: "G. Devi Rohan Sai", role: "Team — Leader & Coordinator", email: "—", status: "Member", source: "Team directory" },
  { name: "R. Nikitha", role: "Team — UI/UX & Documentation", email: "—", status: "Member", source: "Team directory" },
  { name: "A. Rudra Teja", role: "Team — Researcher", email: "—", status: "Member", source: "Team directory" },
  { name: "Sk. Siddik Ahamad", role: "Team — Project Support", email: "—", status: "Member", source: "Team directory" },
  { name: "N Mallemkondaiah", role: "Team — Researcher", email: "—", status: "Member", source: "Team directory" }
];

/* ---------- ROLE SELECTION (STEP 1) ---------- */
const ROLE_DATA = [
  {
    key: "admin", name: "Admin", icon: "shield", accent: "#60a5fa",
    btn: "Continue as Admin",
    desc: "Manage users, system configuration, data sources and platform administration.",
    mode: "Platform administration mode · mock workspace",
    stats: [
      { label: "Team members", value: "12", meta: "4 roles · RBAC" },
      { label: "Data sources", value: "7", meta: "4 live · 3 additional" },
      { label: "System health", value: "99.9%", meta: "All services nominal" },
      { label: "Pending approvals", value: "4", meta: "Awaiting review" }
    ],
    cards: [
      { t: "User & access management", d: "Roles, invitations and an audit trail.", ico: "users" },
      { t: "Data source configuration", d: "DILRMP, Bhunaksha, GNSS feed toggles.", ico: "db", route: "sources" },
      { t: "Platform settings", d: "CRS, map provider and platform switches.", ico: "gear", route: "settings" },
      { t: "Audit & security", d: "Sign-in events and export logs (mock).", ico: "doc" }
    ]
  },
  {
    key: "revenue", name: "Revenue Officer", icon: "filetext", accent: "#34d399",
    btn: "Continue as Revenue Officer",
    desc: "Manage land parcels, ownership records, property information and ULPIN records.",
    mode: "Land records mode · mock workspace",
    stats: [
      { label: "Parcels tracked", value: "11", meta: "Sample village" },
      { label: "ULPINs issued", value: "11", meta: "100% coverage" },
      { label: "Pending mutations", value: "5", meta: "Awaiting verification" },
      { label: "Disputed parcels", value: "1", meta: "Under enquiry" }
    ],
    cards: [
      { t: "Records of Rights (RoR)", d: "Ownership snapshot per survey number.", ico: "doc", route: "parcels" },
      { t: "ULPIN records", d: "Generate and verify 26-char identities.", ico: "hash", route: "ulpin" },
      { t: "Mutation workflow", d: "Plot-by-plot status pipeline (mock).", ico: "edit" },
      { t: "Ownership search", d: "Search by owner name or survey number.", ico: "users" }
    ]
  },
  {
    key: "gis", name: "Surveyor", icon: "map", accent: "#38bdf8",
    btn: "Continue as Surveyor",
    desc: "Manage spatial data, survey information, parcels, buildings and future 3D mapping.",
    mode: "Survey & spatial data mode · mock workspace",
    stats: [
      { label: "Surveyed parcels", value: "11", meta: "RTK verified" },
      { label: "Drone flights", value: "3", meta: ">4.2 cm GSD" },
      { label: "RTK base stations", value: "12", meta: "GNSS · CORS" },
      { label: "Pending surveys", value: "2", meta: "Scheduled" }
    ],
    cards: [
      { t: "Cadastral map viewer", d: "Interactive 2D parcel map of the village.", ico: "map", route: "map" },
      { t: "3D volume browser", d: "Isometric building volumes & floors.", ico: "cube", route: "view3d" },
      { t: "Field survey channels", d: "Mobile sync placeholder (Phase 2).", ico: "smart" },
      { t: "LiDAR & AI modules", d: "Automated boundary detection — Phase 2.", ico: "scan", route: "ai" }
    ]
  },
  {
    key: "planning", name: "Citizen", icon: "building2", accent: "#fbbf24",
    btn: "Continue as Citizen",
    desc: "Manage buildings, infrastructure, underground assets, air-rights and urban planning information.",
    mode: "Urban infra planning mode · mock workspace",
    stats: [
      { label: "Buildings", value: "8", meta: "Vertical entities" },
      { label: "Underground assets", value: "14", meta: "Utilities mapped" },
      { label: "Air-right records", value: "3", meta: "Volumes registered" },
      { label: "Active projects", value: "4", meta: "Planning pipeline" }
    ],
    cards: [
      { t: "Building register", d: "Vertical property entities by parcel.", ico: "building", route: "buildings" },
      { t: "Underground infrastructure", d: "Subsurface utility cross-section.", ico: "pipe", route: "underground" },
      { t: "Air rights register", d: "Air-space volumes above parcels.", ico: "cloud", route: "air" },
      { t: "Urban indicators", d: "FSI / density mock dashboard — Phase 2.", ico: "landmark" },
      { t: "Report Problem", d: "Prototype citizen complaint submission — stored locally.", ico: "doc", route: "reports" }
    ]
  }
];

/* ---------- ROLE FUNCTIONS (STEP 1) ---------- */
function renderWelcomeRoles() {
  const grid = $("#role-grid");
  if (!grid) return;
  grid.innerHTML = ROLE_DATA.map((r) =>
    '<div class="role-card" data-role="' + r.key + '" style="--accent:' + r.accent + '">' +
      '<div class="rc-icon">' + icon(r.icon) + "</div>" +
      "<h2>" + esc(r.name) + "</h2>" +
      "<p>" + esc(r.desc) + "</p>" +
      '<button class="btn rc-btn"><span class="ni-ico" data-i="arrow"></span>' + esc(r.btn) + "</button>" +
    "</div>"
  ).join("");
  mountIcons(grid);
  $$("#role-grid .role-card").forEach((card) => {
    const select = () => { const r = ROLE_DATA.find((x) => x.key === card.dataset.role); if (r) openRoleLogin(r); };
    card.addEventListener("click", select);
    const b = card.querySelector(".rc-btn");
    if (b) b.addEventListener("click", (e) => { e.stopPropagation(); select(); });
  });
}

/* Role buttons open the SAME existing demo login modal, pre-filled for the
   selected role (demo-only gate) instead of entering the dashboard directly. */
function openRoleLogin(role) {
  openLogin(role.key);
}

function enterRole(role, via) {
  state.role = role;
  applyRoleNav();
  applyRoleActions();
  const welcome = $("#welcome-screen");
  if (welcome) welcome.classList.add("hidden");
  // activate the role workspace view
  $$(".view").forEach((v) => v.classList.remove("active"));
  const rv = $("#view-role");
  if (rv) rv.classList.add("active");
  $$(".nav-item").forEach((n) => n.classList.remove("active"));
  $("#view-title").textContent = "Role Workspace";
  $("#view-sub").innerHTML = "<b>" + esc(role.name) + "</b> · placeholder dashboard (Step 1)";
  renderRoleLanding(role);
  const rl = $("#side-role");
  if (rl) rl.textContent = role.name + " · platform access";
  toast("Signed in as <b>" + esc(role.name) + "</b>" + (via ? " · " + esc(via) + " verified." : " — sign-in verified."), "ok");
  window.scrollTo(0, 0);
}

function renderRoleLanding(role) {
  $("#role-welcome-title").textContent = "Welcome, " + role.name;
  $("#role-welcome-sub").textContent = role.mode;
  $("#role-hero-icon").innerHTML = '<div class="rh-ico" style="--accent:' + role.accent + '">' + icon(role.icon) + "</div>";
  $("#role-kpis").innerHTML = role.stats.map((s) =>
    '<div class="kpi"><div class="kpi-label">' + esc(s.label) + '</div><div class="kpi-value">' + esc(s.value) + '</div><div class="kpi-meta">' + esc(s.meta) + "</div></div>"
  ).join("");
  $("#role-cards").innerHTML = role.cards.map((c) =>
    '<div class="role-card-item"' + (c.route ? ' data-route="' + c.route + '"' : "") + '>' +
      '<div class="rci-ico" style="--accent:' + role.accent + '">' + icon(c.ico) + "</div>" +
      '<div><h4>' + esc(c.t) + "</h4><p>" + esc(c.d) + "</p></div>" +
      (c.route ? '<span class="rci-go">' + icon("arrow") + "</span>" : "") +
    "</div>"
  ).join("");
  mountIcons($("#role-hero-icon"));
  mountIcons($("#role-cards"));
  $$("#role-cards [data-route]").forEach((el) => el.addEventListener("click", () => {
    goto(el.dataset.route);
    toast("Module opened — full role workflows arrive in later steps.", "info", 2600);
  }));
  $("#btn-change-role").onclick = showWelcome;
  $("#btn-enter-platform").onclick = () => goto("dashboard");
}

function showWelcome() {
  state.role = null;
  const welcome = $("#welcome-screen");
  if (welcome) welcome.classList.remove("hidden");
  const rl = $("#side-role");
  if (rl) rl.textContent = "Survey Master · RTK Network";
  applyRoleNav();
  applyRoleActions();
  window.scrollTo(0, 0);
}

/* ---------- RBAC HELPERS (demo, frontend-only) ----------
   Central role-permission check + navigation/action gating. These functions
   only SHOW/HIDE or ENABLE/DISABLE existing UI for the signed-in role — they
   never delete features. Guests keep full original access. */
function currentRoleKey() { return state.role ? state.role.key : null; }

function roleCan(view) {
  if (ADMIN_ONLY_VIEWS.indexOf(view) !== -1) return currentRoleKey() === "admin";
  const rk = currentRoleKey();
  const perms = rk ? ROLE_PERMISSIONS[rk] : null;
  if (!perms) return true; /* guest / generic demo sign-in — original full access */
  return perms.views.indexOf(view) !== -1;
}

/* Show/hide ONLY the existing navigation entries for the signed-in role, and
   hide a nav group label when every entry under it is hidden. */
function applyRoleNav() {
  $$(".nav-item").forEach((n) => {
    const v = n.dataset.view;
    if (ADMIN_ONLY_VIEWS.indexOf(v) !== -1) { n.style.display = currentRoleKey() === "admin" ? "" : "none"; return; }
    const rk = currentRoleKey();
    const perms = rk ? ROLE_PERMISSIONS[rk] : null;
    n.style.display = perms && perms.views.indexOf(v) === -1 ? "none" : "";
  });
  $$(".nav-label").forEach((lbl) => {
    let el = lbl.nextElementSibling, any = false;
    while (el && !el.classList.contains("nav-label") && !el.classList.contains("bottom")) {
      if (el.classList.contains("nav-item") && el.style.display !== "none") { any = true; break; }
      el = el.nextElementSibling;
    }
    lbl.style.display = any ? "" : "none";
  });
}

/* Disable create/generate actions for view-only roles (Citizen). The buttons
   stay in the DOM — they are only disabled, never removed. */
function applyRoleActions() {
  const rk = currentRoleKey();
  const perms = rk ? ROLE_PERMISSIONS[rk] : null;
  const viewOnly = !!(perms && perms.viewOnly);
  VIEW_ONLY_BUTTON_IDS.forEach((id) => {
    const b = $("#" + id);
    if (b) b.disabled = viewOnly;
  });
}

/* ---------- ADMIN-ONLY VIEWS (User Management / Role Management / System Overview) ----------
   Additive admin sections that reuse existing local application data and existing CSS
   classes. They clearly state that no external backend/database is connected. */
function renderAdminViews() {
  const ub = $("#users-table-body");
  if (ub) {
    ub.innerHTML = DEMO_USERS.map((u) =>
      "<tr><td><b>" + esc(u.name) + "</b></td><td>" + esc(u.role) + "</td><td>" + esc(u.email) +
      "</td><td>" + statusBadge(u.status) + "</td><td>" + esc(u.source) + "</td></tr>"
    ).join("");
    const c = $("#users-count"); if (c) c.textContent = DEMO_USERS.length + " accounts";
  }
  const rb = $("#roles-table-body");
  if (rb) {
    rb.innerHTML = ROLE_DATA.map((r) => {
      const p = ROLE_PERMISSIONS[r.key] || { views: [] };
      const cred = DEMO_ROLE_CREDENTIALS[r.key] || {};
      const scope = (p.views || []).map((v) => VIEW_LABELS[v] || v).join(" · ");
      const um = r.key === "admin"
        ? '<span class="badge ok"><span class="dot teal"></span>Full access</span>'
        : '<span class="badge info"><span class="dot blue"></span>No access</span>';
      return "<tr><td><b>" + esc(r.name) + "</b></td><td>" + esc(r.key) + "</td><td>" +
        esc(cred.email || "—") + "</td><td><b>" + esc(ROLE_SCOPE[r.key] || "") +
        '</b><div style="font-size:11.5px;color:var(--muted);margin-top:4px">' + esc(scope) + "</div></td><td>" + um + "</td></tr>";
    }).join("");
  }
  const ap = $("#access-policy-list");
  if (ap) {
    ap.innerHTML = ROLE_DATA.map((r) => {
      const p = ROLE_PERMISSIONS[r.key] || { views: [] };
      const um = r.key === "admin" ? "Full user & role management" : "No admin user-management access";
      const scope = (p.views || []).map((v) => VIEW_LABELS[v] || v).join(", ");
      return '<div class="set-row"><div><strong>' + esc(r.name) + "</strong><p>" +
        esc(ROLE_SCOPE[r.key] || "") + ". Sections: " + esc(scope) + '.</p></div><span class="chip">' + esc(um) + "</span></div>";
    }).join("");
  }
  const pk = $("#platform-kpis");
  if (pk) {
    const demo = (typeof DEMO !== "undefined" && DEMO && DEMO.stats) ? DEMO.stats : { parcels: 0, buildings: 0, units: 0 };
    const kpis = [
      { label: "Platform parcels", value: (PARCELS.length + (demo.parcels || 0)).toLocaleString("en-IN") },
      { label: "Platform buildings", value: (BUILDINGS.length + (demo.buildings || 0)).toLocaleString("en-IN") },
      { label: "Platform units", value: (ALL_UNITS.length + (demo.units || 0)).toLocaleString("en-IN") },
      { label: "Registered users", value: String(DEMO_USERS.length) }
    ];
    pk.innerHTML = kpis.map((s) =>
      '<div class="kpi"><div class="kpi-label">' + esc(s.label) + '</div><div class="kpi-value">' + esc(s.value) + "</div></div>"
    ).join("");
  }
  const ps = $("#platform-services");
  if (ps) {
    const services = [
      ["2D cadastral map", "Interactive parcel map of the sample village", "Active"],
      ["3D property view", "Volumetric floors, units & property boundaries", "Active"],
      ["ULPIN generator & verifier", "Simulated 26-character identity pipeline", "Active"],
      ["Underground infrastructure", "Subsurface utility registry tied to parcels", "Active"],
      ["Air rights register", "Air-space volumes above parcels", "Active"],
      ["AI & ML analysis", "In-page analysis modules (sample data)", "Active"],
      ["AI Assistant / chatbot", "Floating cadastral assistant", "Active"],
      ["Real backend / database", "None — frontend prototype with local application data", "Planned"]
    ];
    ps.innerHTML = services.map((s) =>
      '<div class="set-row"><div><strong>' + esc(s[0]) + "</strong><p>" + esc(s[1]) + '</p></div><span class="chip">' + esc(s[2]) + "</span></div>"
    ).join("");
  }
}

/* ---------- GOOGLE-AUTH GATE FOR ROLE SIGN-IN (surgical auth fix) ----------
   Selecting a role and pressing "Sign in to dashboard" no longer grants
   access via the hard-coded demo credentials. The selected role is stored
   as a pending intent and the EXISTING real Supabase Google OAuth flow
   (startGoogleSignIn, js/googleAuth.js) is started. After the OAuth
   redirect, handleGoogleSignIn() + googleRoleForEmail() decide the ACTUAL
   authorized role; the pending intent is compared against it and cleared.
   No second authentication system; no OAuth configuration changes. */
const PENDING_ROLE_STORE_KEY = "ulpin3d_pending_role";

function setPendingRoleIntent(roleKey) {
  try { sessionStorage.setItem(PENDING_ROLE_STORE_KEY, String(roleKey)); } catch (err) {}
}
function getPendingRoleIntent() {
  try { return sessionStorage.getItem(PENDING_ROLE_STORE_KEY); } catch (err) { return null; }
}
function clearPendingRoleIntent() {
  try { sessionStorage.removeItem(PENDING_ROLE_STORE_KEY); } catch (err) {}
}

/* True only when a REAL authenticated Supabase/Google session exists
   (globals maintained by js/googleAuth.js) AND the existing role-mapping
   helper is available. Never true for the old demo-only login. */
function googleSessionActive() {
  return typeof sbGoogleActive !== "undefined" && sbGoogleActive === true &&
         typeof sbUser !== "undefined" && !!sbUser && !!sbUser.email &&
         typeof googleRoleForEmail === "function";
}

function authorizedGoogleRoleKey() {
  try { return googleRoleForEmail(sbUser.email) || null; } catch (err) { return null; }
}

function denySelectedRole(selKey) {
  const sel = ROLE_DATA.find((r) => r.key === selKey);
  const authKey = authorizedGoogleRoleKey();
  const ar = ROLE_DATA.find((r) => r.key === authKey);
  toast("This Google account is not authorized for the selected role" +
    (sel ? " (<b>" + esc(sel.name) + "</b>)" : "") +
    ". Please choose the role assigned to your account" +
    (ar ? " (<b>" + esc(ar.name) + "</b>)" : "") + ".", "err", 7000);
}

/* Runs shortly after page load (covering the OAuth redirect return) to
   compare the pending selected role against the authenticated account's
   authorized role. The intent is always cleared once handled. */
function waitForPendingRoleCheck(attempt) {
  const pending = getPendingRoleIntent();
  if (!pending) return;
  if (googleSessionActive()) {
    const authKey = authorizedGoogleRoleKey();
    clearPendingRoleIntent();
    if (authKey === pending) return; /* match: handleGoogleSignIn already entered the authorized role */
    /* mismatch: never enter the selected role — return to role selection */
    showWelcome();
    denySelectedRole(pending);
    return;
  }
  if (attempt >= 10) { /* ~5s — authentication was not completed */
    clearPendingRoleIntent();
    toast("Google verification was not completed — the selected role was not granted. Please sign in again.", "err", 7000);
    return;
  }
  setTimeout(function () { waitForPendingRoleCheck(attempt + 1); }, 500);
}

/* ---------- LOGIN MODAL ---------- */
function openLogin(roleKey) {
  const ov = $("#login-overlay");
  if (!ov) return;
  /* Optional roleKey: role buttons open this same modal pre-filled with that
     role's DEMO-ONLY credentials. No roleKey = existing normal Sign in flow. */
  const cred = roleKey ? DEMO_ROLE_CREDENTIALS[roleKey] : null;
  const emailIn = $("#login-email"), passIn = $("#login-pass");
  if (cred) {
    state.loginRole = roleKey;
    if (emailIn) emailIn.value = cred.email;
    if (passIn) passIn.value = cred.password;
  } else {
    if (state.loginRole) {
      /* Fields still hold a role's credentials — restore the default demo pre-fill */
      if (emailIn) emailIn.value = emailIn.defaultValue;
      if (passIn) passIn.value = passIn.defaultValue;
    }
    state.loginRole = null;
  }
  const note = $("#login-role-note"), noteText = $("#login-role-note-text");
  const role = roleKey ? ROLE_DATA.find((r) => r.key === roleKey) : null;
  if (note && noteText) {
    if (cred && role) {
      noteText.innerHTML = "<b>" + esc(role.name) + "</b> · sign-in details pre-filled";
      note.style.setProperty("--accent", role.accent || "#38bdf8");
      note.hidden = false;
    } else {
      note.hidden = true;
    }
  }
  ov.classList.add("show");
  ov.setAttribute("aria-hidden", "false");
  setTimeout(() => { const e = $("#login-email"); if (e) { e.focus(); e.select(); } }, 80);
}

function closeLogin() {
  const ov = $("#login-overlay");
  if (!ov) return;
  ov.classList.remove("show");
  ov.setAttribute("aria-hidden", "true");
  const note = $("#login-role-note");
  if (note) note.hidden = true;
}

/* ---------- TEAM CYBERLEEKS MODAL ---------- */
function openTeam() {
  const ov = $("#team-overlay");
  if (!ov) return;
  ov.classList.add("show");
  ov.setAttribute("aria-hidden", "false");
}

function closeTeam() {
  const ov = $("#team-overlay");
  if (!ov) return;
  ov.classList.remove("show");
  ov.setAttribute("aria-hidden", "true");
}

function doLogin(e) {
  if (e) e.preventDefault();
  const email = ($("#login-email").value || "").trim();
  const pass = ($("#login-pass").value || "").trim();
  if (!email || !pass) {
    toast("Please enter both email and password.", "err");
    return;
  }
  /* Role sign-in REQUIRES real Google/Supabase authentication. The selected
     role can never override the role authorized for the Google account, and
     the hard-coded demo credentials no longer grant dashboard access. */
  if (state.loginRole) {
    const roleKey = state.loginRole;
    const role = ROLE_DATA.find((r) => r.key === roleKey);
    state.loginRole = null;
    if (!role) { toast("Unknown role selected.", "err"); return; }
    if (googleSessionActive()) {
      if (authorizedGoogleRoleKey() === roleKey) {
        closeLogin();
        clearPendingRoleIntent();
        enterRole(role, "Google account");
      } else {
        closeLogin();
        denySelectedRole(roleKey);
      }
      return;
    }
    /* No authenticated session → start the EXISTING Google OAuth flow.
       The dashboard is NOT opened before authentication succeeds. */
    setPendingRoleIntent(roleKey);
    if (typeof startGoogleSignIn === "function") {
      closeLogin();
      toast("<b>" + esc(role.name) + "</b> requires Google verification — redirecting to Google sign-in…", "info", 5000);
      startGoogleSignIn();
    } else {
      clearPendingRoleIntent();
      toast("Google sign-in is unavailable right now — access to <b>" + esc(role.name) + "</b> requires Google authentication.", "err", 7000);
    }
    return;
  }
  closeLogin();
  const welcome = $("#welcome-screen");
  if (welcome) welcome.classList.add("hidden");
  const rl = $("#side-role");
  if (rl) rl.textContent = email + " · signed in";
  toast("Welcome back, <b>" + esc(email.split("@")[0]) + "</b> — entering the platform.", "ok");
  goto("dashboard");
}

/* ---------- TOASTS ---------- */
function toast(msg, type, ms) {
  const root = $("#toast-root");
  if (!root) return;
  const el = document.createElement("div");
  el.className = "toast " + (type || "info");
  el.innerHTML = '<span class="t-ico">' + icon(type === "ok" ? "check" : type === "err" ? "x" : "bell") +
    '</span><div>' + msg + '</div><button class="t-x" aria-label="Dismiss">&times;</button>';
  root.appendChild(el);
  const kill = () => { el.classList.add("out"); setTimeout(() => el.remove(), 300); };
  el.querySelector(".t-x").addEventListener("click", kill);
  setTimeout(kill, ms || 3800);
}

/* ---------- MOUNT ICONS ---------- */
function mountIcons(root) { $$(".ni-ico[data-i]", root).forEach((el) => { el.innerHTML = icon(el.dataset.i); }); }

/* ---------- NAVIGATION ---------- */
function goto(view, opts) {
  /* RBAC (demo): refuse navigation into views the current role may not open.
     The underlying feature is NOT deleted — only this navigation is blocked. */
  if (!roleCan(view)) {
    const blocked = VIEW_META[view] || [view];
    toast("<b>" + esc(state.role ? state.role.name : "Guest") + "</b> role does not have access to <b>" + blocked[0] + "</b> — opening the dashboard instead.", "err");
    view = "dashboard";
  }
  state.view = view;
  $$(".view").forEach((v) => v.classList.remove("active"));
  const target = $("#view-" + view);
  if (target) target.classList.add("active");
  $$(".nav-item").forEach((n) => n.classList.toggle("active", n.dataset.view === view));
  const meta = VIEW_META[view] || ["", ""];
  $("#view-title").innerHTML = meta[0];
  $("#view-sub").innerHTML = meta[1];
  document.body.classList.remove("nav-open");
  if (opts && opts.focus) setTimeout(() => { const f = $("#" + opts.focus); if (f) f.focus(); }, 60);
  renderViewExtra(view);
}

function renderViewExtra(view) {
  if (view === "map") renderMap(state.selectedParcel || PARCELS[0]);
  if (view === "view3d") render3D();
  if (view === "parcels") renderParcelsTable();
  if (view === "units") renderUnitsTable();
  if (view === "underground") renderUnderground();
  if (view === "air") renderAir();
  if (view === "reports") {
    renderReportHistory();
    renderAdminReports();
    /* New (additive): Supabase is the cross-device source of truth — refresh
       from it, then re-render with the shared list. */
    refreshReportsFromSupabase(function (ok) { if (ok) { renderReportHistory(); renderAdminReports(); } });
  }
}

/* ===================== DASHBOARD ===================== */
function renderKPIs() {
  // Aggregate local + All-India demo datasets for a national-level snapshot
  const demoProps = (typeof DEMO !== "undefined" && DEMO && DEMO.stats) ? DEMO.stats : null;
  const totalParcels = PARCELS.length + (demoProps ? demoProps.parcels : 0);
  const totalBuildings = BUILDINGS.length + (demoProps ? demoProps.buildings : 0);
  const totalUnits = ALL_UNITS.length + (demoProps ? demoProps.units : 0);
  const totalFloors = (demoProps ? demoProps.floors : 0) + BUILDINGS.reduce((s, b) => s + b.floors.length, 0);
  const totalInfra = UNDERGROUND.length + (demoProps ? demoProps.infra : 0);
  const totalAir = AIR_RECORDS.length + (demoProps ? demoProps.air : 0);
  const statesCovered = demoProps ? demoProps.states : 1;
  const kpis = [
    { label: "Land parcels", value: totalParcels, meta: PARCELS.length + " local · " + (demoProps ? demoProps.parcels : 0) + " additional", ico: "layers", bg: "b-blue" },
    { label: "Buildings", value: totalBuildings, meta: "vertical entities registered", ico: "building", bg: "b-vio" },
    { label: "Units / volumes", value: totalUnits, meta: totalFloors + " floors mapped", ico: "layout", bg: "b-teal" },
    { label: "ULPINs issued", value: totalParcels, meta: '<span class="g">100%</span> parcel coverage', ico: "hash", bg: "b-amber" },
    { label: "Underground assets", value: totalInfra, meta: totalAir + " air-right volumes", ico: "pipe", bg: "b-rose" },
    { label: "States covered", value: statesCovered, meta: "All-India sample coverage", ico: "landmark", bg: "b-blue" }
  ];
  $("#kpi-grid").innerHTML = kpis.map((k) =>
    '<div class="kpi"><div class="kpi-label">' + k.label + '</div>' +
    '<div class="kpi-value">' + k.value + '</div>' +
    '<div class="kpi-meta">' + k.meta + '</div>' +
    '<div class="kpi-ico ' + k.bg + '">' + icon(k.ico) + '</div></div>'
  ).join("");
}

function renderChart() {
  const W = 660, H = 240, PAD = { l: 40, r: 16, t: 18, b: 34 };
  const max = Math.max(...ULPIN_TREND.map((d) => d.v)) * 1.15;
  const iw = W - PAD.l - PAD.r, ih = H - PAD.t - PAD.b;
  const n = ULPIN_TREND.length, gap = 46;
  const bw = Math.min(46, (iw - gap * (n - 1)) / n);
  let bars = "";
  ULPIN_TREND.forEach((d, i) => {
    const x = PAD.l + i * (bw + gap);
    const h = (d.v / max) * ih;
    const y = H - PAD.b - h;
    bars += '<g class="bar-g"><rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) +
      '" height="' + h.toFixed(1) + '" rx="7" fill="url(#barGrad)"/>' +
      '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 7).toFixed(1) + '" class="axis-t" text-anchor="middle" font-weight="700" fill="#2563eb">' + d.v + "</text>" +
      '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - PAD.b + 20).toFixed(1) + '" class="axis-label" fill="#64748b">' + d.m + "</text></g>";
  });
  let grid = "";
  for (let i = 0; i <= 4; i++) {
    const gv = Math.round((max / 4) * i);
    const gy = H - PAD.b - (i / 4) * ih;
    grid += '<line x1="' + PAD.l + '" y1="' + gy.toFixed(1) + '" x2="' + (W - PAD.r) + '" y2="' + gy.toFixed(1) + '" stroke="#eef2f7"/>' +
      '<text x="' + (PAD.l - 10) + '" y="' + (gy + 4).toFixed(1) + '" class="axis-t" text-anchor="end">' + gv + "</text>";
  }
  $("#dashboard-chart").innerHTML =
    '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Monthly ULPIN issuance bar chart">' +
    '<defs><linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#0ea5e9"/></linearGradient></defs>' +
    grid + bars + "</svg>";
}

function renderMiniStack() {
  const b = BUILDINGS.find((x) => x.id === "B-001") || BUILDINGS[0];
  const rev = b.floors.slice().reverse();
  const top = rev.filter((f) => /^F|^G/.test(f.id)).map((f, i) =>
    '<div class="ms-rect r' + (((i) % 6) + 1) + '"><span>' + f.id + (f.id === "G" ? " · Lobby/Retail" : "") + '</span><em>' + f.units.length + " units</em></div>"
  ).join("");
  const und = rev.filter((f) => f.id[0] === "B").map((f) =>
    '<div class="ms-rect ms-undr"><span>' + f.id + " · " + f.type + '</span><em>' + f.units.length + "</em></div>"
  ).join("");
  $("#mini-stack").innerHTML = top + '<div class="ms-rect ground"><span>Ground level</span><em>EL 0.0 m</em></div>' + und;
}

function renderActivity() {
  const dotCls = { blue: "", teal: "tl-teal", amber: "tl-amber", vio: "tl-vio" };
  $("#activity-timeline").innerHTML = ACTIVITY.map((a) =>
    '<div class="tl-item ' + (dotCls[a.color] || "") + '"><p>' + a.text + '</p><span>' + a.time + "</span></div>"
  ).join("");
}

function renderDashParcels() {
  $("#dash-parcels").innerHTML = PARCELS.slice(0, 5).map((p) =>
    '<tr data-pid="' + p.id + '"><td class="owner-cell" style="cursor:pointer">' + esc(p.survey) + "</td>" +
    "<td>" + esc(p.owner) + "</td><td>" + esc(p.use) + "</td><td>" + fmtArea(p.area) + "</td></tr>"
  ).join("");
  $$("#dash-parcels tr").forEach((tr) => {
    tr.addEventListener("click", () => { selectParcelById(tr.dataset.pid, { gotoMap: true }); });
  });
}

function renderDashboard() { renderKPIs(); renderChart(); renderMiniStack(); renderActivity(); renderDashParcels(); }

function fmtArea(n) { return n.toLocaleString("en-IN"); }

/* ===================== ULPIN ===================== */
function ulpinFor(p) { if (!p.ulpin) p.ulpin = genUlpin(p, currentAdmin()); return p.ulpin; }

/* ===================== MAP (real Leaflet map — see js/map.js) ===================== */
function renderMap(selected) {
  const box = $("#parcel-detail");
  if (!box) return;
  if (typeof L === "undefined" || typeof initLeafletMap !== "function") return;
  initLeafletMap(selected || state.selectedParcel || PARCELS[0]);
  if (state.selectedProperty && typeof renderPropertyPanel === "function") {
    renderPropertyPanel(state.selectedProperty);   /* keep the selected property panel */
  } else if (state.selectedSpatial && typeof renderSpatialPanel === "function") {
    renderSpatialPanel(state.selectedSpatial._bld, state.selectedSpatial._info);
  } else {
    renderParcelDetail(selected || state.selectedParcel || PARCELS[0]);
  }
  if (typeof updateBuildingDiscovery === "function") updateBuildingDiscovery();
}

/* ===================== 2D / 3D MODE (see js/scene3d.js) ===================== */
function setMapMode(mode) {
  const view = $("#view-map");
  if (!view) return;
  const is3d = mode === "3d";
  state.mapMode3d = is3d;
  view.dataset.mode = is3d ? "3d" : "2d";
  $$("#map-mode .seg-btn").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
  if (is3d) {
    if (window.ulpin3d) window.ulpin3d.activate();
    else toast("3D engine is still loading (or the CDN is unreachable) — the 2D map keeps working.", "err", 4200);
    if (typeof updateBuildingDiscovery === "function") updateBuildingDiscovery();   /* hide discovery chip behind 3D */
  } else {
    if (window.ulpin3d) window.ulpin3d.deactivate();
    renderMap(state.selectedParcel || PARCELS[0]);   // re-fit Leaflet after display:none
    toast("Back to the live OpenStreetMap", "info", 1600);
  }
}


function renderParcelDetail(p) {
  const box = $("#parcel-detail");
  if (!box || !p) return;
  const ulp = ulpinFor(p);
  const b = BUILDINGS.find((x) => x.parcelId === p.id);
  let html = '<div class="pd-title"><div><h4>Survey ' + esc(p.survey) + "</h4><div class='sub'>" + esc(p.id) + " · " + (b ? "Has building — " + esc(b.name) : "No building volume") + "</div></div></div>";
  html += '<div class="pd-status">' + statusBadge(p.status) + "</div>";
  html += '<div class="pd-grid">';
  html += '<div class="pd-item"><span>Owner</span><b>' + esc(p.owner) + "</b></div>";
  html += '<div class="pd-item"><span>Land use</span><b>' + esc(p.use) + "</b></div>";
  html += '<div class="pd-item"><span>Area</span><b>' + fmtArea(p.area) + " m²</b></div>";
  html += '<div class="pd-item"><span>Coordinates</span><b>' + p.lat.toFixed(5) + "°, " + p.lng.toFixed(5) + "°</b></div>";
  html += "</div>";
  html += '<div class="pd-item" style="padding:12px"><span>ULPIN (26-char)</span><div class="pd-ulpin" style="margin-top:6px">' + ulp + "</div></div>";
  html += '<div class="pd-actions">';
  html += '<button class="btn btn-ghost sm" data-act="copy"><span class="ni-ico" data-i="copy"></span>Copy ULPIN</button>';
  if (b) html += '<button class="btn btn-ghost sm" data-goto3d="' + b.id + '">Open 3D</button>';
  html += '<button class="btn btn-ghost sm" data-goto="parcels">Registry</button>';
  html += "</div>";
  box.innerHTML = html;
  mountIcons(box);
  const cp = box.querySelector('[data-act="copy"]');
  if (cp) cp.addEventListener("click", () => copyText(ulp, "ULPIN copied to clipboard"));
  const g3 = box.querySelector("[data-goto3d]");
  if (g3) g3.addEventListener("click", () => { state.selectedBuilding = BUILDINGS.find((x) => x.id === g3.dataset.goto3d); goto("view3d"); });
  box.querySelectorAll("[data-goto]").forEach((btn) => btn.addEventListener("click", () => goto(btn.dataset.goto)));
}

function copyText(text, msg) {
  const done = () => toast(msg || "Copied to clipboard", "ok");
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
  else { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); done(); }
}

function selectParcel(p, opts) {
  state.selectedParcel = p;
  state.selectedProperty = null;   /* parcel panel replaces property panel (last click wins) */
  if (typeof clearSpatialSelection === "function") clearSpatialSelection(); else state.selectedSpatial = null;
  state.mapFocusPending = true;   // real map flies to this parcel on next render
  if (state.view === "map") renderMap(p);
  if (opts && opts.gotoMap) goto("map");
}
function selectParcelById(id, opts) { const p = PARCELS.find((x) => x.id === id); if (p) selectParcel(p, opts); }

/* ===================== PARCELS TABLE ===================== */
function filteredParcels() {
  const q = (state.query || "").trim().toLowerCase();
  const use = $("#parcel-use-filter") ? $("#parcel-use-filter").value : "";
  const stt = $("#parcel-status-filter") ? $("#parcel-status-filter").value : "";
  return PARCELS.filter((p) => {
    const hitQ = !q || p.survey.toLowerCase().includes(q) || p.owner.toLowerCase().includes(q) || (p.ulpin || "").toLowerCase().includes(q);
    const hitU = !use || p.use === use;
    const hitS = !stt || p.status === stt;
    return hitQ && hitU && hitS;
  });
}

function renderParcelsTable() {
  const rows = filteredParcels();
  const body = $("#parcels-table-body");
  $("#parcels-count").innerHTML = "Showing <b>" + rows.length + "</b> of " + PARCELS.length + " parcels";
  body.innerHTML = rows.map((p) => {
    const sel = state.selectedParcel && state.selectedParcel.id === p.id ? " selected" : "";
    return '<tr class="prow' + sel + '" data-pid="' + p.id + '">' +
      '<td class="owner-cell" style="cursor:pointer">' + esc(p.survey) + "</td>" +
      "<td>" + esc(p.owner) + "</td>" +
      '<td><span class="badge info"><span class="dot blue"></span>' + esc(p.use) + "</span></td>" +
      "<td>" + fmtArea(p.area) + "</td>" +
      "<td>" + p.lat.toFixed(4) + ", " + p.lng.toFixed(4) + "</td>" +
      '<td class="ulpin-cell">' + ulpinFor(p) + "</td>" +
      "<td>" + statusBadge(p.status) + "</td>" +
      '<td><button class="btn btn-ghost sm" data-locate="' + p.id + '">Locate</button></td></tr>';
  }).join("");

  const detail = $("#parcel-inline");
  if (state.selectedParcel) {
    const p = state.selectedParcel;
    detail.hidden = false;
    detail.innerHTML =
      '<div class="id-kicker"><b>' + esc(p.survey) + "</b><span>" + esc(p.id) + " · " + esc(p.use) + "</span></div>" +
      '<div class="id-meta"><div class="id-chips">' + statusBadge(p.status) +
      '<span class="chip"><span class="ni-ico" data-i="pin"></span>' + p.lat.toFixed(5) + "°, " + p.lng.toFixed(5) + "°</span>" +
      '<span class="chip">' + fmtArea(p.area) + " m²</span></div>" +
      '<div class="id-chips"><span class="ulpin-cell" style="font-size:13px">' + ulpinFor(p) + "</span></div></div>" +
      '<div class="id-actions" style="display:flex;gap:8px"><button class="btn btn-primary sm" data-locate="' + p.id + '">Locate on map</button></div>';
    mountIcons(detail);
    const loc = detail.querySelector("[data-locate]");
    if (loc) loc.addEventListener("click", () => { selectParcel(p, { gotoMap: true }); toast("Located survey " + esc(p.survey), "info"); });
  } else { detail.hidden = true; }

  $$("#parcels-table-body .prow").forEach((tr) => {
    tr.addEventListener("click", () => { selectParcelById(tr.dataset.pid); renderParcelsTable(); });
  });
  $$("#parcels-table-body button[data-locate]").forEach((btn) => {
    btn.addEventListener("click", (e) => { e.stopPropagation(); selectParcelById(btn.dataset.locate, { gotoMap: true }); toast("Located on map", "info"); });
  });
}

function wireParcelFilters() {
  const si = $("#parcel-search"), uf = $("#parcel-use-filter"), sf = $("#parcel-status-filter");
  if (!si) return;
  si.addEventListener("input", () => { state.query = si.value; renderParcelsTable(); });
  uf.addEventListener("change", renderParcelsTable);
  sf.addEventListener("change", renderParcelsTable);
  $("#btn-bulk-ulpin").addEventListener("click", () => {
    PARCELS.forEach((p) => { p.ulpin = genUlpin(p, currentAdmin()); });
    if (state.view === "parcels") renderParcelsTable();
    toast("<b>ULPINs issued</b> for all " + PARCELS.length + " parcels in the registry.", "ok");
  });
}

/* ===================== BUILDINGS GRID ===================== */
const BAC_COLORS = { "b-blue": "#eff6ff", "b-vio": "#f5f3ff", "b-teal": "#ecfdf5", "b-amber": "#fffbeb" };
function renderBuildings() {
  $("#buildings-grid").innerHTML = BUILDINGS.map((b, i) => {
    const bgCls = Object.keys(BAC_COLORS)[i % 4];
    const color = BAC_COLORS[bgCls];
    return '<div class="b-card" data-bid="' + b.id + '">' +
      '<div class="b-top"><div><h4>' + esc(b.name) + "</h4><div class='b-addr'>" + esc(b.addr) + " · " + b.year + '</div></div>' +
      '<div class="bac-ico" style="background:' + color + '">' + icon("building") + "</div></div>" +
      '<div class="b-metrics">' +
      '<div class="bm"><span>Floors</span><b>' + b.floors.length + "</b></div>" +
      '<div class="bm"><span>Units</span><b>' + b.totalUnits + "</b></div>" +
      '<div class="bm"><span>Base parcel</span><b>' + esc(b.parcel.survey) + "</b></div>" +
      "</div>" +
      '<div class="occ"><span>Occupancy</span><div class="bar"><i style="width:' + b.occupancy + '%"></i></div><b>' + b.occupancy + "%</b></div></div>";
  }).join("");
  $$("#buildings-grid .b-card").forEach((card) => card.addEventListener("click", () => {
    state.selectedBuilding = BUILDINGS.find((x) => x.id === card.dataset.bid);
    goto("view3d");
  }));
}

/* ===================== UNITS LEDGER ===================== */
function fillUnitSelect(sel, def) {
  if (!sel) return;
  sel.innerHTML = BUILDINGS.map((b) => '<option value="' + b.id + '">' + esc(b.name) + " (" + b.floors.length + " fl)</option>").join("");
  sel.value = def || state.selectedBuilding.id;
}
function renderUnitsTable() {
  const sel = $("#units-building-select");
  if (!sel) return;
  const b = BUILDINGS.find((x) => x.id === sel.value) || state.selectedBuilding;
  const rows = b.floors.flatMap((f) => f.units.map((u) => {
    const ulp = ulpinFor(b.parcel) + "/" + f.id + "-" + u.no;
    return '<tr><td class="owner-cell">' + esc(b.id + "-" + f.id + "-" + u.no) + "</td><td>" + esc(b.name) + "</td><td>" + esc(f.id) + "</td><td>" + esc(u.type) + "</td><td>" + fmtArea(u.area) + "</td><td>" + statusBadge(u.status) + "</td><td class='ulpin-cell'>" + ulp + "</td></tr>";
  }));
  $("#units-table-body").innerHTML = rows.join("");
  $("#units-count").innerHTML = "<b>" + b.totalUnits + "</b> units across <b>" + b.floors.length + "</b> floors";
}
function wireUnits() {
  const sel = $("#units-building-select");
  if (!sel) return;
  fillUnitSelect(sel, state.selectedBuilding.id);
  sel.addEventListener("change", () => { state.selectedBuilding = BUILDINGS.find((x) => x.id === sel.value); renderUnitsTable(); });
  renderUnitsTable();
}

/* ===================== 3D PROPERTY VIEW ===================== */
const FACE_COLORS = {
  residential: { f: "#60a5fa", r: "#2563eb", t: "#93c5fd" },
  retail:      { f: "#f472b6", r: "#db2777", t: "#f9a8d4" },
  parking:     { f: "#64748b", r: "#475569", t: "#94a3b8" },
  utility:     { f: "#94a3b8", r: "#64748b", t: "#cbd5e1" },
  institutional:{ f: "#a78bfa", r: "#7c3aed", t: "#c4b5fd" }
};
const TYPE_LABEL = { residential: "Residential", retail: "Retail / Commercial", parking: "Parking", utility: "Utility", institutional: "Institutional" };

function render3D() {
  const b = state.selectedBuilding || BUILDINGS[0];
  state.selectedBuilding = b;
  if (typeof state.selectedUnit3D === "undefined") state.selectedUnit3D = null;
  const sel = $("#building-select-3d");
  if (sel) { fillUnitSelect(sel, b.id); }
  $("#b3d-name").textContent = b.name;
  $("#b3d-meta").innerHTML = esc(b.addr) + " · parcel " + esc(b.parcel.survey) + " · " + b.year;
  if (!state.selectedFloor || !b.floors.find((f) => f.id === state.selectedFloor)) {
    state.selectedFloor = b.floors[0].id;
    state.selectedUnit3D = null;
  }
  const title = $("#iso-title");
  if (title) title.innerHTML = "<b>" + esc(b.name) + "</b> · " + b.floors.length + " floors · " + (b.floors.length * 3.2).toFixed(1) + " m";
  /* ADD-ONLY demo wiring: inject small controls first so the reference box exists. */
  try { wireVRef3DInject(); } catch (e) {}
  if (window.iso3d) window.iso3d.show(b);          /* real Three.js tower (see scene3d.js) */
  renderFloorsPanel(b);
  renderUnits3D(b, b.floors.find((f) => f.id === state.selectedFloor));
  /* ADD-ONLY demo wiring: overlay units on the rebuilt tower, refresh reference. */
  try { if (window.iso3d && window.iso3d.showUnits) window.iso3d.showUnits(state.selectedFloor); } catch (e2) {}
  renderVRef3D();
}

function floorDisplayName(id) {
  if (id === "G") return "Ground Floor";
  if (id[0] === "B") return "Basement " + id.slice(1);
  return "Floor " + id.slice(1);
}
function renderFloorsPanel(b) {
  const list = $("#floors-panel");
  list.innerHTML = b.floors.slice().reverse().map((f) => {
    const active = f.id === state.selectedFloor ? " active" : "";
    const tagCls = { residential: "resreg", retail: "ret", parking: "park", utility: "util", institutional: "resreg" }[f.type] || "resreg";
    return '<div class="floor-item' + active + '" data-floor="' + f.id + '">' +
      '<span class="fl-dot" style="width:10px;height:10px;border-radius:3px;background:' + (FACE_COLORS[f.type] ? FACE_COLORS[f.type].f : "#3b82f6") + '"></span>' +
      '<div class="f-main"><div class="f-name">' + floorDisplayName(f.id) + "</div>" +
      '<div class="f-sub">' + TYPE_LABEL[f.type] + " · " + f.units.length + (f.units.length === 1 ? " unit" : " units") + "</div>" +
      '<div class="f-tags"><span class="fl-tag ' + tagCls + '">' + (f.id[0] === "B" ? "SUB-SURFACE" : "ABOVE-GROUND") + "</span></div></div></div>";
  }).join("");
  $$("#floors-panel .floor-item").forEach((el) => el.addEventListener("click", () => selectFloor(el.dataset.floor)));
}

function selectFloor(id) {
  const b = state.selectedBuilding;
  if (!b || !b.floors.find((f) => f.id === id)) return;
  state.selectedFloor = id;
  state.selectedUnit3D = null;
  if (window.iso3d) window.iso3d.highlight(id);    /* highlight in the 3D scene */
  renderFloorsPanel(b);
  renderUnits3D(b, b.floors.find((f) => f.id === id));
  try { if (window.iso3d && window.iso3d.showUnits) window.iso3d.showUnits(id); } catch (e) {}
  renderVRef3D();
}

function renderUnits3D(b, floor) {
  if (!floor) return;
  const note = $("#units-note"); if (note) note.innerHTML = "<b>" + floorDisplayName(floor.id) + "</b> · " + TYPE_LABEL[floor.type] + " · " + floor.units.length + " unit(s)";
  const tb = $("#units-body-3d"); if (!tb) return;
  tb.innerHTML = floor.units.map((u) =>
    '<tr data-unit3d="' + esc(u.no) + '"' + (state.selectedUnit3D === u.no ? ' class="u3d-sel"' : "") + ' style="cursor:pointer"><td class="owner-cell">' + esc(u.no) + "</td><td>" + esc(u.type) + "</td><td>" + fmtArea(u.area) + '</td><td>' + statusBadge(u.status) + "</td></tr>"
  ).join("");
  $$("#units-body-3d tr[data-unit3d]").forEach((tr) => tr.addEventListener("click", () => selectUnit3D(tr.dataset.unit3d)));
}

/* ADD-ONLY vertical-property demo panel state + wiring (existing data untouched) */
function renderVRef3D() {
  const box = $("#vref3d");
  if (!box) return;
  const b = state.selectedBuilding;
  if (!b) { box.innerHTML = ""; return; }
  const f = b.floors.find((x) => x.id === state.selectedFloor) || b.floors[0];
  const u = f ? f.units.find((x) => x.no === state.selectedUnit3D) : null;
  let m = { floors: b.floors.length, floorH: 3.2, totalH: b.floors.length * 3.2, selElev: 0 };
  try { if (window.iso3d && window.iso3d.metrics) m = window.iso3d.metrics(); } catch (e) {}
  const ulp = (typeof ulpinFor === "function") ? ulpinFor(b.parcel) : (b.parcel.ulpin || "—");
  box.innerHTML =
    '<div class="vref-grid">' +
    '<div><span>Parcel ID</span><b>' + esc(b.parcel.id) + " · " + esc(b.parcel.survey) + "</b></div>" +
    '<div><span>Parcel ULPIN (demo/prototype)</span><b class="ulpin-cell" style="font-size:10.5px">' + esc(ulp) + "</b></div>" +
    '<div><span>Building</span><b>' + esc(b.id) + " · " + esc(b.name) + "</b></div>" +
    '<div><span>Floor</span><b>' + esc(floorDisplayName(f.id)) + " (" + esc(f.id) + ")</b></div>" +
    '<div><span>Unit</span><b>' + (u ? esc(u.no) + " · " + esc(u.type) + " · " + fmtArea(u.area) + " sq ft · " + esc(u.status) : "— select a unit row below —") + "</b></div>" +
    '<div><span>Prototype vertical ref</span><b class="ulpin-cell" style="font-size:10.5px">' + esc(ulp) + "/" + esc(b.id) + "/" + esc(f.id) + (u ? "/" + esc(u.no) : "") + "</b></div>" +
    '<div><span>Floor height</span><b>' + Number(m.floorH).toFixed(1) + " m</b></div>" +
    '<div><span>Selected floor elevation</span><b>EL +' + Number(m.selElev).toFixed(1) + " m</b></div>" +
    '<div><span>Total building height</span><b>' + Number(m.totalH).toFixed(1) + " m (" + m.floors + " floors)</b></div>" +
    "</div>" +
    '<div class="vref-demo">Demo / prototype data — simulated ULPIN format, not a legal volumetric title. Block volumes only.</div>';
}
function selectUnit3D(no) {
  const b = state.selectedBuilding;
  if (!b) return;
  const f = b.floors.find((x) => x.id === state.selectedFloor);
  if (!f || !f.units.find((x) => x.no === no)) return;
  state.selectedUnit3D = (state.selectedUnit3D === no) ? null : no;
  try { if (window.iso3d && window.iso3d.highlightUnit) window.iso3d.highlightUnit(state.selectedUnit3D); } catch (e2) {}
  renderUnits3D(b, f);
  renderVRef3D();
}
function wireVRef3DInject() {
  if (!document.getElementById("vref3d-css")) {
  const st = document.createElement("style");
  st.id = "vref3d-css";
  st.textContent =
    ".vref3d{margin-top:12px;border:1px solid var(--line);border-radius:12px;padding:12px;background:#f8fafc}" +
    ".vref3d h5{margin:0 0 8px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}" +
    ".vref-grid{display:flex;flex-direction:column;gap:7px}" +
    ".vref-grid div{display:flex;flex-direction:column;gap:1px}" +
    ".vref-grid span{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}" +
    ".vref-grid b{font-size:12px;color:var(--ink);font-weight:600;word-break:break-word}" +
    ".vref-demo{margin-top:8px;font-size:10.5px;color:var(--muted);border-top:1px dashed var(--line);padding-top:7px;line-height:1.5}" +
    ".vsep3d{margin:0 0 10px;border:1px solid var(--line);border-radius:12px;padding:10px 12px;background:var(--surface)}" +
    ".vsep3d label{font-size:11px;font-weight:700;color:var(--ink-2);display:flex;justify-content:space-between;align-items:center;gap:8px}" +
    ".vsep3d label b{color:var(--primary)}" +
    ".vsep3d input[type=range]{width:100%;margin:8px 0 4px;accent-color:var(--primary)}" +
    ".vsep3d .row{display:flex;gap:8px}" +
    ".vsep3d .row button{flex:1;border:1px solid var(--line);background:#f1f5f9;border-radius:8px;padding:6px;font-size:11.5px;font-weight:700;color:var(--ink-2);cursor:pointer;font-family:inherit}" +
    ".vsep3d .row button:hover{border-color:var(--primary);color:var(--primary)}" +
    "#units-body-3d tr.u3d-sel td{background:#fef3c7 !important}" +
    "#units-body-3d tr[data-unit3d]:hover td{background:#eff6ff}";
  document.head.appendChild(st);
  }
  const anchor = document.getElementById("floors-panel");
  if (anchor && !document.getElementById("vsep3d")) {
    const d = document.createElement("div");
    d.className = "vsep3d"; d.id = "vsep3d";
    d.innerHTML = '<label>Floor separation <b id="vsep3d-val">0.0 m</b></label>' +
      '<input type="range" id="vsep3d-range" min="0" max="3" step="0.2" value="0" aria-label="Floor separation" />' +
      '<div class="row"><button type="button" id="vsep3d-demo">Separate floors</button>' +
      '<button type="button" id="vsep3d-reset">Reset view</button></div>';
    anchor.parentNode.insertBefore(d, anchor);
    const r = d.querySelector("#vsep3d-range"), vv = d.querySelector("#vsep3d-val");
    const apply = (x) => {
      try { if (window.iso3d && window.iso3d.setExplode) window.iso3d.setExplode(x); } catch (e3) {}
      if (vv) vv.textContent = Number(x).toFixed(1) + " m";
    };
    r.addEventListener("input", () => apply(r.value));
    d.querySelector("#vsep3d-demo").addEventListener("click", () => { r.value = "1.6"; apply(1.6); });
    d.querySelector("#vsep3d-reset").addEventListener("click", () => { r.value = "0"; apply(0); });
  }
  const tbl = document.getElementById("units-table-3d");
  if (tbl && !document.getElementById("vref3d-wrap")) {
    const d = document.createElement("div");
    d.className = "vref3d"; d.id = "vref3d-wrap";
    d.innerHTML = '<h5>Vertical property reference</h5><div id="vref3d"></div>';
    tbl.parentNode.insertBefore(d, tbl.nextSibling);
  }
}

function wire3D() {
  const sel = $("#building-select-3d");
  if (!sel) return;
  fillUnitSelect(sel, state.selectedBuilding.id);
  sel.addEventListener("change", () => {
    state.selectedBuilding = BUILDINGS.find((x) => x.id === sel.value);
    state.selectedFloor = state.selectedBuilding.floors[0].id;
    state.selectedUnit3D = null;
    render3D();
  });
}

/* ===================== ULPIN GENERATOR ===================== */
/* ---- helper: validate required parcel input ---- */
function validateRequiredParcel() {
  const pS = $("#ulp-parcel");
  if (!pS || !pS.value) {
    toast("Please complete the required parcel information.", "warn");
    return null;
  }
  return PARCELS.find((x) => x.id === pS.value) || PARCELS[0];
}

/* ---- helper: current admin hierarchy snapshot ---- */
function currentAdminHierarchy() {
  const a = state.admin || currentAdmin();
  const pS = $("#ulp-parcel");
  const p = pS && pS.value ? PARCELS.find((x) => x.id === pS.value) || PARCELS[0] : PARCELS[0];
  return {
    admin: a,
    state: a.state ? a.state.name : "",
    stateCode: a.state && typeof a.state.code !== "undefined" ? String(a.state.code) : "00",
    district: a.district ? a.district.name : "",
    districtCode: a.district && typeof a.district.code !== "undefined" ? String(a.district.code) : "00",
    tehsil: a.tehsil ? a.tehsil.name : "",
    tehsilCode: a.tehsil && typeof a.tehsil.code !== "undefined" ? String(a.tehsil.code) : "00",
    village: a.village ? a.village.name : "",
    villageCode: a.village && typeof a.village.code !== "undefined" ? String(a.village.code) : "00",
    p: p
  };
}

/* ---- parcel info / status panel ---- */
function renderParcelInfo() {
  const pS = $("#ulp-parcel");
  const statusEl = $("#ulp-parcel-status");
  if (!statusEl) return;
  const hi = currentAdminHierarchy();
  if (!pS || !pS.value) {
    statusEl.className = "pd-status";
    statusEl.innerHTML = '<div class="pd-item"><span class="ni-ico" data-i="alert"></span><span>Please select a land parcel (survey number) above.</span></div>' +
      '<div class="pd-item"><span>Workflow</span><b style="font-size:11.5px;color:var(--muted)">State → District → Tehsil → Village → Parcel → ULPIN — complete the hierarchy, then generate.</b></div>';
    mountIcons(statusEl);
    return;
  }
  const p = hi.p;
  const isLGD = state.ulpinDataSource === "lgd";
  const ulp = isLGD ? genPrototypeUlpin(p, hi) : genUlpin(p, hi.admin);
  const statusCls = p.status === "Titled" ? "ok" : (p.status === "Pending survey" ? "warn" : "err");
  const statusLabel = p.status === "Titled" ? "Titled — ready" : (p.status === "Pending survey" ? "Pending survey" : "Disputed");
  const dup = window.ulpinRegistry[p.id];
  const dupMatch = (dup && dup === ulp) ? "ok" : ((dup && dup !== ulp) ? "err" : "info");
  const dupMsg = (dup && dup === ulp) ? "Existing prototype ULPIN attached to this parcel — generating will use the same identifier." :
    (dup && dup !== ulp) ? "Different ULPIN already registered for this parcel — generated ULPIN is expected reference, not a new issuance." :
    "No prototype ULPIN issued to this parcel yet.";
  statusEl.className = "pd-status";
  const curVillage = (isLGD && state.admin) ? state.admin.village : null;
  const curVillageSample = !!(curVillage && curVillage.sample);
  const lgdExtra = isLGD ?
    '<div class="pd-item"><span>Data source</span><b style="color:var(--amber)">Real LGD (data.gov.in) + official village dataset (2026-07-02)</b></div>' +
    '<div class="pd-item"><span>Village status</span><b style="color:' + (curVillageSample ? "var(--amber)" : "var(--primary)") + '">' + (curVillageSample ? "SAMPLE data — this sub-district has no matching official LGD village record" : "Official LGD village record (parent hierarchy matched)") + '</b></div>' +
    '<div class="pd-item"><span>Identifier type</span><b style="color:var(--amber)">PROTOTYPE ULPIN — NOT AN OFFICIAL GOVERNMENT ID</b></div>' :
    '';
  statusEl.innerHTML =
    '<div class="pd-items">' +
    '<div class="pd-item"><span>Parcel ID</span><b>' + esc(p.id) + "</b></div>" +
    '<div class="pd-item"><span>Survey / parcel</span><b>' + esc(p.survey) + " — " + esc(p.use) + "</b></div>" +
    '<div class="pd-item"><span>Area</span><b>' + fmtArea(p.area) + " m²</b></div>" +
    '<div class="pd-item"><span>State</span><b>' + esc(hi.state) + " (" + esc(hi.stateCode) + ")</b></div>" +
    '<div class="pd-item"><span>District</span><b>' + esc(hi.district) + " (" + esc(hi.districtCode) + ")</b></div>" +
    '<div class="pd-item"><span>Sub-district / Tehsil</span><b>' + esc(hi.tehsil) + " (" + esc(hi.tehsilCode) + ")</b></div>" +
    '<div class="pd-item"><span>Village</span><b>' + esc(hi.village) + " (" + esc(hi.villageCode) + ")</b></div>" +
    '<div class="pd-item"><span>Coordinates (provisional)</span><b>' + p.lat.toFixed(5) + "°, " + p.lng.toFixed(5) + "°</b></div>" +
    '<div class="pd-item"><span>Survey status (prototype data)</span><b><span class="bc ' + statusCls + '">' + statusLabel + "</span></b></div>" +
    (state.ulpinDataSource === "lgd" ? lgdExtra :
    '<div class="pd-item"><span>Prototype ULPIN (expected)</span><b class="pd-ulpin">' + esc(ulp) + "</b></div>" +
    '<div class="pd-item"><span>Registration note</span><b><span class="ni-ico i-' + dupMatch + '"></span>' + dupMsg + "</b></div>") +
    '</div>';
  mountIcons(statusEl);
}

/* ---- mini status chip for the result card ---- */
function resultChip(text, cls) {
  return '<span class="pd-verdict ' + (cls || "") + '">' + text + "</span>";
}

/* ---- validate that a parcel can be used for generation ---- */
function validateParcelForGeneration(p) {
  if (!p) return "No parcel is selected. Please choose a land parcel first.";
  if (!p.survey || p.survey.trim() === "") return "Selected parcel has no survey number.";
  if (typeof p.lat !== "number" || typeof p.lng !== "number") return "Parcel coordinates are not available.";
  return null;
}

/* ---- REAL LGD village data (lazy per-state chunks) ---------------------
   Official LGD village records (data.gov.in Local Government Directory,
   snapshot dated 2026-07-02) are shipped as lazily-loaded per-state files:
     js/lgd-villages/villages-<stateCode>.js
   Each chunk registers window.LGD_VILLAGE_INDEX["<stateCode>"] as a map of
     "<districtCode>:<subDistrictCode>" -> [["<villageCode>","<villageName>"], ...]
   ONLY villages whose (state, district, sub-district) parent matches the
   loaded LGD hierarchy EXACTLY are attached; incompatible parents are kept
   isolated and never merged. A sub-district with no matching real record
   falls back to the deterministic SAMPLE villages below (prior behaviour). */

function lgdVillageIndexFor(stateCode) {
  if (typeof window.LGD_VILLAGE_INDEX === "undefined" || !window.LGD_VILLAGE_INDEX) return null;
  const idx = window.LGD_VILLAGE_INDEX[String(stateCode)];
  if (idx) return idx;
  // Also check AP missing tehsils for state 28 (AP sub-districts not in lgd-data.js)
  if (String(stateCode) === '28' && typeof window.AP_MISSING_TEHSILS !== "undefined" && window.AP_MISSING_TEHSILS) {
    const apTehsils = window.AP_MISSING_TEHSILS;
    const result = {};
    for (const dCode in apTehsils) {
      if (apTehsils[dCode].villages) {
        for (const key in apTehsils[dCode].villages) {
          result[key] = apTehsils[dCode].villages[key];
        }
      }
    }
    if (Object.keys(result).length > 0) return result;
  }
  return null;
}

function fireLgdVillageLoaded(stateCode) {
  const pend = (window.LGD_VILLAGE_LOADING && window.LGD_VILLAGE_LOADING[String(stateCode)]) || [];
  if (window.LGD_VILLAGE_LOADING) window.LGD_VILLAGE_LOADING[String(stateCode)] = null;
  refreshLgdStateVillages(String(stateCode));
  pend.forEach((fn) => { try { fn(); } catch (e) {} });
}

/* Lazily load one state's official village chunk; calls onDone once loaded
   (or immediately when already available). Works from file:// and via the
   local HTTP server — no backend required. */
function requestLgdStateVillages(stateCode, onDone) {
  stateCode = String(stateCode);
  if (lgdVillageIndexFor(stateCode)) { if (onDone) { try { onDone(); } catch (e) {} } return; }
  if (typeof window.LGD_VILLAGE_LOADING === "undefined") window.LGD_VILLAGE_LOADING = {};
  if (window.LGD_VILLAGE_LOADING[stateCode]) {
    if (onDone) window.LGD_VILLAGE_LOADING[stateCode].push(onDone);
    return;
  }
  window.LGD_VILLAGE_LOADING[stateCode] = [];
  if (onDone) window.LGD_VILLAGE_LOADING[stateCode].push(onDone);
  // For AP (state 28), also load the special missing-tehsils file for districts 743-755, 790-791
  if (stateCode === "28") {
    const s2 = document.createElement("script");
    s2.src = "js/lgd-villages/ap-missing-tehsils.js?v=1";
    s2.onload = () => fireLgdVillageLoaded(stateCode);
    s2.onerror = () => fireLgdVillageLoaded(stateCode);
    (document.head || document.documentElement).appendChild(s2);
  }
  const s = document.createElement("script");
  s.src = "js/lgd-villages/villages-" + stateCode + ".js?v=1";
  s.onload = () => fireLgdVillageLoaded(stateCode);
  s.onerror = () => fireLgdVillageLoaded(stateCode);
  (document.head || document.documentElement).appendChild(s);
}

/* Real official villages for one sub-district (via loaded chunk) or null
   while the state chunk is still loading. */
function lgdRealVillagesFor(stateCode, districtCode, tehsilCode) {
  const idx = lgdVillageIndexFor(stateCode);
  if (!idx) {
    // Fallback: check AP_MISSING_TEHSILS directly for state 28
    if (String(stateCode) === '28' && typeof window.AP_MISSING_TEHSILS !== "undefined" && window.AP_MISSING_TEHSILS) {
      const ap = window.AP_MISSING_TEHSILS;
      const key = String(districtCode) + ":" + String(tehsilCode);
      for (const dCode in ap) {
        if (ap[dCode].villages && ap[dCode].villages[key]) {
          return ap[dCode].villages[key].map((v) => ({ code: String(v[0]), name: String(v[1]), sample: false }));
        }
      }
    }
    return null;
  }
  const list = idx[String(districtCode) + ":" + String(tehsilCode)];
  if (!list) return [];
  return list.map((v) => ({ code: String(v[0]), name: String(v[1]), sample: false }));
}

/* Deterministic SAMPLE fallback (prior behaviour) — used only when a
   sub-district has no matching official village record. */
function lgdSampleVillagesFor(tehsil) {
  return [1, 2, 3].map((n) => ({
    code: String(tehsil.code) + "0" + n,
    name: "SAMPLE Village " + n + " (SAMPLE DATA)",
    sample: true
  }));
}

/* Attach the correct village list to a tehsil object: official data when
   available, otherwise the SAMPLE fallback (or a transient "loading"
   placeholder while the state chunk is being fetched). */
/* AP-only compatibility layer (state 28): fills missing sub-districts for
   post-bifurcation districts (743-755, 790, 791) from js/lgd-villages/ap-missing-tehsils.js.
   Only touches state 28. All codes are real LGD codes from the July 2026 dataset. */
function lgdAttachMissingTehsils(stateCode, district) {
  if (!district || !Array.isArray(district.tehsils) || district.tehsils.length) return;
  if (String(stateCode) !== "28") return;
  if (typeof window.AP_MISSING_TEHSILS === "undefined" || !window.AP_MISSING_TEHSILS) return;
  const ap = window.AP_MISSING_TEHSILS[String(district.code)];
  if (ap && Array.isArray(ap.tehsils) && ap.tehsils.length) district.tehsils = ap.tehsils;
}
function lgdAttachMissingDistricts(stateCode, stateObj) {
  if (!stateObj || String(stateCode) !== "28" || stateObj._apExtraDistricts) return;
  if (typeof window.AP_MISSING_TEHSILS === "undefined" || !window.AP_MISSING_TEHSILS) return;
  const existing = new Set((stateObj.districts || []).map((d) => String(d.code)));
  const extras = [];
  for (const dCode in window.AP_MISSING_TEHSILS) {
    if (!existing.has(String(dCode))) {
      const ap = window.AP_MISSING_TEHSILS[dCode];
      extras.push({ code: dCode, name: ap.name, tehsils: ap.tehsils });
    }
  }
  if (extras.length) stateObj.districts = (stateObj.districts || []).concat(extras);
  stateObj._apExtraDistricts = true;
}
function ensureLgdTehsilVillages(tehsil, stateCode, districtCode) {
  if (!tehsil) return [];
  if (tehsil._villagesReady) return tehsil.villages || [];
  // For AP (state 28), check AP_MISSING_TEHSILS for village data
  if (String(stateCode) === "28" && typeof window.AP_MISSING_TEHSILS !== "undefined" && window.AP_MISSING_TEHSILS) {
    const ap = window.AP_MISSING_TEHSILS;
    const key = String(districtCode) + ":" + String(tehsil.code);
    for (const dCode in ap) {
      if (ap[dCode].villages && ap[dCode].villages[key]) {
        tehsil.villages = ap[dCode].villages[key].map((v) => ({ code: v[0], name: v[1], sample: false }));
        tehsil._villagesReady = true;
        return tehsil.villages;
      }
    }
  }
  const real = lgdRealVillagesFor(stateCode, districtCode, tehsil.code);
  if (real === null) {
    tehsil.villages = [{ code: "--", name: "Loading official villages…", sample: true }];
  } else if (real.length) {
    tehsil.villages = real;
    tehsil._villagesReady = true;
  } else {
    tehsil.villages = lgdSampleVillagesFor(tehsil);
    tehsil._villagesReady = true;
  }
  return tehsil.villages;
}

/* After a state chunk is loaded, drop any earlier (sample/loading) lists
   for that state so the next populate step re-binds real data. */
function refreshLgdStateVillages(stateCode) {
  if (typeof window.LGD_DATA === "undefined" || !window.LGD_DATA || !window.LGD_DATA.states) return;
  (window.LGD_DATA.states || []).forEach((s) => {
    if (String(s.code) !== String(stateCode)) return;
    (s.districts || []).forEach((d) => {
      (d.tehsils || []).forEach((t) => {
        delete t._villagesReady;
        delete t.villages;
      });
    });
  });
}

/* Prototype ULPIN — safe variable-length format preserving full LGD codes:
   RULPIN-{stateCode}-{districtCode}-{subDistrictCode}-{villageCode}-{survey}-{geoHash}
   PROTOTYPE ONLY — NOT AN OFFICIAL GOVERNMENT ISSUED ULPIN. */
function genPrototypeUlpin(parcel, hi) {
  const survey = parcel.survey.replace(/\D/g, "").padStart(4, "0").slice(-4);
  const geo = encodeGeo(parcel.lat, parcel.lng).slice(0, 14);
  return ("RULPIN-" + String(hi.stateCode) + "-" + String(hi.districtCode) + "-" + String(hi.tehsilCode) + "-" + String(hi.villageCode) + "-" + survey + "-" + geo).toUpperCase();
}

/* Breakdown chips for the prototype RULPIN format (variable length). */
function prototypeUlpinParts(ulpin) {
  if (!ulpin || ulpin.indexOf("RULPIN-") !== 0) return null;
  const parts = ulpin.split("-");
  if (parts.length < 7) return null;
  return [
    { label: "PREFIX", value: parts[0] },
    { label: "STATE", value: parts[1] },
    { label: "DISTRICT", value: parts[2] },
    { label: "SUB-DISTRICT", value: parts[3] },
    { label: "VILLAGE", value: parts[4] },
    { label: "PARCEL", value: parts[5] },
    { label: "GEO", value: parts.slice(6).join("-") }
  ];
}

/* ---- Prototype QR code controls (additive feature) -----------------------
   The QR encodes EXACTLY the generated ULPIN string (demo 26-char ULPIN or
   the RULPIN prototype identifier). Prototype/demo only — the QR is NOT a
   government-issued or officially verified artefact. Graceful fallback:
   if the QR library (CDN) is unavailable, a clear message is shown and no
   QR is generated. A fresh QR is created per generation result, so it
   always reflects the newest generated ULPIN. */
function attachQrControls(box, ulpin) {
  if (!box || !ulpin) return;
  const wrap = document.createElement("div");
  wrap.className = "ulpin-qr";
  wrap.style.cssText = "margin-top:10px;padding:10px;border:1px dashed var(--line,#d7dce6);border-radius:8px;text-align:center";
  wrap.innerHTML =
    '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;align-items:center">' +
      '<button type="button" class="btn btn-ghost sm" data-qr-generate><span class="ni-ico" data-i="scan"></span>Generate QR</button>' +
      '<button type="button" class="btn btn-ghost sm" data-qr-report><span class="ni-ico" data-i="doc"></span>Report Problem</button>' +
      '<span style="font-size:10.5px;color:var(--muted,#8b93a7)">Prototype QR — encodes the generated ULPIN. Not government-issued.</span>' +
    '</div>' +
    '<div data-qr-output style="margin-top:10px"></div>';
  box.appendChild(wrap);
  mountIcons(wrap);
  const rptBtn = wrap.querySelector("[data-qr-report]");
  if (rptBtn) rptBtn.addEventListener("click", () => openReportForm(String(ulpin)));
  const out = wrap.querySelector("[data-qr-output]");
  wrap.querySelector("[data-qr-generate]").addEventListener("click", () => {
    if (!ulpin) {
      out.innerHTML = '<div style="color:var(--rose,#f43f5e);font-size:11.5px">No valid ULPIN available — generate a ULPIN first.</div>';
      return;
    }
    if (typeof QRCode === "undefined") {
      out.innerHTML = '<div style="color:var(--rose,#f43f5e);font-size:11.5px">QR library not loaded (offline or CDN blocked). QR generation unavailable.</div>';
      return;
    }
    out.innerHTML = "";
    const holder = document.createElement("div");
    holder.style.cssText = "display:inline-block;padding:8px;background:#ffffff;border-radius:6px";
    out.appendChild(holder);
    try {
      new QRCode(holder, { text: String(ulpin), width: 160, height: 160, colorDark: "#0d1b2e", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M });
    } catch (e) {
      out.innerHTML = '<div style="color:var(--rose,#f43f5e);font-size:11.5px">QR generation failed: ' + esc(String((e && e.message) || e)) + '</div>';
      return;
    }
    const dl = document.createElement("button");
    dl.type = "button";
    dl.className = "btn btn-ghost sm";
    dl.style.marginTop = "8px";
    dl.innerHTML = '<span class="ni-ico" data-i="check"></span>Download QR';
    dl.addEventListener("click", () => {
      let url = "";
      const cv = out.querySelector("canvas");
      if (cv && cv.toDataURL) { try { url = cv.toDataURL("image/png"); } catch (err) { url = ""; } }
      if (!url) { const im = out.querySelector("img"); if (im && im.src) url = im.src; }
      if (!url) { toast("QR image not available for download.", "warn"); return; }
      const a = document.createElement("a");
      a.href = url;
      a.download = "ULPIN-QR-" + String(ulpin).replace(/[^A-Za-z0-9-]/g, "").slice(0, 40) + ".png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast("QR image downloaded.", "ok");
    });
    out.appendChild(dl);
    mountIcons(dl);
  });
}

/* ---- ULPIN QR Scanner (additive feature) -------------------------------
   Reads QR codes produced by the ULPIN Generator (exact text match against
   the local prototype registry / parcel records). Camera via getUserMedia
   (permission requested ONLY on user action), image upload as fallback.
   All information shown is prototype/demo data. */
function openUlpinScanner() {
  const ov = $("#scanner-overlay");
  if (!ov) return;
  ov.classList.add("show");
  ov.setAttribute("aria-hidden", "false");
  stopUlpinCamera();
  const res = $("#scanner-result");
  if (res) { res.className = "pd-status"; res.innerHTML = '<span class="ni-ico" data-i="scan"></span>Start the camera or upload a QR image.'; mountIcons(res); }
  const st = $("#scanner-cam-status");
  if (st) st.textContent = "Camera starts only when you press Start Camera.";
}

function closeUlpinScanner() {
  stopUlpinCamera();
  const ov = $("#scanner-overlay");
  if (ov) { ov.classList.remove("show"); ov.setAttribute("aria-hidden", "true"); }
}

function stopUlpinCamera() {
  state.scannerActive = false;
  if (state.scanRafId) { cancelAnimationFrame(state.scanRafId); state.scanRafId = null; }
  const video = $("#scanner-video");
  if (video && video.srcObject) {
    try {
      const tracks = video.srcObject.getTracks() || [];
      tracks.forEach((t) => { try { t.stop(); } catch (e) {} });
    } catch (e) {}
    video.srcObject = null;
  }
}

async function startUlpinCamera() {
  const video = $("#scanner-video");
  if (!video) return;
  const st = $("#scanner-cam-status");
  const res = $("#scanner-result");
  if (res) { res.className = "pd-status"; res.innerHTML = '<span class="ni-ico" data-i="scan"></span>Searching for a QR code…'; mountIcons(res); }
  if (typeof jsQR === "undefined") {
    if (st) st.textContent = "Scanner library (jsQR) not loaded — offline or CDN blocked.";
    return;
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    if (st) st.textContent = "Camera API not available in this browser. Use the Upload QR Image option.";
    return;
  }
  stopUlpinCamera();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
    video.srcObject = stream;
    await video.play();
    state.scannerActive = true;
    if (st) st.textContent = "Camera active — point at a ULPIN QR code.";
    const cnv = document.createElement("canvas");
    const ctx = cnv.getContext("2d", { willReadFrequently: true });
    const tick = () => {
      if (!state.scannerActive) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        try {
          cnv.width = video.videoWidth;
          cnv.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, cnv.width, cnv.height);
          const img = ctx.getImageData(0, 0, cnv.width, cnv.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code && code.data && code.data.trim()) {
            state.scannerActive = false;
            stopUlpinCamera();
            handleUlpinScanResult(code.data.trim());
            return;
          }
        } catch (e) { /* frame decode error — keep scanning */ }
      }
      state.scanRafId = requestAnimationFrame(tick);
    };
    state.scanRafId = requestAnimationFrame(tick);
  } catch (err) {
    let msg = "Camera permission denied or camera unavailable. You can still use the Upload QR Image option.";
    if (err && err.name === "NotAllowedError") msg = "Camera permission was denied. Allow camera access or use the Upload QR Image option.";
    else if (err && err.name === "NotFoundError") msg = "No camera device found. Use the Upload QR Image option.";
    if (st) st.textContent = msg;
    if (res) { res.className = "pd-status warn"; res.innerHTML = '<span class="ni-ico" data-i="alert"></span>' + esc(msg); mountIcons(res); }
  }
}

function scanUlpinImage(file) {
  if (!file) return;
  const st = $("#scanner-cam-status");
  const res = $("#scanner-result");
  if (st) st.textContent = "Decoding image…";
  if (res) { res.className = "pd-status"; res.innerHTML = '<span class="ni-ico" data-i="scan"></span>Decoding QR image…'; mountIcons(res); }
  if (typeof jsQR === "undefined") {
    if (st) st.textContent = "Scanner library (jsQR) not loaded — offline or CDN blocked.";
    if (res) { res.className = "pd-status warn"; res.innerHTML = '<span class="ni-ico" data-i="alert"></span>Scanner library (jsQR) not loaded.'; mountIcons(res); }
    return;
  }
  const fr = new FileReader();
  fr.onload = () => {
    const img = new Image();
    img.onload = () => {
      try {
        const cnv = document.createElement("canvas");
        cnv.width = img.naturalWidth || img.width;
        cnv.height = img.naturalHeight || img.height;
        const ctx = cnv.getContext("2d");
        ctx.drawImage(img, 0, 0, cnv.width, cnv.height);
        const id = ctx.getImageData(0, 0, cnv.width, cnv.height);
        const code = jsQR(id.data, id.width, id.height, { inversionAttempts: "dontInvert" });
        if (code && code.data && code.data.trim()) { stopUlpinCamera(); handleUlpinScanResult(code.data.trim()); }
        else if (res) { res.className = "pd-status warn"; res.innerHTML = '<span class="ni-ico" data-i="alert"></span>No QR code found in the uploaded image.'; mountIcons(res); }
      } catch (e) {
        if (res) { res.className = "pd-status warn"; res.innerHTML = '<span class="ni-ico" data-i="alert"></span>Could not decode that image: ' + esc(String((e && e.message) || e)); mountIcons(res); }
      }
    };
    img.onerror = () => {
      if (res) { res.className = "pd-status warn"; res.innerHTML = '<span class="ni-ico" data-i="alert"></span>Could not read the uploaded image file.'; mountIcons(res); }
    };
    img.src = fr.result;
  };
  fr.onerror = () => {
    if (res) { res.className = "pd-status warn"; res.innerHTML = '<span class="ni-ico" data-i="alert"></span>Could not read the selected file.'; mountIcons(res); }
  };
  fr.readAsDataURL(file);
}

/* Resolve the exact decoded ULPIN text against the local prototype data.
   Comparison is EXACT — the decoded string must equal the stored ULPIN. */
function findUlpinRecord(val) {
  if (!val || typeof val !== "string") return null;
  const v = val.trim();
  if (!v) return null;
  const reg = window.ulpinRegistry || {};
  for (const k in reg) {
    if (Object.prototype.hasOwnProperty.call(reg, k) && reg[k] === v) {
      const parcel = PARCELS.find((p) => p.id === k);
      if (parcel) return { type: "parcel", ulpin: v, key: k, parcel: parcel };
      const parts = k.split("|");
      const b = parts[0] ? BUILDINGS.find((x) => x.id === parts[0]) : null;
      const floor = b && parts[1] ? b.floors.find((f) => f.id === parts[1]) : null;
      const unit = floor && parts[2] ? (floor.units || []).find((u) => u.no === parts[2]) : null;
      return { type: "vertical", ulpin: v, key: k, building: b, floor: floor, unit: unit };
    }
  }
  const p2 = PARCELS.find((p) => p.ulpin === v);
  if (p2) return { type: "parcel", ulpin: v, parcel: p2 };
  if (state.generated && state.generated.ulpin === v && state.generated.parcel) {
    return { type: "parcel", ulpin: v, parcel: state.generated.parcel };
  }
  return null;
}

/* Hierarchy names for a 26-char demo ULPIN or RULPIN prototype identifier. */
function ulpinHierarchy(val) {
  if (!val) return null;
  if (val.indexOf("RULPIN-") === 0) {
    const parts = val.split("-");
    if (parts.length < 7) return null;
    if (typeof window.LGD_DATA !== "undefined" && window.LGD_DATA && window.LGD_DATA.states) {
      const s = (window.LGD_DATA.states || []).find((x) => String(x.code) === parts[1]);
      const d = s ? (s.districts || []).find((x) => String(x.code) === parts[2]) : null;
      const t = d ? (d.tehsils || []).find((x) => String(x.code) === parts[3]) : null;
      let village = null;
      if (t && t.villages) village = t.villages.find((x) => String(x.code) === parts[4]);
      if (!village) {
        const real = (s && d && t) ? lgdRealVillagesFor(parts[1], parts[2], parts[3]) : null;
        if (real && real.length) village = real.find((x) => String(x.code) === parts[4]);
      }
      return {
        state: s ? s.name : parts[1], stateCode: parts[1],
        district: d ? d.name : parts[2], districtCode: parts[2],
        tehsil: t ? t.name : parts[3], tehsilCode: parts[3],
        village: village ? village.name : parts[4], villageCode: parts[4],
        sampleVillage: !!(village && village.sample), prototype: true
      };
    }
  } else if (val.length === 26) {
    const st = ADMIN.find((x) => x.code === val.slice(0, 2));
    const dt = st ? st.districts.find((x) => x.code === val.slice(2, 4)) : null;
    const th = dt ? dt.tehsils.find((x) => x.code === val.slice(4, 6)) : null;
    const vg = th ? th.villages.find((x) => x.code === val.slice(6, 8)) : null;
    return {
      state: st ? st.name : val.slice(0, 2), stateCode: val.slice(0, 2),
      district: dt ? dt.name : val.slice(2, 4), districtCode: val.slice(2, 4),
      tehsil: th ? th.name : val.slice(4, 6), tehsilCode: val.slice(4, 6),
      village: vg ? vg.name : val.slice(6, 8), villageCode: val.slice(6, 8),
      sampleVillage: false, prototype: false
    };
  }
  return null;
}

function handleUlpinScanResult(val) {
  const res = $("#scanner-result");
  if (!res) return;
  stopUlpinCamera();
  const rec = findUlpinRecord(val);
  if (!rec) {
    res.className = "pd-status warn";
    res.innerHTML = '<span class="ni-ico" data-i="alert"></span><strong>ULPIN not found in this prototype registry.</strong>' +
      '<div style="margin-top:6px;font-size:11.5px">Decoded value: <b class="pd-ulpin">' + esc(val) + '</b></div>';
    mountIcons(res);
    return;
  }
  const hi = ulpinHierarchy(val);
  const isProto = val.indexOf("RULPIN-") === 0;
  const parcel = rec.parcel || null;
  const items = [];
  items.push({ k: "ULPIN", v: esc(val) });
  if (hi) {
    items.push({ k: "State", v: esc(hi.state) + " (" + esc(hi.stateCode) + ")" });
    items.push({ k: "District", v: esc(hi.district) + " (" + esc(hi.districtCode) + ")" });
    items.push({ k: "Sub-district / Tehsil / Mandal", v: esc(hi.tehsil) + " (" + esc(hi.tehsilCode) + ")" });
    items.push({ k: "Village", v: esc(hi.village) + " (" + esc(hi.villageCode) + ")" + (hi.sampleVillage ? ' <span class="bc warn">SAMPLE</span>' : "") });
  }
  if (parcel) {
    items.push({ k: "Survey / Parcel", v: esc(parcel.survey) + " — " + esc(parcel.use) });
    items.push({ k: "Latitude", v: parcel.lat.toFixed(6) });
    items.push({ k: "Longitude", v: parcel.lng.toFixed(6) });
    items.push({ k: "Property status", v: esc(parcel.status) });
    items.push({ k: "Area", v: parcel.area + " m²" });
    if (parcel.owner) items.push({ k: "Owner (Demo / Prototype Data)", v: esc(parcel.owner) });
  }
  if (rec.building) items.push({ k: "Building", v: esc(rec.building.name) + " (" + esc(rec.building.id) + ")" });
  if (rec.floor) items.push({ k: "Floor", v: esc(rec.floor.name) + " (" + esc(rec.floor.type) + ")" });
  if (rec.unit) items.push({ k: "Unit", v: esc(rec.unit.no) + " — " + esc(rec.unit.type) + " · " + rec.unit.area + " m²" });
  const header = (isProto || rec.type === "vertical") ?
    '<strong style="color:var(--amber)">PROTOTYPE ULPIN — NOT AN OFFICIAL GOVERNMENT ID</strong><br>' : "";
  res.className = "pd-status verified";
  res.innerHTML = header +
    '<div class="pd-items">' + items.map((it) => '<div class="pd-item"><span>' + it.k + '</span><b>' + it.v + '</b></div>').join("") + '</div>';
  mountIcons(res);
}

function wireUlpinScanner() {
  const openBtn = $("#btn-open-scanner");
  if (openBtn) openBtn.addEventListener("click", openUlpinScanner);
  const closeBtn = $("#btn-close-scanner");
  if (closeBtn) closeBtn.addEventListener("click", closeUlpinScanner);
  const startBtn = $("#btn-scanner-start");
  if (startBtn) startBtn.addEventListener("click", startUlpinCamera);
  const fileInput = $("#scanner-file");
  if (fileInput) fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) scanUlpinImage(f);
    e.target.value = "";
  });
  const ov = $("#scanner-overlay");
  if (ov) ov.addEventListener("click", (e) => { if (e.target === ov) closeUlpinScanner(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeUlpinScanner(); });
}

/* ---- Report Problem (additive prototype feature) ------------------------
   Citizen-complaint prototype. Reports are stored ONLY in the browser's
   localStorage — nothing is sent to any external or government system.
   Attachments are never uploaded: only filename/type/size metadata is kept.
   Ticket IDs are deterministic-looking and locally unique. */
const REPORT_STORE_KEY = "ulpin3d_reports_v1";
const REPORT_FILE_SIZE_LIMIT = 2 * 1024 * 1024; /* 2 MB */
const REPORT_CATEGORIES = ["Land Record Issue", "Property Boundary Issue", "ULPIN Issue", "Building/Floor Issue", "Map/Location Issue", "Other"];
/* New (additive, report module only): real status workflow + safe attachment storage. */
const REPORT_STATUSES = ["Submitted", "Under Review", "Resolved", "Rejected"];
/* Raw file bytes eligible for local storage. Base64 inflates ~33%, so this keeps the
   stored payload under a conservative ~700 KB localStorage budget. Larger files stay
   metadata-only (previous behavior), preserving report submission. */
const REPORT_ATTACHMENT_STORAGE_LIMIT = 500 * 1024;
let reportAdminSearch = "";
let reportAdminStatusFilter = "All";
let reportAdminOpenId = null;

function loadReports() {
  try { const raw = localStorage.getItem(REPORT_STORE_KEY); return raw ? JSON.parse(raw) : []; }
  catch (e) { return []; }
}
function saveReports(list) {
  try { localStorage.setItem(REPORT_STORE_KEY, JSON.stringify(list)); return true; }
  catch (e) { return false; }
}
function fmtFileSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}
function genTicketId() {
  const seq = loadReports().length + 1;
  const ts = Date.now().toString(36).toUpperCase();
  return "RP-" + ts + "-" + String(seq).padStart(3, "0");
}

/* New (additive) helpers — safe on legacy records that lack reporter/status fields.
   Legacy status "Submitted — Prototype" normalizes to "Submitted" at render time only;
   stored records are never mutated or deleted by these helpers. */
function normalizeReportStatus(status) {
  if (REPORT_STATUSES.indexOf(status) !== -1) return status;
  if (typeof status === "string" && status.indexOf("Submitted") === 0) return "Submitted";
  return "Submitted";
}
function reportStatusBadge(status) {
  const cls = { "Submitted": "submitted", "Under Review": "review", "Resolved": "resolved", "Rejected": "rejected" }[status] || "submitted";
  return '<span class="rp-badge rp-badge-' + cls + '">' + esc(status) + "</span>";
}
function getReporterRole(r) {
  if (!r) return "Not recorded";
  const v = r.reporterRoleName || r.reporterRole;
  return v ? String(v) : "Not recorded";
}
function getReporterEmail(r) {
  return r && r.reporterEmail ? String(r.reporterEmail) : "Not recorded";
}
function currentReporterRoleName() {
  try { return (state && state.role && state.role.name) ? String(state.role.name) : (currentRoleKey() || "guest"); }
  catch (e) { return "guest"; }
}
/* Reporter email from EXISTING session/app data only — auth code is not touched.
   state.email / state.userEmail are read if ever present; otherwise fall back to the
   existing demo role credentials table (already in the app) for role accounts. */
function currentReporterEmail() {
  try {
    if (state && state.email) return String(state.email);
    if (state && state.userEmail) return String(state.userEmail);
    /* New (additive): prefer the real Supabase Auth session email (Google
       sign-in) so reports carry the true reporter address. Falls back to the
       existing demo role credentials table for demo sessions. */
    const sb = getReportsSupabase();
    if (sb && sb.auth && typeof sb.auth.session === "function") {
      const sess = sb.auth.session();
      const em = sess && sess.user && sess.user.email;
      if (em) return String(em);
    }
    const rk = currentRoleKey();
    const cred = rk && typeof DEMO_ROLE_CREDENTIALS === "object" ? DEMO_ROLE_CREDENTIALS[rk] : null;
    return cred && cred.email ? String(cred.email) : "";
  } catch (e) { return ""; }
}
function reportHasStoredAttachment(r) {
  return !!(r && typeof r.attachmentData === "string" && r.attachmentData.indexOf("data:") === 0);
}
function isStorableAttachmentType(fileType) {
  const t = String(fileType || "").toLowerCase();
  return t.indexOf("image/") === 0 || t === "application/pdf";
}
function reportAttachmentText(r) {
  if (!r || !r.fileName) return "";
  const base = r.fileName + " (" + (r.fileType || "file") + ", " + fmtFileSize(r.fileSize) + ")";
  return reportHasStoredAttachment(r) ? base + " — stored locally, preview available" : base + " — Preview unavailable — metadata only";
}

/* New (additive): Supabase-backed cross-device persistence for reports.
   The shared public.problem_reports table (see supabase/migrations/
   20260914120000_create_problem_reports.sql) is the source of truth across
   devices; localStorage stays as an instant cache / offline fallback only.
   Every helper here is additive — no existing report function was renamed. */
const REPORT_SUPABASE_TABLE = "problem_reports";
const REPORT_MIGRATED_KEY = "ulpin3d_reports_migrated_v1";
let reportsRefreshInFlight = false;
let reportsSubmitInFlight = false;

function getReportsSupabase() {
  try {
    if (typeof window.getSupabaseAIClient === "function") return window.getSupabaseAIClient();
  } catch (e) {}
  return null;
}

/* Map a Supabase row to the existing report record shape used by the UI. */
function reportRowToRecord(row) {
  if (!row || !row.id) return null;
  const r = {
    id: String(row.id),
    category: row.category || "Other",
    ulpin: row.ulpin || "",
    description: row.description || "",
    location: row.location || "",
    fileName: row.file_name || "",
    fileType: row.file_type || "",
    fileSize: row.file_size == null ? 0 : Number(row.file_size),
    status: normalizeReportStatus(row.status),
    createdAt: row.created_at || new Date().toISOString(),
    reporterRole: row.reporter_role || "",
    reporterRoleName: row.reporter_role_name || "",
    reporterEmail: row.reporter_email || "",
    adminRemarks: row.admin_remarks || "",
    statusUpdatedAt: row.status_updated_at || "",
    remarksUpdatedAt: row.remarks_updated_at || "",
    fromSupabase: true
  };
  if (row.attachment_data) r.attachmentData = row.attachment_data;
  return r;
}

/* Map an existing report record to the Supabase row shape (snake_case).
   user_id is intentionally omitted — the column defaults to auth.uid(), which
   satisfies the RLS insert policy without handling any token in the frontend. */
function reportRecordToRow(r) {
  if (!r || !r.id) return null;
  const row = {
    id: String(r.id),
    category: r.category || "Other",
    ulpin: r.ulpin || null,
    description: r.description || "",
    location: r.location || null,
    file_name: r.fileName || null,
    file_type: r.fileType || null,
    file_size: r.fileSize ? Number(r.fileSize) : null,
    status: normalizeReportStatus(r.status),
    created_at: r.createdAt || new Date().toISOString(),
    reporter_role: r.reporterRole || null,
    reporter_role_name: r.reporterRoleName || null,
    reporter_email: r.reporterEmail || null,
    admin_remarks: r.adminRemarks || ""
  };
  if (r.statusUpdatedAt) row.status_updated_at = r.statusUpdatedAt;
  if (r.remarksUpdatedAt) row.remarks_updated_at = r.remarksUpdatedAt;
  if (r.attachmentData) row.attachment_data = r.attachmentData;
  return row;
}

/* Load reports from Supabase, merge them with the local cache (never losing
   a local-only report) and re-render the reports views. Any failure keeps the
   page working from the cache — the page never breaks. */
function refreshReportsFromSupabase(done) {
  const sb = getReportsSupabase();
  if (!sb || reportsRefreshInFlight) { if (done) done(false); return; }
  reportsRefreshInFlight = true;
  sb.from(REPORT_SUPABASE_TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500)
    .then(function (res) {
      reportsRefreshInFlight = false;
      if (res.error) {
        console.warn("[Reports] Supabase load failed — using local cache:", res.error.message || res.error);
        if (done) done(false);
        return;
      }
      const remote = (res.data || []).map(reportRowToRecord).filter(Boolean);
      const remoteIds = {};
      remote.forEach(function (r) { remoteIds[r.id] = true; });
      const localOnly = loadReports().filter(function (r) { return r && !remoteIds[r.id]; });
      saveReports(remote.concat(localOnly));
      migrateLocalReportsToSupabase(localOnly);
      if (done) done(true);
    })
    .catch(function (e) {
      reportsRefreshInFlight = false;
      console.warn("[Reports] Supabase load error — using local cache:", e);
      if (done) done(false);
    });
}

/* One-time-safe import of reports that were saved only in this browser's
   localStorage (previous behaviour). Marked in REPORT_MIGRATED_KEY so they are
   never re-inserted after a successful upload. */
function migrateLocalReportsToSupabase(localOnly) {
  const sb = getReportsSupabase();
  if (!sb || !localOnly || !localOnly.length) return;
  let migrated = {};
  try { migrated = JSON.parse(localStorage.getItem(REPORT_MIGRATED_KEY) || "{}") || {}; } catch (e) { migrated = {}; }
  const rows = [];
  localOnly.forEach(function (r) {
    if (migrated[r.id]) return;
    const row = reportRecordToRow(r);
    if (row) rows.push(row);
    migrated[r.id] = true;
  });
  if (!rows.length) return;
  try { localStorage.setItem(REPORT_MIGRATED_KEY, JSON.stringify(migrated)); } catch (e2) {}
  sb.from(REPORT_SUPABASE_TABLE).upsert(rows, { onConflict: "id", ignoreDuplicates: true })
    .then(function (res) {
      if (res.error) {
        console.warn("[Reports] local report migration failed:", res.error.message || res.error);
        try {
          const retry = JSON.parse(localStorage.getItem(REPORT_MIGRATED_KEY) || "{}") || {};
          rows.forEach(function (row) { delete retry[row.id]; });
          localStorage.setItem(REPORT_MIGRATED_KEY, JSON.stringify(retry));
        } catch (e3) {}
      }
    })
    .catch(function (e) { console.warn("[Reports] local report migration error:", e); });
}

/* Push an admin field update (status / remarks) to Supabase. The local cache
   is already updated by the caller; failures degrade to a clear warning. */
function syncReportFieldsToSupabase(reportId, fields) {
  const sb = getReportsSupabase();
  if (!sb) { toast("Saved in this browser only — the server could not be reached.", "warn", 5000); return; }
  sb.from(REPORT_SUPABASE_TABLE).update(fields).eq("id", String(reportId))
    .then(function (res) {
      if (res.error) {
        console.warn("[Reports] Supabase update failed — kept locally:", res.error.message || res.error);
        toast("Saved in this browser only — the server could not be updated.", "warn", 5000);
      }
    })
    .catch(function () { toast("Saved in this browser only — the server could not be updated.", "warn", 5000); });
}

function deleteReportFromSupabase(reportId) {
  const sb = getReportsSupabase();
  if (!sb) { toast("Deleted in this browser only — the server could not be reached.", "warn", 5000); return; }
  sb.from(REPORT_SUPABASE_TABLE).delete().eq("id", String(reportId))
    .then(function (res) {
      if (res.error) {
        console.warn("[Reports] Supabase delete failed:", res.error.message || res.error);
        toast("Deleted in this browser only — the server could not be updated.", "warn", 5000);
      }
    })
    .catch(function () { toast("Deleted in this browser only — the server could not be updated.", "warn", 5000); });
}

function openReportForm(prefillUlpin) {
  const uIn = $("#report-ulpin");
  if (prefillUlpin && uIn) uIn.value = String(prefillUlpin);
  goto("reports");
  if (prefillUlpin && uIn) toast("ULPIN prefilled for this report — you can edit it.", "info", 2600);
}

function renderReportHistory() {
  const box = $("#report-history");
  if (!box) return;
  const list = loadReports();
  if (!list.length) {
    box.innerHTML = '<div class="pd-empty"><div class="pd-ico"><span class="ni-ico" data-i="doc"></span></div><p>No prototype reports submitted yet.</p></div>';
    mountIcons(box);
    return;
  }
  box.innerHTML = list.map((r) => {
    const st = normalizeReportStatus(r.status);
    const remarks = r && r.adminRemarks ? String(r.adminRemarks) : "";
    return '<div style="border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><b style="color:var(--primary)">' + esc(r.id) + '</b><span style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap">' + reportStatusBadge(st) + '<span class="bc">' + esc(r.category) + '</span></span></div>' +
      '<div style="margin-top:6px;font-size:12px;color:var(--muted)"><b>ULPIN / Property ID:</b> ' + esc(r.ulpin) + '</div>' +
      '<div style="margin-top:4px;font-size:12.5px;color:var(--ink)">' + esc(r.description) + '</div>' +
      '<div style="margin-top:8px;display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--muted)">' +
        '<span>Status: <b>' + esc(st) + '</b></span>' +
        '<span>Date: ' + new Date(r.createdAt).toLocaleString() + '</span>' +
        (r.location ? '<span>Location: ' + esc(r.location) + '</span>' : '') +
        (r.fileName ? '<span>Attachment: ' + esc(reportAttachmentText(r)) + '</span>' : '') +
      '</div>' +
      (remarks ? '<div style="margin-top:8px;border-left:3px solid var(--primary);padding:6px 10px;background:rgba(0,0,0,.04);border-radius:6px;font-size:12px"><b>Admin remarks:</b> ' + esc(remarks) + '</div>' : '') +
    '</div>';
  }).join("");
  mountIcons(box);
}

function submitReport() {
  const cat = $("#report-category"), uIn = $("#report-ulpin"), dIn = $("#report-desc"), lIn = $("#report-location"), fIn = $("#report-file");
  const category = cat ? cat.value.trim() : "";
  const ulpin = uIn ? uIn.value.trim() : "";
  const desc = dIn ? dIn.value.trim() : "";
  const loc = lIn ? lIn.value.trim() : "";
  if (!category) { toast("Please select a problem category.", "warn"); if (cat) cat.focus(); return; }
  if (REPORT_CATEGORIES.indexOf(category) === -1) { toast("Please select a valid problem category.", "warn"); if (cat) cat.focus(); return; }
  if (!ulpin) { toast("Please enter the ULPIN / property ID.", "warn"); if (uIn) uIn.focus(); return; }
  if (!desc) { toast("Please describe the problem.", "warn"); if (dIn) dIn.focus(); return; }
  let fileName = "", fileType = "", fileSize = 0;
  let file = null;
  if (fIn && fIn.files && fIn.files[0]) {
    file = fIn.files[0];
    if (file.size > REPORT_FILE_SIZE_LIMIT) { toast("Attachment is too large (max 2 MB).", "warn"); return; }
    fileName = file.name;
    fileType = file.type || (file.name.split(".").pop() || "file");
    fileSize = file.size;
  }
  /* Small image/PDF attachments are stored locally under a conservative budget;
     everything else (and any read failure) keeps the original metadata-only behavior. */
  if (file && fileSize <= REPORT_ATTACHMENT_STORAGE_LIMIT && isStorableAttachmentType(fileType)) {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        finalizeReportSubmission(category, ulpin, desc, loc, fileName, fileType, fileSize,
          typeof reader.result === "string" && reader.result.indexOf("data:") === 0 ? reader.result : null);
      };
      reader.onerror = () => finalizeReportSubmission(category, ulpin, desc, loc, fileName, fileType, fileSize, null);
      reader.readAsDataURL(file);
      return;
    } catch (e) { /* fall through: metadata-only */ }
  }
  finalizeReportSubmission(category, ulpin, desc, loc, fileName, fileType, fileSize, null);
}

function finalizeReportSubmission(category, ulpin, desc, loc, fileName, fileType, fileSize, attachmentData) {
  const r = {
    id: genTicketId(),
    category: category,
    ulpin: ulpin,
    description: desc,
    location: loc,
    fileName: fileName,
    fileType: fileType,
    fileSize: fileSize,
    status: "Submitted",
    createdAt: new Date().toISOString(),
    reporterRole: currentRoleKey() || "guest",
    reporterRoleName: currentReporterRoleName(),
    reporterEmail: currentReporterEmail(),
    adminRemarks: ""
  };
  if (attachmentData) r.attachmentData = attachmentData;
  /* New (additive): the shared Supabase table is the source of truth — insert
     there first so Admin sees the report from any device; localStorage stays
     as the instant cache / offline fallback. */
  persistNewReport(r);
}

/* Renders the existing submission outcome UI and updates the local cache
   (same as the previous localStorage-only flow). */
function finishReportUi(r) {
  const list = loadReports();
  let replaced = false;
  for (let i = 0; i < list.length; i++) {
    if (list[i] && list[i].id === r.id) { list[i] = r; replaced = true; break; }
  }
  if (!replaced) list.unshift(r);
  const ok = saveReports(list);
  if (!ok && r.attachmentData) {
    /* localStorage quota reached — keep the report, fall back to metadata-only. */
    try { delete r.attachmentData; } catch (e2) { r.attachmentData = undefined; }
    saveReports(list);
    toast("Attachment contents exceeded local storage — report saved as metadata only.", "info", 4200);
  }
  const out = $("#report-outcome");
  if (out) {
    out.className = "pd-status verified";
    out.innerHTML = '<span class="ni-ico" data-i="check"></span><strong>Report submitted (prototype).</strong>' +
      '<div class="pd-items">' +
      '<div class="pd-item"><span>Ticket ID</span><b style="color:var(--primary)">' + esc(r.id) + '</b></div>' +
      '<div class="pd-item"><span>Problem category</span><b>' + esc(r.category) + '</b></div>' +
      '<div class="pd-item"><span>ULPIN / Property ID</span><b>' + esc(r.ulpin) + '</b></div>' +
      '<div class="pd-item"><span>Submission status</span><b>' + esc(normalizeReportStatus(r.status)) + '</b></div>' +
      '<div class="pd-item"><span>Date / time</span><b>' + new Date(r.createdAt).toLocaleString() + '</b></div>' +
      (r.fileName ? '<div class="pd-item"><span>Attachment</span><b>' + esc(reportAttachmentText(r)) + '</b></div>' : '') +
      '</div>' +
      '<div style="margin-top:8px;font-size:11.5px;color:var(--muted)">Prototype Submission — not connected to a government grievance system. Saved to the ULPIN platform database and visible to Admin.</div>';
    mountIcons(out);
  }
  toast("Report submitted — Ticket " + esc(r.id), "ok", 4200);
  const cat = $("#report-category"), uIn = $("#report-ulpin"), dIn = $("#report-desc"), lIn = $("#report-location"), fIn = $("#report-file");
  if (cat) cat.value = "";
  if (uIn) uIn.value = "";
  if (dIn) dIn.value = "";
  if (lIn) lIn.value = "";
  if (fIn) fIn.value = "";
  const info = $("#report-file-info");
  if (info) info.textContent = "";
  renderReportHistory();
  renderAdminReports();
}

/* New (additive): insert the report into Supabase so it is visible from any
   device. The unique ticket ID + ignoreDuplicates prevent duplicate rows on
   retries/submits. If the server is unreachable the report is still cached
   locally and automatically re-sent when the Reports page is next opened. */
function persistNewReport(r) {
  if (reportsSubmitInFlight) return;
  reportsSubmitInFlight = true;
  const sub = $("#btn-submit-report");
  if (sub) sub.disabled = true;
  const finish = function (serverSaved) {
    reportsSubmitInFlight = false;
    if (sub) sub.disabled = false;
    finishReportUi(r);
    if (!serverSaved) toast("Report saved in this browser only — the server could not be reached. It will be sent automatically when the Reports page is reopened.", "warn", 6500);
  };
  const sb = getReportsSupabase();
  if (!sb) { finish(false); return; }
  const row = reportRecordToRow(r);
  if (!row) { finish(false); return; }
  sb.from(REPORT_SUPABASE_TABLE)
    .upsert([row], { onConflict: "id", ignoreDuplicates: true })
    .then(function (res) {
      if (res.error) {
        console.warn("[Reports] Supabase insert failed — kept locally:", res.error.message || res.error);
        finish(false);
        return;
      }
      finish(true);
    })
    .catch(function (e) { console.warn("[Reports] Supabase insert error — kept locally:", e); finish(false); });
}

function wireReports() {
  const sub = $("#btn-submit-report");
  if (sub) sub.addEventListener("click", submitReport);
  const fIn = $("#report-file");
  if (fIn) fIn.addEventListener("change", () => {
    const info = $("#report-file-info");
    if (!info) return;
    const f = fIn.files && fIn.files[0];
    if (!f) { info.textContent = ""; return; }
    if (f.size > REPORT_FILE_SIZE_LIMIT) {
      info.innerHTML = '<span style="color:var(--rose)">File is too large (max 2 MB). Please choose a smaller image/document.</span>';
      return;
    }
    info.textContent = "Selected: " + f.name + " — " + (f.type || "file") + ", " + fmtFileSize(f.size) + " (metadata only; not uploaded to any server).";
  });
  /* Admin Report Management wiring (additive) */
  const rpSearch = $("#admin-report-search");
  if (rpSearch) rpSearch.addEventListener("input", () => { reportAdminSearch = rpSearch.value; renderAdminReportList(); });
  const rpFilter = $("#admin-report-status-filter");
  if (rpFilter) rpFilter.addEventListener("change", () => { reportAdminStatusFilter = rpFilter.value; renderAdminReportList(); });
  const rpList = $("#admin-report-list");
  if (rpList) rpList.addEventListener("click", (e) => {
    const row = e.target && e.target.closest ? e.target.closest("[data-admin-report]") : null;
    if (row) openAdminReportDetail(row.getAttribute("data-admin-report"));
  });
  const rpDetail = $("#admin-report-detail");
  if (rpDetail) rpDetail.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("[data-rp-action]") : null;
    if (!btn) return;
    const act = btn.getAttribute("data-rp-action"), id = btn.getAttribute("data-rp-id");
    if (act === "save-status") { const sel = $("#rp-detail-status"); if (sel) updateReportStatus(id, sel.value); }
    else if (act === "save-remarks") { const ta = $("#rp-detail-remarks"); if (ta) updateReportRemarks(id, ta.value); }
    else if (act === "delete") deleteReport(id);
    else if (act === "close-detail") { reportAdminOpenId = null; renderAdminReports(); }
  });
}

/* ---- Admin Report Management (additive; UI-level demo gating only) -------
   Renders only when currentRoleKey() === "admin". Uses existing localStorage
   report data and existing CSS design language. No backend involved. */
function renderAdminReports() {
  const card = $("#admin-reports-card");
  if (!card) return;
  const isAdmin = currentRoleKey() === "admin";
  card.style.display = isAdmin ? "" : "none";
  const formCard = $("#report-form-card");
  if (formCard) formCard.style.display = isAdmin ? "none" : "";
  if (!isAdmin) {
    reportAdminOpenId = null;
    ["#admin-report-stats", "#admin-report-list", "#admin-report-detail"].forEach((sel) => { const el = $(sel); if (el) el.innerHTML = ""; });
    return;
  }
  const list = loadReports();
  const counts = { total: list.length, "Submitted": 0, "Under Review": 0, "Resolved": 0, "Rejected": 0 };
  list.forEach((r) => { counts[normalizeReportStatus(r && r.status)]++; });
  const stats = $("#admin-report-stats");
  if (stats) stats.innerHTML =
    '<div class="rp-stat"><div class="rp-stat-label">Total</div><div class="rp-stat-value">' + counts.total + '</div></div>' +
    '<div class="rp-stat"><div class="rp-stat-label">Submitted</div><div class="rp-stat-value">' + counts["Submitted"] + '</div></div>' +
    '<div class="rp-stat"><div class="rp-stat-label">Under Review</div><div class="rp-stat-value">' + counts["Under Review"] + '</div></div>' +
    '<div class="rp-stat"><div class="rp-stat-label">Resolved</div><div class="rp-stat-value">' + counts["Resolved"] + '</div></div>' +
    '<div class="rp-stat"><div class="rp-stat-label">Rejected</div><div class="rp-stat-value">' + counts["Rejected"] + '</div></div>';
  renderAdminReportList();
}
function renderAdminReportList() {
  const box = $("#admin-report-list");
  if (!box) return;
  if (currentRoleKey() !== "admin") { box.innerHTML = ""; return; }
  const q = (reportAdminSearch || "").trim().toLowerCase();
  let list = loadReports().slice().sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  if (reportAdminStatusFilter !== "All") list = list.filter((r) => normalizeReportStatus(r && r.status) === reportAdminStatusFilter);
  if (q) list = list.filter((r) => (
    ((r && r.id) || "") + " " + ((r && r.ulpin) || "") + " " + ((r && r.category) || "") + " " + ((r && r.reporterEmail) || "")
  ).toLowerCase().indexOf(q) !== -1);
  if (!list.length) {
    box.innerHTML = '<div class="pd-empty"><div class="pd-ico"><span class="ni-ico" data-i="doc"></span></div><p>No reports match the current search / filter.</p></div>';
    mountIcons(box);
    return;
  }
  box.innerHTML =
    '<div class="rp-head"><span>Ticket</span><span>Category</span><span>ULPIN</span><span>Reporter</span><span>Status</span><span>Date</span><span>Attach.</span></div>' +
    list.map((r) => {
      const att = reportHasStoredAttachment(r) ? "Stored" : (r.fileName ? "Meta" : "—");
      return '<div class="rp-row' + (r.id === reportAdminOpenId ? " rp-active" : "") + '" data-admin-report="' + esc(r.id) + '" title="Open report details">' +
        '<span class="rp-strong">' + esc(r.id) + '</span>' +
        '<span>' + esc(r.category || "—") + '</span>' +
        '<span class="rp-mono">' + esc(r.ulpin || "—") + '</span>' +
        '<span>' + esc(getReporterRole(r)) + '</span>' +
        '<span>' + reportStatusBadge(normalizeReportStatus(r.status)) + '</span>' +
        '<span class="rp-muted">' + (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—") + '</span>' +
        '<span class="rp-muted">' + esc(att) + '</span>' +
      '</div>';
    }).join("");
}
function openAdminReportDetail(reportId) {
  if (currentRoleKey() !== "admin") return;
  const r = loadReports().find((x) => x && x.id === reportId);
  if (!r) { toast("Report not found.", "warn"); return; }
  reportAdminOpenId = reportId;
  const box = $("#admin-report-detail");
  if (!box) return;
  const st = normalizeReportStatus(r.status);
  const opts = REPORT_STATUSES.map((s) => '<option' + (s === st ? " selected" : "") + '>' + s + '</option>').join("");
  const stored = reportHasStoredAttachment(r);
  let attachmentHtml = '<div class="rp-field-label">Attachment</div>';
  if (r.fileName) {
    attachmentHtml += '<div class="rp-field-value">' + esc(r.fileName) + '<br><span class="rp-muted">' + esc(r.fileType || "file") + ' · ' + fmtFileSize(r.fileSize) + '</span></div>';
    if (stored) {
      if (String(r.fileType || "").toLowerCase().indexOf("image/") === 0) {
        attachmentHtml += '<img class="rp-preview" src="' + esc(r.attachmentData) + '" alt="Attachment preview">';
      }
      attachmentHtml += '<div style="margin-top:6px"><a class="rp-dl" href="' + esc(r.attachmentData) + '" download="' + esc(r.fileName) + '">Open / download attachment</a></div>';
    } else {
      attachmentHtml += '<div class="rp-muted" style="margin-top:4px">Preview unavailable — metadata only</div>';
    }
  } else {
    attachmentHtml += '<div class="rp-field-value">No attachment</div>';
  }
  box.innerHTML =
    '<div class="rp-detail">' +
      '<div class="rp-detail-head">' +
        '<div><div class="rp-field-label">Report detail</div><h4 style="margin:2px 0 0;color:var(--primary)">' + esc(r.id) + '</h4></div>' +
        '<button class="btn" type="button" data-rp-action="close-detail" data-rp-id="' + esc(r.id) + '">Close</button>' +
      '</div>' +
      '<div class="rp-detail-grid">' +
        '<div><div class="rp-field-label">Created</div><div class="rp-field-value">' + (r.createdAt ? new Date(r.createdAt).toLocaleString() : "—") + '</div></div>' +
        '<div><div class="rp-field-label">Category</div><div class="rp-field-value">' + esc(r.category || "—") + '</div></div>' +
        '<div><div class="rp-field-label">ULPIN / Property ID</div><div class="rp-field-value rp-mono">' + esc(r.ulpin || "Not provided") + '</div></div>' +
        '<div><div class="rp-field-label">Reporter role</div><div class="rp-field-value">' + esc(getReporterRole(r)) + '</div></div>' +
        '<div><div class="rp-field-label">Reporter email</div><div class="rp-field-value">' + esc(getReporterEmail(r)) + '</div></div>' +
        '<div><div class="rp-field-label">Current status</div><div class="rp-field-value">' + reportStatusBadge(st) + '</div></div>' +
        '<div><div class="rp-field-label">Location</div><div class="rp-field-value">' + esc(r.location || "Not provided") + '</div></div>' +
        '<div>' + attachmentHtml + '</div>' +
      '</div>' +
      '<div style="margin-top:12px"><div class="rp-field-label">Description</div><div class="rp-field-value">' + esc(r.description || "—") + '</div></div>' +
      '<div class="rp-edit-grid">' +
        '<div><div class="rp-field-label">Change status</div><select id="rp-detail-status" class="select" style="margin-top:4px">' + opts + '</select></div>' +
        '<div><div class="rp-field-label">Admin remarks</div><textarea id="rp-detail-remarks" class="input rp-remarks" placeholder="Add remarks (shown in the citizen history)&hellip;">' + esc(r.adminRemarks || "") + '</textarea></div>' +
      '</div>' +
      '<div class="rp-actions">' +
        '<button class="btn btn-primary" type="button" data-rp-action="save-status" data-rp-id="' + esc(r.id) + '">Save Status</button>' +
        '<button class="btn" type="button" data-rp-action="save-remarks" data-rp-id="' + esc(r.id) + '">Save Remarks</button>' +
        '<button class="btn" type="button" data-rp-action="delete" data-rp-id="' + esc(r.id) + '" style="background:rgba(229,72,77,.12);color:var(--rose,#e5484d);border-color:rgba(229,72,77,.35)">Delete Report</button>' +
      '</div>' +
    '</div>';
  mountIcons(box);
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function updateReportStatus(reportId, newStatus) {
  const st = normalizeReportStatus(newStatus);
  if (REPORT_STATUSES.indexOf(st) === -1) { toast("Invalid status.", "warn"); return; }
  const list = loadReports();
  const r = list.find((x) => x && x.id === reportId);
  if (!r) { toast("Report not found.", "warn"); return; }
  r.status = st;
  r.statusUpdatedAt = new Date().toISOString();
  saveReports(list);
  /* New (additive): persist the status change to Supabase (cross-device). */
  syncReportFieldsToSupabase(reportId, { status: st, status_updated_at: r.statusUpdatedAt });
  renderAdminReports();
  renderReportHistory();
  if (reportAdminOpenId === reportId) openAdminReportDetail(reportId);
  toast("Status updated to <b>" + esc(st) + "</b> — Ticket " + esc(reportId) + ".", "ok", 3200);
}

function updateReportRemarks(reportId, remarks) {
  const list = loadReports();
  const r = list.find((x) => x && x.id === reportId);
  if (!r) { toast("Report not found.", "warn"); return; }
  r.adminRemarks = String(remarks || "").trim();
  r.remarksUpdatedAt = new Date().toISOString();
  saveReports(list);
  /* New (additive): persist the remarks change to Supabase (cross-device). */
  syncReportFieldsToSupabase(reportId, { admin_remarks: r.adminRemarks, remarks_updated_at: r.remarksUpdatedAt });
  renderReportHistory();
  toast(r.adminRemarks ? "Admin remarks saved for " + esc(reportId) + "." : "Admin remarks cleared for " + esc(reportId) + ".", "ok", 3000);
}

function deleteReport(reportId) {
  if (!confirm("Delete this report permanently?")) return;
  const list = loadReports();
  const next = list.filter((r) => !(r && r.id === reportId));
  if (next.length === list.length) { toast("Report not found.", "warn"); return; }
  saveReports(next);
  /* New (additive): delete from Supabase as well (cross-device). */
  deleteReportFromSupabase(reportId);
  reportAdminOpenId = null;
  const det = $("#admin-report-detail");
  if (det) det.innerHTML = "";
  renderAdminReports();
  renderReportHistory();
  toast("Report " + esc(reportId) + " deleted.", "ok", 3200);
}

function renderUlpinForm() {
  const sS = $("#ulp-state"), dS = $("#ulp-district"), tS = $("#ulp-tehsil"), vS = $("#ulp-village"), pS = $("#ulp-parcel");
  if (!sS) return;

  // Data source toggle: Demo (legacy) vs Real LGD
  state.ulpinDataSource = state.ulpinDataSource || "demo";
  const lgdAvailable = typeof window.LGD_DATA !== "undefined" && window.LGD_DATA && window.LGD_DATA.states;

  // Insert data source toggle if not present
  let toggleWrap = $("#ulpin-source-toggle");
  if (!toggleWrap) {
    toggleWrap = document.createElement("div");
    toggleWrap.id = "ulpin-source-toggle";
    toggleWrap.style.cssText = "display:flex;gap:6px;margin-bottom:12px;padding:8px;background:var(--bg2);border:1px solid var(--line);border-radius:8px;";
    toggleWrap.innerHTML =
      '<button type="button" id="ulpin-src-demo" class="btn sm" style="flex:1;padding:6px 10px;font-size:11.5px;border:1px solid var(--line);background:var(--bg3);border-radius:6px;cursor:pointer;">Demo Data</button>' +
      '<button type="button" id="ulpin-src-lgd" class="btn sm" style="flex:1;padding:6px 10px;font-size:11.5px;border:1px solid var(--line);background:transparent;border-radius:6px;cursor:pointer;' + (lgdAvailable ? "" : "opacity:0.5;") + '">Real LGD Data</button>';
    const formEl = document.getElementById("ulpin-form");
    if (formEl) formEl.parentNode.insertBefore(toggleWrap, formEl);
  }

  // LGD notice element
  let lgdNotice = $("#ulpin-lgd-notice");
  if (!lgdNotice) {
    lgdNotice = document.createElement("div");
    lgdNotice.id = "ulpin-lgd-notice";
    lgdNotice.style.cssText = "display:none;margin-bottom:10px;padding:10px;background:rgba(255,183,0,0.08);border:1px solid rgba(255,183,0,0.3);border-radius:8px;font-size:11.5px;color:var(--text);";
    const formEl = document.getElementById("ulpin-form");
    if (formEl) formEl.parentNode.insertBefore(lgdNotice, formEl);
  }

  const setToggleUI = () => {
    const isLGD = state.ulpinDataSource === "lgd";
    const demoBtn = $("#ulpin-src-demo");
    const lgdBtn = $("#ulpin-src-lgd");
    if (demoBtn) { demoBtn.style.background = isLGD ? "transparent" : "var(--bg3)"; demoBtn.style.borderColor = isLGD ? "var(--line)" : "var(--primary)"; }
    if (lgdBtn) { lgdBtn.style.background = isLGD ? "var(--bg3)" : "transparent"; lgdBtn.style.borderColor = isLGD ? "var(--primary)" : "var(--line)"; }
    if (lgdNotice) {
      lgdNotice.style.display = isLGD ? "block" : "none";
      lgdNotice.innerHTML = isLGD ?
        '<strong style="color:var(--amber)">PROTOTYPE ULPIN - NOT AN OFFICIAL GOVERNMENT ID</strong><br>' +
        'State / District / Sub-District use real LGD hierarchy data from data.gov.in (Ministry of Panchayati Raj). ' +
        'Villages come from the official LGD village dataset (snapshot 2026-07-02) where the parent ' +
        'State / District / Sub-District matches exactly; sub-districts without a matching record fall back to ' +
        '<strong>SAMPLE / PROTOTYPE data</strong>. ' +
        'The generated RULPIN is a prototype reference identifier, not an official government-issued ULPIN.' :
        "";
    }
  };

  // Toggle handlers
  const toggleDemo = () => { state.ulpinDataSource = "demo"; resetCascade(); setToggleUI(); renderParcelInfo(); };
  const toggleLgd = () => {
    if (!lgdAvailable) { toast("LGD data not loaded", "warn"); return; }
    state.ulpinDataSource = "lgd";
    const lgd = window.LGD_DATA.states;
    const s = lgd[0];
    const d0 = (s.districts && s.districts[0]) || { name: "", districts: [], tehsils: [] };
    const t0 = (d0.tehsils && d0.tehsils[0]) || { name: "", villages: [] };
    ensureLgdTehsilVillages(t0, s.code, d0.code);
    state.admin = {
      state: s,
      district: d0,
      tehsil: t0,
      village: (t0.villages && t0.villages[0]) || { name: "", code: "--", sample: true }
    };
    requestLgdStateVillages(s.code, () => { popLGD(); renderParcelInfo(); });
    popLGD();
    setToggleUI();
    renderParcelInfo();
  };

  // Demo mode populate
  const pop = () => {
    if (state.ulpinDataSource === "lgd") { popLGD(); return; }
    const a = state.admin;
    sS.innerHTML = ADMIN.map((x) => "<option>" + esc(x.name) + "</option>").join("");
    sS.value = a.state.name;
    dS.innerHTML = a.state.districts.map((x) => "<option>" + esc(x.name) + "</option>").join("");
    dS.value = a.district.name;
    tS.innerHTML = a.district.tehsils.map((x) => "<option>" + esc(x.name) + "</option>").join("");
    tS.value = a.tehsil.name;
    vS.innerHTML = a.tehsil.villages.map((x) => "<option>" + esc(x.name) + "</option>").join("");
    vS.value = a.village.name;
    pS.innerHTML = PARCELS.map((p) => '<option value="' + p.id + '">' + esc(p.survey) + " \u2014 " + esc(p.use) + " (" + fmtArea(p.area) + " m\u00b2)</option>").join("");
  };

  // LGD mode populate
  const popLGD = () => {
    const lgd = window.LGD_DATA.states;
    const a = state.admin;
    // AP-only: attach missing sub-districts / newer districts (743-755, 790, 791)
    lgdAttachMissingDistricts(a.state && a.state.code, a.state);
    lgdAttachMissingTehsils(a.state && a.state.code, a.district);
    if (a.district && Array.isArray(a.district.tehsils) && a.district.tehsils.length && (!a.tehsil || !a.tehsil.name)) a.tehsil = a.district.tehsils[0];
    sS.innerHTML = lgd.map((x) => "<option>" + esc(x.name) + "</option>").join("");
    sS.value = a.state.name;
    const dists = a.state.districts || [];
    dS.innerHTML = dists.map((x) => "<option>" + esc(x.name) + "</option>").join("");
    dS.value = a.district ? a.district.name : "";
    // For AP (state 28), check AP_MISSING_TEHSILS when district has empty tehsils
    let tehs = a.district ? (a.district.tehsils || []) : [];
    if (tehs.length === 0 && a.state && String(a.state.code) === "28" && typeof window.AP_MISSING_TEHSILS !== "undefined" && window.AP_MISSING_TEHSILS) {
      const apDistrict = window.AP_MISSING_TEHSILS[String(a.district.code)];
      if (apDistrict && Array.isArray(apDistrict.tehsils) && apDistrict.tehsils.length > 0) {
        tehs = apDistrict.tehsils;
      }
    }
    tS.innerHTML = tehs.map((x) => "<option>" + esc(x.name) + "</option>").join("");
    tS.value = a.tehsil ? a.tehsil.name : "";
    const vills = (a.tehsil && a.state && a.district) ? ensureLgdTehsilVillages(a.tehsil, a.state.code, a.district.code) : ((a.tehsil && a.tehsil.villages) ? a.tehsil.villages : []);
    if (vills.length) {
      vS.innerHTML = vills.map((x) => '<option value="' + esc(x.name) + '">' + esc(x.name) + " (" + esc(x.code) + ")</option>").join("");
      let chosen = a.village;
      if (!chosen || !chosen.code || chosen.code === "--" || !vills.some((x) => x.name === chosen.name && x.code === chosen.code)) { chosen = vills[0] || null; a.village = chosen; }
      vS.value = chosen ? chosen.name : "";
    } else {
      vS.innerHTML = '<option value="">No village data for this sub-district</option>';
      vS.value = "";
    }
    pS.innerHTML = PARCELS.map((p) => '<option value="' + p.id + '">' + esc(p.survey) + " \u2014 " + esc(p.use) + " (" + fmtArea(p.area) + " m\u00b2)</option>").join("");
  };

  const resetCascade = () => {
    if (state.ulpinDataSource === "lgd") {
      const lgd = window.LGD_DATA.states;
      const s = lgd.find((x) => x.name === sS.value) || lgd[0];
      const d0 = (s.districts && s.districts[0]) || { name: "", districts: [], tehsils: [] };
      lgdAttachMissingDistricts(s.code, s);
      lgdAttachMissingTehsils(s.code, d0);
      const t0 = (d0.tehsils && d0.tehsils[0]) || { name: "", villages: [] };
      ensureLgdTehsilVillages(t0, s.code, d0.code);
      state.admin = {
        state: s,
        district: d0,
        tehsil: t0,
        village: (t0.villages && t0.villages[0]) || { name: "", code: "--", sample: true }
      };
      requestLgdStateVillages(s.code, () => { popLGD(); renderParcelInfo(); });
      popLGD();
      return;
    }
    const s = ADMIN.find((x) => x.name === sS.value) || ADMIN[0];
    state.admin = {
      state: s,
      district: s.districts[0],
      tehsil: s.districts[0].tehsils[0],
      village: s.districts[0].tehsils[0].villages[0]
    };
    pop();
  };

  // Toggle event listeners
  const demoBtn = $("#ulpin-src-demo");
  const lgdBtn = $("#ulpin-src-lgd");
  if (demoBtn) demoBtn.addEventListener("click", toggleDemo);
  if (lgdBtn) lgdBtn.addEventListener("click", toggleLgd);

  setToggleUI();
  pop();
  sS.addEventListener("change", resetCascade);
  dS.addEventListener("change", () => {
    if (state.ulpinDataSource === "lgd") {
      const dists = state.admin.state.districts || [];
      const d = dists.find((x) => x.name === dS.value) || dists[0];
      state.admin.district = d;
      lgdAttachMissingTehsils(state.admin.state.code, d);
      const t0 = (d.tehsils && d.tehsils[0]) || { name: "", villages: [] };
      ensureLgdTehsilVillages(t0, state.admin.state.code, d.code);
      state.admin.tehsil = t0;
      state.admin.village = (t0.villages && t0.villages[0]) || { name: "", code: "--", sample: true };
      popLGD();
      return;
    }
    state.admin.district = state.admin.state.districts.find((d) => d.name === dS.value) || state.admin.state.districts[0];
    state.admin.tehsil = state.admin.district.tehsils[0];
    state.admin.village = state.admin.tehsil.villages[0];
    pop();
  });
  tS.addEventListener("change", () => {
    if (state.ulpinDataSource === "lgd") {
      lgdAttachMissingTehsils(state.admin.state.code, state.admin.district);
      const tehs = state.admin.district.tehsils || [];
      state.admin.tehsil = tehs.find((t) => t.name === tS.value) || tehs[0];
      const t = state.admin.tehsil;
      ensureLgdTehsilVillages(t, state.admin.state.code, state.admin.district.code);
      state.admin.village = (t && t.villages && t.villages[0]) || { name: "", code: "--", sample: true };
      popLGD();
      return;
    }
    state.admin.tehsil = state.admin.district.tehsils.find((t) => t.name === tS.value) || state.admin.district.tehsils[0];
    state.admin.village = state.admin.tehsil.villages[0];
    pop();
  });
  vS.addEventListener("change", () => {
    if (state.ulpinDataSource === "lgd") {
      const vills = state.admin.tehsil && state.admin.tehsil.villages ? state.admin.tehsil.villages : [];
      state.admin.village = vills.find((v) => v.name === vS.value) || vills[0] || null;
      return;
    }
    state.admin.village = state.admin.tehsil.villages.find((v) => v.name === vS.value) || state.admin.tehsil.villages[0];
    pop();
  });

  $("#btn-generate-ulpin").addEventListener("click", generateUlpin);
  $("#btn-validate").addEventListener("click", validateUlpin);
  $("#ulpin-validate-input").addEventListener("keydown", (e) => { if (e.key === "Enter") validateUlpin(); });

  /* Vertical ULPIN: building / floor / unit cascade */
  const bS = $("#ulp-building"), fS = $("#ulp-floor"), uS = $("#ulp-unit");
  if (bS && fS && uS) {
    bS.innerHTML = BUILDINGS.map((b) => '<option value="' + b.id + '">' + esc(b.name) + ' (' + b.id + ')</option>').join("");
    const popFloors = () => {
      const b = BUILDINGS.find((x) => x.id === bS.value) || BUILDINGS[0];
      fS.innerHTML = b.floors.map((f) => '<option value="' + f.id + '">' + floorDisplayName(f.id) + '</option>').join("");
      popUnits();
    };
    const popUnits = () => {
      const b = BUILDINGS.find((x) => x.id === bS.value) || BUILDINGS[0];
      const f = b.floors.find((x) => x.id === fS.value) || b.floors[0];
      uS.innerHTML = (f.units || []).map((u) => '<option value="' + u.no + '">' + esc(u.no) + ' \u00b7 ' + esc(u.type) + '</option>').join("");
    };
    bS.addEventListener("change", popFloors);
    fS.addEventListener("change", popUnits);
    popFloors();
    $("#btn-generate-vertical-ulpin").addEventListener("click", generateVerticalUlpin);
  }

  /* ---- ensure registry + parcel status initialized during form setup ---- */
  if (typeof window.ulpinRegistry === "undefined") { window.ulpinRegistry = {}; }
  if (pS) {
    pS.addEventListener("change", renderParcelInfo);
    renderParcelInfo();
  }

  /* ---- prototype workflow: validate first, then generate ---- */
  const $genBtn = $("#btn-generate-ulpin");
  if ($genBtn) {
    $genBtn.addEventListener("click", (e) => {
      e.preventDefault();
      generateUlpin();
    });
  }
  const $vBtn = $("#btn-generate-vertical-ulpin");
  if ($vBtn) {
    $vBtn.addEventListener("click", (e) => {
      e.preventDefault();
      generateVerticalUlpin();
    });
  }


}

function generateUlpin() {
  const pS = $("#ulp-parcel");
  const out = $("#ulp-parcel-status");
  const p = PARCELS.find(function (x) { return x.id === pS.value; }) || PARCELS[0];
  const hi = currentAdminHierarchy();

  if (!pS.value) {
    if (out) {
      out.className = "pd-status";
      out.innerHTML = '<span class="ni-ico" data-i="alert"></span>Please complete the required land parcel information.';
      mountIcons(out);
    }
    toast("Please complete the required parcel information.", "err");
    return;
  }

  // LGD prototype mode: generate a clearly-labelled prototype identifier
  // using the full official LGD hierarchy codes (never truncated/hashed).
  if (state.ulpinDataSource === "lgd") {
    const v = state.admin && state.admin.village;
    if (!state.admin.tehsil || !state.admin.tehsil.name || !v || !v.code || v.code === "--") {
      if (out) {
        out.className = "pd-status warn";
        out.innerHTML = '<span class="ni-ico" data-i="alert"></span><strong>Village required.</strong> Select a State, District and Sub-District that has village data before generating a prototype ULPIN.';
        mountIcons(out);
      }
      toast("Select a valid village before generating the prototype ULPIN.", "warn");
      return;
    }
    const protoUlp = genPrototypeUlpin(p, hi);
    const existing = (typeof window.ulpinRegistry !== "undefined" && window.ulpinRegistry[p.id]);

    if (existing && existing !== protoUlp) {
      if (out) {
        out.className = "pd-status conflict";
        out.innerHTML = '<span class="ni-ico" data-i="alert"></span>Conflict — a different prototype ULPIN (' + esc(existing) + ') was already stored for this parcel in this session.';
        mountIcons(out);
      }
      toast("Do not generate a new prototype ULPIN for this parcel — registry shows " + esc(existing) + ".", "err");
      return;
    }

    p.ulpin = protoUlp;
    state.generated = { ulpin: protoUlp, parcel: p, prototype: true };
    if (typeof window.ulpinRegistry !== "undefined") {
      window.ulpinRegistry[p.id] = protoUlp;
    }

    const box = $("#ulpin-result");
    if (out) {
      out.className = "pd-status verified";
      out.innerHTML = '<span class="ni-ico" data-i="check"></span>Parcel validated. Prototype ULPIN generated for survey ' + esc(p.survey) + " — official LGD hierarchy codes preserved.";
      mountIcons(out);
    }

    box.innerHTML = '<div class="ulpin-reveal">' +
      '<div class="pd-honest"><strong>PROTOTYPE ULPIN — NOT AN OFFICIAL GOVERNMENT ID</strong></div>' +
      '<div class="ulpin-code">' + protoUlp + "</div>" +
      '<div class="ulpin-meta">Survey ' + esc(p.survey) + " · " + esc(p.owner) + " · " + p.lat.toFixed(5) + "°, " + p.lng.toFixed(5) + "°</div>" +
      '<div class="break-chips">' + prototypeUlpinParts(protoUlp).map(function (x) { return '<span class="bc"><em>' + x.label + "</em>" + esc(x.value); }).join("") + "</div>" +
      '<div class="ulpin-actions">' +
      '<button class="btn btn-ghost sm" data-copy-ulp="' + protoUlp + '"><span class="ni-ico" data-i="copy"></span>Copy</button>' +
      '<button class="btn btn-primary sm" data-save-ulp="' + p.id + '"><span class="ni-ico" data-i="check"></span>Save to registry</button>' +
      '<button class="btn btn-ghost sm" data-link-ulp="' + p.id + '"><span class="ni-ico" data-i="cube"></span>Link to 3D property</button>' +
      "</div></div>";

    mountIcons(box);
    attachQrControls(box, protoUlp);
    box.querySelector("[data-copy-ulp]").addEventListener("click", function () { copyText(protoUlp, "Prototype ULPIN copied — " + protoUlp.slice(0, 14) + "…"); });
    box.querySelector("[data-save-ulp]").addEventListener("click", function () {
      p.ulpin = protoUlp;
      toast("Prototype ULPIN attached to survey " + esc(p.survey) + " in the registry.", "ok");
      if (out) { renderParcelInfo(); }
    });
    box.querySelector("[data-link-ulp]").addEventListener("click", function () {
      window.open("index.html#view3d?parcel=" + encodeURIComponent(p.id), "_self");
    });
    return;
  }

  if (out) { renderParcelInfo(); }

  const ulp = genUlpin(p, hi.admin);
  const existing = (typeof window.ulpinRegistry !== "undefined" && window.ulpinRegistry[p.id]);

  if (existing && existing !== ulp) {
    if (out) {
      out.className = "pd-status conflict";
      out.innerHTML = '<span class="ni-ico" data-i="alert"></span>Conflict — a different ULPIN (' + esc(existing) + ') was already stored for this parcel in this session.';
      mountIcons(out);
    }
    toast("Do not generate a new ULPIN for this parcel — registry shows " + esc(existing) + ".", "err");
    return;
  }

  p.ulpin = ulp;
  state.generated = { ulpin: ulp, parcel: p };

  if (typeof window.ulpinRegistry !== "undefined") {
    window.ulpinRegistry[p.id] = ulp;
  }

  const box = $("#ulpin-result");
  if (out) {
    out.className = "pd-status verified";
    out.innerHTML = '<span class="ni-ico" data-i="check"></span>Parcel validated successfully. Prototype ULPIN generated for survey ' + esc(p.survey) + ".";
    mountIcons(out);
  }

  box.innerHTML = '<div class="ulpin-reveal">' +
    '<div class="pd-honest">Prototype / Demo — not an official legal land title identifier</div>' +
    '<div class="ulpin-code">' + ulp + "</div>" +
    '<div class="ulpin-meta">Survey ' + esc(p.survey) + " · " + esc(p.owner) + " · " + p.lat.toFixed(5) + "°, " + p.lng.toFixed(5) + "°</div>" +
    '<div class="break-chips">' + ulpinParts(ulp).map(function (x) { return '<span class="bc"><em>' + x.label + "</em>" + x.value; }).join("") + "</div>" +
    '<div class="ulpin-actions">' +
    '<button class="btn btn-ghost sm" data-copy-ulp="' + ulp + '"><span class="ni-ico" data-i="copy"></span>Copy</button>' +
    '<button class="btn btn-primary sm" data-save-ulp="' + p.id + '"><span class="ni-ico" data-i="check"></span>Save to registry</button>' +
    '<button class="btn btn-ghost sm" data-link-ulp="' + p.id + '"><span class="ni-ico" data-i="cube"></span>Link to 3D property</button>' +
    "</div></div>";

  mountIcons(box);
  attachQrControls(box, ulp);
  box.querySelector("[data-copy-ulp]").addEventListener("click", function () { copyText(ulp, "ULPIN copied — " + ulp.slice(0, 8) + "…"); });
  box.querySelector("[data-save-ulp]").addEventListener("click", function () {
    p.ulpin = ulp;
    toast("ULPIN attached to survey " + esc(p.survey) + " in the registry.", "ok");
    if (out) { renderParcelInfo(); }
  });
  box.querySelector("[data-link-ulp]").addEventListener("click", function () {
    window.open("index.html#view3d?parcel=" + encodeURIComponent(p.id), "_self");
  });
}

function generateVerticalUlpin() {
  const pS = $("#ulp-parcel");
  if (!pS.value) {
    toast("<span class='ni-ico' data-i='alert'></span>Please select a land parcel before generating a vertical ULPIN.", "warn");
    return;
  }
  if (state.ulpinDataSource === "lgd") {
    const lv = state.admin && state.admin.village;
    if (!state.admin.tehsil || !state.admin.tehsil.name || !lv || !lv.code || lv.code === "--") {
      toast("Select a valid village before generating the vertical prototype ULPIN.", "warn");
      return;
    }
  }
  const p = PARCELS.find((x) => x.id === pS.value) || PARCELS[0];
  const hi = currentAdminHierarchy();
  const isLGDMode = state.ulpinDataSource === "lgd";
  const surfaceUlp = isLGDMode ? genPrototypeUlpin(p, hi) : genUlpin(p, hi.admin);
  const bS = $("#ulp-building"), fS = $("#ulp-floor"), uS = $("#ulp-unit");
  const bId = bS ? bS.value : "";
  const fId = fS ? fS.value : "";
  const uId = uS ? uS.value : "";
  const b = BUILDINGS.find((x) => x.id === bId) || (BUILDINGS[0] || null);
  const floor = b ? (b.floors.find((f) => f.id === fId) || b.floors[0] || null) : null;
  const unit = floor ? ((floor.units || []).find((u) => u.no === uId) || (floor.units || [])[0] || null) : null;
  const verticalUlp = surfaceUlp + "-" + bId + "-" + fId + (unit ? "-" + unit.no : "");
  state.generated = { ulpin: verticalUlp, parcel: p, building: b, floor: floor, unit: unit, surface: surfaceUlp };
  window.ulpinRegistry[b && bId ? bId + "|" + fId + (unit ? "|" + unit.no : "") : "vertical|" + (b ? b.id : "none") + "|" + fId] = verticalUlp;
  p.ulpin = surfaceUlp;
  const box = $("#ulpin-result");
  const links3d = (b && floor) ? 
    '<div class="pd-status" style="margin-top:8px;font-size:11px"><span class="ni-ico" data-i="cube"></span><a href="#" id="ulp-link-3d" style="color:var(--primary);text-decoration:underline">Open in 3D property view</a></div>' : '';
  box.innerHTML = '<div class="ulpin-reveal">' +
    (isLGDMode ? '<div class="pd-honest"><strong>PROTOTYPE ULPIN — NOT AN OFFICIAL GOVERNMENT ID</strong></div>' : '') +
    '<div class="ulpin-code">' + verticalUlp + "</div>" +
    '<div class="ulpin-meta">Vertical identity · ' + esc(b && b.name ? b.name : "—") + ' · ' + floorDisplayName(floor && floor.id ? floor.id : "—") + (unit ? ' · ' + esc(unit.no) : '') + '</div>' +
    '<div class="break-chips">' +
    '<span class="bc"><em>SURFACE</em>' + surfaceUlp + '</span>' +
    '<span class="bc"><em>BUILDING</em>' + esc(bId) + '</span>' +
    '<span class="bc"><em>FLOOR</em>' + esc(fId) + '</span>' +
    (unit ? '<span class="bc"><em>UNIT</em>' + esc(unit.no) + '</span>' : '') +
    '</div>' +
    '<div class="ulpin-actions">' +
    '<button class="btn btn-ghost sm" data-copy-ulp="' + verticalUlp + '"><span class="ni-ico" data-i="copy"></span>Copy</button>' +
    '<button class="btn btn-primary sm" data-save-ulp="' + p.id + '"><span class="ni-ico" data-i="check"></span>Save to registry</button>' +
    '</div></div>' +
    links3d +
    '<div class="outcome ok show" style="margin-top:8px"><span class="ni-ico" data-i="check"></span>Parcel validated and prototype vertical ULPIN ' + verticalUlp.slice(0, 10) + '… generated from existing property hierarchy.</div>' +
    '<div class="prototype-note" style="margin-top:6px;text-align:center"><span class="ni-ico" data-i="info"></span>Prototype / demo reference — not an official legal land title identifier.</div>';
  mountIcons(box);
  attachQrControls(box, verticalUlp);
  box.querySelector("[data-copy-ulp]").addEventListener("click", () => copyText(verticalUlp, "Vertical ULPIN copied — " + verticalUlp.slice(0, 12) + "…"));
  box.querySelector("[data-save-ulp]").addEventListener("click", () => {
    p.ulpin = verticalUlp;
    toast("<b>Vertical ULPIN attached</b> to " + esc(b && b.name ? b.name : "—") + " · " + floorDisplayName(floor && floor.id ? floor.id : "—") + " in the prototype registry.", "ok");
    renderParcelInfo();
  });
  if (links3d) {
    const lnk = box.querySelector("#ulp-link-3d");
    if (lnk) {
      lnk.addEventListener("click", (e) => {
        e.preventDefault();
        if (window.iso3d && typeof window.iso3d.show === "function") {
          window.iso3d.show(b);
          if (typeof selectFloor === "function") selectFloor(floor.id);
          if (typeof renderVRef3D === "function") renderVRef3D();
          goto("view3d");
        } else if (typeof goto === "function") {
          goto("view3d");
        }
      });
    }
  }
  toast("<b>Vertical ULPIN generated</b> · " + esc(p.survey) + " → " + (b && b.name ? b.name : "building") + " · " + floorDisplayName(floor && floor.id ? floor.id : "") + (unit ? " · " + esc(unit.no) : ""), "ok");
}

function generateParcelResult(p) {
  const ulp = genUlpin(p, state.admin);
  p.ulpin = ulp;
  window.ulpinRegistry[p.id] = ulp;
  state.generated = { ulpin: ulp, parcel: p };
  renderParcelInfo();
  const box = $("#ulpin-result");
  box.innerHTML =
    '<div class="ulpin-reveal">' +
    '<div class="ulpin-code">' + ulp + "</div>" +
    '<div class="ulpin-meta">Prototype ULPIN / reference — survey ' + esc(p.survey) + ' · ' + esc(p.owner) + ' · ' + p.lat.toFixed(5) + "°, " + p.lng.toFixed(5) + "°</div>" +
    '<div class="break-chips">' + ulpinParts(ulp).map((x) => '<span class="bc"><em>' + x.label + "</em>" + x.value + "</span>").join("") + "</div>" +
    '<div class="ulpin-actions">' +
    '<button class="btn btn-ghost sm" data-copy-ulp="' + ulp + '"><span class="ni-ico" data-i="copy"></span>Copy</button>' +
    '<button class="btn btn-primary sm" data-save-ulp="' + p.id + '"><span class="ni-ico" data-i="check"></span>Save to registry</button>' +
    "</div></div>" +
    '<div class="ulpin-prototype-note">Prototype / demo identifier — not an official legal land title identifier.</div>';
  mountIcons(box);
  attachQrControls(box, ulp);
  box.querySelector("[data-copy-ulp]").addEventListener("click", () => copyText(ulp, "ULPIN copied — " + ulp.slice(0, 8) + "…"));
  box.querySelector("[data-save-ulp]").addEventListener("click", () => {
    p.ulpin = ulp;
    toast("<b>Prototype ULPIN attached</b> to survey " + esc(p.survey) + " in the registry.", "ok");
    renderParcelInfo();
  });
}

function validateUlpin() {
  const input = $("#ulpin-validate-input"), out = $("#validate-outcome");
  const val = (input.value || "").trim().toUpperCase();
  out.className = "outcome";
  out.innerHTML = "";
  mountIcons(out);
  if (!val) {
    out.className = "outcome err show";
    out.innerHTML = '<span class="ni-ico" data-i="alert"></span>Enter a 26-character ULPIN or a RULPIN prototype identifier first.';
    return;
  }
  /* Prototype RULPIN format: RULPIN-{state}-{district}-{subdistrict}-{village}-{survey}-{geo} */
  if (val.indexOf("RULPIN-") === 0) {
    const parts = val.split("-");
    if (parts.length < 7 || parts[0] !== "RULPIN" || !parts.slice(1, 6).every((x) => /^[A-Z0-9]+$/.test(x))) {
      out.className = "outcome err show";
      out.innerHTML = '<span class="ni-ico" data-i="alert"></span>Invalid prototype format — expected RULPIN-{state}-{district}-{subdistrict}-{village}-{parcel}-{geo}.';
      mountIcons(out);
      return;
    }
    const registry = (window.ulpinRegistry || {});
    const regKey = Object.keys(registry).find((k) => (registry[k] || "").toUpperCase() === val);
    out.className = "outcome ok show";
    out.innerHTML = '<span class="ni-ico" data-i="check"></span><b>PROTOTYPE ULPIN — NOT AN OFFICIAL GOVERNMENT ID.</b> Format valid.' +
      '<div class="break-chips" style="justify-content:flex-start;margin-top:4px">' +
      '<span class="bc"><em>STATE</em>' + esc(parts[1]) + '</span>' +
      '<span class="bc"><em>DISTRICT</em>' + esc(parts[2]) + '</span>' +
      '<span class="bc"><em>SUB-DISTRICT</em>' + esc(parts[3]) + '</span>' +
      '<span class="bc"><em>VILLAGE</em>' + esc(parts[4]) + '</span>' +
      '<span class="bc"><em>PARCEL</em>' + esc(parts[5]) + '</span>' +
      '</div>' +
      (regKey ? '<div style="margin-top:4px">Registered locally under key <b>' + esc(regKey) + '</b>.</div>' : '<div style="margin-top:4px">Not currently recorded in the local prototype registry.</div>') +
      '<div class="prototype-note" style="margin-top:6px;text-align:left"><span class="ni-ico" data-i="info"></span>Prototype registry check — not an authoritative government verification.</div>';
    mountIcons(out);
    return;
  }
  const shapeOk = val.length === 26 && /^[A-Z0-9]+$/.test(val);
  if (!shapeOk) {
    out.className = "outcome err show";
    out.innerHTML = '<span class="ni-ico" data-i="alert"></span>Invalid — a ULPIN must be exactly 26 alphanumeric characters.';
    return;
  }
  const known = PARCELS.find((p) => (p.ulpin || "").toUpperCase() === val);
  const registry = (window.ulpinRegistry || {});
  const regKey = Object.keys(registry).find((k) => (registry[k] || "").toUpperCase() === val);
  if (known) {
    const dup = Object.keys(registry).filter((k) => k !== known.id && (registry[k] || "").toUpperCase() === val);
    out.className = "outcome ok show";
    out.innerHTML = '<span class="ni-ico" data-i="check"></span>Verified against the local prototype registry — survey <b>' + esc(known.survey) + '</b> (' + esc(known.use) + ') in ' + esc((state.admin && state.admin.district && state.admin.district.name) || '') + '.' +
      (dup.length ? '<div class="break-chips" style="justify-content:flex-start;margin-top:4px"><span class="bc"><em>⚠ Duplicate note</em>' + dup.length + ' other parcel(s) share this prototype ULPIN in this session.</span></div>' : '') +
      '<div class="prototype-note" style="margin-top:6px;text-align:left"><span class="ni-ico" data-i="info"></span>Prototype / demo registry check — not an authoritative government verification.</div>';
    mountIcons(out);
  } else {
    out.className = "outcome ok show";
    out.innerHTML = '<span class="ni-ico" data-i="check"></span>Format looks valid (simulated checksum OK) — not currently recorded in the prototype registry.' +
      '<div class="prototype-note" style="margin-top:6px;text-align:left"><span class="ni-ico" data-i="info"></span>Prototype / demo check — a match here means the identifier has not yet been saved in this session.</div>';
    mountIcons(out);
  }
}

/* ===================== UNDERGROUND ===================== */
function renderUnderground() {
  const svg = $("#subsurface-svg");
  if (!svg) return;
  let s = '<rect class="ug-sky" width="760" height="78"/>';
  s += '<rect class="ug-grass" y="78" width="760" height="20"/>';
  s += '<text x="16" y="18" font-size="12" font-weight="700" fill="#334155" font-family="Inter,sans-serif">Cross-section through Rajnagar Layout</text>';
  s += '<line x1="0" y1="98" x2="760" y2="98" stroke="#334155" stroke-width="2"/>';
  s += '<rect class="ug-soil" y="98" width="760" height="90"/>';
  s += '<rect class="ug-clay" y="188" width="760" height="110"/>';
  s += '<rect class="ug-rock" y="298" width="760" height="142"/>';
  s += '<rect class="ug-aqua" y="360" width="760" height="80"/>';
  s += '<text x="728" y="398" text-anchor="end" font-size="10.5" fill="#64748b" font-family="Inter,sans-serif">water table ≈ −7.5 m</text>';
  s += '<rect x="0" y="108" width="760" height="48" fill="none" stroke="#fde68a" stroke-width="2" stroke-dasharray="6 6"/>';
  s += '<text x="16" y="124" font-size="10" font-weight="700" fill="#a16207" font-family="Inter,sans-serif" letter-spacing="1">UTILITY ZONE</text>';
  s += '<line class="ug-anchor" x1="130" y1="98" x2="130" y2="270"/><line class="ug-anchor" x1="310" y1="98" x2="310" y2="270"/><line class="ug-anchor" x1="480" y1="98" x2="480" y2="270"/><line class="ug-anchor" x1="650" y1="98" x2="650" y2="270"/>';

  s += '<rect x="60" y="40" width="70" height="58" fill="#475569"/><rect x="70" y="50" width="12" height="12" fill="#e2e8f0"/><rect x="92" y="50" width="12" height="12" fill="#e2e8f0"/><rect x="70" y="70" width="12" height="12" fill="#e2e8f0"/>';
  s += '<rect x="560" y="30" width="46" height="68" fill="#64748b"/><rect x="600" y="30" width="70" height="68" fill="#475569"/><rect x="612" y="42" width="14" height="14" fill="#e2e8f0"/><rect x="636" y="42" width="14" height="14" fill="#e2e8f0"/><rect x="612" y="64" width="14" height="14" fill="#e2e8f0"/>';
  s += '<text x="600" y="24" text-anchor="middle" font-size="10.5" fill="#64748b" font-family="Inter,sans-serif">Vertex Heights</text>';

  const pipes = [
    { cls: "fiber", y: 112, label: "Optical fibre · 0.8 m" },
    { cls: "water", y: 134, label: "Water main · 1.2 m" },
    { cls: "gas",   y: 156, label: "Gas · 1.5 m" },
    { cls: "sewer", y: 210, label: "Sewer trunk · 2.4 m" },
    { cls: "power", y: 262, label: "HV power · 2.8 m" }
  ];
  pipes.forEach((p) => {
    s += '<line class="ug-pipe ' + p.cls + '" x1="' + (p.y > 200 ? 30 : 40) + '" y1="' + p.y + '" x2="' + (p.y > 200 ? 730 : 720) + '" y2="' + p.y + '"/>';
    s += '<text class="ug-label" x="18" y="' + (p.y + 4) + '">' + p.label + "</text>";
  });
  svg.innerHTML = s;

  $("#assets-list").innerHTML = UNDERGROUND.map((a) =>
    '<div class="asset"><div class="a-ico ' + a.cat + '">' + icon("pipe") + '</div>' +
    '<div class="a-main"><b>' + esc(a.name) + "</b><span>" + esc(a.operator) + " · depth " + esc(a.depth) + " · dia " + esc(a.dia) + "</span></div>" +
    statusBadge(a.status) + "</div>"
  ).join("");
  mountIcons($("#assets-list"));
}

/* ===================== AIR RIGHTS ===================== */
function renderAir() {
  const svg = $("#air-svg");
  if (svg) {
    let s = '<defs><linearGradient id="airg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0ea5e9" stop-opacity=".28"/><stop offset="1" stop-color="#2563eb" stop-opacity=".1"/></linearGradient></defs>';
    s += '<rect y="260" width="520" height="80" fill="#e8effa"/>';
    s += '<line x1="0" y1="260" x2="520" y2="260" stroke="#475569" stroke-width="2"/>';
    s += '<rect x="150" y="170" width="130" height="90" fill="#334155"/>';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) s += '<rect x="' + (158 + c * 40) + '" y="' + (180 + r * 20) + '" width="32" height="14" fill="#f1f5f9" opacity=".9"/>';
    s += '<rect x="120" y="150" width="190" height="20" rx="4" fill="#60a5fa" opacity=".35" stroke="#2563eb" stroke-dasharray="5 4"/><text x="215" y="164" text-anchor="middle" font-size="10" font-weight="700" fill="#1d4ed8" font-family="Inter,sans-serif">FSI bank · 0 – 20 m</text>';
    s += '<rect x="100" y="90" width="230" height="54" rx="4" fill="url(#airg)" stroke="#0ea5e9" stroke-dasharray="5 4"/><text x="215" y="122" text-anchor="middle" font-size="10" font-weight="700" fill="#0369a1" font-family="Inter,sans-serif">Tower mast volume · 12 – 60 m</text>';
    s += '<rect x="60" y="40" width="400" height="46" rx="4" fill="url(#airg)" stroke="#8b5cf6" stroke-dasharray="5 4"/><text x="260" y="68" text-anchor="middle" font-size="10" font-weight="700" fill="#6d28d9" font-family="Inter,sans-serif">Drone corridor · 60 – 120 m</text>';
    svg.innerHTML = s;
  }
  $("#air-list").innerHTML = AIR_RECORDS.map((a) =>
    '<div class="air-card"><div class="ac-top"><b>' + esc(a.id) + " · " + esc(a.holder) + "</b>" + statusBadge(a.status) + '</div><p>' + esc(a.purpose) + " above parcel " + esc(a.parcel) + '.</p><div class="ac-meta"><span>' + icon("arrow") + esc(a.height) + "</span><span>" + icon("pin") + "base ULPIN linked</span></div></div>"
  ).join("");
  $("#air-list").innerHTML += '<div class="air-card" style="opacity:.7"><div class="ac-top"><b>More air parcels</b></div><p>Air-volume registration workflow arrives in Phase 2.</p></div>';
}

/* ===================== AI & SOURCES ===================== */
function renderAI() {
  // AI Insights Cards (replaces the old placeholder grid)
  if (typeof renderAIInsights === "function") renderAIInsights();
}
function renderSources() {
  // Enrich each data source with demo coverage / quality / use-in-analysis metadata
  const META = {
    "DILRMP — Records of Rights": { coverage: "All states", quality: "Authoritative", use: "Ownership verification · mutation tracking", pct: 100 },
    "Bhunaksha cadastral tiles": { coverage: "24 states", quality: "1:1000 scale", use: "Parcel boundary overlay · survey reference", pct: 92 },
    "GNSS / CORS base stations": { coverage: "Pan-India network", quality: "±2 cm RTK", use: "Coordinate accuracy · boundary survey", pct: 98 },
    "LiDAR / drone orthophotos": { coverage: "Sample districts", quality: "42 pts/m²", use: "Building extraction · floor segmentation", pct: 78 },
    "Property tax (ULC) export": { coverage: "Urban local bodies", quality: "Structured DB", use: "Valuation · tax linkage", pct: 65 },
    "Survey of India DTMs": { coverage: "National", quality: "1 m resolution", use: "DEM/DSM · elevation modeling", pct: 88 },
    "Field survey app (mobile)": { coverage: "Pilot districts", quality: "Real-time sync", use: "Ground truthing · data collection", pct: 45 }
  };
  $("#sources-list").innerHTML = DATA_SOURCES.map((s) => {
    const m = META[s.name] || { coverage: "Sample", quality: "Sample", use: "Analysis support", pct: 50 };
    return '<div class="src-card"><div class="src-ico">' + icon(s.icon) + '</div>' +
      '<div class="src-body"><h4>' + esc(s.name) + "</h4><p>" + esc(s.type) + " · " + esc(s.freq) + "</p>" +
      '<div class="src-demo-meta"><span><b>Coverage:</b> ' + esc(m.coverage) + '</span><span><b>Quality:</b> ' + esc(m.quality) + '</span><span><b>Use:</b> ' + esc(m.use) + '</span></div>' +
      '<div class="src-bar"><div class="src-bar-fill" style="width:' + m.pct + '%"></div></div></div>' +
      '<div class="src-meta"><span class="badge ' + s.chipCls + '"><span class="dot ' + (s.chipCls === "ok" ? "teal" : "amber") + '"></span>' + s.chip + "</span><b>" + esc(s.last) + "</b></div></div>";
  }).join("");
  mountIcons($("#sources-list"));
}

/* ===================== GLOBAL WIRING ===================== */
function wireAll() {
  $$(".nav-item").forEach((n) => n.addEventListener("click", (e) => { e.preventDefault(); goto(n.dataset.view); }));
  /* Mobile drawer (Task 1, additive): keep the drawer below the live sticky
     topbar height so the EXISTING #hamburger stays visible + tappable. */
  const syncDrawerTop = () => {
    try {
      const tb = document.querySelector(".topbar");
      if (tb && window.matchMedia("(max-width:1024px)").matches) {
        document.documentElement.style.setProperty("--m-top", Math.round(tb.getBoundingClientRect().height) + "px");
      } else {
        document.documentElement.style.removeProperty("--m-top");
      }
    } catch (e) { /* keep desktop/default offset */ }
  };
  window.addEventListener("resize", syncDrawerTop);
  window.addEventListener("orientationchange", syncDrawerTop);
  syncDrawerTop();
  $("#hamburger").addEventListener("click", () => { syncDrawerTop(); document.body.classList.toggle("nav-open"); });
  $("#scrim").addEventListener("click", () => document.body.classList.remove("nav-open"));

  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) { goto(g.dataset.goto); return; }
    const a = e.target.closest("[data-action]");
    if (a) {
      if (a.dataset.action === "toast-bell") toast("<b>3 unread notifications</b> — new boundary survey ready for P-10.", "info");
      if (a.dataset.action === "toast-acc") { if (typeof openAccountPanel === "function") openAccountPanel(); else toast("Account panel arrives with the backend (Phase 2).", "info"); }
    }
  });

  $("#btn-new-record").addEventListener("click", () => toast("Record creation is part of the Phase 2 backend. Try the <b>ULPIN Generator</b> meanwhile.", "info", 5000));

  const skipBtn = $("#btn-skip-welcome");
  if (skipBtn) skipBtn.addEventListener("click", () => {
    const welcome = $("#welcome-screen");
    if (welcome) welcome.classList.add("hidden");
    toast("Skipped role selection — using <b>guest</b> access.", "info");
    goto("dashboard");
  });

  /* Login open/close/submit use inline fallbacks in index.html so they remain
     available even if an unrelated dashboard renderer fails during startup. */
  const loginOverlay = $("#login-overlay");
  if (loginOverlay) loginOverlay.addEventListener("click", (e) => { if (e.target === loginOverlay) closeLogin(); });
  const teamOverlay = $("#team-overlay");
  if (teamOverlay) teamOverlay.addEventListener("click", (e) => { if (e.target === teamOverlay) closeTeam(); });
  const teamBtn = $("#btn-open-team");
  if (teamBtn) teamBtn.addEventListener("click", (e) => { e.preventDefault(); openTeam(); });
  const forgot = $("#login-forgot");
  if (forgot) forgot.addEventListener("click", (e) => { e.preventDefault(); toast("Password reset is part of the Phase 2 backend. Use the pre-filled sign-in details for now.", "info", 4000); });

  $$("#map-layers .seg-btn").forEach((btn) => btn.addEventListener("click", () => {
    state.mapLayer = btn.dataset.layer;
    $$("#map-layers .seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
    if (typeof setMapSegLayer === "function") setMapSegLayer(btn.dataset.layer);
    toast(state.mapLayer === "underground" ? "Underground utility layer enabled" : "Parcel layer", "info", 1800);
  }));

  /* 2D Map / 3D Property View toggle (inside the Map Viewer) */
  $$("#map-mode .seg-btn").forEach((btn) => btn.addEventListener("click", () => setMapMode(btn.dataset.mode)));

  $("#search-input").addEventListener("input", (e) => {
    state.query = e.target.value;
    if (state.view === "parcels") renderParcelsTable();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); $("#search-input").focus(); }
    if (e.key === "/" && (!document.activeElement || document.activeElement.tagName !== "INPUT")) { e.preventDefault(); $("#search-input").focus(); }
    if (e.key === "Escape") {
      if (document.activeElement) document.activeElement.blur();
      document.body.classList.remove("nav-open");
      const login = $("#login-overlay");
      if (login && login.classList.contains("show")) { closeLogin(); return; }
      const welcome = $("#welcome-screen");
      if (welcome && !welcome.classList.contains("hidden")) { welcome.classList.add("hidden"); goto("dashboard"); }
    }
  });
}

/* ===================== CADASTRE ENGINE WIRING ===================== */

function wireDataSources() {
  const container = document.getElementById("sources-list");
  if (!container) return;
  container.addEventListener("click", (e) => {
    const card = e.target.closest(".src-card");
    if (!card) return;
    const name = card.querySelector("h4") ? card.querySelector("h4").textContent : "";
    const src = (typeof CADASTRE !== "undefined" ? CADASTRE.DATASOURCES : []).find((s) => s.name === name);
    if (src) runDataSourceLoad(src);
  });
}

function runDataSourceLoad(src) {
  if (typeof CADASTRE === "undefined") return;
  const data = CADASTRE.loadDataSource(src.id);
  toast("<b>" + src.name + "</b> loaded — " + data.result.quality + "% quality · " + data.result.records + " records", "ok", 4000);
}

function runAIAnalysisInPageV2() {
  const select = document.getElementById("ai-analysis-type");
  const resultsContainer = document.getElementById("ai-analysis-results");
  const subtitle = document.getElementById("ai-results-subtitle");
  if (!resultsContainer) return;
  const type = select ? select.value : "parcel";
  if (subtitle) { subtitle.textContent = "Running " + type + "..."; subtitle.style.color = "var(--accent)"; }
  resultsContainer.innerHTML = "<div style='text-align:center;padding:40px;color:var(--muted)'><div style='font-size:32px;margin-bottom:16px'>⏳</div><p>AI processing...</p></div>";
  setTimeout(() => {
    if (typeof CADASTRE === "undefined") { resultsContainer.innerHTML = "<p style='color:var(--rose)'>Cadastre engine not loaded.</p>"; return; }
    let data;
    switch (type) {
      case "extraction": data = CADASTRE.runBuildingExtraction(); break;
      case "floorseg": data = CADASTRE.runFloorSegmentation("B01"); break;
      case "vertical": data = CADASTRE.runVerticalDelineation("P-02", "B01", "F4", "U03"); break;
      case "topology": data = CADASTRE.runTopologyValidation(); break;
      case "ownership": data = CADASTRE.runOwnershipAnalysis(); break;
      case "planning": data = CADASTRE.runInfrastructurePlanning(); break;
      default: data = CADASTRE.runTopologyValidation();
    }
    renderProcessingResult(resultsContainer, data, type);
    if (subtitle) subtitle.textContent = type + " complete";
  }, 800);
}

function renderProcessingResult(container, data, type) {
  let stepsHtml = "<ol class='proc-steps'>";
  (data.steps || []).forEach((s) => { stepsHtml += "<li>✓ " + s + "</li>"; });
  stepsHtml += "</ol>";
  let resultHtml = "";
  const r = data.result;
  if (type === "extraction") {
    resultHtml = "<div class='ai-analysis-score high'>" + r.detected + "</div><p style='text-align:center;color:var(--muted)'>buildings detected · avg confidence " + r.avgConfidence + "%</p>";
    resultHtml += "<div class='bld-list'>" + r.buildings.map((b) => "<div class='bld-item'><b>" + b.name + "</b><span>Confidence: " + b.confidence + "% · " + b.height + "m · " + b.floors + " floors</span></div>").join("") + "</div>";
  } else if (type === "floorseg") {
    resultHtml = "<div class='ai-analysis-score high'>" + r.totalFloors + "</div><p style='text-align:center;color:var(--muted)'>floors segmented in " + r.name + " · avg confidence " + r.avgConfidence + "%</p>";
    resultHtml += "<div class='floor-list'>" + r.floors.map((f) => "<div class='floor-item'><b>" + f.name + "</b><span>EL +" + f.elevation + "m · " + f.height + "m · " + f.units + " units · " + f.confidence + "%</span></div>").join("") + "</div>";
  } else if (type === "vertical") {
    resultHtml = "<div class='ai-analysis-score high'>3D Volume</div>";
    resultHtml += "<div class='vol-panel'><div><b>Parcel:</b> " + r.parcel.survey + "</div><div><b>Building:</b> " + r.building.name + "</div><div><b>Floor:</b> " + r.floor.name + " (EL +" + r.lowerElevation + "m to +" + r.upperElevation + "m)</div><div><b>Unit:</b> " + (r.unit ? r.unit.no + " · " + r.unit.type + " · " + r.unit.owner : "N/A") + "</div><div><b>Volume:</b> " + r.volume + " m³</div><div><b>ULPIN:</b> <code>" + r.ulpin + "</code></div></div>";
  } else if (type === "topology") {
    resultHtml = "<div class='ai-analysis-score " + (r.score >= 90 ? "high" : "medium") + "'>" + r.score + "%</div><p style='text-align:center;color:var(--muted)'>topology health · " + r.totalIssues + " issues</p>";
    resultHtml += "<ul class='ai-issue-list'>" + r.issues.map((i) => "<li class='" + i.severity.toLowerCase() + "'><b>" + i.severity + "</b>: " + i.desc + " <button class='btn btn-ghost sm' style='margin-left:8px' onclick='goto(\"map\")'>Show on Map</button></li>").join("") + "</ul>";
  } else if (type === "ownership") {
    resultHtml = "<div class='ai-analysis-score " + (r.totalConflicts === 0 ? "high" : "medium") + "'>" + r.totalConflicts + "</div><p style='text-align:center;color:var(--muted)'>ownership conflicts detected</p>";
    resultHtml += "<ul class='ai-issue-list'>" + r.conflicts.map((c) => "<li class='" + c.severity.toLowerCase() + "'><b>" + c.severity + "</b>: " + c.parcel + " · " + c.floor + " · " + c.unit + "<br>Record A: " + c.recordA + " | Record B: " + c.recordB + "<br>Confidence: " + c.confidence + "% · Status: " + c.status + "</li>").join("") + "</ul>";
  } else if (type === "planning") {
    resultHtml = "<div class='ai-analysis-score medium'>" + r.totalConflicts + "</div><p style='text-align:center;color:var(--muted)'>infrastructure conflicts · " + r.proposed.type + "</p>";
    resultHtml += "<ul class='ai-issue-list'>" + r.conflicts.map((c) => "<li class='" + c.severity.toLowerCase() + "'><b>" + c.severity + "</b>: " + c.desc + "<br>Clearance: " + c.clearance + " · Risk: " + c.risk + "</li>").join("") + "</ul>";
  }
  container.innerHTML = "<div class='proc-result'><h4>Processing Steps</h4>" + stepsHtml + "<h4 style='margin-top:14px'>Result</h4>" + resultHtml + "</div>";
}

function renderUndergroundEnhanced() {
  const assetsList = document.getElementById("assets-list");
  if (!assetsList || typeof CADASTRE === "undefined") return;
  const utils = CADASTRE.getUtilitySummary();
  let html = "<div class='util-summary'><div class='util-kpi'><b>" + utils.total + "</b><span>Total Utilities</span></div><div class='util-kpi'><b>" + utils.active + "</b><span>Active</span></div><div class='util-kpi'><b>" + utils.totalServes + "</b><span>Properties Served</span></div></div>";
  html += "<h4>Utility Assets</h4><div class='util-list'>";
  (CADASTRE.DATASET.underground || []).forEach((a) => {
    html += "<div class='util-item " + (a.status === "Active" ? "active" : "planned") + "'><div class='util-icon'>" + utilIcon(a.type) + "</div><div class='util-body'><b>" + a.id + " — " + a.type + "</b><span>Depth: " + a.depth + "m · Authority: " + a.authority + " · Serves: " + a.serves + " properties</span><span class='util-status'>" + a.status + "</span></div></div>";
  });
  html += "</div>";
  assetsList.innerHTML = html;
}

function utilIcon(type) {
  const icons = { "Water Pipeline": "💧", "Sewer Line": "🚿", "Electric Cable": "⚡", "Gas Pipeline": "🔥", "Utility Tunnel": "🚇", "Underground Parking": "🅿️" };
  return icons[type] || "🔧";
}

function showVolumetricPanel(buildingId, floorId, unitId) {
  if (typeof CADASTRE === "undefined") return;
  const vol = CADASTRE.calcVolume("P-02", buildingId || "B01", floorId || "F4", unitId || "U03");
  let panel = document.getElementById("volumetric-panel");
  if (!panel) { panel = document.createElement("div"); panel.id = "volumetric-panel"; panel.className = "volumetric-panel"; const stage = document.querySelector(".stage3d"); if (stage) stage.appendChild(panel); }
  panel.innerHTML = "<h4>Volumetric Cadastre</h4><div class='vol-grid'><div><label>Parcel</label><b>" + vol.parcel.survey + "</b></div><div><label>Building</label><b>" + vol.building.name + "</b></div><div><label>Floor</label><b>" + vol.floor.name + "</b></div><div><label>Unit</label><b>" + (vol.unit ? vol.unit.no : "—") + "</b></div></div><h4>3D Boundaries</h4><div class='vol-grid'><div><label>X range</label><b>" + vol.xRange.min + " – " + vol.xRange.max + "</b></div><div><label>Y range</label><b>" + vol.yRange.min + " – " + vol.yRange.max + "</b></div><div><label>Z range</label><b>" + vol.zRange.min + "m – " + vol.zRange.max + "m</b></div><div><label>Floor Volume</label><b>" + vol.floorVolume + " m³</b></div><div><label>Unit Volume</label><b>" + vol.unitVolume + " m³</b></div><div><label>Total Building</label><b>" + vol.totalBuildingVolume + " m³</b></div></div>";
  panel.style.display = "block";
}

function enhanceChatbot() {
  const sendBtn = document.getElementById("ai-send-btn");
  const input = document.getElementById("ai-input");
  if (!sendBtn || !input) return;
  sendBtn.onclick = () => { const query = input.value.trim(); if (query) { input.value = ""; handleCadastreQuery(query); } };
}

async function handleCadastreQuery(query) {
  const messagesContainer = document.getElementById("ai-chat-messages");
  if (!messagesContainer) return;
  const userMsg = document.createElement("div");
  userMsg.className = "ai-message ai-user-message";
  userMsg.innerHTML = "<div class='ai-message-content'>" + query + "</div>";
  messagesContainer.appendChild(userMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  const q = query.toLowerCase().trim();
  let response = "";
  let needsAI = false;
  const C = (typeof CADASTRE !== "undefined") ? CADASTRE : null;
  if (!C) { response = "Cadastre engine is not loaded."; }
  else if (q.includes("analyze parcel") || q.includes("131/2")) {
    const s = C.getCadastralSummary();
    response = "<b>Cadastral Analysis: Parcel 131/2</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>Parcel: " + s.parcel.survey + " (" + s.parcel.owner + ")\nBuilding: " + s.building.name + " (" + s.totalFloors + " floors, " + s.totalUnits + " units)\nSelected: Floor F4, Unit U03 (Demo Owner)\nElevation: +12.2m to +15.2m\nULPIN: " + (s.ulpin || "N/A") + "\nTopology Score: " + s.topology.score + "%\nOwnership Conflicts: " + s.ownershipConflicts.length + "\nUnderground Assets: " + s.underground.length + "</pre>";
  } else if (q.includes("floors") && (q.includes("b01") || q.includes("building"))) {
    const seg = C.runFloorSegmentation("B01");
    response = "<b>Floor Segmentation: Shivapur Residency</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>" + seg.result.floors.map((f) => f.name + ": EL +" + f.elevation + "m · " + f.height + "m · " + f.units + " units · " + f.confidence + "%").join("\n") + "</pre>";
  } else if (q.includes("ulpin") && (q.includes("f4") || q.includes("u03"))) {
    const v = C.runVerticalDelineation("P-02", "B01", "F4", "U03");
    response = "<b>Vertical ULPIN</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>ULPIN: " + v.result.ulpin + "\nParcel: " + v.result.parcel.survey + "\nBuilding: " + v.result.building.name + "\nFloor: " + v.result.floor.name + " (EL +" + v.result.lowerElevation + "m to +" + v.result.upperElevation + "m)\nUnit: " + (v.result.unit ? v.result.unit.no + " · " + v.result.unit.owner : "N/A") + "\nVolume: " + v.result.volume + " m³</pre>";
  } else if (q.includes("underground") || q.includes("utility") || q.includes("utilities")) {
    const u = C.getUtilitySummary();
    response = "<b>Underground Utilities</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>Total: " + u.total + " assets (" + u.active + " active)\nProperties served: " + u.totalServes + "\n" + u.types.map((t) => t + ": " + u.byType[t].length).join("\n") + "</pre>";
  } else if (q.includes("topology") || q.includes("conflict")) {
    const t = C.runTopologyValidation();
    response = "<b>Topology Validation</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>Health Score: " + t.result.score + "%\nIssues: " + t.result.totalIssues + " (HIGH: " + t.result.high + ", MED: " + t.result.medium + ", LOW: " + t.result.low + ")\n" + t.result.issues.map((i) => i.severity + ": " + i.desc).join("\n") + "</pre>";
  } else if (q.includes("vertical volume") || q.includes("3d volume")) {
    const v = C.calcVolume("P-02", "B01", "F4", "U03");
    response = "<b>3D Volume</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>X: " + v.xRange.min + " – " + v.xRange.max + "\nY: " + v.yRange.min + " – " + v.yRange.max + "\nZ: " + v.zRange.min + "m – " + v.zRange.max + "m\nFloor Volume: " + v.floorVolume + " m³\nUnit Volume: " + v.unitVolume + " m³\nTotal Building: " + v.totalBuildingVolume + " m³</pre>";
  } else if (q.includes("ownership") && q.includes("conflict")) {
    const o = C.runOwnershipAnalysis();
    response = "<b>Ownership Conflicts</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>" + o.result.conflicts.map((c) => c.parcel + " · " + c.floor + " · " + c.unit + "\n" + c.recordA + " vs " + c.recordB + " (" + c.confidence + "%)").join("\n\n") + "</pre>";
  } else if (q.includes("summary") || q.includes("complete") || q.includes("report")) {
    const s = C.getCadastralSummary();
    response = "<b>Complete Cadastral Summary</b><pre style='white-space:pre-wrap;margin-top:6px;font-size:12px'>Parcel: " + s.parcel.survey + " (" + s.parcel.owner + ", " + s.parcel.area + " sq m)\nBuilding: " + s.building.name + " (" + s.building.year + ", " + s.totalFloors + "F, " + s.totalUnits + " units)\nSelected: F4 / U03 (Demo Owner, 2 BHK, 850 sq.ft.)\nElevation: +12.2m to +15.2m\n3D Volume: " + C.calcVolume("P-02", "B01", "F4", "U03").unitVolume + " m³\nULPIN: " + (s.ulpin || "N/A") + "\nTopology: " + s.topology.score + "% · Conflicts: " + s.ownershipConflicts.length + "\nUnderground: " + s.underground.length + " assets</pre>";
  } else {
    /* No cadastral branch matched. Try the rule-based general-knowledge
       fallback first (defined in js/aiAssistant.js). If that also fails,
       escalate to the live Gemini AI via the Supabase Edge Function. */
    const gk = (typeof answerGeneralQuestion === "function") ? answerGeneralQuestion(q) : null;
    if (gk) {
      response = gk;
    } else {
      response = null;
      needsAI = true;
    }
  }

  if (!needsAI) {
    const finalResponse = response;
    setTimeout(() => {
      const aiMsg = document.createElement("div");
      aiMsg.className = "ai-message";
      aiMsg.innerHTML = "<div class='ai-message-content'>" + finalResponse + "</div>";
      messagesContainer.appendChild(aiMsg);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 400);
    return;
  }

  /* Live AI path: show a thinking indicator, then call Gemini. */
  const aiMsg = document.createElement("div");
  aiMsg.className = "ai-message";
  aiMsg.innerHTML = "<div class='ai-message-content'>🤖 Consulting Gemini…</div>";
  messagesContainer.appendChild(aiMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  const helpText = "I can analyze your cadastral data. Try:\n• 'Analyze parcel 131/2'\n• 'How many floors does B01 have?'\n• 'What is the ULPIN of F4-U03?'\n• 'Show underground utilities'\n• 'Are there topology conflicts?'\n• 'What is the vertical volume?'\n• 'Find ownership conflicts'\n• 'Generate a cadastral summary'\nOr ask a natural-language question — I am connected to Google Gemini.";

  try {
    if (typeof callGeminiAI !== "function") throw new Error("AI bridge not loaded");
    const answer = await callGeminiAI(query);
    aiMsg.innerHTML = "<div class='ai-message-content'>" + answer + "</div>";
  } catch (e) {
    console.warn("[ULPIN AI] Gemini fallback:", e && e.message);
    aiMsg.innerHTML = "<div class='ai-message-content'>" + helpText + "</div>";
  }
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function init() {
  mountIcons(document);
  renderWelcomeRoles();
  applyRoleNav();
  applyRoleActions();
  renderAdminViews();
  renderRoleLanding(ROLE_DATA[0]);
  renderDashboard();
  renderBuildings();
  wireAll();
  wireParcelFilters();
  wireUnits();
  wire3D();
  renderUlpinForm();
  wireUlpinScanner();
  wireReports();
  render3D();
  renderMap(PARCELS[0]);
  renderUnderground();
  renderAir();
  renderAI();
  renderSources();
  if (typeof initAIAssistantUI === "function") initAIAssistantUI();
  // Cadastre engine wiring
  if (typeof CADASTRE !== "undefined") {
    wireDataSources();
    renderUndergroundEnhanced();
    enhanceChatbot();
    showVolumetricPanel("B01", "F4", "U03");
  }
}

document.addEventListener("DOMContentLoaded", init);

/* Start the pending-role intent check shortly after load — gives the existing
   Google session-restore in js/googleAuth.js (getSession / SIGNED_IN) time to
   complete after an OAuth redirect return. */
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () { waitForPendingRoleCheck(0); }, 300);
});
