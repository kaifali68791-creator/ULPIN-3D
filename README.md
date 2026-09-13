# 3D ULPIN Generation & Vertical Property Mapping System

Digital 3D Cadastral Platform for Smart Land & Property Management.

A dependency-free static web UI (HTML + CSS + vanilla JS) — no build step, no backend.
Builds on the existing demo site without replacing it.

## Run

Because the whole app is static, it opens by double-clicking `index.html`.

To open it at **http://127.0.0.1:5173/** (Python is required):

```powershell
cd "c:\Users\lenovo\OneDrive\Desktop\SIH26011"
python -m http.server 5173 --bind 127.0.0.1
```

Then browse to <http://127.0.0.1:5173/>.

> Node/Vite is **not** required — no packages are installed for this project.

## Step 1 — Welcome page & role selection (current)

On load the website shows a full-screen Welcome / Role Selection page:

- **Title**: 3D ULPIN & Vertical Property Mapping System
- **Subtitle**: Digital 3D Cadastral Platform for Smart Land & Property Management
- Four role cards (mock, no authentication):

  1. **Admin** — Continue as Admin
  2. **Revenue / Land Officer** — Continue as Land Officer
  3. **GIS / Survey Officer** — Continue as GIS Officer
  4. **Urban Planning / Infrastructure Officer** — Continue as Planning Officer

Clicking a card (or its button) hides the welcome screen and opens a **placeholder
role dashboard**: a hero heading ("Welcome, <Role>"), four role-specific stat KPIs,
and four mock quick-action cards. A footer note and "Change role" button return to
the role selection.

A prominent **Sign in** button opens a demo login dialog. The pre-filled credentials
can be submitted to open the main dashboard directly. This is front-end demo access
only; real authentication and account validation still require a backend.

## Project structure

```
index.html        app shell, welcome overlay + role-landing view
css/styles.css    full design system (incl. welcome/role styles)
js/data.js        mock data (parcels, buildings, ULPIN, utilities, feeds…)
js/app.js         view logic, icons, welcome + role selection behaviour
```

## Later steps (not part of this build)

Backend, databases (PostgreSQL/PostGIS), real 3D engines (Three.js/Cesium),
AI/ML, LiDAR and authentication are intentionally excluded for Step 1.