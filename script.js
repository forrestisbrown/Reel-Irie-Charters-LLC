/* ==========================================================
   REEL IRIE CHARTERS — edit your info and trips right here.
   ========================================================== */

const CONFIG = {
  captainName: "Captain Ron Brown",
  phone: "(727) 386-1281",           // shown on the site
  phoneDial: "+17273861281",         // used for tap to call / text
  // Where booking requests are sent (FormSubmit.co). The first request sends an
  // activation email to this address; click it once and requests start arriving.
  formEmail: "forrestisbrown@icloud.com",
  // Optional: a Google Sheet (File > Share > Publish to web > CSV) listing days off,
  // on call days and booked dates. Leave "" to use only the weekly schedule below.
  availabilitySheet: "",
  // Forecast spot: just off the St. Pete beaches
  forecastSpot: { lat: 27.69, lon: -82.74 },
};

// Which trips run on which days. "all" means every trip, or list trip ids.
// Specific dates can be changed in the availability sheet (see README).
const SCHEDULE = {
  weekdays: ["sunset"], // Monday to Friday
  weekends: "all",      // Saturday and Sunday
};

// Islands. These match the pages in /islands/.
const ISLANDS = [
  { id: "shell-key", name: "Shell Key" },
  { id: "egmont-key", name: "Egmont Key" },
  { id: "caladesi-island", name: "Caladesi Island" },
  { id: "pass-a-grille", name: "Pass-a-Grille" },
  { id: "fort-de-soto", name: "Fort De Soto" },
];

// The trip menu. Add, remove or reorder trips here.
// price: number, or null to show "Call"   islands: which island pages list this trip
const CHARTERS = [
  {
    id: "island-hopper",
    name: "Island Hopper",
    when: "Half Day",
    hours: 4,
    guests: 6,
    price: 500,
    badge: "Most Popular",
    desc: "Two of our favorite spots in one trip. Wade onto a barrier island, swim a sandbar and watch for dolphins on the ride between.",
    perks: ["2 island stops", "Swimming", "Shelling", "Dolphin spotting"],
    islands: ["shell-key", "fort-de-soto", "pass-a-grille", "egmont-key", "caladesi-island"],
  },
  {
    id: "sunset",
    name: "Sunset Irie Cruise",
    when: "Sunset",
    hours: 2,
    guests: 6,
    price: 300,
    badge: "Golden Hour",
    desc: "Cruise the Pass-a-Grille channel as the sky lights up, then watch the sun drop into the Gulf. Bring your drinks and your people.",
    perks: ["Sunset views", "Dolphins", "Date night", "Celebrations"],
    islands: ["pass-a-grille", "shell-key", "fort-de-soto"],
    time: "Sunset",
  },
  {
    id: "sandbar-sunset",
    name: "Sandbar to Sunset",
    when: "Afternoon",
    hours: 4,
    guests: 6,
    price: 575,
    badge: "Best of Both",
    desc: "Spend the afternoon anchored up at a sandbar, then stay out for the sunset ride home. The full Irie experience.",
    perks: ["Sandbar time", "Swimming", "Sunset ride", "Bring a picnic"],
    islands: ["shell-key", "fort-de-soto", "pass-a-grille"],
    time: "Afternoon",
  },
  {
    id: "egmont",
    name: "Egmont Key Explorer",
    when: "Half Day",
    hours: 4,
    guests: 6,
    price: 550,
    desc: "Walk the brick roads of Fort Dade, see the 1858 lighthouse, snorkel near the old fort ruins and meet the gopher tortoises.",
    perks: ["Fort ruins", "Lighthouse", "Snorkeling", "Wildlife"],
    islands: ["egmont-key"],
  },
  {
    id: "full-day",
    name: "Full Day Island Escape",
    when: "Full Day",
    hours: 6,
    guests: 6,
    price: 750,
    desc: "Three stops, lunch on the sand and nowhere to be. Pick your islands or let Captain Ron choose the best water of the day.",
    perks: ["3 island stops", "Lunch on the sand", "Swimming", "Shelling"],
    islands: ["shell-key", "egmont-key", "caladesi-island", "pass-a-grille", "fort-de-soto"],
  },
];

const CUSTOM = {
  id: "custom",
  name: "Celebrations & Custom",
  when: "Your Call",
  hours: null,
  guests: 6,
  price: null,
  desc: "Birthdays, proposals, family in town, a day off with your crew. Tell us the occasion and we'll plan the trip around it.",
  perks: ["Birthdays", "Proposals", "Family visits", "Any idea you've got"],
};

/* ---------- Everything below runs the site ---------- */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => "$" + n.toLocaleString("en-US");
const allTrips = [...CHARTERS, CUSTOM];
const findTrip = (id) => allTrips.find((t) => t.id === id);
const islandName = (id) => (ISLANDS.find((i) => i.id === id) || {}).name;
const params = new URLSearchParams(location.search);

/* ---------- Availability ---------- */
// Date overrides from the availability sheet, keyed "YYYY-MM-DD"
const overrides = {};
const isWeekend = (iso) => { const [y, m, d] = iso.split("-").map(Number); return [0, 6].includes(new Date(y, m - 1, d).getDay()); };
const runsOn = (trips, id) => id === "custom" || trips === "all" || trips.includes(id);

function dayStatus(iso) {
  const o = overrides[iso];
  if (o) return o;
  return isWeekend(iso)
    ? { open: true, trips: SCHEDULE.weekends }
    : { open: true, trips: SCHEDULE.weekdays };
}

function tripDays(id) {
  const wd = runsOn(SCHEDULE.weekdays, id), we = runsOn(SCHEDULE.weekends, id);
  return wd && we ? "Every day" : we ? "Weekends" : wd ? "Weekdays" : "By request";
}

function tripsLabel(st) {
  if (!st.open) return st.note || "Unavailable";
  if (st.trips === "all") return "All trips";
  if (st.trips.length === 1) return (findTrip(st.trips[0]) || {}).name || "Limited";
  return "Select trips";
}

// Sheet columns: date, status, note. Status: off / booked / sunset only / open
const pad = (n) => String(n).padStart(2, "0");
function toIso(s) {
  s = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (m) return `${m[3].length === 2 ? "20" + m[3] : m[3]}-${pad(m[1])}-${pad(m[2])}`;
  // Other formats Google Sheets might use, like "Oct 18, 2026" or "Sat, Oct 18, 2026"
  const d = /[a-z]/i.test(s) && /\d{4}/.test(s) ? new Date(s.replace(/^[a-z]+,\s*/i, "")) : null;
  return d && !isNaN(d) ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : null;
}

// Splits one CSV line, respecting "quoted, fields"
function csvCells(line) {
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q && ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
    else if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const availabilityReady = (async () => {
  if (!CONFIG.availabilitySheet) return;
  try {
    const csv = await (await fetch(CONFIG.availabilitySheet, { cache: "no-store" })).text();
    const now = new Date();
    const todayIso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    csv.split(/\r?\n/).forEach((line) => {
      const [date = "", status = "", note = ""] = csvCells(line);
      const iso = toIso(date); // the header row and blank rows fail here and are skipped
      const s = status.toLowerCase();
      if (!iso || !s || iso < todayIso) return;
      if (/off|booked|closed|on call|unavailable/.test(s)) overrides[iso] = { open: false, note: s.includes("booked") ? "Booked" : "Unavailable" };
      else if (/sunset/.test(s)) overrides[iso] = { open: true, trips: ["sunset"], note };
      else if (/open|all/.test(s)) overrides[iso] = { open: true, trips: "all", note };
    });
  } catch (err) {
    console.warn("Availability sheet not loaded:", err);
  }
})();

// Contact details everywhere
$$("[data-cfg]").forEach((el) => { if (CONFIG[el.dataset.cfg]) el.textContent = CONFIG[el.dataset.cfg]; });
$$('[data-cfg-link="tel"]').forEach((a) => (a.href = "tel:" + CONFIG.phoneDial));
$$('[data-cfg-link="sms"]').forEach((a) => (a.href = "sms:" + CONFIG.phoneDial));
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

/* ---------- Header ---------- */
const header = $(".nav");
const onScroll = () => header.classList.toggle("is-scrolled", scrollY > 24);
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// Islands dropdown (hover opens it on desktop; click works everywhere)
$$(".drop").forEach((drop) => {
  const btn = $("button", drop);
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    drop.classList.toggle("is-open", !open);
  });
  document.addEventListener("click", (e) => {
    if (!drop.contains(e.target)) { btn.setAttribute("aria-expanded", "false"); drop.classList.remove("is-open"); }
  });
});

// Full screen menu
const menu = $("#menu");
const menuBtn = $(".nav-toggle");
function setMenu(open) {
  menu.classList.toggle("is-open", open);
  menu.setAttribute("aria-hidden", String(!open));
  menu.inert = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  document.documentElement.classList.toggle("menu-open", open);
  if (open) $(".menu-close", menu).focus();
}
menu.inert = true;
menuBtn.addEventListener("click", () => setMenu(true));
$(".menu-close", menu).addEventListener("click", () => { setMenu(false); menuBtn.focus(); });
$$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (menu.classList.contains("is-open")) { setMenu(false); menuBtn.focus(); }
  $$(".drop.is-open").forEach((d) => { d.classList.remove("is-open"); $("button", d).setAttribute("aria-expanded", "false"); });
});

// Highlight the section you're looking at (home page)
const spyLinks = $$(".nav-links a[href^='/#']");
const spyTargets = spyLinks.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
if (spyTargets.length && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      spyLinks.forEach((a) => a.classList.toggle("is-active", a.hash === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  spyTargets.forEach((t) => io.observe(t));
}

/* ---------- Trip cards ---------- */
const ICON = {
  clock: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  people: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>',
  cal: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  sun: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  sunset: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M17 18a5 5 0 0 0-10 0M12 2v7M4.2 10.2l1.4 1.4M1 18h2M21 18h2M18.4 11.6l1.4-1.4M23 22H1M8 6l4 4 4-4"/></svg>',
};

function card(c, island) {
  const href = `/?trip=${c.id}${island ? `&island=${island}` : ""}#book`;
  const isCustom = c.id === "custom";
  const whenIcon = /sunset|afternoon/i.test(c.when) ? ICON.sunset : ICON.sun;
  return `
  <article class="trip${isCustom ? " trip-custom" : ""}">
    ${c.badge ? `<span class="ribbon">${c.badge}</span>` : ""}
    <span class="when">${whenIcon}${c.when}</span>
    <h3>${c.name}</h3>
    <ul class="trip-stats">
      ${c.hours ? `<li>${ICON.clock}${c.hours} hrs</li>` : ""}
      <li>${ICON.people}Up to ${c.guests}</li>
      <li>${ICON.cal}${tripDays(c.id)}</li>
    </ul>
    <p class="desc">${c.desc}</p>
    <ul class="perks">${c.perks.map((p) => `<li>${p}</li>`).join("")}</ul>
    <div class="trip-foot">
      <div class="price">${c.price ? `<small>From</small>${money(c.price)}` : `<small>Rate</small>Let's talk`}</div>
      <a href="${href}" class="btn ${isCustom ? "btn-ghost" : "btn-primary"} btn-sm" data-book data-pick="${c.id}"${island ? ` data-island="${island}"` : ""}>${isCustom ? "Plan It" : "Book This Trip"}</a>
    </div>
  </article>`;
}

const grid = $("#trip-grid");
if (grid) {
  const island = grid.dataset.island;
  const trips = island ? CHARTERS.filter((c) => c.islands.includes(island)) : [...CHARTERS, CUSTOM];
  grid.innerHTML = trips.map((c) => card(c, island)).join("");
}

/* ---------- Booking pop up (two simple steps) ---------- */
const dlg = $("#booking");
const form = $("#book-form");
if (dlg && form) {
  const dateIn = $("#f-date");
  const dateNote = $("#date-note");
  const guestNote = $("#guest-note");
  const done = $("#bk-done");
  const count = { adults: 2, kids: 0 };
  let step = 1;

  $("#trip-options").innerHTML = allTrips.map((t) => `
    <label class="tp">
      <input type="radio" name="charter" value="${t.id}">
      <span class="tp-card">
        <span class="tp-radio" aria-hidden="true"></span>
        <span class="tp-name">${t.name}</span>
        <span class="tp-meta">${t.hours ? `${t.hours} hrs` : "Your call"}${t.price ? ` &middot; ${money(t.price)}` : ""}</span>
      </span>
    </label>`).join("");

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateIn.min = today.toISOString().slice(0, 10);

  const tripId = () => form.elements.charter.value || "";
  const trip = () => findTrip(tripId());
  const maxGuests = () => (trip() || { guests: 6 }).guests;
  const prettyDate = (iso) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  // Guest counters
  function renderGuests() {
    const max = maxGuests();
    while (count.adults + count.kids > max && count.kids > 0) count.kids--;
    count.adults = Math.max(1, Math.min(count.adults, max - count.kids));
    $("#out-adults").textContent = count.adults;
    $("#out-kids").textContent = count.kids;
    $("#f-adults").value = count.adults;
    $("#f-kids").value = count.kids;
    const full = count.adults + count.kids >= max;
    $$('[data-count][data-d="1"]', form).forEach((b) => (b.disabled = full));
    $('[data-count="adults"][data-d="-1"]', form).disabled = count.adults <= 1;
    $('[data-count="kids"][data-d="-1"]', form).disabled = count.kids <= 0;
    guestNote.hidden = !full;
    guestNote.innerHTML = `This trip fits up to ${max}. Bigger group? <a href="sms:${CONFIG.phoneDial}">Text Ron</a>.`;
    $("#kid-ages").hidden = count.kids === 0;
    $("#f-ages").required = count.kids > 0;
  }
  form.addEventListener("click", (e) => {
    const b = e.target.closest("[data-count]");
    if (!b) return;
    count[b.dataset.count] += +b.dataset.d;
    renderGuests();
  });

  // Warn when the date doesn't fit the schedule; block days he's off
  function checkDate() {
    const iso = dateIn.value;
    const field = dateIn.closest(".field");
    field.classList.remove("invalid");
    dateNote.hidden = true;
    dateNote.classList.remove("is-warn");
    if (!iso) return true;
    const st = dayStatus(iso);
    const t = trip();
    let msg = "", ok = true, warn = false;
    if (!st.open) {
      msg = "Captain Ron isn't available that day. Please pick another date.";
      ok = false;
    } else if (t && !runsOn(st.trips, t.id)) {
      const only = st.trips.length === 1 ? `the ${tripsLabel(st)}` : "select trips";
      const usual = { Weekends: "on weekends", Weekdays: "on weekdays" }[tripDays(t.id)] || "by request";
      msg = `${isWeekend(iso) ? "That day" : "Weekdays"} we're running ${only} only. ${t.name} usually runs ${usual}, but send it and Ron will let you know.`;
      warn = true;
    } else if (st.note) {
      msg = st.note;
    }
    if (msg) { dateNote.textContent = msg; dateNote.hidden = false; dateNote.classList.toggle("is-warn", warn || !ok); }
    if (!ok) field.classList.add("invalid");
    return ok;
  }

  function updateSummary() {
    const t = trip();
    renderGuests();
    checkDate();
    $("#trip-pick").classList.remove("invalid");
    $("#sum-name").textContent = t ? t.name : "Pick a trip";
    const bits = !t ? ["Choose one to get started."]
      : t.id === "custom" ? ["Tell us what you have in mind"]
      : [`${t.hours} hours`, `up to ${t.guests} guests`, t.price ? "from " + money(t.price) : "call for rate"];
    const where = islandName($("#f-island").value);
    if (t && where) bits.push(where);
    $("#sum-meta").textContent = bits.join(" · ");
  }

  form.addEventListener("change", (e) => {
    if (e.target.name === "charter") updateSummary();
    if (e.target.name === "date") checkDate();
  });

  function goTo(n) {
    step = n;
    $$(".bk-pane", form).forEach((p) => (p.hidden = +p.dataset.pane !== n));
    $(".bk-back", form).hidden = n === 1;
    $("#bk-step").textContent = `Step ${n} of 2`;
    $("#bk-heading").textContent = n === 1 ? "Pick your trip" : "Your info";
    $("#bk-bar").style.width = n === 1 ? "50%" : "100%";
    $("#submit-btn").innerHTML = n === 1 ? "Next &rarr;" : "Send Request &rarr;";
    if (n === 2) {
      const t = trip();
      const g = count.adults + count.kids;
      $("#bk-recap").innerHTML = `<span>${t.name} &middot; ${prettyDate(dateIn.value)} &middot; ${g} guest${g === 1 ? "" : "s"}</span><b>Edit</b>`;
    }
    $(".bk-main", dlg).scrollTop = 0;
  }
  $$("[data-go]", dlg).forEach((b) => b.addEventListener("click", () => goTo(+b.dataset.go)));

  function validStep(n) {
    let ok = true;
    const pane = $(`.bk-pane[data-pane="${n}"]`, form);
    if (n === 1 && !checkDate()) ok = false; // runs first: it resets the date field's state
    $$(".field", pane).forEach((f) => { if (n !== 1 || f !== dateIn.closest(".field")) f.classList.remove("invalid"); });
    $$("input, textarea", pane).forEach((el) => {
      if (el.closest("[hidden]") || ["radio", "hidden"].includes(el.type) || el.classList.contains("hp")) return;
      if (!el.checkValidity()) { el.closest(".field")?.classList.add("invalid"); ok = false; }
    });
    if (n === 1) {
      if (!tripId()) { $("#trip-pick").classList.add("invalid"); ok = false; }
    }
    if (!ok) {
      const bad = $("#trip-pick.invalid input, .invalid input, .invalid textarea", pane);
      bad?.focus({ preventScroll: true });
      bad?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return ok;
  }

  function openBooking({ trip: id, island, date } = {}) {
    form.hidden = false;
    done.hidden = true;
    $("#msg-err").hidden = true;
    if (id) { const r = $(`input[name="charter"][value="${id}"]`, form); if (r) r.checked = true; }
    $("#f-island").value = island && islandName(island) ? island : "";
    if (date) dateIn.value = date;
    goTo(1);
    updateSummary();
    if (!dlg.open) dlg.showModal();
    document.documentElement.classList.add("modal-open");
    // Only move focus on desktop so phones don't pop the keyboard open
    if (matchMedia("(hover: hover)").matches) $(".tp input:checked, .tp input", form).focus({ preventScroll: true });
  }
  const closeBooking = () => dlg.open && dlg.close();
  window.openBooking = openBooking;
  window.bookDate = (iso) => openBooking({ date: iso });

  dlg.addEventListener("close", () => {
    document.documentElement.classList.remove("modal-open");
    if (location.hash === "#book") history.replaceState(null, "", location.pathname + location.search);
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) closeBooking(); });
  $$(".bk-close, .bk-close-done", dlg).forEach((b) => b.addEventListener("click", closeBooking));

  // Any "Book" link on the page opens the pop up instead of jumping
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-book], a[href$='#book']");
    if (!a || dlg.contains(a) || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const q = a.href ? new URL(a.href, location.href).searchParams : new URLSearchParams();
    openBooking({ trip: a.dataset.pick || q.get("trip"), island: a.dataset.island || q.get("island") });
  });

  updateSummary();
  availabilityReady.then(checkDate);
  if (location.hash === "#book" || params.get("trip")) {
    openBooking({ trip: params.get("trip"), island: params.get("island") });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#msg-err").hidden = true;
    if (step === 1) {
      if (validStep(1)) goTo(2);
      return;
    }
    if (!validStep(2)) return;

    const d = Object.fromEntries(new FormData(form));
    if (d._honey) return;
    const t = findTrip(d.charter);
    const payload = {
      _subject: `Booking request: ${t.name} on ${prettyDate(d.date)} (${d.name})`,
      _template: "table",
      _captcha: "false",
      "Trip": t.name,
      "Date": prettyDate(d.date) + ` (${d.date})`,
      "Adults": d.adults,
      "Kids": d.kids,
      "Kids' ages": +d.kids ? d.kid_ages : "",
      "Island": islandName(d.island) || "Captain's choice",
      name: d.name,
      phone: d.phone,
      email: d.email,
      "Notes": d.notes || "",
    };
    if (t.time) payload["Start time"] = t.time;

    const btn = $("#submit-btn");
    btn.disabled = true;
    btn.textContent = "Sending...";
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${CONFIG.formEmail}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (String(json.success) !== "true") throw new Error(json.message);
      form.reset();
      count.adults = 2; count.kids = 0;
      form.hidden = true;
      done.hidden = false;
      $(".bk-close-done", dlg).focus();
    } catch (err) {
      console.warn("Form error:", err);
      $("#msg-err").hidden = false;
    } finally {
      btn.disabled = false;
      goTo(form.hidden ? 1 : 2);
      updateSummary();
    }
  });
}

/* ---------- Boat day forecast (Open-Meteo, free, no key) ---------- */
const wxGrid = $("#wx-grid");
if (wxGrid) {
  const { lat, lon } = CONFIG.forecastSpot;
  const tz = "America%2FNew_York";
  const WX_URL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,sunset,uv_index_max&current=temperature_2m,wind_speed_10m,wind_direction_10m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${tz}&forecast_days=7`;
  const SEA_URL = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat - 0.01}&longitude=${lon - 0.06}&daily=wave_height_max,wave_period_max&current=sea_surface_temperature,wave_height&length_unit=imperial&temperature_unit=fahrenheit&timezone=${tz}&forecast_days=7`;

  const sky = (c) =>
    c === 0 ? ["☀️", "Sunny"] : c <= 2 ? ["🌤️", "Mostly sunny"] : c === 3 ? ["☁️", "Cloudy"]
    : c <= 48 ? ["🌫️", "Fog"] : c <= 57 ? ["🌦️", "Drizzle"] : c <= 67 ? ["🌧️", "Rain"]
    : c <= 82 ? ["🌦️", "Showers"] : ["⛈️", "Storms"];
  const compass = (deg) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(deg / 45) % 8];
  const clock = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const ft = (n) => (n < 1 ? "Under 1" : n.toFixed(1).replace(".0", ""));

  function rate(d) {
    const { wind, waves, rain, code } = d;
    if (wind >= 20 || waves >= 3.5 || (code >= 95 && rain >= 60)) return ["rough", "Rough"];
    if (wind >= 15 || waves >= 2.5 || rain >= 50 || code >= 95) return ["iffy", "Iffy"];
    if (wind >= 10 || waves >= 1.5 || rain >= 30) return ["good", "Good"];
    return ["great", "Great"];
  }

  async function getJSON(url) {
    const key = "wx:" + url;
    try {
      const hit = JSON.parse(sessionStorage.getItem(key) || "null");
      if (hit && Date.now() - hit.t < 30 * 60 * 1000) return hit.v;
    } catch (e) {}
    const v = await (await fetch(url)).json();
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch (e) {}
    return v;
  }

  (async () => {
    try {
      const [wx, sea] = await Promise.all([getJSON(WX_URL), getJSON(SEA_URL).catch(() => null)]);
      await availabilityReady;
      const D = wx.daily, S = sea && sea.daily;

      const now = [
        sea && sea.current ? ["Water", `${Math.round(sea.current.sea_surface_temperature)}°F`] : null,
        ["Air", `${Math.round(wx.current.temperature_2m)}°F`],
        ["Wind", `${Math.round(wx.current.wind_speed_10m)} mph ${compass(wx.current.wind_direction_10m)}`],
        sea && sea.current ? ["Waves", `${ft(sea.current.wave_height)} ft`] : null,
        ["Sunset", clock(D.sunset[0])],
      ].filter(Boolean);
      $("#wx-now").innerHTML = now.map(([k, v]) => `<div class="now-chip"><span>${k}</span><strong>${v}</strong></div>`).join("");

      wxGrid.innerHTML = D.time.map((iso, i) => {
        const day = {
          wind: D.wind_speed_10m_max[i], gust: D.wind_gusts_10m_max[i],
          waves: S ? S.wave_height_max[i] : 0, rain: D.precipitation_probability_max[i] || 0, code: D.weather_code[i],
        };
        const [cls, label] = rate(day);
        const [icon, skyText] = sky(day.code);
        const st = dayStatus(iso);
        const [y, m, d] = iso.split("-").map(Number);
        const date = new Date(y, m - 1, d);
        const dow = i === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" });
        return `
        <button type="button" class="wx-day wx-${cls}${st.open ? "" : " is-closed"}" data-date="${iso}" ${st.open ? "" : "disabled"}
          aria-label="${dow} ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}: ${label} boat day, ${skyText}. ${tripsLabel(st)}.">
          <span class="wx-head"><span class="wx-dow">${dow}</span><span class="wx-date">${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></span>
          <span class="wx-icon" aria-hidden="true">${icon}</span>
          <span class="wx-temp">${Math.round(D.temperature_2m_max[i])}°<small>${Math.round(D.temperature_2m_min[i])}°</small></span>
          <span class="wx-rating"><i></i>${label}</span>
          <span class="wx-stats">
            <span><b>Wind</b>${Math.round(day.wind)} mph ${compass(D.wind_direction_10m_dominant[i])}</span>
            ${S ? `<span><b>Waves</b>${ft(day.waves)} ft</span>` : ""}
            <span><b>Rain</b>${day.rain}%</span>
            <span><b>Sunset</b>${clock(D.sunset[i])}</span>
          </span>
          <span class="wx-avail">${tripsLabel(st)}</span>
          ${st.open ? `<span class="wx-cta">Book this day</span>` : ""}
        </button>`;
      }).join("");

      wxGrid.addEventListener("click", (e) => {
        const b = e.target.closest(".wx-day");
        if (b && !b.disabled && window.bookDate) window.bookDate(b.dataset.date);
      });
    } catch (err) {
      console.warn("Forecast unavailable:", err);
      $("#forecast").hidden = true;
    }
  })();
}
