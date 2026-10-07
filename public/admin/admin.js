/* Captain's Deck — bookings and calendar for Captain Ron. Settings come from /config.js */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmt = (iso, opts) => parseIso(iso).toLocaleDateString("en-US", opts);
const digits = (p) => String(p || "").replace(/[^\d+]/g, "");
const first = (name) => String(name || "").split(" ")[0];
const tripName = (id) => ([...CHARTERS, CUSTOM].find((t) => t.id === id) || {}).name;

const state = { bookings: [], days: {}, today: isoOf(new Date()), filter: "new", month: null };

const ICON = {
  phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  text: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
};

/* ---------- Talking to the server ---------- */
async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { "Content-Type": "application/json" }, ...opts });
  if (res.status === 401) { location.reload(); throw new Error("login"); }
  const out = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(out.error || "Request failed");
  return out;
}

async function load() {
  const [b, d, me] = await Promise.all([api("/api/admin/bookings"), api("/api/admin/days"), api("/api/admin/me")]);
  state.bookings = b.bookings;
  state.today = b.today || state.today;
  state.days = Object.fromEntries(d.days.map((x) => [x.date, x]));
  $("#hello").textContent = /ron/i.test(me.email) ? "Ahoy, Captain Ron" : `Signed in as ${me.email}`;
  render();
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Schedule helpers (same rules as the website) ---------- */
const weekend = (iso) => [0, 6].includes(parseIso(iso).getDay());
function normalFor(iso) {
  const trips = weekend(iso) ? SCHEDULE.weekends : SCHEDULE.weekdays;
  return trips === "all" ? "all" : trips.length === 1 && trips[0] === "sunset" ? "sunset" : "some";
}
function dayKind(iso) {
  const o = state.days[iso];
  if (o) return ["off", "on call", "booked"].includes(o.status) ? "off" : o.status === "sunset only" ? "sunset" : "all";
  return normalFor(iso) === "sunset" ? "sunset" : "all";
}
const kindLabel = { all: "All", sunset: "Sunset", off: "Off" };
function normalText(iso) {
  const n = normalFor(iso);
  return n === "all" ? "Normally every trip runs on this day." : n === "sunset" ? "Normally Sunset Irie Cruise only on this day." : "Normally select trips on this day.";
}

/* ---------- Requests ---------- */
function filtered() {
  const t = state.today;
  const b = state.bookings;
  if (state.filter === "new") return b.filter((x) => x.status === "new").sort((a, z) => a.date.localeCompare(z.date));
  if (state.filter === "upcoming") return b.filter((x) => x.status === "confirmed" && x.date >= t);
  if (state.filter === "past") return b.filter((x) => (x.status === "confirmed" || x.status === "done") && x.date < t || x.status === "done").sort((a, z) => z.date.localeCompare(a.date));
  return b.filter((x) => x.status === "declined" || x.status === "cancelled").sort((a, z) => z.date.localeCompare(a.date));
}

function smsLink(b, kind) {
  const when = fmt(b.date, { weekday: "long", month: "long", day: "numeric" });
  const msgs = {
    hello: `Hi ${first(b.name)}, this is Captain Ron with Reel Irie Charters about your ${b.trip_name} request for ${when}.`,
    confirm: `Hi ${first(b.name)}, Captain Ron here with Reel Irie Charters. You're all set for the ${b.trip_name} on ${when}! I'll send the dock location and meet time the day before. See you on the water!`,
    decline: `Hi ${first(b.name)}, Captain Ron here with Reel Irie Charters. Thanks so much for reaching out! Unfortunately ${when} doesn't work for the ${b.trip_name}. Would another day work for you?`,
  };
  return `sms:${digits(b.phone)}?&body=${encodeURIComponent(msgs[kind])}`;
}

function ago(created) {
  const t = new Date(created.replace(" ", "T") + "Z");
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return `${Math.max(m, 1)} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} hr ago`;
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function card(b) {
  const guests = `${b.adults} adult${b.adults == 1 ? "" : "s"}${b.kids ? ` · ${b.kids} kid${b.kids == 1 ? "" : "s"}${b.kid_ages ? ` (${esc(b.kid_ages)})` : ""}` : ""}`;
  const past = b.date < state.today;
  let actions = "";
  if (b.status === "new") actions = `<button class="btn btn-green" data-act="confirm" data-id="${b.id}">Confirm</button><button class="btn btn-danger" data-act="decline" data-id="${b.id}">Decline</button>`;
  else if (b.status === "confirmed") actions = past
    ? `<button class="btn btn-ghost" data-act="done" data-id="${b.id}">Mark done</button>`
    : `<button class="btn btn-danger" data-act="cancel" data-id="${b.id}">Cancel trip</button>`;
  else if (b.status === "declined" || b.status === "cancelled") actions = `<button class="btn btn-ghost" data-act="reopen" data-id="${b.id}">Move back to New</button>`;

  return `
  <article class="card" id="booking-${b.id}">
    <div class="card-top">
      <div class="datebox"><small>${fmt(b.date, { weekday: "short" })}</small><strong>${fmt(b.date, { day: "numeric" })}</strong><em>${fmt(b.date, { month: "short" })}</em></div>
      <div class="card-main">
        <span class="pill pill-${b.status}">${b.status}</span>
        <h3>${esc(b.trip_name)}</h3>
        <p class="meta">${guests}</p>
        ${b.island ? `<p class="meta">${esc(b.island)}</p>` : ""}
      </div>
    </div>
    <div class="who"><strong>${esc(b.name)}</strong><span>${esc(b.phone)} · ${esc(b.email)}</span></div>
    ${b.notes ? `<p class="notes">${esc(b.notes)}</p>` : ""}
    <div class="contact">
      <a href="tel:${esc(digits(b.phone))}">${ICON.phone} Call</a>
      <a href="${esc(smsLink(b, "hello"))}">${ICON.text} Text</a>
      <a href="mailto:${esc(b.email)}?subject=${encodeURIComponent("Your Reel Irie Charters trip")}">${ICON.mail} Email</a>
    </div>
    ${actions ? `<div class="actions">${actions}</div>` : ""}
    <details class="cap-notes"${b.captain_notes ? " open" : ""}>
      <summary>Private notes</summary>
      <textarea data-notes="${b.id}" placeholder="Only you see these. Deposit paid, meet at the north dock...">${esc(b.captain_notes || "")}</textarea>
    </details>
    <p class="received">Request #${b.id} · received ${ago(b.created_at)}</p>
  </article>`;
}

const EMPTY = {
  new: ["All caught up", "New booking requests will show up here."],
  upcoming: ["No confirmed trips yet", "Confirm a request and it moves here."],
  past: ["Nothing here yet", "Finished trips show up here."],
  declined: ["Nothing declined", "Declined and cancelled requests land here."],
};

function renderList() {
  const items = filtered();
  $("#list").innerHTML = items.length ? items.map(card).join("") : `<div class="empty"><strong>${EMPTY[state.filter][0]}</strong>${EMPTY[state.filter][1]}</div>`;
}

function renderStats() {
  const t = state.today;
  const week = isoOf(new Date(parseIso(t).getTime() + 7 * 864e5));
  const nNew = state.bookings.filter((b) => b.status === "new").length;
  $("#st-new").textContent = nNew;
  $("#st-up").textContent = state.bookings.filter((b) => b.status === "confirmed" && b.date >= t).length;
  $("#st-week").textContent = state.bookings.filter((b) => b.status === "confirmed" && b.date >= t && b.date < week).length;
  $("#badge-new").textContent = $("#tab-badge").textContent = nNew || "";
}

function render() {
  renderStats();
  renderList();
  renderCal();
}

/* ---------- Confirm / decline ---------- */
const actSheet = $("#act-sheet");
let pending = null;

function openAction(kind, b) {
  pending = { kind, b };
  const when = fmt(b.date, { weekday: "long", month: "long", day: "numeric" });
  const cfg = {
    confirm: ["Confirm this trip?", `${b.trip_name} for ${b.name} on ${when}.`, "Confirm", true, `Text ${first(b.name)} a confirmation`],
    decline: ["Decline this request?", `${b.trip_name} for ${b.name} on ${when}.`, "Decline", false, `Text ${first(b.name)} to offer another day`],
    cancel: ["Cancel this trip?", `${b.trip_name} for ${b.name} on ${when}.`, "Cancel Trip", false, `Text ${first(b.name)} about it`],
  }[kind];
  $("#act-title").textContent = cfg[0];
  $("#act-sub").textContent = cfg[1];
  $("#act-ok").textContent = cfg[2];
  $("#act-ok").className = `btn ${kind === "confirm" ? "btn-green" : "btn-danger"}`;
  const st = state.days[b.date];
  $("#act-block-row").hidden = !cfg[3];
  $("#act-block").checked = cfg[3] && !(st && st.status === "booked");
  $("#act-block-label").textContent = `Mark ${fmt(b.date, { weekday: "short", month: "short", day: "numeric" })} as booked on the website`;
  $("#act-text").checked = true;
  $("#act-text-label").textContent = cfg[4];
  actSheet.showModal();
}

actSheet.addEventListener("close", async () => {
  if (actSheet.returnValue !== "ok" || !pending) return;
  const { kind, b } = pending;
  pending = null;
  const status = { confirm: "confirmed", decline: "declined", cancel: "cancelled" }[kind];
  // Open the text right away (phones block it if it waits on the network)
  if ($("#act-text").checked) location.href = smsLink(b, kind === "confirm" ? "confirm" : "decline");
  try {
    await setStatus(b, status);
    if (kind === "confirm" && $("#act-block").checked) await saveDay(b.date, "booked", "");
    toast(kind === "confirm" ? "Trip confirmed" : kind === "decline" ? "Request declined" : "Trip cancelled");
  } catch (e) { toast("Couldn't save. Try again."); }
});

async function setStatus(b, status) {
  const { booking } = await api(`/api/admin/bookings/${b.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  Object.assign(b, booking);
  render();
}

$("#list").addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const b = state.bookings.find((x) => x.id == btn.dataset.id);
  const act = btn.dataset.act;
  if (act === "confirm" || act === "decline" || act === "cancel") return openAction(act, b);
  try {
    await setStatus(b, act === "done" ? "done" : "new");
    toast(act === "done" ? "Marked done" : "Moved back to New");
  } catch { toast("Couldn't save. Try again."); }
});

// Private notes save when you leave the box
$("#list").addEventListener("focusout", async (e) => {
  const ta = e.target.closest("[data-notes]");
  if (!ta) return;
  const b = state.bookings.find((x) => x.id == ta.dataset.notes);
  if ((b.captain_notes || "") === ta.value) return;
  try {
    await api(`/api/admin/bookings/${b.id}`, { method: "PATCH", body: JSON.stringify({ captain_notes: ta.value }) });
    b.captain_notes = ta.value;
    toast("Notes saved");
  } catch { toast("Couldn't save notes"); }
});

/* ---------- Calendar ---------- */
function renderCal() {
  const m = state.month || (state.month = new Date(parseIso(state.today).getFullYear(), parseIso(state.today).getMonth(), 1));
  $("#cal-title").textContent = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const startPad = m.getDay();
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const byDate = {};
  state.bookings.forEach((b) => { if (b.status === "new" || b.status === "confirmed") (byDate[b.date] = byDate[b.date] || []).push(b); });

  let html = "";
  for (let i = 0; i < startPad; i++) html += `<div class="day blank"></div>`;
  for (let d = 1; d <= days; d++) {
    const iso = isoOf(new Date(m.getFullYear(), m.getMonth(), d));
    const kind = dayKind(iso);
    const o = state.days[iso];
    const tag = o ? (o.status === "on call" ? "On call" : o.status === "booked" ? "Booked" : o.status === "off" ? "Off" : kindLabel[kind]) : kindLabel[kind];
    const dots = (byDate[iso] || []).slice(0, 3).map((b) => `<i class="${b.status === "new" ? "new" : ""}"></i>`).join("");
    html += `<button type="button" class="day s-${kind}${o ? " override" : ""}${iso < state.today ? " past" : ""}${iso === state.today ? " today" : ""}" data-date="${iso}" aria-label="${fmt(iso, { weekday: "long", month: "long", day: "numeric" })}: ${tag}">
      <span class="n">${d}</span><span class="tag">${tag}</span><span class="dots">${dots}</span></button>`;
  }
  $("#cal").innerHTML = html;
}

$("#cal-prev").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() - 1, 1); renderCal(); });
$("#cal-next").addEventListener("click", () => { state.month = new Date(state.month.getFullYear(), state.month.getMonth() + 1, 1); renderCal(); });

const daySheet = $("#day-sheet");
let editing = null;
$("#cal").addEventListener("click", (e) => {
  const cell = e.target.closest(".day[data-date]");
  if (!cell) return;
  editing = cell.dataset.date;
  const o = state.days[editing];
  $("#day-title").textContent = fmt(editing, { weekday: "long", month: "long", day: "numeric" });
  $("#day-normal").textContent = normalText(editing);
  $$('input[name="dstatus"]').forEach((r) => (r.checked = r.value === (o ? o.status : "")));
  $("#day-note").value = o ? o.note || "" : "";
  const list = state.bookings.filter((b) => b.date === editing && (b.status === "new" || b.status === "confirmed"));
  $("#day-bookings").innerHTML = list.map((b) => `<p><b>${b.status === "new" ? "Request" : "Confirmed"}:</b> ${esc(b.trip_name)} · ${esc(b.name)} · ${+b.adults + +b.kids} guests</p>`).join("");
  daySheet.showModal();
});

daySheet.addEventListener("close", async () => {
  if (daySheet.returnValue !== "ok" || !editing) return;
  const status = ($('input[name="dstatus"]:checked') || {}).value || "";
  try {
    await saveDay(editing, status, $("#day-note").value.trim());
    toast("Day saved");
  } catch { toast("Couldn't save. Try again."); }
  editing = null;
});

async function saveDay(date, status, note) {
  if (!status) {
    await api(`/api/admin/days/${date}`, { method: "DELETE" });
    delete state.days[date];
  } else {
    await api(`/api/admin/days/${date}`, { method: "PUT", body: JSON.stringify({ status, note }) });
    state.days[date] = { date, status, note };
  }
  render();
}

/* ---------- Navigation ---------- */
function show(view) {
  $$(".tab[data-view]").forEach((t) => t.classList.toggle("is-on", t.dataset.view === view));
  $("#view-requests").hidden = view !== "requests";
  $("#view-calendar").hidden = view !== "calendar";
  scrollTo(0, 0);
}
$$(".tab[data-view]").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));

function setFilter(f) {
  state.filter = f;
  $$(".chip").forEach((c) => c.classList.toggle("is-on", c.dataset.filter === f));
  renderList();
}
$$(".chip").forEach((c) => c.addEventListener("click", () => setFilter(c.dataset.filter)));
$$("[data-jump]").forEach((s) => s.addEventListener("click", () => { show("requests"); setFilter(s.dataset.jump); }));

$("#refresh").addEventListener("click", async (e) => {
  const b = e.currentTarget;
  b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
  try { await load(); toast("Up to date"); } catch { toast("Couldn't refresh"); }
});

// Close sheets by tapping the dark area
$$(".sheet").forEach((s) => s.addEventListener("click", (e) => { if (e.target === s) s.close("cancel"); }));

// Check for new requests when he comes back to the app
document.addEventListener("visibilitychange", () => { if (!document.hidden) load().catch(() => {}); });

/* ---------- Start ---------- */
load().then(() => {
  // Links from the booking email: /admin/#booking-12
  const m = location.hash.match(/^#booking-(\d+)$/);
  if (!m) return;
  const b = state.bookings.find((x) => x.id == m[1]);
  if (!b) return;
  setFilter(b.status === "new" ? "new" : b.status === "confirmed" ? (b.date >= state.today ? "upcoming" : "past") : b.status === "done" ? "past" : "declined");
  const el = document.getElementById(`booking-${b.id}`);
  if (el) { el.scrollIntoView({ block: "start" }); el.classList.add("flash"); }
}).catch((e) => {
  if (e.message !== "login") $("#list").innerHTML = `<div class="empty"><strong>Couldn't load bookings</strong>Check your connection and tap refresh.</div>`;
});
