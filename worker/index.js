/**
 * Reel Irie Charters — Cloudflare Worker
 *
 * Public:
 *   POST /api/book            save a booking request, notify the captain
 *   GET  /api/availability    days that differ from the normal week
 * Captain only (Cloudflare Access login):
 *   /admin                    the Captain's Deck app
 *   GET    /api/admin/bookings
 *   PATCH  /api/admin/bookings/:id     { status, captain_notes }
 *   GET    /api/admin/days
 *   PUT    /api/admin/days/:date       { status, note }
 *   DELETE /api/admin/days/:date
 *
 * Everything else is the static site (env.ASSETS).
 */
import { notifyCaptain } from "./email.js";

const STATUSES = ["new", "confirmed", "declined", "done", "cancelled"];
const DAY_STATUSES = ["off", "on call", "booked", "sunset only", "open"];
const ISO = /^\d{4}-\d{2}-\d{2}$/;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json", ...headers } });
const clean = (v, max = 500) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
const cleanMultiline = (v, max = 2000) => String(v ?? "").replace(/\r/g, "").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ").trim().slice(0, max);
const now = () => new Date().toISOString().replace("T", " ").slice(0, 19);
const todayEastern = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/api/book" && request.method === "POST") return await book(request, env, ctx, url);
      if (path === "/api/availability" && request.method === "GET") return await availability(env);

      if (path === "/admin" || path.startsWith("/admin/") || path.startsWith("/api/admin/")) {
        const who = await captain(request, env);
        if (!who) return denied(path);
        if (path.startsWith("/api/admin/")) return await adminApi(request, env, path, who);
        return env.ASSETS.fetch(request);
      }
      if (path.startsWith("/api/")) return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error(err);
      return json({ error: "Something went wrong" }, 500);
    }
    return env.ASSETS.fetch(request);
  },
};

/* ---------------- Public ---------------- */

async function book(request, env, ctx, url) {
  let d;
  try { d = await request.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (d._honey) return json({ ok: true }); // bots fill the hidden field

  const b = {
    trip_id: clean(d.trip_id, 40),
    trip_name: clean(d.trip_name, 80),
    date: clean(d.date, 10),
    adults: Math.max(1, Math.min(20, parseInt(d.adults, 10) || 1)),
    kids: Math.max(0, Math.min(20, parseInt(d.kids, 10) || 0)),
    kid_ages: clean(d.kid_ages, 80),
    island: clean(d.island, 60),
    name: clean(d.name, 80),
    phone: clean(d.phone, 30),
    email: clean(d.email, 120),
    notes: cleanMultiline(d.notes, 1500),
  };
  if (!b.trip_name || !ISO.test(b.date) || !b.name || !b.phone || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email)) {
    return json({ error: "Please fill in the trip, date, name, phone and email." }, 400);
  }
  if (b.date < todayEastern()) return json({ error: "That date has already passed." }, 400);

  // Same person, same day, within 10 minutes = a double tap; don't save twice
  const dupe = await env.DB.prepare(
    "SELECT id FROM bookings WHERE phone = ? AND date = ? AND created_at > datetime('now', '-10 minutes') LIMIT 1"
  ).bind(b.phone, b.date).first();
  if (dupe) return json({ ok: true, id: dupe.id });

  const row = await env.DB.prepare(
    `INSERT INTO bookings (trip_id, trip_name, date, adults, kids, kid_ages, island, name, phone, email, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`
  ).bind(b.trip_id, b.trip_name, b.date, b.adults, b.kids, b.kid_ages, b.island, b.name, b.phone, b.email, b.notes).first();

  ctx.waitUntil(notifyCaptain(env, { ...b, id: row.id }, url.origin).catch((e) => console.error("notify failed", e)));
  return json({ ok: true, id: row.id });
}

async function availability(env) {
  const { results } = await env.DB.prepare("SELECT date, status, note FROM days WHERE date >= ? ORDER BY date")
    .bind(todayEastern()).all();
  const days = {};
  // Notes on days he's off stay private
  for (const r of results) days[r.date] = { status: r.status, note: ["off", "on call", "booked"].includes(r.status) ? "" : r.note || "" };
  return json({ days }, 200, { "cache-control": "public, max-age=60" });
}

/* ---------------- Captain only ---------------- */

async function adminApi(request, env, path, who) {
  const m = request.method;

  if (path === "/api/admin/me") return json({ email: who });

  if (path === "/api/admin/bookings" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM bookings ORDER BY date ASC, created_at ASC LIMIT 1000").all();
    return json({ bookings: results, today: todayEastern() });
  }

  const bm = path.match(/^\/api\/admin\/bookings\/(\d+)$/);
  if (bm && m === "PATCH") {
    const d = await request.json();
    const sets = [], vals = [];
    if (d.status !== undefined) {
      if (!STATUSES.includes(d.status)) return json({ error: "Bad status" }, 400);
      sets.push("status = ?"); vals.push(d.status);
    }
    if (d.captain_notes !== undefined) { sets.push("captain_notes = ?"); vals.push(cleanMultiline(d.captain_notes, 2000)); }
    if (!sets.length) return json({ error: "Nothing to update" }, 400);
    sets.push("updated_at = ?"); vals.push(now());
    const row = await env.DB.prepare(`UPDATE bookings SET ${sets.join(", ")} WHERE id = ? RETURNING *`).bind(...vals, +bm[1]).first();
    return row ? json({ booking: row }) : json({ error: "Not found" }, 404);
  }

  if (path === "/api/admin/days" && m === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM days WHERE date >= date('now', '-60 days') ORDER BY date").all();
    return json({ days: results });
  }

  const dm = path.match(/^\/api\/admin\/days\/(\d{4}-\d{2}-\d{2})$/);
  if (dm && m === "PUT") {
    const d = await request.json();
    if (!DAY_STATUSES.includes(d.status)) return json({ error: "Bad status" }, 400);
    await env.DB.prepare(
      `INSERT INTO days (date, status, note, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(date) DO UPDATE SET status = excluded.status, note = excluded.note, updated_at = excluded.updated_at`
    ).bind(dm[1], d.status, clean(d.note, 200), now()).run();
    return json({ ok: true });
  }
  if (dm && m === "DELETE") {
    await env.DB.prepare("DELETE FROM days WHERE date = ?").bind(dm[1]).run();
    return json({ ok: true });
  }

  return json({ error: "Not found" }, 404);
}

function denied(path) {
  if (path.startsWith("/api/")) return json({ error: "Captain login required" }, 401);
  return new Response(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
     <title>Captain's Deck</title>
     <body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#050505;color:#f6f3ea;font-family:system-ui;text-align:center;padding:24px">
     <div><h1 style="margin:0 0 8px">Captain only</h1><p style="color:#b5afa2">This page is for Captain Ron. <a style="color:#ffd614" href="/">Back to the site</a></p></div>`,
    { status: 401, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

/**
 * Who's asking? Returns the captain's email when the request carries a valid
 * Cloudflare Access login for an allowed address, otherwise null.
 * Local testing only: DEV_ADMIN_EMAIL in .dev.vars skips the check.
 */
async function captain(request, env) {
  const host = new URL(request.url).hostname;
  if (env.DEV_ADMIN_EMAIL && /^(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)$/.test(host)) return env.DEV_ADMIN_EMAIL;
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return null;

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) return null;
  const payload = await verifyAccessJwt(token, env).catch(() => null);
  if (!payload?.email) return null;
  const allowed = String(env.ADMIN_EMAILS || "").toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  return allowed.length === 0 || allowed.includes(payload.email.toLowerCase()) ? payload.email : null;
}

let certCache = { at: 0, keys: [] };
async function verifyAccessJwt(token, env) {
  const [h, p, s] = token.split(".");
  const header = JSON.parse(b64urlText(h));
  const payload = JSON.parse(b64urlText(p));
  const team = `https://${env.ACCESS_TEAM_DOMAIN.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;

  if (Date.now() - certCache.at > 3600_000) {
    const res = await fetch(`${team}/cdn-cgi/access/certs`);
    certCache = { at: Date.now(), keys: (await res.json()).keys || [] };
  }
  const jwk = certCache.keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown key");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error("bad signature");

  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) throw new Error("wrong audience");
  if (payload.iss !== team) throw new Error("wrong issuer");
  if (payload.exp * 1000 < Date.now()) throw new Error("expired");
  return payload;
}
function b64urlBytes(s) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
const b64urlText = (s) => new TextDecoder().decode(b64urlBytes(s));
