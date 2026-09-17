"use strict";

/* =====================================================================
   ULPIN 3D — Google sign-in via Supabase Auth (ADDITIVE module)
   - Uses ONLY the Supabase project URL + public anon key in the frontend.
     The Google OAuth Client Secret lives ONLY in the Supabase dashboard —
     it must never be placed in HTML/CSS/JS or any frontend file.
   - SAFETY: the public.profiles row of the AUTHENTICATED user (read by
     auth.users.id with the user's own session) is AUTHORITATIVE for the
     frontend role (Phase 3B): admin -> admin, revenue_officer -> revenue,
     surveyor -> gis, citizen -> planning. The addresses in
     ADMIN_EMAIL / SURVEYOR_EMAIL / REVENUE_OFFICER_EMAIL (below) are used
     ONLY as the safe bootstrap before that lookup resolves and as the
     fallback when no profile row is available — staff roles are granted
     SERVER-SIDE by the database provisioning trigger, never from here, so a
     random Google user can never receive a restricted role through this
     flow. The four role keys (admin / revenue / gis / planning) are
     unchanged.
   - The existing email/password login, role system, permissions, logout UI
     and dashboard are untouched.
   ===================================================================== */

/* ---------- CONFIG — paste your Supabase values here ---------- */
const SUPABASE_URL = "https://ymkxbkbwioyanievflpu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ujV_J2ebtVQc9KFQLVO_tw_aZsAJDjs";
/* ---------------------------------------------------------------- */

let sbClient = null;            /* Supabase browser client */
/* Expose the shared browser client so the AI assistant can call Supabase Edge Functions
   (e.g. the Gemini chat proxy) without re-initialising. Returns null if unconfigured. */
window.getSupabaseAIClient = function () { return sbClient; };


let sbGoogleActive = false;     /* true while a Google/Supabase session is in use */
let sbUser = null;              /* current Supabase Auth user (account panel) */

/* Google users get the safest existing role (Citizen = view-oriented) by
   default. EXCEPTION: the authorized addresses in ADMIN_EMAIL /
   SURVEYOR_EMAIL / REVENUE_OFFICER_EMAIL below are mapped to their
   existing restricted role. Nobody else can receive a restricted role. */
const GOOGLE_ROLE_KEY = "planning";
const ADMIN_ROLE_KEY = "admin";
const SURVEYOR_ROLE_KEY = "gis";
const REVENUE_OFFICER_ROLE_KEY = "revenue";

/* ---------- ROLE AUTHORIZATION — replace the placeholders with your own
   Google account emails. ONLY each address receives its restricted
   application role after Supabase Google authentication. These are plain
   email strings — NEVER put a Google Client Secret or Supabase
   service_role/secret key here. */
const ADMIN_EMAIL = "kaifali68791@gmail.com";
const SURVEYOR_EMAIL = "k8875349@gmail.com";
const REVENUE_OFFICER_EMAIL = "ffpr121@gmail.com";
/* ---------------------------------------------------------------------- */

/* ===================== PHASE 3B — DATABASE-AUTHORITATIVE ROLE =====================
   The public.profiles role is authoritative for the frontend role once the
   profile row of the CURRENT authenticated Supabase user has been read (see
   syncProfileFromSession below). The exact database role vocabulary is mapped
   onto the four EXISTING frontend role keys — no key is renamed or added. */
const DB_ROLE_TO_FRONTEND_KEY = {
  admin: ADMIN_ROLE_KEY,                     /* admin            -> admin    */
  revenue_officer: REVENUE_OFFICER_ROLE_KEY, /* revenue_officer  -> revenue  */
  surveyor: SURVEYOR_ROLE_KEY,               /* surveyor         -> gis      */
  citizen: GOOGLE_ROLE_KEY                  /* citizen          -> planning */
};

/* Authoritative profile state of the CURRENT authenticated session. Filled
   ONLY from the public.profiles row that the Supabase session reads by its own
   auth.users id — never from UI input, a form field or a role card. Cleared on
   sign-out, so no authority can ever leak into another session. */
let profileAuthority = { uid: "", roleKey: null, status: null };

/* ===================== PHASE 7 — SUSPENDED ACCOUNT ACCESS LOCK =====================
   Application-level access gating only. The database / RLS / RPC / Edge Function
   protections remain the real security boundary: this lock only decides whether
   the dashboard becomes usable with the still-valid Supabase Auth session.
   Source of truth is profileAuthority.status (snapshot of public.profiles.status
   from the existing syncProfileFromSession SELECT). Realtime events below are
   ONLY a trigger to re-read that authoritative row. */
let ownProfileChannel = null;      /* dedicated own-row Realtime channel (Phase 7) */
let ownProfileChannelUid = "";     /* UID the current own-row channel watches */
let ownProfileRecheckBusy = null; /* shared promise for manual/realtime checks */
let ownProfileRecheckQueued = false;
let googleSessionEpoch = 0;
let googleSessionWork = null;
let googleProfilePending = false;
let suspendedInertNodes = [];
let suspendedPreviousFocus = null;
let suspendedLockVisible = false;  /* true while #suspended-lock is shown */
function isSuspendedLocked() {
  return suspendedLockVisible === true ||
    (profileAuthority && profileAuthority.status === "suspended" && !!sbUser);
}
function showSuspendedLock(email) {
  const lock = document.getElementById("suspended-lock");
  const first = !suspendedLockVisible;
  suspendedLockVisible = true;
  stopProfileHeartbeat();
  window.currentRole = null;
  showWelcome(); /* clears the actual app role: state.role */
  closeLogin();
  closeAccountPanel();
  if (!lock) return;
  if (first) {
    suspendedPreviousFocus = document.activeElement;
    suspendedInertNodes = Array.from(document.body.children)
      .filter(function (el) { return el !== lock && !el.contains(lock) && !el.inert; });
    suspendedInertNodes.forEach(function (el) { el.inert = true; });
  }
  lock.hidden = false;
  lock.classList.add("open");
  lock.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-suspended");
  document.getElementById("suspended-email").textContent = email || (sbUser && sbUser.email) || "—";
  renderAccountPanel();
  if (first) document.getElementById("btn-suspended-recheck").focus();
}
function hideSuspendedLock() {
  suspendedLockVisible = false;
  const lock = document.getElementById("suspended-lock");
  if (lock) {
    lock.hidden = true;
    lock.classList.remove("open");
    lock.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("account-suspended");
  suspendedInertNodes.forEach(function (el) { el.inert = false; });
  suspendedInertNodes = [];
  if (suspendedPreviousFocus && suspendedPreviousFocus.isConnected) suspendedPreviousFocus.focus();
  suspendedPreviousFocus = null;
}
/* Read-only own-row watcher: UPDATE on public.profiles for the current UID only.
   Never writes; the event only triggers an authoritative re-sync. Singleton. */
function stopOwnProfileWatcher() {
  const ch = ownProfileChannel;
  ownProfileChannel = null;
  ownProfileChannelUid = "";
  ownProfileRecheckBusy = null;
  ownProfileRecheckQueued = false;
  if (ch && sbClient) {
    Promise.resolve(sbClient.removeChannel(ch)).catch(function () {});
  }
}
function startOwnProfileWatcher(uid) {
  if (!sbClient || !sbGoogleActive || !uid) return;
  if (ownProfileChannel && ownProfileChannelUid === String(uid)) return;
  stopOwnProfileWatcher();
  try {
    const ch = sbClient.channel("own-profile-status-" + String(uid));
    /* Reserve BEFORE subscribe completes; pending subscriptions are singletons too. */
    ownProfileChannel = ch;
    ownProfileChannelUid = String(uid);
    ch.on("postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles", filter: "id=eq." + String(uid) },
      function () {
        if (ownProfileChannel !== ch || !sbUser || String(sbUser.id) !== String(uid)) return;
        recheckSuspendedStatus("realtime"); /* payload is never authorization */
      });
    ch.subscribe(function (status) {
      if (ownProfileChannel !== ch) return;
      if (status === "SUBSCRIBED") recheckSuspendedStatus("realtime"); /* close subscribe gap */
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        console.warn("[GoogleAuth] Own-profile live updates unavailable; use Check again to verify account access.");
      }
    });
  } catch (e) {
    stopOwnProfileWatcher();
    console.warn("[GoogleAuth] Own-profile watcher unavailable; Check again remains available.");
  }
}
/* Serialized, read-only rechecks. A burst gets at most one trailing read, so an
   event arriving during a read is not lost. No immediate presence/identity writes. */
function recheckSuspendedStatus(source) {
  if (ownProfileRecheckBusy) {
    if (source === "realtime") ownProfileRecheckQueued = true;
    return ownProfileRecheckBusy;
  }
  const epoch = googleSessionEpoch;
  const work = (async function () {
    do {
      ownProfileRecheckQueued = false;
      if (!sbClient) return;
      const res = await sbClient.auth.getSession();
      if (epoch !== googleSessionEpoch) return;
      if (res.error) throw res.error;
      const session = res.data && res.data.session;
      if (!session) { handleGoogleSignOut(); return; }
      if (googleSessionWork) await googleSessionWork;
      if (epoch !== googleSessionEpoch) return;
      await handleGoogleSignIn(session, false, true);
    } while (ownProfileRecheckQueued && epoch === googleSessionEpoch);
  })().catch(function () {
    const note = document.getElementById("suspended-note");
    if (note) note.textContent = "Could not verify account access. Please check your connection and try again.";
  }).finally(function () {
    if (ownProfileRecheckBusy === work) ownProfileRecheckBusy = null;
  });
  ownProfileRecheckBusy = work;
  return work;
}

/* Frontend role key derived from the DATABASE for the given (session) email, or
   null when no authoritative profile role is known for this session yet.
   Guarded on purpose: a stale authority from a previous account is ignored. */
function authoritativeProfileRoleKey(email) {
  try {
    if (!profileAuthority || !profileAuthority.roleKey) return null;
    if (!sbGoogleActive || !sbUser || !sbUser.id) return null;
    if (String(sbUser.id) !== String(profileAuthority.uid)) return null;
    if (String(email || "").trim().toLowerCase() !== String(sbUser.email || "").trim().toLowerCase()) return null;
    return DB_ROLE_TO_FRONTEND_KEY[profileAuthority.roleKey] || null;
  } catch (e) { return null; }
}

/* True only when the database profile of the current session reports
   status = 'suspended'. The value is only READ — Phase 3B never changes it,
   never lifts it and never re-activates an account. */
function profileStatusSuspended() {
  try {
    return !!(sbGoogleActive && sbUser && sbUser.id && profileAuthority &&
      profileAuthority.status === "suspended" &&
      String(profileAuthority.uid) === String(sbUser.id));
  } catch (e) { return false; }
}

/* Honest account-status label for the EXISTING status slots (no new UI):
   reflects the database value when it is known, otherwise the previous
   wording. */
function sessionStatusLabel() {
  if (profileStatusSuspended()) return "Suspended (database)";
  try {
    if (sbGoogleActive && sbUser && sbUser.id && profileAuthority &&
        profileAuthority.status === "active" &&
        String(profileAuthority.uid) === String(sbUser.id)) return "Active";
  } catch (e) { /* fall through to the previous wording */ }
  return "Active";
}

/* True only when `email` is the configured admin address. The placeholder
   value never matches anyone (safe fallback: no Admin is granted). */
function isAdminGoogleEmail(email) {
  if (!email) return false;
  if (ADMIN_EMAIL.indexOf("YOUR_ADMIN_GOOGLE_EMAIL") !== -1) return false;
  return String(email).trim().toLowerCase() === String(ADMIN_EMAIL).trim().toLowerCase();
}

/* True only when `email` is the configured surveyor address. The placeholder
   value never matches anyone (safe fallback: no Surveyor is granted). */
function isSurveyorGoogleEmail(email) {
  if (!email) return false;
  if (SURVEYOR_EMAIL.indexOf("YOUR_SURVEYOR_GOOGLE_EMAIL") !== -1) return false;
  return String(email).trim().toLowerCase() === String(SURVEYOR_EMAIL).trim().toLowerCase();
}

/* True only when `email` is the configured revenue-officer address. The
   placeholder value never matches anyone (safe fallback: no Revenue Officer
   is granted). */
function isRevenueOfficerGoogleEmail(email) {
  if (!email) return false;
  if (REVENUE_OFFICER_EMAIL.indexOf("YOUR_REVENUE_OFFICER_GOOGLE_EMAIL") !== -1) return false;
  return String(email).trim().toLowerCase() === String(REVENUE_OFFICER_EMAIL).trim().toLowerCase();
}

/* Application role key for a Google-authenticated email.
   PHASE 3B: once the authenticated user's own public.profiles row has been read,
   its role is AUTHORITATIVE and is returned first. The email mapping below stays
   as the safe bootstrap (used before the lookup resolves) and as the fallback
   when no profile row exists or the lookup failed, so the existing four-role
   login flow keeps working unchanged.
   Bootstrap/fallback priority: Admin → Surveyor → Revenue Officer → safe default. */
function googleRoleForEmail(email) {
  const dbRoleKey = authoritativeProfileRoleKey(email);
  if (dbRoleKey) return dbRoleKey;
  if (isAdminGoogleEmail(email)) return ADMIN_ROLE_KEY;
  if (isSurveyorGoogleEmail(email)) return SURVEYOR_ROLE_KEY;
  if (isRevenueOfficerGoogleEmail(email)) return REVENUE_OFFICER_ROLE_KEY;
  return GOOGLE_ROLE_KEY;
}

/* Human-readable authorization note for the account UI: which configured
   email list granted the role, or the honest default-role note. */
function roleAuthNote(email) {
  /* PHASE 3B: when the database profile role is authoritative, say so. The
     note never claims more than the read actually established. */
  if (authoritativeProfileRoleKey(email)) {
    return profileStatusSuspended()
      ? "Database profile role (public.profiles) is authoritative — this account is also marked suspended in the database and is left unchanged in this phase."
      : "Database profile role (public.profiles) is authoritative for this account.";
  }
  if (isAdminGoogleEmail(email)) return "Authorized administrator (ADMIN_EMAIL).";
  if (isSurveyorGoogleEmail(email)) return "Authorized surveyor (SURVEYOR_EMAIL).";
  if (isRevenueOfficerGoogleEmail(email)) return "Authorized revenue officer (REVENUE_OFFICER_EMAIL).";
  return ROLE_AUTH_NOTE_DEFAULT;
}
/* PHASE 3B: honest wording for the window BEFORE this session's profile row has
   been read (or when there is no Google session at all) — it must not claim
   anything about the database role, and it no longer says that per-user roles
   are "not connected", because they are authoritative once read. */
const ROLE_AUTH_NOTE_DEFAULT = "Safe default role — the public.profiles role becomes authoritative once this session's profile row is read.";

/* Small helper: real Supabase Auth email of a user object (or ""). */
function pEmail(user) {
  return (user && user.email) || "";
}

function googleAuthConfigured() {
  return SUPABASE_URL.indexOf("https://") === 0 &&
         SUPABASE_URL.indexOf("YOUR-PROJECT-REF") === -1 &&
         SUPABASE_ANON_KEY.length > 20 &&
         SUPABASE_ANON_KEY.indexOf("YOUR-PUBLIC-ANON-KEY") === -1;
}

function initGoogleAuth() {
  const btn = $("#btn-google-signin");
  if (!btn) return;

  /* FIX: the click handler is ALWAYS attached. Previously the button was left
     disabled (clicks silently swallowed) whenever config/SDK checks failed —
     clicking did nothing. Now clicking ALWAYS gives honest feedback, and runs
     the REAL Supabase Google OAuth flow when properly configured. */
  btn.addEventListener("click", startGoogleSignIn);

  /* Requirement: clearly accessible Logout in the existing account/profile
     area (sidebar user widget, #btn-signout). Bound FIRST so it works even
     when the Supabase SDK failed to load — in that case it falls back to the
     existing demo logout behaviour instead of doing nothing. */
  const signoutBtn = $("#btn-signout");
  if (signoutBtn) signoutBtn.addEventListener("click", doSignOut);

  /* Account panel (additive): toggle from the topbar avatar, close on
     outside-click / Escape, and sign out from inside the panel. */
  const accBtn = $("#btn-account");
  const accPanel = $("#account-panel");
  if (accBtn && accPanel) {
    accBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleAccountPanel(); });
    document.addEventListener("click", (e) => {
      if (!accPanel.classList.contains("open")) return;
      /* ignore clicks on the panel itself, the avatar button, and the sidebar
         account button (which opens the panel — see app.js toast-acc). */
      if (accPanel.contains(e.target) || accBtn.contains(e.target)) return;
      if (e.target.closest('[data-action="toast-acc"]')) return;
      closeAccountPanel();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { closeAccountPanel(); closeProfileModal(); closeSettingsModal(); }
    });
  }
  const accSignout = $("#account-signout");
  if (accSignout) accSignout.addEventListener("click", () => { closeAccountPanel(); doSignOut(); });

  /* "Login with another account": real signOut → forced Google account chooser. */
  const accSwitch = $("#account-switch");
  if (accSwitch) accSwitch.addEventListener("click", () => { closeAccountPanel(); switchGoogleAccount(); });

  /* "Sign up" on the login screen: Google OAuth creates/authenticates the
     Supabase Auth user automatically (existing users just sign in). Same REAL
     flow — no fake registration form is added. */
  const signupLink = $("#btn-google-signup");
  if (signupLink) signupLink.addEventListener("click", (e) => { e.preventDefault(); startGoogleSignIn(); });

  /* My Profile / Account Settings actions inside the account panel. */
  const profBtn = $("#btn-my-profile"), setBtn = $("#btn-account-settings");
  if (profBtn) profBtn.addEventListener("click", () => { closeAccountPanel(); openProfileModal(); });
  if (setBtn) setBtn.addEventListener("click", () => { closeAccountPanel(); openSettingsModal(); });

  if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
    /* SDK could not load (e.g. offline). Existing login keeps working. */
    console.error("[GoogleAuth] supabase-js UMD script did not load — check the supabase.js <script> tag in index.html and your internet connection.");
    btn.title = "Supabase Auth library could not be loaded — the existing email sign-in still works.";
    return;
  }
  if (googleAuthKeyLooksSecret()) {
    /* SECURITY guardrail: a secret/service_role key must never be used here. */
    console.error("[GoogleAuth] The key in js/googleAuth.js looks like a SECRET (service_role) key. Replace it with the PUBLIC anon key. Never commit the secret.");
    btn.title = "Blocked: the key in js/googleAuth.js looks like a secret key — use the public anon key only.";
    return;
  }
  if (!googleAuthConfigured()) {
    /* Not configured yet — the button stays clickable and explains itself. */
    console.warn("[GoogleAuth] SUPABASE_URL / SUPABASE_ANON_KEY in js/googleAuth.js (lines 17-18) still contain placeholders — Google OAuth cannot start until you paste your real values.");
    btn.title = "Google sign-in is not configured yet — paste your Supabase URL and public anon key at the top of js/googleAuth.js (lines 17-18), then click again.";
    return;
  }

  try {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  } catch (e) {
    console.error("[GoogleAuth] Failed to create the Supabase client:", e);
    btn.title = "Supabase client failed to initialize — check the URL/key in js/googleAuth.js.";
    return;
  }

  /* Requirement: listen for auth state changes (login/logout updates). */
  sbClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) handleGoogleSignIn(session, true);
    if (event === "SIGNED_OUT") handleGoogleSignOut();
  });

  /* PHASE 3B: refresh last_seen_at when the tab becomes visible again.
     Registered exactly once (initGoogleAuth runs a single time on
     DOMContentLoaded), so no duplicate listeners can accumulate;
     touchProfileLastSeen is itself throttled and no-ops without a session. */
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") touchProfileLastSeen("visibility");
  });

  /* Requirement: session persistence — restore the Google session on refresh.
     detectSessionInUrl also completes the OAuth redirect on the way back. */
  sbClient.auth.getSession().then(({ data }) => {
    if (data && data.session) handleGoogleSignIn(data.session); /* restore only — no welcome toast */
  }).catch((err) => {
    /* Failed session retrieval — honest message; the welcome screen stays. */
    console.error("[GoogleAuth] getSession failed:", err);
    toast("Could not restore your sign-in session — you may appear signed out. Try reloading the page.", "err", 6000);
  });

  /* Honest diagnostics: if Google/Supabase returned an OAuth error in the URL
     (e.g. redirect URL not registered), surface it instead of staying silent. */
  const urlErr = readOauthErrorFromUrl();
  if (urlErr) {
    console.warn("[GoogleAuth] OAuth provider returned an error:", urlErr);
    /* Honest error handling: cancelled vs failed — never pretend login worked. */
    const cancelled = String(urlErr).indexOf("access_denied") !== -1;
    toast(cancelled
      ? "Google sign-in was cancelled — no account was signed in."
      : "Google sign-in failed: " + esc(urlErr) + ". Check the Redirect URLs in Supabase Auth settings.", "err", 8000);
  }

  /* Requirement: Google logout through the EXISTING logout UI ("Change role"). */
  const changeRoleBtn = $("#btn-change-role");
  if (changeRoleBtn) changeRoleBtn.addEventListener("click", () => {
    if (sbClient && sbGoogleActive) sbClient.auth.signOut();
  });
}

/* True if the value pasted looks like a SECRET key (never allowed in frontend). */
function googleAuthKeyLooksSecret() {
  return SUPABASE_ANON_KEY.indexOf("service_role") !== -1 ||
         SUPABASE_ANON_KEY.indexOf("sb_secret_") === 0;
}

/* Supabase OAuth errors arrive back in the URL (query or hash) after redirect. */
function readOauthErrorFromUrl() {
  try {
    const q = new URLSearchParams(window.location.search);
    let desc = q.get("error_description") || q.get("error");
    if (!desc && window.location.hash.indexOf("error") !== -1) {
      const h = new URLSearchParams(window.location.hash.substring(1));
      desc = h.get("error_description") || h.get("error");
    }
    return desc;
  } catch (e) { return null; }
}

/* THE REAL FLOW: click → Supabase builds the Google OAuth URL → the browser
   navigates to accounts.google.com → user picks a real Google account →
   Google authenticates via the Supabase provider → redirect back to this
   site → detectSessionInUrl/getSession restore the session. No fake steps. */
function startGoogleSignIn(opts) {
  const selectAccount = !!(opts && opts.selectAccount);
  /* Honest guards — each one explains itself; none fakes a login. */
  if (typeof window.supabase === "undefined" || !window.supabase.createClient) {
    toast("Google sign-in unavailable: the Supabase Auth library did not load. Check your connection and reload the page.", "err", 6000);
    console.error("[GoogleAuth] window.supabase is missing — check the supabase-js <script> tag in index.html.");
    return;
  }
  if (googleAuthKeyLooksSecret()) {
    toast("Google sign-in blocked: the key in js/googleAuth.js looks like a SECRET key. Use the PUBLIC anon key only.", "err", 7000);
    return;
  }
  if (!googleAuthConfigured()) {
    toast("Google sign-in is not configured yet — paste your Supabase Project URL and public anon key at the top of js/googleAuth.js (lines 17-18), then reload.", "err", 8000);
    console.warn("[GoogleAuth] Placeholders still present in js/googleAuth.js lines 17-18.");
    return;
  }
  if (!sbClient) {
    try {
      sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      sbClient.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) handleGoogleSignIn(session, true);
        if (event === "SIGNED_OUT") handleGoogleSignOut();
      });
    } catch (e) {
      toast("Google sign-in failed to initialize: " + esc((e && e.message) || "unknown error"), "err", 6000);
      return;
    }
  }

  /* OAuth return URL (Task 2): ALWAYS the page that started the login.
     - Local dev (http://localhost:*) keeps working: redirect = that localhost page.
     - Production/GitHub Pages: redirect = the deployed page origin + path
       (e.g. https://kaifali68791-creator.github.io/ULPIN-3D/).
     Nothing is hardcoded, so localhost can never leak into production and the
     deployed site can never leak into local dev. This URL must ALSO be listed
     in Supabase Auth Redirect URLs (see note at the bottom of this file). */
  var oauthReturnUrl = window.location.origin + window.location.pathname;
  /* selectAccount → prompt=select_account: Google ALWAYS shows its account
     chooser, so the user can pick a different account. The default sign-in
     keeps the previous (working) behaviour. */
  sbClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: oauthReturnUrl,
      queryParams: selectAccount ? { prompt: "select_account" } : undefined
    }
  }).then(({ error }) => {
    if (error) {
      toast("Google sign-in could not start: " + esc(error.message), "err", 6000);
      console.error("[GoogleAuth] signInWithOAuth error:", error);
    }
    /* On success the browser navigates away to Google — nothing more to do. */
  }).catch((err) => {
    toast("Google sign-in could not start: " + esc((err && err.message) || "unknown error"), "err", 6000);
    console.error("[GoogleAuth] signInWithOAuth exception:", err);
  });
}

function handleGoogleSignIn(session, viaNewSignIn, readOnly) {
  if (!session || !session.user || !session.user.id) return Promise.resolve();
  const changed = !sbUser || String(sbUser.id) !== String(session.user.id);
  if (changed) {
    googleSessionEpoch++;
    googleSessionWork = null;
    stopOwnProfileWatcher();
    stopProfileHeartbeat();
    profileAuthority = { uid: String(session.user.id), roleKey: null, status: null };
    hideSuspendedLock();
    profileSyncState = { uid: "", at: 0 };
  }
  sbGoogleActive = true;
  sbUser = session.user;
  if (googleSessionWork) return googleSessionWork;
  const epoch = googleSessionEpoch;
  googleProfilePending = true;
  const work = (async function () {
    await syncProfileFromSession(session, !!readOnly);
    if (epoch !== googleSessionEpoch || !sbGoogleActive) return;
    googleProfilePending = false;
    startOwnProfileWatcher(sbUser.id);
    if (profileAuthority.status === "suspended") {
      showSuspendedLock(sbUser.email);
      return; /* Auth session remains valid; no app role or heartbeat is granted. */
    }
    const wasLocked = suspendedLockVisible;
    hideSuspendedLock();
    /* Preserve the current view on routine UPDATE events (including heartbeat).
       On restore, resolve the role afresh from the just-read database profile. */
    if (readOnly && !wasLocked && state.role) {
      applyAuthoritativeProfileRole(sbUser.id);
      renderAccountPanel();
      return;
    }
    const roleKey = googleRoleForEmail(sbUser.email);
    const role = ROLE_DATA.find((r) => r.key === roleKey) ||
      ROLE_DATA.find((r) => r.key === GOOGLE_ROLE_KEY) || ROLE_DATA[0];
    if (viaNewSignIn) {
      const m = sbUser.user_metadata || {};
      const name = m.full_name || m.name || String(sbUser.email || "").split("@")[0];
      toast("Welcome to <b>ULPIN 3D</b>" + (name ? ", " + esc(name) : "") + " — your Google account is signed in.", "ok", 5200);
    }
    const loginOv = $("#login-overlay");
    if (loginOv && loginOv.classList.contains("show")) closeLogin();
    enterRole(role, "Google account");
    applyGoogleUserProfile(sbUser);
    renderAccountPanel();
    startProfileHeartbeat();
  })().finally(function () {
    if (epoch === googleSessionEpoch) {
      googleProfilePending = false;
      if (googleSessionWork === work) googleSessionWork = null;
    }
  });
  googleSessionWork = work;
  return work;
}

function handleGoogleSignOut() {
  const wasGoogle = sbGoogleActive;
  const wasLocked = suspendedLockVisible;
  googleSessionEpoch++;
  googleSessionWork = null;
  googleProfilePending = false;
  stopOwnProfileWatcher();
  sbGoogleActive = false;
  sbUser = null;
  /* PHASE 3B: stop the heartbeat and drop the authoritative database role /
     status of the session that just ended. */
  stopProfileHeartbeat();
  profileAuthority = { uid: "", roleKey: null, status: null };
  hideSuspendedLock();
  restoreDefaultUserWidget();
  renderAccountPanel(); /* private info disappears immediately */
  /* PHASE 3A: clear the de-duplication marker so the next sign-in syncs again. */
  profileSyncState = { uid: "", at: 0 };
  if (wasGoogle && (state.role || wasLocked)) showWelcome(); /* includes lock-screen logout */
}

/* ===================== PHASE 3A — PROFILE SYNC (additive) =====================
   Connects the EXISTING authenticated Supabase session to its matching
   public.profiles row (created by the Phase 1 migration and its auth.users
   trigger). Nothing else changes: the login UI, the OAuth configuration, the
   frontend role mapping and the account panel behave exactly as before.

   Guarantees:
   - Only the shared browser client (sbClient) is used, i.e. the REAL
     authenticated Supabase session — supabase-js attaches that session's access
     token to every request automatically. No token, refresh token, API key or
     secret is ever read, printed or stored here.
   - Desired values come ONLY from the Supabase Auth user and its Google
     metadata. role, status, id and created_at are NEVER sent from here:
     profile.role is only READ (authoritative since Phase 3B) and profile.status
     is never changed automatically, so a suspended account stays suspended and
     is never re-activated.
   - A profile row is NEVER created from the browser; a missing row is only
     reported (new users are provisioned by the database trigger, which is the
     ONE place a staff role is granted).
   - last_seen_at is written on successful authentication / session
     initialization here and by the Phase 3B heartbeat below — nothing else.
   - Every failure is logged clearly without secrets and can never break
     Google sign-in. */

const PROFILE_TABLE = "profiles";
const PROFILE_READ_COLUMNS = "id,email,full_name,avatar_url,role,status,last_seen_at";
/* SIGNED_IN and the getSession() restore can both run in one page load; a second
   call for the same account inside this window is skipped, so initialization
   never double-writes. */
const PROFILE_SYNC_DEDUPE_MS = 15000;
let profileSyncState = { uid: "", at: 0 };

/* Short, non-sensitive reference for log messages (never a token or key). */
function profileLogRef(uid) {
  return uid ? String(uid).slice(0, 8) + "…" : "(no user id)";
}

/* Google/Auth values → the profile identity values we would like to store.
   Read strictly from the Supabase Auth user and its metadata — never from any
   UI input, form field or role card. */
function desiredProfileIdentity(user) {
  const meta = (user && user.user_metadata) || {};
  return {
    email: (user && user.email) ? String(user.email) : "",
    full_name: meta.full_name || meta.name || "",
    avatar_url: meta.picture || meta.avatar_url || ""
  };
}

/* Normalised comparison helper: "" and null/undefined mean the same "empty". */
function profileTextOrNull(v) {
  return (v === undefined || v === null || v === "") ? null : String(v);
}

/* The existing SELECT is now awaitable so app entry waits for status. Rechecks
   bypass the initialization dedupe and skip ALL identity/presence writes. */
function syncProfileFromSession(session, readOnly) {
  try {
    const user = session && session.user;
    if (!user || !user.id) return;   /* no authenticated session */
    if (!sbClient) return;           /* SDK/config unavailable — nothing to sync with */
    const uid = String(user.id);

    const now = Date.now();
    const epoch = googleSessionEpoch;
    if (!readOnly && profileSyncState.uid === uid && (now - profileSyncState.at) < PROFILE_SYNC_DEDUPE_MS) return;
    if (!readOnly) profileSyncState = { uid: uid, at: now };

    /* 1 + 2. Read the profile row of the AUTHENTICATED user (RLS: own row). */
    return sbClient.from(PROFILE_TABLE)
      .select(PROFILE_READ_COLUMNS)
      .eq("id", uid)
      .maybeSingle()
      .then(function (res) {
        if (!sbGoogleActive || !sbUser || String(sbUser.id) !== uid || epoch !== googleSessionEpoch) return;
        if (res.error) {
          console.warn("[ProfileSync] Profile lookup failed for " + profileLogRef(uid) + " — Google sign-in is unaffected:", res.error.message || res.error);
          return; /* retain a known suspended snapshot on lookup failure */
        }
        if (!res.data) {
          /* 10. Report the condition — never invent/create a row here. */
          console.warn("[ProfileSync] No public.profiles row exists for " + profileLogRef(uid) + " — no row was created from the browser. New users are provisioned by the Phase 1 auth.users trigger; an account that already signed in before the migration needs a database-side action.");
          return;
        }
        /* PHASE 3B: a response that arrives after sign-out or an account switch
           must never be applied to the session that is running now. */
        if (!sbGoogleActive || !sbUser || String(sbUser.id) !== uid) {
          console.warn("[ProfileSync] The session changed before the profile lookup resolved for " + profileLogRef(uid) + " — the database role is not applied to this session.");
          return;
        }
        const row = res.data;
        console.log("[ProfileSync] Profile found for " + profileLogRef(uid) + " (database role: " + row.role + ", status: " + row.status + "). This database role is now authoritative for the frontend role.");
        /* PHASE 3B: the role/status of the AUTHENTICATED user's own row are now
           the authoritative session values. They are only READ here — role and
           status are never written by the frontend. */
        profileAuthority = { uid: uid, roleKey: row.role || null, status: row.status || null };
        /* Phase 7: the session gate applies roles after the awaited read. Never
           write while suspended, or from a manual/Realtime status recheck. */
        if (row.status === "suspended" || readOnly) return;
        /* 3 (last_seen_at): the only column a normal user may change on their own
           row — enforced by public.profiles_guard_self_update() in Phase 1. */
        sbClient.from(PROFILE_TABLE)
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", uid)
          .then(function (upd) {
            if (upd.error) {
              console.warn("[ProfileSync] last_seen_at update failed for " + profileLogRef(uid) + " — Google sign-in is unaffected:", upd.error.message || upd.error);
            } else {
              console.log("[ProfileSync] last_seen_at updated for " + profileLogRef(uid) + ".");
            }
            syncProfileIdentity(uid, row, user);
          })
          .catch(function (err) {
            console.warn("[ProfileSync] last_seen_at request failed for " + profileLogRef(uid) + " — Google sign-in is unaffected:", (err && err.message) || err);
            syncProfileIdentity(uid, row, user);
          });
      })
      .catch(function (err) {
        console.warn("[ProfileSync] Profile lookup request failed for " + profileLogRef(uid) + " — Google sign-in is unaffected:", (err && err.message) || err);
      });
  } catch (e) {
    /* Absolute safety net: profile syncing must never affect authentication. */
    console.warn("[ProfileSync] Unexpected error while syncing the profile — Google sign-in is unaffected:", (e && e.message) || e);
  }
}

/* 3. Synchronize email / full_name / avatar_url from the AUTHENTICATED user
   when the stored values differ. Values come only from the auth session and
   Google metadata — never from UI input.

   HONEST NOTE (no fake success): the Phase 1 database guard
   public.profiles_guard_self_update() lets a NON-ADMIN change ONLY
   last_seen_at on its own row; email, full_name and avatar_url are refused for
   everyone else, because the Phase 1 trigger/backfill own those columns.
   An admin profile (public.is_admin() = true) is allowed through the same
   trigger, so its identity genuinely syncs here.

   This is therefore a SEPARATE statement sent only when a real difference
   exists: a refusal can never undo the last_seen_at write above, and the
   outcome is reported truthfully instead of being presented as success. */
function syncProfileIdentity(uid, row, user) {
  try {
    const want = desiredProfileIdentity(user);
    const patch = {};
    if (want.email && want.email !== (row.email || "")) patch.email = want.email;
    if (profileTextOrNull(want.full_name) !== profileTextOrNull(row.full_name)) patch.full_name = profileTextOrNull(want.full_name);
    if (profileTextOrNull(want.avatar_url) !== profileTextOrNull(row.avatar_url)) patch.avatar_url = profileTextOrNull(want.avatar_url);
    const fields = Object.keys(patch);
    if (!fields.length) {
      console.log("[ProfileSync] Profile identity is already in sync for " + profileLogRef(uid) + " — nothing to update.");
      return;
    }
    console.log("[ProfileSync] Identity data differs for " + profileLogRef(uid) + " (fields: " + fields.join(", ") + ") — attempting the sync.");
    sbClient.from(PROFILE_TABLE)
      .update(patch)
      .eq("id", uid)
      .then(function (res) {
        if (res.error) {
          console.warn("[ProfileSync] Identity sync was refused by the database guard for " + profileLogRef(uid) + " (fields: " + fields.join(", ") + ") — " + (res.error.message || res.error) + ". The stored profile values are kept and Google sign-in is unaffected. A non-admin may change only last_seen_at; updating these columns for a normal user requires a database-side or administrator action.");
          return;
        }
        console.log("[ProfileSync] Identity synchronized for " + profileLogRef(uid) + " (fields: " + fields.join(", ") + ").");
      })
      .catch(function (err) {
        console.warn("[ProfileSync] Identity sync request failed for " + profileLogRef(uid) + " — Google sign-in is unaffected:", (err && err.message) || err);
      });
  } catch (e) {
    console.warn("[ProfileSync] Unexpected error while syncing the profile identity:", (e && e.message) || e);
  }
}
/* PHASE 3A section end (additive profile sync above — nothing else changed). */

/* ===================== PHASE 3B — LAST-SEEN HEARTBEAT (additive) =====================
   A lightweight REAL heartbeat for the CURRENTLY authenticated user only.
   Guarantees:
   - It writes EXACTLY one column, last_seen_at, on the row of the session's OWN
     auth.users id (.eq("id", uid)). role and status are never sent, so the
     heartbeat can never promote, demote, suspend or re-activate anybody.
   - It can never break the application: every failure is only logged, the row is
     never created here and nothing is thrown into the login flow.
   - Only ONE interval exists at a time (startProfileHeartbeat is idempotent) and
     it is cleared on sign-out / account switch (stopProfileHeartbeat).
   - No token, refresh token, API key or session secret is ever logged. */
const PROFILE_HEARTBEAT_MS = 90000;          /* ~90 s while the session is active (60–120 s) */
const PROFILE_HEARTBEAT_MIN_GAP_MS = 30000;  /* never write more often than every ~30 s */
let profileHeartbeatTimer = null;
let profileHeartbeatLastAt = 0;

/* Fire-and-forget last_seen_at write for the current authenticated user. */
function touchProfileLastSeen(reason)
{
  try {
    if (!sbClient || !sbGoogleActive || !sbUser || !sbUser.id || isSuspendedLocked() || googleProfilePending) return; /* no usable authenticated session */
    const uid = String(sbUser.id);
    const now = Date.now();
    if (now - profileHeartbeatLastAt < PROFILE_HEARTBEAT_MIN_GAP_MS) return; /* de-duplicate */
    profileHeartbeatLastAt = now;
    sbClient.from(PROFILE_TABLE)
      .update({ last_seen_at: new Date().toISOString() })  /* ONLY last_seen_at */
      .eq("id", uid)                                       /* the user's OWN profile id */
      .then(function (res) {
        if (res.error) console.warn("[ProfileHeartbeat] last_seen_at update (" + reason + ") failed for " + profileLogRef(uid) + " — the application is unaffected:", res.error.message || res.error);
      })
      .catch(function (err) {
        console.warn("[ProfileHeartbeat] last_seen_at request (" + reason + ") failed for " + profileLogRef(uid) + " — the application is unaffected:", (err && err.message) || err);
      });
  } catch (e) {
    console.warn("[ProfileHeartbeat] Unexpected error in the last_seen_at heartbeat — the application is unaffected:", (e && e.message) || e);
  }
}

/* Start the SINGLE heartbeat interval for the current authenticated session.
   Calling it again first clears any existing interval, so duplicate intervals
   can never accumulate. */
function startProfileHeartbeat() {
  try {
    stopProfileHeartbeat();
    if (!sbGoogleActive || !sbUser || isSuspendedLocked() || googleProfilePending) return;
    if (typeof setInterval !== "function") return;
    profileHeartbeatTimer = setInterval(function () { touchProfileLastSeen("interval"); }, PROFILE_HEARTBEAT_MS);
  } catch (e) {
    console.warn("[ProfileHeartbeat] Could not start the heartbeat — the application is unaffected:", (e && e.message) || e);
  }
}

/* Stop the heartbeat completely (sign-out, account switch, failed sign-out).
   Safe to call when nothing is running. */
function stopProfileHeartbeat() {
  try {
    if (profileHeartbeatTimer !== null) { clearInterval(profileHeartbeatTimer); profileHeartbeatTimer = null; }
  } catch (e) { profileHeartbeatTimer = null; }
  profileHeartbeatLastAt = 0;
}

/* PHASE 3B: apply the authoritative DATABASE role to the running frontend role.
   Called only after the profile row of the CURRENT authenticated user was read.
   - Database role equals the role the frontend already entered → nothing happens
     (the normal case: no extra toast, no flicker).
   - Database role differs (e.g. it was changed in the database) → the UI is
     corrected: the DATABASE wins over the email bootstrap.
   - A user who deliberately returned to the role-selection screen (no active
     role) is left there; no role is forced on them. */
function applyAuthoritativeProfileRole(uid) {
  try {
    if (!sbGoogleActive || !sbUser || String(sbUser.id) !== String(uid)) return;
    const dbKey = authoritativeProfileRoleKey(sbUser.email);
    if (!dbKey) return;
    if (typeof state === "undefined" || !state || !state.role) return;
    if (state.role.key === dbKey) { renderAccountPanel(); return; }
    const role = (typeof ROLE_DATA !== "undefined") && ROLE_DATA.find((r) => r.key === dbKey);
    if (!role) return;
    console.log("[ProfileSync] Database role '" + profileAuthority.roleKey + "' is authoritative — correcting the frontend role from '" + state.role.key + "' to '" + dbKey + "'.");
    enterRole(role, "Database profile role");
  } catch (e) {
    console.warn("[ProfileSync] Could not apply the authoritative database role to the session — the application is unaffected:", (e && e.message) || e);
  }
}
/* PHASE 3B section end. */

/* Requirement: one Logout entry point, used by the sidebar "Sign out" button.
   - Real Google/Supabase session → supabase.auth.signOut(); the SIGNED_OUT
     onAuthStateChange event then runs handleGoogleSignOut, which restores the
     default user widget and returns the UI to the welcome screen.
   - Demo-role or guest session (no Supabase session exists) → exactly the
     existing "Change role" behaviour (showWelcome). No fake Supabase session
     is created or removed, and no access token is ever shown in the UI. */
function doSignOut() {
  if (sbClient && sbGoogleActive) {
    sbClient.auth.signOut().then(() => {
      /* UI update happens in handleGoogleSignOut via the SIGNED_OUT event. */
    }).catch((err) => {
      /* Rare: the server-side revoke call failed (e.g. offline). Never leave
         the user stuck inside the dashboard — clear the local UI state too. */
      console.error("[GoogleAuth] signOut failed:", err);
      /* PHASE 3B: the SIGNED_OUT event may not arrive, so stop the heartbeat and
         drop the authoritative database role/status explicitly as well. */
      stopProfileHeartbeat();
      profileAuthority = { uid: "", roleKey: null, status: null };
      sbGoogleActive = false;
      restoreDefaultUserWidget();
      showWelcome();
    });
    return;
  }
  showWelcome(); /* existing demo logout behaviour */
}

/* "Login with another account" — REAL account switching, no faking:
   1. End the current Supabase session with the real supabase.auth.signOut()
      (the SIGNED_OUT event clears the authenticated UI + shows the welcome
      screen — exactly the same as a normal Sign out).
   2. Start the real Google OAuth flow again with prompt=select_account so
      Google ALWAYS shows its account chooser, allowing the user to pick a
      DIFFERENT Google account. The new account then signs in via the normal
      SIGNED_IN path. If anything fails, an honest error is shown — the user
      is left signed OUT, never stuck in a half state. */
function switchGoogleAccount() {
  if (sbClient && sbGoogleActive) {
    sbClient.auth.signOut().then(() => {
      startGoogleSignIn({ selectAccount: true });
    }).catch((err) => {
      console.error("[GoogleAuth] account-switch signOut failed:", err);
      toast("Could not end the current session: " + esc((err && err.message) || "unknown error") + " — Google account chooser was not started.", "err", 7000);
    });
    return;
  }
  startGoogleSignIn({ selectAccount: true });
}

/* ===================== ACCOUNT PANEL (additive) =====================
   Shows REAL Supabase Auth user information (name, email, avatar picture)
   from the live session — never faked, no tokens/secrets in the UI. */

function openAccountPanel() {
  const panel = $("#account-panel");
  if (!panel || panel.classList.contains("open")) return;
  renderAccountPanel();
  panel.classList.add("open");
  const b = $("#btn-account");
  if (b) b.setAttribute("aria-expanded", "true");
}

function toggleAccountPanel() {
  const panel = $("#account-panel");
  if (!panel) return;
  if (panel.classList.contains("open")) closeAccountPanel(); else openAccountPanel();
}

function closeAccountPanel() {
  const panel = $("#account-panel");
  if (panel) panel.classList.remove("open");
  const b = $("#btn-account");
  if (b) b.setAttribute("aria-expanded", "false");
}

/* Rendered fresh on every open AND on every auth state change, so the panel
   is always synchronised with the real Supabase session (incl. refresh). */
function renderAccountPanel() {
  const panel = $("#account-panel");
  if (!panel) return;
  const nameEl = $("#ap-name"), emailEl = $("#ap-email"), avatarEl = $("#ap-avatar"),
        roleEl = $("#ap-role"), noteEl = $("#ap-note"), soBtn = $("#account-signout"),
        statusEl = $("#ap-status"), authEl = $("#ap-auth"), swBtn = $("#account-switch");
  if (!nameEl || !emailEl || !avatarEl || !roleEl || !noteEl || !soBtn) return;

  const meta = (sbUser && sbUser.user_metadata) || {};
  const gName = meta.full_name || meta.name || (sbUser && sbUser.email ? String(sbUser.email).split("@")[0] : "");
  const email = sbUser && sbUser.email ? sbUser.email : "";
  const picture = meta.picture || meta.avatar_url || "";

  if (sbUser) {
    /* Real Google/Supabase Auth session — show the real account details. */
    nameEl.textContent = gName || "Google user";
    emailEl.textContent = email;
    avatarEl.innerHTML = picture
      ? '<img src="' + esc(picture) + '" alt="" referrerpolicy="no-referrer">'
      : esc(accountInitials(gName || "GU"));
    roleEl.textContent = accountRoleName();
    /* PHASE 3B: report the REAL database status when this session's profile row
       has been read. 'suspended' is only displayed — never lifted here. */
    if (statusEl) {
      statusEl.textContent = sessionStatusLabel();
      statusEl.style.color = profileStatusSuspended() ? "var(--rose)" : "var(--teal)";
    }
    if (authEl) authEl.textContent = "Google Account";
    noteEl.textContent = "Signed in with Google (Supabase Auth). " + accountRoleName() +
      (roleAuthNote(pEmail(sbUser)) === ROLE_AUTH_NOTE_DEFAULT
        ? " is the safe default role — the public.profiles role becomes authoritative once this session's profile row is read."
        : " — " + roleAuthNote(pEmail(sbUser)));
    soBtn.style.display = "";
    if (swBtn) swBtn.style.display = "";
  } else if (state.role) {
    /* Demo role session — clearly labelled as demo, never presented as a
       database-backed account. */
    nameEl.textContent = state.role.name + " (demo)";
    emailEl.textContent = "Frontend demo session — no database account";
    avatarEl.textContent = accountInitials(state.role.name);
    roleEl.textContent = state.role.name;
    if (statusEl) { statusEl.textContent = "Demo session"; statusEl.style.color = "var(--amber)"; }
    if (authEl) authEl.textContent = "Demo (no Supabase Auth)";
    noteEl.textContent = "Demo sign-in only (pre-filled demo credentials) — not a Supabase Auth session.";
    soBtn.style.display = "";
    if (swBtn) swBtn.style.display = "none";
  } else {
    /* Requirement: no authenticated session → show NO private account info. */
    nameEl.textContent = "Not signed in";
    emailEl.textContent = "";
    avatarEl.textContent = "–";
    roleEl.textContent = "—";
    if (statusEl) { statusEl.textContent = "Guest"; statusEl.style.color = "var(--muted)"; }
    if (authEl) authEl.textContent = "—";
    noteEl.textContent = "Sign in to see your account details here.";
    soBtn.style.display = "none";
    if (swBtn) swBtn.style.display = "none";
  }
}

/* Application role for the account UI. While a Google/Supabase session is
   active the authenticated email is authoritative: the configured
   ADMIN_EMAIL / SURVEYOR_EMAIL / REVENUE_OFFICER_EMAIL addresses show
   their role, everyone else the safe default — never a manually clicked
   role, which a Google user must not be able to escalate to. */
function accountRoleName() {
  if (sbGoogleActive && sbUser) {
    const role = ROLE_DATA.find((r) => r.key === googleRoleForEmail(sbUser.email));
    if (role) return role.name;
    const citizen = ROLE_DATA.find((r) => r.key === GOOGLE_ROLE_KEY);
    return citizen ? citizen.name : "Citizen";
  }
  if (state.role) return state.role.name;
  const citizen = ROLE_DATA.find((r) => r.key === GOOGLE_ROLE_KEY);
  return citizen ? citizen.name : "Citizen";
}

/* ===================== MY PROFILE / ACCOUNT SETTINGS (additive) =====================
   Professional modals reusing the existing login-card design. All content comes
   from the REAL Supabase Auth user/session (user.email, user_metadata,
   user.created_at, user.last_sign_in_at, user.id) — nothing is invented. */

/* SAFETY GUARD — while a real Google/Supabase session is active, the
   authenticated email owns the application role. A Google user must not
   be able to escalate to a restricted role (Admin / Surveyor / Revenue
   Officer) by clicking that role card (which calls enterRole directly).
   This wrapper only ever redirects to the entitled role: the configured
   address keeps its role, every other Google email is corrected to the
   safe Citizen default. Every other call passes through untouched, so the
   demo email/password login and all other roles behave exactly as before. */
if (typeof enterRole === "function" && !enterRole.__googleAdminGuard) {
  const __baseEnterRole = enterRole;
  enterRole = function (role, via) {
    if (isSuspendedLocked()) { showSuspendedLock(); return; }
    if (googleProfilePending) return;
    try {
      if (sbGoogleActive && sbUser && role) {
        const entitled = googleRoleForEmail(sbUser.email);
        const wanted = role.key;
        const wantedRestricted = (wanted === ADMIN_ROLE_KEY ||
          wanted === SURVEYOR_ROLE_KEY || wanted === REVENUE_OFFICER_ROLE_KEY);
        const entitledRestricted = (entitled === ADMIN_ROLE_KEY ||
          entitled === SURVEYOR_ROLE_KEY || entitled === REVENUE_OFFICER_ROLE_KEY);
        /* A restricted role card was clicked while a Google session is
           active: only allow it when it is exactly the role this email is
           entitled to; otherwise correct to this email's entitled role
           (Citizen for unknown users). */
        if (wantedRestricted && wanted !== entitled) {
          const safe = (typeof ROLE_DATA !== "undefined" &&
            (ROLE_DATA.find((r) => r.key === entitled) ||
             ROLE_DATA.find((r) => r.key === GOOGLE_ROLE_KEY))) || role;
          return __baseEnterRole.call(this, safe, via);
        }
        /* A non-restricted role was clicked (Citizen): during a Google
           session always correct to the email's entitled role so a
           restricted user cannot be downgraded by the card either. */
        if (!wantedRestricted && entitledRestricted && wanted !== entitled) {
          const entitledRole = (typeof ROLE_DATA !== "undefined" &&
            ROLE_DATA.find((r) => r.key === entitled)) || role;
          return __baseEnterRole.call(this, entitledRole, via);
        }
      }
    } catch (e) { /* fall through to the original behaviour */ }
    return __baseEnterRole.call(this, role, via);
  };
  enterRole.__googleAdminGuard = true;
}

function openProfileModal() { renderProfileModal(); showAuthModal("#profile-overlay"); }
function openSettingsModal() { renderSettingsModal(); showAuthModal("#settings-overlay"); }
function closeProfileModal() { hideAuthModal("#profile-overlay"); }
function closeSettingsModal() { hideAuthModal("#settings-overlay"); }

function showAuthModal(sel) {
  const ov = $(sel);
  if (!ov) return;
  ov.classList.add("show");
  ov.setAttribute("aria-hidden", "false");
}
function hideAuthModal(sel) {
  const ov = $(sel);
  if (!ov) return;
  ov.classList.remove("show");
  ov.setAttribute("aria-hidden", "true");
}

/* Row helpers — values are HTML-escaped by the caller before passing in. */
function profRow(label, value, small) {
  return '<div class="prof-row"><em>' + label + "</em><div>" + value +
    (small ? "<small>" + small + "</small>" : "") + "</div></div>";
}
function profIdentity(name, email, picture, initials) {
  return '<div class="prof-id">' +
    '<div class="ap-avatar">' + (picture ? '<img src="' + esc(picture) + '" alt="" referrerpolicy="no-referrer">' : esc(initials || "–")) + "</div>" +
    "<div><strong>" + esc(name) + "</strong>" + (email ? "<span>" + esc(email) + "</span>" : "") + "</div></div>";
}
function fmtDate(iso) {
  const d = iso ? new Date(iso) : null;
  return (d && !isNaN(d.getTime())) ? d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
}
function bindModalSignIn(btnId, closeFn) {
  const b = $(btnId);
  if (b) b.addEventListener("click", () => { closeFn(); if (typeof openLogin === "function") openLogin(); });
}

function renderProfileModal() {
  const body = $("#prof-body");
  if (!body) return;
  if (sbUser) {
    const meta = sbUser.user_metadata || {};
    const name = meta.full_name || meta.name || (sbUser.email ? String(sbUser.email).split("@")[0] : "Google user");
    const email = sbUser.email || "";
    const picture = meta.picture || meta.avatar_url || "";
    const initials = accountInitials(name || "GU");
    body.innerHTML = profIdentity(name, email, picture, initials) +
      profRow("Full Name", esc(name)) +
      profRow("Email", esc(email)) +
      profRow("Application Role", esc(accountRoleName()), roleAuthNote(pEmail(sbUser))) +
      profRow("Account Status", esc(sessionStatusLabel()), profileStatusSuspended() ? "Marked suspended in the database — reported only, never changed by the frontend" : undefined) +
      profRow("Authentication", "Google Account", "via Supabase Auth") +
      profRow("Joined", esc(fmtDate(sbUser.created_at)), sbUser.created_at ? undefined : "Not provided by Supabase for this account");
  } else if (state.role) {
    body.innerHTML = profIdentity(state.role.name + " (demo)", "Frontend demo session — no database account", "", accountInitials(state.role.name)) +
      profRow("Application Role", esc(state.role.name)) +
      profRow("Account Status", "Demo session") +
      profRow("Authentication", "Pre-filled demo credentials", "Not a Supabase Auth session");
  } else {
    body.innerHTML = '<p class="ap-note" style="margin-top:4px">You are not signed in. Sign in with your Google account to view your profile.</p>' +
      '<div class="prof-actions"><button type="button" class="btn btn-primary sm" id="prof-signin">Sign in</button></div>';
    bindModalSignIn("#prof-signin", closeProfileModal);
  }
}

function renderSettingsModal() {
  const body = $("#settings-body");
  if (!body) return;
  if (sbUser) {
    const meta = sbUser.user_metadata || {};
    const name = meta.full_name || meta.name || (sbUser.email ? String(sbUser.email).split("@")[0] : "Google user");
    const email = sbUser.email || "";
    const shortId = sbUser.id ? String(sbUser.id).slice(0, 8) + "…" : "—";
    body.innerHTML =
      '<p class="ap-note" style="margin-top:4px">Only settings that actually work with the current frontend and Supabase Auth are listed. Nothing here is decorative.</p>' +
      '<p class="ap-sec-label" style="margin-top:12px">Profile information</p>' +
      profRow("Display Name", esc(name), "Managed by your Google account — read-only here") +
      profRow("Email", esc(email), "Managed by your Google account — read-only here") +
      '<p class="ap-sec-label" style="margin-top:12px">Current role</p>' +
      profRow("Application Role", esc(accountRoleName()),
        roleAuthNote(sbUser && sbUser.email) === ROLE_AUTH_NOTE_DEFAULT
          ? "Google sign-in uses the safest existing role until this session's database profile role is read — the existing role-permission system is unchanged."
          : roleAuthNote(sbUser && sbUser.email)) +
      '<p class="ap-sec-label" style="margin-top:12px">Authentication method</p>' +
      profRow("Provider", "Google Account", "Supabase Auth (OAuth) — no passwords are stored") +
      '<p class="ap-sec-label" style="margin-top:12px">Session / account information</p>' +
      profRow("Session", "Active", "Persisted by Supabase Auth — survives refresh, token auto-refresh on") +
      profRow("User ID", esc(shortId), "Supabase Auth user id (shortened)") +
      profRow("Last Sign-in", esc(fmtDate(sbUser.last_sign_in_at)), sbUser.last_sign_in_at ? undefined : "Not provided");
  } else {
    body.innerHTML = '<p class="ap-note" style="margin-top:4px">Account settings become available once you sign in with your Google account.</p>' +
      '<div class="prof-actions"><button type="button" class="btn btn-primary sm" id="settings-signin">Sign in</button></div>';
    bindModalSignIn("#settings-signin", closeSettingsModal);
  }
}

function accountInitials(name) {
  const parts = String(name).trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : String(name).slice(0, 2)).toUpperCase();
}

function applyGoogleUserProfile(user) {
  const meta = (user && user.user_metadata) || {};
  const name = meta.full_name || meta.name || (user && user.email ? String(user.email).split("@")[0] : "Google user");
  const picture = meta.picture || meta.avatar_url || "";
  const parts = String(name).trim().split(/\s+/);
  const initials = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : String(name).slice(0, 2)).toUpperCase();
  const av1 = document.querySelector(".side-user .avatar");
  const nm = document.querySelector(".side-user .su-meta strong");
  if (av1) av1.textContent = initials;
  if (nm) nm.textContent = name;
  /* Professional account button (topbar): Google photo when available, the
     display name next to it, initials when no photo, "Account" fallback. */
  setAccountButton(picture, name, initials);
}

function restoreDefaultUserWidget() {
  const av1 = document.querySelector(".side-user .avatar");
  const nm = document.querySelector(".side-user .su-meta strong");
  if (av1) av1.textContent = "RS";
  if (nm) nm.textContent = "Rajesh Surveyor";
  setAccountButton("", "", "");
}

/* Update the topbar account button from REAL Supabase Auth data only —
   photo when Google provides one, else initials, else a generic icon. */
function setAccountButton(picture, name, initials) {
  const av = $("#acc-av"), nm = $("#acc-name");
  if (!av || !nm) return;
  if (picture) {
    av.innerHTML = '<img src="' + esc(picture) + '" alt="" referrerpolicy="no-referrer">';
  } else if (initials) {
    av.textContent = initials;
  } else {
    av.textContent = "–";
  }
  nm.textContent = name || "Account";
}

/* Guard the shared router as well as enterRole; guest Skip uses this route.
   These wrappers live here so app.js and its demo credential map stay untouched. */
if (typeof goto === "function") {
  const baseGoto = goto;
  goto = function () {
    if (isSuspendedLocked()) { showSuspendedLock(); return; }
    if (googleProfilePending) return;
    return baseGoto.apply(this, arguments);
  };
}
function initSuspendedLock() {
  const lock = document.getElementById("suspended-lock");
  const retry = document.getElementById("btn-suspended-recheck");
  const signout = document.getElementById("btn-suspended-signout");
  if (!lock || !retry || !signout) return;
  retry.addEventListener("click", async function () {
    retry.disabled = true;
    try { await recheckSuspendedStatus("manual"); }
    finally { retry.disabled = false; }
  });
  signout.addEventListener("click", doSignOut);
  /* Capture before existing handlers: blocks role cards, Skip, demo submits,
     keyboard shortcuts and background panels without changing their modules. */
  ["click", "pointerdown", "submit", "keydown", "focusin"].forEach(function (type) {
    window.addEventListener(type, function (event) {
      if (!isSuspendedLocked() && !googleProfilePending) return;
      if (lock.contains(event.target) && !lock.hidden) {
        if (type === "keydown" && event.key === "Tab") {
          const first = retry.disabled ? signout : retry;
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault(); signout.focus();
          } else if (!event.shiftKey && document.activeElement === signout) {
            event.preventDefault(); first.focus();
          }
        }
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      if (isSuspendedLocked()) {
        showSuspendedLock();
        if (type === "focusin") (retry.disabled ? signout : retry).focus();
      }
    }, true);
  });
}
document.addEventListener("DOMContentLoaded", initSuspendedLock);
document.addEventListener("DOMContentLoaded", initGoogleAuth);

/* --------------------------------------------------------------------
   WHAT REMAINS TO BE CONFIGURED (honest status, no fake behaviour):
   1. Paste SUPABASE_URL and SUPABASE_ANON_KEY at the top of this file.
   2. Supabase dashboard → Authentication → URL Configuration (Task 2 fix):
      BOTH of these exact values must be present in "Redirect URLs"
      (one line per URL — replace any stale http://localhost:3000 entry):
        https://kaifali68791-creator.github.io/ULPIN-3D/
        https://kaifali68791-creator.github.io/ULPIN-3D/index.html
      Set "Site URL" to:  https://kaifali68791-creator.github.io/ULPIN-3D/
      Keep a localhost entry ONLY if you still test locally, e.g.
      http://localhost:5500/ — never as the production value.
      If this dashboard step is skipped, Supabase/Google will still bounce
      the login back to localhost:3000 (or show a redirect error) even
      though the code above now sends the correct deployed return URL.
   3. Google Cloud → OAuth client: the Authorized Redirect URI must be
      https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
      (this is configured in Supabase, never in this frontend).
   4. Role mapping (Phase 3B): the public.profiles row of the authenticated
       user is AUTHORITATIVE — its role is mapped onto the four existing
       frontend role keys: admin → admin, revenue_officer → revenue,
       surveyor → gis, citizen → planning. Staff roles are granted ONLY by the
       database provisioning trigger (server-side, trusted email mapping:
       kaifali68791@gmail.com → admin, ffpr121@gmail.com → revenue_officer,
       k8875349@gmail.com → surveyor, everyone else → citizen). The addresses
       in ADMIN_EMAIL / SURVEYOR_EMAIL / REVENUE_OFFICER_EMAIL (top of this
       file) are only the safe bootstrap/fallback used before the profile row
       has been read. To give someone another role, change
       public.profiles.role in the database — never grant roles from the
       Google login itself, and never from UI input.
   -------------------------------------------------------------------- */

