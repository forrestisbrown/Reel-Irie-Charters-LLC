/* Captain's Deck — bookings, trips, calendar and customers for Captain Ron.
   Trip names and the weekly schedule come from /config.js */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const pad = (n) => String(n).padStart(2, "0");
const isoOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d); };
const fmt = (iso, opts) => parseIso(iso).toLocaleDateString("en-US", opts);
const longDate = (iso) => fmt(iso, { weekday: "long", month: "long", day: "numeric" });
const shortDate = (iso) => fmt(iso, { weekday: "short", month: "short", day: "numeric" });
const digits = (p) => String(p || "").replace(/[^\d+]/g, "");
const first = (name) => String(name || "").split(" ")[0];
const guests = (b) => +b.adults + +b.kids;
const custKey = (b) => digits(b.phone).slice(-10) || String(b.email || "").toLowerCase();
const mobile = () => matchMedia("(max-width: 959px)").matches;

const state = {
  bookings: [], days: {}, today: isoOf(new Date()), month: null,
  view: "inbox", inbox: "new", trips: "upcoming", sel: null, // sel: { type: "booking" | "customer", id }
};

const ICON = {
  phone: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
  text: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="m15 6-6 6 6 6"/></svg>',
};

/* ---------- Server ---------- */
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
  $("#hello").textContent = me.email.toLowerCase() === String(CONFIG.email || "").toLowerCase() ? "Ahoy, Captain Ron" : me.email;
  render();
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2200);
}

function ago(created) {
  const t = new Date(String(created).replace(" ", "T") + "Z");
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 60) return `${Math.max(m, 1)}m ago`;
  if (m < 1440) return `${Math.round(m / 60)}h ago`;
  if (m < 10080) return `${Math.round(m / 1440)}d ago`;
  return t.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ---------- Schedule (same rules as the website) ---------- */
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
function dayLabel(iso) {
  const o = state.days[iso];
  if (o) return { off: "Off", "on call": "On call", booked: "Booked", "sunset only": "Sunset only", open: "All trips" }[o.status];
  return normalFor(iso) === "sunset" ? "Sunset only" : "All trips";
}

/* ---------- Rows ---------- */
const search = (id) => ($(id).value || "").trim().toLowerCase();
const matches = (b, q) => !q || [b.name, b.phone, b.email, b.trip_name, b.island].join(" ").toLowerCase().includes(q) || digits(b.phone).includes(q.replace(/\D/g, "") || "~");

function bookingRow(b, { showTime = true } = {}) {
  const sel = state.sel && state.sel.type === "booking" && state.sel.id == b.id;
  return `<button class="row${sel ? " is-sel" : ""}" data-open="booking" data-id="${b.id}">
    <span class="row-date"><b>${fmt(b.date, { day: "numeric" })}</b><small>${fmt(b.date, { month: "short" })}</small></span>
    <span class="row-main"><span class="row-name">${esc(b.name)}</span><span class="row-sub">${esc(b.trip_name)} · ${guests(b)} guest${guests(b) === 1 ? "" : "s"}</span></span>
    <span class="row-end"><span class="pill pill-${b.status}">${b.status}</span>${showTime ? `<span class="row-time">${ago(b.created_at)}</span>` : ""}</span>
  </button>`;
}

const empty = (title, sub) => `<div class="empty"><strong>${title}</strong>${sub}</div>`;

function renderInbox() {
  const q = search("#q-inbox");
  const items = state.bookings
    .filter((b) => (state.inbox === "new" ? b.status === "new" : ["declined", "cancelled"].includes(b.status)) && matches(b, q))
    .sort((a, z) => String(z.updated_at || z.created_at).localeCompare(String(a.updated_at || a.created_at)));
  const list = $("#list-inbox");
  list.innerHTML = items.map((b) => bookingRow(b)).join("");
  list.insertAdjacentHTML("afterend", "");
  $("#inbox-empty")?.remove();
  if (!items.length) list.insertAdjacentHTML("afterend", `<div id="inbox-empty">${q ? empty("No matches", "Try a different search.") : state.inbox === "new" ? empty("All caught up", "New booking requests land here.") : empty("Nothing declined", "Declined and cancelled requests land here.")}</div>`);
}

function renderTrips() {
  const q = search("#q-trips");
  const t = state.today;
  const up = state.trips === "upcoming";
  const items = state.bookings
    .filter((b) => (up ? b.status === "confirmed" && b.date >= t : b.status === "done" || (b.status === "confirmed" && b.date < t)) && matches(b, q))
    .sort((a, z) => (up ? a.date.localeCompare(z.date) : z.date.localeCompare(a.date)));
  let html = "", last = "";
  items.forEach((b) => {
    if (b.date !== last) {
      last = b.date;
      const label = b.date === t ? "Today" : longDate(b.date);
      const st = dayLabel(b.date);
      html += `<div class="group${dayKind(b.date) === "off" ? " off" : ""}"><span>${label}</span><em>${up ? st : ""}</em></div>`;
    }
    html += bookingRow(b, { showTime: false });
  });
  $("#list-trips").innerHTML = html;
  $("#trips-empty")?.remove();
  if (!items.length) $("#list-trips").insertAdjacentHTML("afterend", `<div id="trips-empty">${q ? empty("No matches", "Try a different search.") : up ? empty("No upcoming trips", "Confirm a request and it shows up here.") : empty("No past trips yet", "Finished trips show up here.")}</div>`);
}

function customers() {
  const map = new Map();
  [...state.bookings].sort((a, z) => String(a.created_at).localeCompare(String(z.created_at))).forEach((b) => {
    const k = custKey(b);
    const c = map.get(k) || { key: k, name: b.name, phone: b.phone, email: b.email, bookings: [] };
    Object.assign(c, { name: b.name, phone: b.phone, email: b.email }); // newest details win
    c.bookings.push(b);
    map.set(k, c);
  });
  return [...map.values()].map((c) => {
    const trips = c.bookings.filter((b) => ["confirmed", "done"].includes(b.status));
    const lastDate = c.bookings.map((b) => b.date).sort().pop();
    return { ...c, trips: trips.length, lastDate };
  }).sort((a, z) => z.lastDate.localeCompare(a.lastDate));
}

const COLORS = ["#19c83c", "#ffd614", "#ff6a5f", "#7fd0ff", "#c9a7ff"];
const initials = (n) => String(n || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
const colorFor = (k) => COLORS[[...k].reduce((s, ch) => s + ch.charCodeAt(0), 0) % COLORS.length];

function renderCustomers() {
  const q = search("#q-customers");
  const list = customers().filter((c) => !q || [c.name, c.phone, c.email].join(" ").toLowerCase().includes(q));
  $("#list-customers").innerHTML = list.map((c) => {
    const sel = state.sel && state.sel.type === "customer" && state.sel.id === c.key;
    return `<button class="row${sel ? " is-sel" : ""}" data-open="customer" data-id="${esc(c.key)}">
      <span class="avatar" style="background:${colorFor(c.key)}">${esc(initials(c.name))}</span>
      <span class="row-main"><span class="row-name">${esc(c.name)}</span><span class="row-sub">${esc(c.phone)} · ${c.trips} trip${c.trips === 1 ? "" : "s"}</span></span>
      <span class="row-end"><span class="row-time">Last: ${fmt(c.lastDate, { month: "short", day: "numeric" })}</span></span>
    </button>`;
  }).join("");
  $("#cust-empty")?.remove();
  if (!list.length) $("#list-customers").insertAdjacentHTML("afterend", `<div id="cust-empty">${q ? empty("No matches", "Try a different search.") : empty("No customers yet", "Everyone who books shows up here.")}</div>`);
}

function renderKpis() {
  const t = state.today;
  const week = isoOf(new Date(parseIso(t).getTime() + 7 * 864e5));
  const month = t.slice(0, 7);
  const confirmed = state.bookings.filter((b) => b.status === "confirmed");
  const nextWeek = confirmed.filter((b) => b.date >= t && b.date < week);
  const nNew = state.bookings.filter((b) => b.status === "new").length;
  $("#k-new").textContent = nNew;
  $("#k-week").textContent = nextWeek.length;
  $("#k-guests").textContent = nextWeek.reduce((s, b) => s + guests(b), 0);
  $("#k-month").textContent = state.bookings.filter((b) => ["confirmed", "done"].includes(b.status) && b.date.startsWith(month)).length;
  $("#badge-inbox").textContent = nNew || "";
}

function render() {
  renderKpis();
  renderInbox();
  renderTrips();
  renderCustomers();
  renderCal();
  if (state.sel) renderDetail();
}

/* ---------- Detail panel ---------- */
const detail = $("#detail");

function smsLink(b, kind) {
  const when = longDate(b.date);
  const msgs = {
    hello: `Hi ${first(b.name)}, this is Captain Ron with Reel Irie Charters about your ${b.trip_name} request for ${when}.`,
    confirm: `Hi ${first(b.name)}, Captain Ron here with Reel Irie Charters. You're all set for the ${b.trip_name} on ${when}! I'll send the dock location and meet time the day before. See you on the water!`,
    decline: `Hi ${first(b.name)}, Captain Ron here with Reel Irie Charters. Thanks so much for reaching out! Unfortunately ${when} doesn't work for the ${b.trip_name}. Would another day work for you?`,
    cancel: `Hi ${first(b.name)}, Captain Ron here with Reel Irie Charters. I'm sorry, but I need to cancel the ${b.trip_name} on ${when}. Can we find another day that works for you?`,
  };
  return `sms:${digits(b.phone)}?&body=${encodeURIComponent(msgs[kind])}`;
}

const contactBtns = (p) => `<div class="contact">
  <a href="tel:${esc(digits(p.phone))}">${ICON.phone} Call</a>
  <a href="${esc(p.sms || `sms:${digits(p.phone)}`)}">${ICON.text} Text</a>
  <a href="mailto:${esc(p.email)}?subject=${encodeURIComponent("Your Reel Irie Charters trip")}">${ICON.mail} Email</a>
</div>`;

function bookingDetail(b) {
  const past = b.date < state.today;
  let actions = "";
  if (b.status === "new") actions = `<button class="btn btn-green" data-act="confirm">Confirm</button><button class="btn btn-danger" data-act="decline">Decline</button>`;
  else if (b.status === "confirmed" && !past) actions = `<button class="btn btn-danger" data-act="cancel">Cancel Trip</button>`;
  else if (b.status === "confirmed" && past) actions = `<button class="btn btn-ghost" data-act="done">Mark Done</button>`;
  else if (["declined", "cancelled"].includes(b.status)) actions = `<button class="btn btn-ghost" data-act="reopen">Move Back to New</button>`;

  const others = state.bookings.filter((x) => x.id !== b.id && custKey(x) === custKey(b));
  return `
  <div class="d-top">
    <button class="d-back" type="button" data-close>${ICON.back} Back</button>
    <span class="d-ref">Request #${b.id} · ${ago(b.created_at)}</span>
    <span class="pill pill-${b.status}">${b.status}</span>
  </div>
  <div class="d-body">
    <div class="d-who"><h2>${esc(b.name)}</h2><p>${esc(b.phone)} · ${esc(b.email)}</p></div>
    ${contactBtns({ phone: b.phone, email: b.email, sms: smsLink(b, "hello") })}
    <section class="card">
      <h4>Trip</h4>
      <dl class="facts">
        <div class="full"><dt>Trip</dt><dd>${esc(b.trip_name)}</dd></div>
        <div><dt>Date</dt><dd>${shortDate(b.date)}</dd></div>
        <div><dt>Website shows</dt><dd>${dayLabel(b.date)}</dd></div>
        <div><dt>Adults</dt><dd>${b.adults}</dd></div>
        <div><dt>Kids</dt><dd>${b.kids}${b.kids && b.kid_ages ? ` <span style="color:var(--muted);font-weight:600">(ages ${esc(b.kid_ages)})</span>` : ""}</dd></div>
        <div class="full"><dt>Island</dt><dd>${esc(b.island || "Captain's choice")}</dd></div>
      </dl>
    </section>
    ${b.notes ? `<section class="card"><h4>From ${esc(first(b.name))}</h4><p class="msg-box">${esc(b.notes)}</p></section>` : ""}
    ${actions ? `<div class="actions">${actions}</div>` : ""}
    <section class="card notes-box">
      <h4>Private notes <span class="saved" id="saved">Saved</span></h4>
      <textarea id="cap-notes" placeholder="Only you see these. Deposit paid, meet at the north dock...">${esc(b.captain_notes || "")}</textarea>
    </section>
    ${others.length ? `<section class="card"><h4>Other bookings from ${esc(first(b.name))}</h4><div class="list">${others.map((x) => bookingRow(x, { showTime: false })).join("")}</div></section>` : ""}
    <p class="meta-line">Received ${new Date(String(b.created_at).replace(" ", "T") + "Z").toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}${b.updated_at ? ` · updated ${ago(b.updated_at)}` : ""}</p>
  </div>`;
}

function customerDetail(c) {
  const sorted = [...c.bookings].sort((a, z) => z.date.localeCompare(a.date));
  const firstReq = [...c.bookings].sort((a, z) => String(a.created_at).localeCompare(String(z.created_at)))[0];
  const kids = c.bookings.map((b) => b.kid_ages).filter(Boolean).pop();
  return `
  <div class="d-top">
    <button class="d-back" type="button" data-close>${ICON.back} Back</button>
    <span class="d-ref">Customer</span>
  </div>
  <div class="d-body">
    <div class="d-who"><h2>${esc(c.name)}</h2><p>${esc(c.phone)} · ${esc(c.email)}</p></div>
    ${contactBtns(c)}
    <section class="card">
      <h4>Summary</h4>
      <dl class="facts">
        <div><dt>Trips</dt><dd>${c.trips}</dd></div>
        <div><dt>Requests</dt><dd>${c.bookings.length}</dd></div>
        <div><dt>Customer since</dt><dd>${new Date(String(firstReq.created_at).replace(" ", "T") + "Z").toLocaleDateString("en-US", { month: "short", year: "numeric" })}</dd></div>
        <div><dt>Latest date</dt><dd>${shortDate(c.lastDate)}</dd></div>
        ${kids ? `<div class="full"><dt>Kids' ages (last trip)</dt><dd>${esc(kids)}</dd></div>` : ""}
      </dl>
    </section>
    <section class="card"><h4>Bookings</h4><div class="list">${sorted.map((b) => bookingRow(b, { showTime: false })).join("")}</div></section>
  </div>`;
}

function renderDetail() {
  if (!state.sel) return;
  if (state.sel.type === "booking") {
    const b = state.bookings.find((x) => x.id == state.sel.id);
    if (!b) return closeDetail();
    detail.innerHTML = bookingDetail(b);
  } else {
    const c = customers().find((x) => x.key === state.sel.id);
    if (!c) return closeDetail();
    detail.innerHTML = customerDetail(c);
  }
}

function openDetail(type, id) {
  const wasOpen = detail.classList.contains("open");
  state.sel = { type, id };
  renderDetail();
  renderInbox(); renderTrips(); renderCustomers(); // highlight the selected row
  detail.scrollTop = 0;
  if (mobile()) {
    detail.classList.add("open");
    document.documentElement.classList.add("detail-open");
    if (!wasOpen) history.pushState({ detail: true }, "");
  }
}

function closeDetail(fromHistory) {
  if (mobile() && detail.classList.contains("open")) {
    detail.classList.remove("open");
    document.documentElement.classList.remove("detail-open");
    if (!fromHistory && history.state && history.state.detail) history.back();
  }
  state.sel = null;
  detail.innerHTML = `<div class="detail-empty"><img src="/images/logo.webp" alt="" width="520" height="507"><p>Select a request, trip or customer to see the details.</p></div>`;
  renderInbox(); renderTrips(); renderCustomers();
}
addEventListener("popstate", () => { if (detail.classList.contains("open")) closeDetail(true); });

// Rows anywhere (lists and inside the detail panel)
document.addEventListener("click", (e) => {
  const row = e.target.closest("[data-open]");
  if (row) return openDetail(row.dataset.open, row.dataset.open === "booking" ? +row.dataset.id : row.dataset.id);
  if (e.target.closest("[data-close]")) closeDetail();
});

// Actions in the detail panel
detail.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn || !state.sel || state.sel.type !== "booking") return;
  const b = state.bookings.find((x) => x.id == state.sel.id);
  const act = btn.dataset.act;
  if (["confirm", "decline", "cancel"].includes(act)) return openAction(act, b);
  try {
    await setStatus(b, act === "done" ? "done" : "new");
    toast(act === "done" ? "Marked done" : "Moved back to New");
  } catch { toast("Couldn't save. Try again."); }
});

// Private notes autosave
let noteTimer;
detail.addEventListener("input", (e) => {
  if (e.target.id !== "cap-notes") return;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => saveNotes(e.target.value), 800);
});
detail.addEventListener("focusout", (e) => { if (e.target.id === "cap-notes") { clearTimeout(noteTimer); saveNotes(e.target.value); } });
async function saveNotes(value) {
  const b = state.bookings.find((x) => state.sel && x.id == state.sel.id);
  if (!b || (b.captain_notes || "") === value) return;
  try {
    await api(`/api/admin/bookings/${b.id}`, { method: "PATCH", body: JSON.stringify({ captain_notes: value }) });
    b.captain_notes = value;
    const s = $("#saved");
    if (s) { s.classList.add("show"); setTimeout(() => s.classList.remove("show"), 1400); }
  } catch { toast("Couldn't save notes"); }
}

/* ---------- Confirm / decline / cancel ---------- */
const actSheet = $("#act-sheet");
let pending = null;

function openAction(kind, b) {
  pending = { kind, b };
  const when = longDate(b.date);
  const day = state.days[b.date];
  const otherTrips = state.bookings.some((x) => x.id !== b.id && x.date === b.date && x.status === "confirmed");
  const cfg = {
    confirm: ["Confirm this trip?", "Confirm", "btn-green", `Text ${first(b.name)} a confirmation`],
    decline: ["Decline this request?", "Decline", "btn-danger", `Text ${first(b.name)} to offer another day`],
    cancel: ["Cancel this trip?", "Cancel Trip", "btn-danger", `Text ${first(b.name)} about the cancellation`],
  }[kind];
  $("#act-title").textContent = cfg[0];
  $("#act-sub").textContent = `${b.trip_name} for ${b.name} on ${when}.`;
  $("#act-ok").textContent = cfg[1];
  $("#act-ok").className = `btn ${cfg[2]}`;

  // Day option: block the day when confirming, reopen it when cancelling or declining
  const row = $("#act-day-row");
  if (kind === "confirm") {
    row.hidden = !!(day && day.status === "booked");
    $("#act-day").checked = true;
    $("#act-day-label").textContent = `Mark ${shortDate(b.date)} as booked on the website`;
  } else {
    row.hidden = !(day && day.status === "booked");
    $("#act-day").checked = !otherTrips;
    $("#act-day-label").textContent = `Reopen ${shortDate(b.date)} for bookings on the website${otherTrips ? " (another trip is still confirmed that day)" : ""}`;
  }
  $("#act-text").checked = true;
  $("#act-text-label").textContent = cfg[3];
  actSheet.returnValue = ""; // a dismissed sheet must never reuse the last answer
  actSheet.showModal();
}

actSheet.addEventListener("close", async () => {
  const go = actSheet.returnValue === "ok" && pending;
  const job = pending;
  pending = null;
  if (!go) return;
  const { kind, b } = job;
  const status = { confirm: "confirmed", decline: "declined", cancel: "cancelled" }[kind];
  const dayChange = !$("#act-day-row").hidden && $("#act-day").checked;
  // Open Messages right away (phones block it if it waits on the network)
  if ($("#act-text").checked) location.href = smsLink(b, kind);
  try {
    await setStatus(b, status);
    if (dayChange) await saveDay(b.date, kind === "confirm" ? "booked" : "", "");
    const reopened = dayChange && kind !== "confirm" ? ` · ${shortDate(b.date)} reopened` : "";
    toast((kind === "confirm" ? "Trip confirmed" : kind === "decline" ? "Request declined" : "Trip cancelled") + reopened);
  } catch { toast("Couldn't save. Try again."); }
});

async function setStatus(b, status) {
  const { booking } = await api(`/api/admin/bookings/${b.id}`, { method: "PATCH", body: JSON.stringify({ status }) });
  Object.assign(b, booking);
  render();
}

/* ---------- Calendar ---------- */
function renderCal() {
  const t = parseIso(state.today);
  const m = state.month || (state.month = new Date(t.getFullYear(), t.getMonth(), 1));
  $("#cal-title").textContent = m.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const byDate = {};
  state.bookings.forEach((b) => { if (b.status === "new" || b.status === "confirmed") (byDate[b.date] = byDate[b.date] || []).push(b); });

  let html = "";
  for (let i = 0; i < m.getDay(); i++) html += `<div class="day blank"></div>`;
  for (let d = 1; d <= days; d++) {
    const iso = isoOf(new Date(m.getFullYear(), m.getMonth(), d));
    const kind = dayKind(iso);
    const o = state.days[iso];
    const tag = o ? dayLabel(iso).replace("Sunset only", "Sunset").replace("All trips", "All") : kind === "sunset" ? "Sunset" : "All";
    const dots = (byDate[iso] || []).slice(0, 3).map((b) => `<i class="${b.status === "new" ? "new" : ""}"></i>`).join("");
    html += `<button type="button" class="day s-${kind}${o ? " override" : ""}${iso < state.today ? " past" : ""}${iso === state.today ? " today" : ""}" data-date="${iso}" aria-label="${longDate(iso)}: ${dayLabel(iso)}">
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
  $("#day-title").textContent = longDate(editing);
  $("#day-normal").textContent = normalFor(editing) === "all" ? "Normally every trip runs on this day." : "Normally Sunset Irie Cruise only on this day.";
  $$('input[name="dstatus"]').forEach((r) => (r.checked = r.value === (o ? o.status : "")));
  $("#day-note").value = o ? o.note || "" : "";
  const list = state.bookings.filter((b) => b.date === editing && (b.status === "new" || b.status === "confirmed"));
  daySheet.returnValue = "";
  $("#day-bookings").innerHTML = list.map((b) => `<p><b>${b.status === "new" ? "Request" : "Confirmed"}:</b> ${esc(b.trip_name)} · ${esc(b.name)} · ${guests(b)} guests</p>`).join("");
  daySheet.showModal();
});
daySheet.addEventListener("close", async () => {
  if (daySheet.returnValue !== "ok" || !editing) { editing = null; return; }
  const status = ($('input[name="dstatus"]:checked') || {}).value || "";
  try { await saveDay(editing, status, $("#day-note").value.trim()); toast("Day saved"); }
  catch { toast("Couldn't save. Try again."); }
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

/* ---------- Tabs, filters, search ---------- */
function show(view) {
  state.view = view;
  $$(".tab").forEach((t) => t.classList.toggle("is-on", t.dataset.view === view));
  ["inbox", "trips", "calendar", "customers"].forEach((v) => ($(`#view-${v}`).hidden = v !== view));
  scrollTo(0, 0);
}
$$(".tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));
$$("[data-inbox]").forEach((b) => b.addEventListener("click", () => {
  state.inbox = b.dataset.inbox;
  $$("[data-inbox]").forEach((x) => x.classList.toggle("is-on", x === b));
  renderInbox();
}));
$$("[data-trips]").forEach((b) => b.addEventListener("click", () => {
  state.trips = b.dataset.trips;
  $$("[data-trips]").forEach((x) => x.classList.toggle("is-on", x === b));
  renderTrips();
}));
$("#q-inbox").addEventListener("input", renderInbox);
$("#q-trips").addEventListener("input", renderTrips);
$("#q-customers").addEventListener("input", renderCustomers);

$("#refresh").addEventListener("click", async (e) => {
  const b = e.currentTarget;
  b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
  try { await load(); toast("Up to date"); } catch { toast("Couldn't refresh"); }
});
$$(".sheet").forEach((s) => s.addEventListener("click", (e) => { if (e.target === s) s.close("cancel"); }));
document.addEventListener("visibilitychange", () => { if (!document.hidden) load().catch(() => {}); });

/* ---------- Start ---------- */
load().then(() => {
  // Link from the booking email: /admin/#booking-12
  const m = location.hash.match(/^#booking-(\d+)$/);
  if (m && state.bookings.some((x) => x.id == m[1])) {
    history.replaceState(null, "", location.pathname);
    openDetail("booking", +m[1]);
  }
}).catch((e) => {
  if (e.message !== "login") $("#list-inbox").outerHTML = `<div class="list" id="list-inbox"></div>${empty("Couldn't load bookings", "Check your connection and tap refresh.")}`;
});
