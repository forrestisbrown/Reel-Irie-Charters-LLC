/* ==========================================================
   TEAM REEL IRIE — edit your info and charters right here.
   ========================================================== */

const CONFIG = {
  captainName: "Captain",              // e.g. "Captain Mike Brown"
  phone: "(727) 000-0000",             // shown on the site
  phoneDial: "+17270000000",           // used for tap to call
  email: "captain@example.com",
  // Free key from https://web3forms.com (enter the captain's email, they send the key).
  // Until it's set, the form opens the visitor's email app with the request filled in.
  web3formsKey: "",
};

// The charter menu. Add, remove or reorder trips here.
// type: "fishing" or "island"   price: number, or null to show "Call for rate"
const CHARTERS = [
  {
    id: "inshore-half",
    name: "Inshore Slam",
    type: "fishing",
    hours: 4,
    guests: 4,
    price: 450,
    badge: "Most Popular",
    desc: "Work the flats, mangroves and passes for the inshore slam: snook, redfish and trout.",
    perks: ["Snook", "Redfish", "Trout", "Great for beginners"],
  },
  {
    id: "island-hopper",
    name: "Island Hopper",
    type: "island",
    hours: 4,
    guests: 6,
    price: 500,
    desc: "Cruise to Shell Key, Egmont or Caladesi. Swim the sandbars, hunt shells and spot dolphins along the way.",
    perks: ["Sandbars", "Shelling", "Dolphins", "Swimming"],
  },
  {
    id: "inshore-full",
    name: "Full Day Inshore",
    type: "fishing",
    hours: 6,
    guests: 4,
    price: 650,
    desc: "More time, more spots, more fish. Chase the tides from Tampa Bay to the beaches.",
    perks: ["Snook", "Redfish", "Tarpon (in season)", "Cobia"],
  },
  {
    id: "nearshore",
    name: "Nearshore Reef & Wreck",
    type: "fishing",
    hours: 6,
    guests: 4,
    price: 750,
    desc: "Head out to the Gulf reefs and wrecks for bottom fishing and fast action on the pelagics.",
    perks: ["Grouper", "Snapper", "Kingfish", "Spanish mackerel"],
  },
  {
    id: "fish-and-island",
    name: "Reel & Relax Combo",
    type: "island",
    hours: 6,
    guests: 6,
    price: 700,
    badge: "Best of Both",
    desc: "Fish the morning bite, then drop anchor at a sandbar for lunch and a swim. The full Irie experience.",
    perks: ["Fishing", "Island stop", "Swimming", "Lunch on the sand"],
  },
  {
    id: "sunset",
    name: "Sunset Irie Cruise",
    type: "island",
    hours: 2,
    guests: 6,
    price: 300,
    desc: "Golden hour on the Gulf. Bring your drinks and your people and watch the sun drop into the water.",
    perks: ["Sunset views", "Dolphins", "Date night", "Celebrations"],
  },
];

const CUSTOM = { id: "custom", name: "Custom Trip", type: "all", hours: null, guests: 6, price: null };

/* ---------- Everything below runs the page ---------- */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n) => "$" + n.toLocaleString("en-US");
const allTrips = [...CHARTERS, CUSTOM];
const findTrip = (id) => allTrips.find((t) => t.id === id);

// Fill in contact details everywhere
$$("[data-cfg]").forEach((el) => { if (CONFIG[el.dataset.cfg]) el.textContent = CONFIG[el.dataset.cfg]; });
$$('[data-cfg-link="tel"]').forEach((a) => (a.href = "tel:" + CONFIG.phoneDial));
$$('[data-cfg-link="mailto"]').forEach((a) => (a.href = "mailto:" + CONFIG.email));
$("#year").textContent = new Date().getFullYear();

// Mobile menu
const toggle = $(".nav-toggle");
const menu = $("#mobile-menu");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!open));
  menu.hidden = open;
});
$$("#mobile-menu a").forEach((a) => a.addEventListener("click", () => {
  toggle.setAttribute("aria-expanded", "false");
  menu.hidden = true;
}));

// Charter cards
const grid = $("#charter-grid");
grid.innerHTML = CHARTERS.map((c) => `
  <article class="charter" data-type="${c.type}">
    <div class="charter-top">
      <span class="tag tag-${c.type}">${c.type === "fishing" ? "Fishing" : "Island & Cruise"}</span>
      ${c.badge ? `<span class="badge">${c.badge}</span>` : ""}
    </div>
    <h3>${c.name}</h3>
    <div class="charter-meta">
      <span>${c.hours} hours</span>
      <span>Up to ${c.guests} guests</span>
    </div>
    <p class="desc">${c.desc}</p>
    <ul>${c.perks.map((p) => `<li>${p}</li>`).join("")}</ul>
    <div class="charter-foot">
      <div class="price">${c.price ? `<small>From</small>${money(c.price)}` : `<small>Rate</small>Call`}</div>
      <a href="#book" class="btn btn-primary btn-sm" data-pick="${c.id}">Book This Trip</a>
    </div>
  </article>`).join("");

// Filters
$$(".chip").forEach((chip) => chip.addEventListener("click", () => {
  $$(".chip").forEach((c) => { c.classList.remove("is-active"); c.setAttribute("aria-selected", "false"); });
  chip.classList.add("is-active");
  chip.setAttribute("aria-selected", "true");
  const f = chip.dataset.filter;
  $$(".charter").forEach((card) => { card.hidden = f !== "all" && card.dataset.type !== f; });
}));

// Booking form
const form = $("#book-form");
const charterSel = $("#f-charter");
const guestSel = $("#f-guests");
charterSel.innerHTML += allTrips.map((t) =>
  `<option value="${t.id}">${t.name}${t.hours ? ` (${t.hours} hrs)` : ""}</option>`).join("");

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
$("#f-date").min = $("#f-alt-date").min = today.toISOString().slice(0, 10);

function fillGuests(max) {
  const current = guestSel.value;
  guestSel.innerHTML = Array.from({ length: max }, (_, i) => `<option>${i + 1}</option>`).join("");
  guestSel.value = current && +current <= max ? current : String(Math.min(2, max));
}

function updateSummary() {
  const t = findTrip(charterSel.value);
  fillGuests(t ? t.guests : 6);
  if (!t) {
    $("#sum-name").textContent = "Pick a charter";
    $("#sum-meta").textContent = "Choose a trip from the menu or the form.";
    return;
  }
  $("#sum-name").textContent = t.name;
  $("#sum-meta").textContent = t.id === "custom"
    ? "Tell us what you have in mind and we'll put it together."
    : `${t.hours} hours · up to ${t.guests} guests · ${t.price ? "from " + money(t.price) : "call for rate"}`;
}
charterSel.addEventListener("change", updateSummary);
updateSummary();

// "Book This Trip" buttons preselect the charter
document.addEventListener("click", (e) => {
  const pick = e.target.closest("[data-pick]");
  if (!pick) return;
  charterSel.value = pick.dataset.pick;
  $('input[name="request_type"][value="Booking Request"]').checked = true;
  setMode();
  updateSummary();
});

// Book vs. Just Asking
function setMode() {
  const asking = $('input[name="request_type"]:checked').value === "Question";
  $$(".booking-only").forEach((el) => (el.hidden = asking));
  $("#f-date").required = !asking;
  charterSel.required = !asking;
  $("#notes-label").textContent = asking ? "Your question" : "Anything we should know?";
  $("#f-notes").required = asking;
  $("#submit-btn").innerHTML = asking ? "Send My Question &rarr;" : "Reel It In &rarr; Send Request";
}
$$('input[name="request_type"]').forEach((r) => r.addEventListener("change", setMode));
setMode();

function validate() {
  let ok = true;
  $$(".field", form).forEach((f) => f.classList.remove("invalid"));
  $$("input, select, textarea", form).forEach((el) => {
    if (el.closest("[hidden]") || el.type === "checkbox") return;
    if (!el.checkValidity()) { el.closest(".field")?.classList.add("invalid"); ok = false; }
  });
  if (!ok) $(".field.invalid input, .field.invalid select, .field.invalid textarea", form)?.focus();
  return ok;
}

function buildMessage(data) {
  const t = findTrip(data.charter);
  const lines = [
    `Request: ${data.request_type}`,
    `Charter: ${t ? t.name : "Not chosen"}`,
  ];
  if (data.request_type === "Booking Request") {
    lines.push(`Date: ${data.date}${data.backup_date ? ` (backup ${data.backup_date})` : ""}`,
      `Start time: ${data.start_time}`, `Guests: ${data.guests}`);
  }
  lines.push(`Name: ${data.name}`, `Phone: ${data.phone}`, `Email: ${data.email}`, "", data.notes || "");
  return lines.join("\n");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#msg-ok").hidden = $("#msg-err").hidden = true;
  if (!validate()) return;

  const data = Object.fromEntries(new FormData(form));
  if (data.botcheck) return;
  const t = findTrip(data.charter);
  const subject = `${data.request_type}: ${t ? t.name : "General"} — ${data.name}`;
  const message = buildMessage(data);

  // No form key yet: hand off to the visitor's email app
  if (!CONFIG.web3formsKey) {
    location.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    return;
  }

  const btn = $("#submit-btn");
  btn.disabled = true;
  btn.textContent = "Casting...";
  try {
    const res = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: CONFIG.web3formsKey,
        subject,
        from_name: "Team Reel Irie Website",
        replyto: data.email,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    form.reset();
    updateSummary();
    $("#msg-ok").hidden = false;
  } catch (err) {
    $("#msg-err").hidden = false;
  } finally {
    btn.disabled = false;
    setMode();
  }
});
