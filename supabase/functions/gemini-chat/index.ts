import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/* =====================================================================
   ULPIN 3D — Gemini AI Edge Function (FREE tier)
   ---------------------------------------------------------------------
   Securely calls the Google Gemini API. The API key is read from the
   GEMINI_API_KEY Supabase secret — it is NEVER exposed to the browser.
   Model defaults to gemini-2.5-flash (free tier). Override with the
   GEMINI_MODEL secret if desired.
   ===================================================================== */

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_ENDPOINT =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "GEMINI_API_KEY is not set. Add it as a Supabase Edge Function secret.",
      }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  const query: string = (body.query || "").trim();
  if (!query) {
    return new Response(
      JSON.stringify({ error: "Missing 'query' field." }),
      { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }

  const context = body.context || {};

  try {
    const answer = await callGemini(query, context);
    return new Response(
      JSON.stringify({ answer, model: GEMINI_MODEL }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[gemini-chat] Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Gemini request failed." }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});

/* ------------------------------------------------------------------ */
async function callGemini(query: string, context: Record<string, unknown>): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: query }] }],
      system_instruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (res.status === 429) {
      throw new Error("Gemini rate limit reached. Please wait a moment and try again.");
    }
    if (res.status === 403 || res.status === 400) {
      throw new Error(`Gemini API request rejected (${res.status}). Check your API key.`);
    }
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

/* ------------------------------------------------------------------ */
function buildSystemPrompt(context: Record<string, unknown>): string {
  const c = context as any;
  const lines: string[] = [];

  lines.push(
    "You are the ULPIN 3D AI Cadastral Assistant, embedded in a demonstration web application for India's Digital India Land Records Modernisation Programme (DILRMP).",
  );
  lines.push("");
  lines.push("## About this project");
  lines.push(
    "ULPIN 3D is a vertical property mapping and ULPIN (Unique Land Parcel Identification Number) generation platform. It demonstrates: surface land parcels with survey numbers and ownership, multi-floor buildings with individual units, 3D volumetric cadastre (X/Y/Z boundaries), underground utility infrastructure (water, sewer, gas, electric, fibre), air rights / FSI volumes, topology validation, and ownership conflict detection.",
  );
  lines.push("");
  lines.push("## Current demo dataset");
  lines.push(
    "The user is viewing a demo property in Shivapur village, Haveli tehsil, Pune district, Maharashtra, India. Use the data below to answer specific questions. If a question asks for data not present here, say it is not available in the current demo rather than inventing facts.",
  );
  lines.push("");

  if (c.parcel) {
    const p = c.parcel;
    lines.push(
      `PARCEL: survey ${p.survey} (${p.id}), owner ${p.owner}, ${p.use}, ${p.area} ${p.areaUnit || "sq m"}, status ${p.status}, coords ${p.lat},${p.lng}, elevation ${p.elevation}m, CRS ${p.crs}, GNSS ${p.gnssStatus}, accuracy ${p.accuracy}, surveyed ${p.surveyDate}, plot ${p.plotDims}.`,
    );
  }
  if (c.building) {
    const b = c.building;
    lines.push(
      `BUILDING: ${b.name} (${b.id}), built ${b.year}, ${b.type}, ${b.height}m tall, ${b.floors} floors, ${b.units} units, ${b.occupancy}% occupied, footprint ${b.footprint}, ${b.basement}, parking ${b.parking}.`,
    );
  }
  if (Array.isArray(c.floors)) {
    lines.push(
      "FLOORS: " + c.floors.map((f: any) =>
        `${f.name} (${f.id}): elevation +${f.elevation}m, ${f.height}m height, ${f.units} units, ${f.confidence}% confidence`
      ).join("; ") + ".",
    );
  }
  if (c.units && Array.isArray(c.units["F4"])) {
    lines.push(
      "F4 UNITS: " + c.units["F4"].map((u: any) =>
        `${u.no}: ${u.type}, ${u.area}, owner ${u.owner}, ${u.status}, elevation +${u.elevBase}m to +${u.elevTop}m`
      ).join("; ") + ".",
    );
  }
  if (Array.isArray(c.underground)) {
    lines.push(
      "UNDERGROUND INFRASTRUCTURE: " + c.underground.map((u: any) =>
        `${u.type} (${u.id}): ${u.authority}, depth ${u.depth}m, ${u.status}, serves ${u.serves} properties, length ${u.length}m`
      ).join("; ") + ".",
    );
  }
  if (c.topology) {
    const t = c.topology;
    lines.push(`TOPOLOGY: health score ${t.score}%, ${t.issues ? t.issues.length : 0} issues.`);
  }
  if (Array.isArray(c.ownershipConflicts)) {
    lines.push(`OWNERSHIP CONFLICTS: ${c.ownershipConflicts.length} detected.`);
  }
  if (c.infrastructure) {
    const inf = c.infrastructure;
    lines.push(
      `INFRASTRUCTURE: proposed project ${inf.proposed ? inf.proposed.id : "none"} (${inf.proposed ? inf.proposed.type : ""}), ${inf.conflicts ? inf.conflicts.length : 0} conflicts.`,
    );
  }

  lines.push("");
  lines.push("## Behaviour rules");
  lines.push(
    "- Answer natural-language questions about ULPIN, land parcels, buildings, floors, cadastral mapping, survey data, underground infrastructure, maps, and this project.",
  );
  lines.push(
    "- Explain cadastral concepts (ULPIN structure, topology, vertical delineation, etc.) in clear, concise terms.",
  );
  lines.push("- Use short bullet points where helpful. Keep answers focused.");
  lines.push(
    "- Do NOT claim to be ChatGPT, GPT-4, Claude, or any other model. You are the ULPIN 3D assistant powered by Google Gemini.",
  );
  lines.push("- Do NOT reveal the API key, any secret, or internal configuration.");
  lines.push("- This is a demonstration system with sample data; say so when relevant.");

  return lines.join("\n");
}

