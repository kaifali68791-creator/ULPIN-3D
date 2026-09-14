"use strict";

/* =====================================================================
   ULPIN 3D — Google sign-in via Supabase Auth (ADDITIVE module)
   - Uses ONLY the Supabase project URL + public anon key in the frontend.
     The Google OAuth Client Secret lives ONLY in the Supabase dashboard —
     it must never be placed in HTML/CSS/JS or any frontend file.
   - SAFETY: a Google-signed-in user is mapped to the existing Citizen role
     (the view-oriented role) by default. ONLY the authorized addresses in
     ADMIN_EMAIL / SURVEYOR_EMAIL / REVENUE_OFFICER_EMAIL (below) receive
     their restricted role. A random Google user can never receive a
     restricted role through this flow. Role mapping to a database is NOT
     connected yet — see the notes at the bottom of this file.
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
   Priority: Admin → Surveyor → Revenue Officer → safe default (Citizen). */
function googleRoleForEmail(email) {
  if (isAdminGoogleEmail(email)) return ADMIN_ROLE_KEY;
  if (isSurveyorGoogleEmail(email)) return SURVEYOR_ROLE_KEY;
  if (isRevenueOfficerGoogleEmail(email)) return REVENUE_OFFICER_ROLE_KEY;
  return GOOGLE_ROLE_KEY;
}

/* Human-readable authorization note for the account UI: which configured
   email list granted the role, or the honest default-role note. */
function roleAuthNote(email) {
  if (isAdminGoogleEmail(email)) return "Authorized administrator (ADMIN_EMAIL).";
  if (isSurveyorGoogleEmail(email)) return "Authorized surveyor (SURVEYOR_EMAIL).";
  if (isRevenueOfficerGoogleEmail(email)) return "Authorized revenue officer (REVENUE_OFFICER_EMAIL).";
  return "Default role — per-user roles stored in the database are not connected yet.";
}

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

function handleGoogleSignIn(session, viaNewSignIn) {
  sbGoogleActive = true;
  sbUser = (session && session.user) || null;
  /* Email-to-role mapping: the REAL Supabase Auth email decides the
     application role — priority Admin → Surveyor → Revenue Officer,
     everyone else keeps the safe default. Case-insensitive,
     whitespace-trimmed. */
  const authEmail = (sbUser && sbUser.email) || "";
  const roleKey = googleRoleForEmail(authEmail);
  const role = ROLE_DATA.find((r) => r.key === roleKey) ||
               ROLE_DATA.find((r) => r.key === GOOGLE_ROLE_KEY) || ROLE_DATA[0];
  /* Professional welcome — shows only on a NEW sign-in (never on a refresh
     session restore). Never claims a first-time-only event or a role upgrade. */
  if (viaNewSignIn) {
    const m = (session && session.user && session.user.user_metadata) || {};
    const wName = m.full_name || m.name || (session && session.user && session.user.email ? String(session.user.email).split("@")[0] : "");
    toast("Welcome to <b>ULPIN 3D</b>" + (wName ? ", " + esc(wName) : "") + " — your Google account is signed in.", "ok", 5200);
  }
  /* If the sign-in modal is still open (e.g. the OAuth redirect returned to
     the page while it was up), close it so the authenticated dashboard is
     visible. No-op when the modal is not open. */
  const loginOv = $("#login-overlay");
  if (loginOv && loginOv.classList.contains("show")) closeLogin();
  /* The authenticated Google email decides the role: the entitled role
     always wins over a previously stored in-memory role for this address,
     and any other Google user is always corrected back to the safe
     default — a manually clicked restricted-role card can never
     override it. */
  enterRole(role, "Google account");
  applyGoogleUserProfile(session && session.user);
  renderAccountPanel(); /* keep the account panel synchronised with the real auth state */
}

function handleGoogleSignOut() {
  const wasGoogle = sbGoogleActive;
  sbGoogleActive = false;
  sbUser = null;
  restoreDefaultUserWidget();
  renderAccountPanel(); /* private info disappears immediately */
  if (wasGoogle && state.role) showWelcome(); /* same behaviour as the existing logout */
}

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
    if (statusEl) { statusEl.textContent = "Active"; statusEl.style.color = "var(--teal)"; }
    if (authEl) authEl.textContent = "Google Account";
    noteEl.textContent = "Signed in with Google (Supabase Auth). " + accountRoleName() + (roleAuthNote(pEmail(sbUser)) === "Default role — per-user roles stored in the database are not connected yet." ? " is the default role — per-user roles stored in the database are not connected yet." : " — " + roleAuthNote(pEmail(sbUser)));
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
      profRow("Account Status", "Active") +
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
      profRow("Application Role", esc(accountRoleName()), roleAuthNote(sbUser && sbUser.email) === "Default role — per-user roles stored in the database are not connected yet." ? "Google sign-in always uses the safest existing role. The existing role-permission system is unchanged." : roleAuthNote(sbUser && sbUser.email)) +
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
   4. Role mapping: every Google user gets the CITIZEN role, EXCEPT the
       addresses in ADMIN_EMAIL / SURVEYOR_EMAIL / REVENUE_OFFICER_EMAIL
       (top of this file), which get their existing restricted role
       (Admin → Surveyor → Revenue Officer priority).
      To give specific people other roles later, store a role per user
      (e.g. a "profiles" table in Supabase keyed by user id) and map it
      in handleGoogleSignIn — do NOT grant roles from the Google login
      itself.
   -------------------------------------------------------------------- */

