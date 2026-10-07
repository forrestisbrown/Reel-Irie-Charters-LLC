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
function card(c, island) {
  const href = `/?trip=${c.id}${island ? `&island=${island}` : ""}#book`;
  const isCustom = c.id === "custom";
  return `
  <article class="trip${isCustom ? " trip-custom" : ""}">
    <div class="trip-top">
      <span class="when">${c.when}</span>
      ${c.badge ? `<span class="badge">${c.badge}</span>` : ""}
    </div>
    <h3>${c.name}</h3>
    <p class="trip-meta">${c.hours ? `${c.hours} hours &middot; ` : ""}Up to ${c.guests} guests</p>
    <p class="desc">${c.desc}</p>
    <ul>${c.perks.map((p) => `<li>${p}</li>`).join("")}</ul>
    <div class="trip-foot">
      <div class="price">${c.price ? `<small>From</small>${money(c.price)}` : `<small>Rate</small>Let's talk`}</div>
      <a href="${href}" class="btn ${isCustom ? "btn-ghost" : "btn-primary"} btn-sm" data-pick="${c.id}"${island ? ` data-island="${island}"` : ""}>${isCustom ? "Plan It" : "Book This Trip"}</a>
    </div>
  </article>`;
}

const grid = $("#trip-grid");
if (grid) {
  const island = grid.dataset.island;
  const trips = island ? CHARTERS.filter((c) => c.islands.includes(island)) : [...CHARTERS, CUSTOM];
  grid.innerHTML = trips.map((c) => card(c, island)).join("");
}

/* ---------- Booking form (home page) ---------- */
const form = $("#book-form");
if (form) {
  const charterSel = $("#f-charter");
  const islandSel = $("#f-island");
  const adultSel = $("#f-adults");
  const kidSel = $("#f-kids");
  const kidAges = $("#kid-ages");
  const guestNote = $("#guest-note");

  charterSel.innerHTML += allTrips.map((t) =>
    `<option value="${t.id}">${t.name}${t.hours ? ` (${t.hours} hrs)` : ""}</option>`).join("");
  islandSel.innerHTML += ISLANDS.map((i) => `<option value="${i.id}">${i.name}</option>`).join("");

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $("#f-date").min = $("#f-alt-date").min = today.toISOString().slice(0, 10);

  const maxGuests = () => (findTrip(charterSel.value) || { guests: 6 }).guests;

  function fillCounts() {
    const max = maxGuests();
    const a = +adultSel.value || 2, k = +kidSel.value || 0;
    adultSel.innerHTML = Array.from({ length: max }, (_, i) => `<option>${i + 1}</option>`).join("");
    kidSel.innerHTML = Array.from({ length: max }, (_, i) => `<option>${i}</option>`).join("");
    adultSel.value = String(Math.min(a, max));
    kidSel.value = String(Math.min(k, max - 1));
    checkGuests();
  }

  function checkGuests() {
    const max = maxGuests();
    const total = +adultSel.value + +kidSel.value;
    const kids = +kidSel.value;
    kidAges.hidden = kids === 0;
    $("#f-ages").required = kids > 0;
    const over = total > max;
    guestNote.textContent = over
      ? `That's ${total} guests. This trip fits up to ${max}, so give us a call for bigger groups.`
      : `${total} guest${total === 1 ? "" : "s"} total${kids ? `, including ${kids} kid${kids === 1 ? "" : "s"}` : ""}.`;
    guestNote.classList.toggle("is-warn", over);
    $("#guest-row").classList.toggle("invalid", over);
    return !over;
  }

  function updateSummary() {
    const t = findTrip(charterSel.value);
    const where = islandName(islandSel.value);
    fillCounts();
    if (!t) {
      $("#sum-name").textContent = "Pick a trip";
      $("#sum-meta").textContent = "Choose from the menu or the form.";
      return;
    }
    $("#sum-name").textContent = t.name;
    const bits = t.id === "custom"
      ? ["Tell us what you have in mind"]
      : [`${t.hours} hours`, `up to ${t.guests} guests`, t.price ? "from " + money(t.price) : "call for rate"];
    if (where) bits.push(where);
    $("#sum-meta").textContent = bits.join(" · ");
  }

  function pick(trip, island) {
    if (trip && findTrip(trip)) charterSel.value = trip;
    if (island && islandName(island)) islandSel.value = island;
    const t = findTrip(trip);
    if (t && t.time) $("#f-time").value = t.time;
    $('input[name="request_type"][value="Booking Request"]').checked = true;
    setMode();
    updateSummary();
  }

  charterSel.addEventListener("change", () => pick(charterSel.value));
  islandSel.addEventListener("change", updateSummary);
  adultSel.addEventListener("change", checkGuests);
  kidSel.addEventListener("change", checkGuests);

  // "Book This Trip" buttons on this page
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-pick]");
    if (b) pick(b.dataset.pick, b.dataset.island);
  });

  // Book vs. Just Asking
  function setMode() {
    const asking = $('input[name="request_type"]:checked').value === "Question";
    $$(".booking-only", form).forEach((el) => (el.hidden = asking));
    $("#f-date").required = !asking;
    charterSel.required = !asking;
    $("#f-ages").required = !asking && +kidSel.value > 0;
    $("#notes-label").textContent = asking ? "Your question" : "Anything we should know?";
    $("#f-notes").required = asking;
    $("#submit-btn").innerHTML = asking ? "Send My Question &rarr;" : "Get Irie &rarr; Send Request";
  }
  $$('input[name="request_type"]').forEach((r) => r.addEventListener("change", setMode));

  setMode();
  updateSummary();
  if (params.get("trip") || params.get("island")) pick(params.get("trip"), params.get("island"));

  function validate() {
    let ok = true;
    $$(".field", form).forEach((f) => f.classList.remove("invalid"));
    $$("input, select, textarea", form).forEach((el) => {
      if (el.closest("[hidden]") || el.type === "checkbox" || el.type === "radio") return;
      if (!el.checkValidity()) { el.closest(".field")?.classList.add("invalid"); ok = false; }
    });
    if (!$("#guest-row").hidden && !checkGuests()) ok = false;
    if (!ok) $(".invalid input, .invalid select, .invalid textarea", form)?.focus();
    return ok;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#msg-ok").hidden = $("#msg-err").hidden = true;
    if (!validate()) return;

    const d = Object.fromEntries(new FormData(form));
    if (d._honey) return;
    const booking = d.request_type === "Booking Request";
    const t = findTrip(d.charter);
    const payload = {
      _subject: `${booking ? "Booking request" : "Question"}: ${t ? t.name : "General"} (${d.name})`,
      _template: "table",
      _captcha: "false",
      "Request": d.request_type,
      "Trip": t ? t.name : "Not chosen",
    };
    if (booking) {
      Object.assign(payload, {
        "Where to": islandName(d.island) || "Captain's choice",
        "Date": d.date + (d.backup_date ? `  (backup ${d.backup_date})` : ""),
        "Start time": d.start_time,
        "Adults": d.adults,
        "Kids": d.kids,
        "Kids' ages": +d.kids ? d.kid_ages : "",
      });
    }
    Object.assign(payload, { name: d.name, phone: d.phone, email: d.email, "Notes": d.notes || "" });

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
      updateSummary();
      $("#msg-ok").hidden = false;
    } catch (err) {
      console.warn("Form error:", err);
      $("#msg-err").hidden = false;
    } finally {
      btn.disabled = false;
      setMode();
    }
  });
}
