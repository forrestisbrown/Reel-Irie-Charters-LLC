/* ==========================================================
   REEL IRIE CHARTERS — edit your info, trips and schedule here.
   Used by the website (script.js) and the Captain's Deck (/admin).
   ========================================================== */

const CONFIG = {
  captainName: "Captain Ron Brown",
  phone: "(727) 386-1281",           // shown on the site
  phoneDial: "+17273861281",         // used for tap to call / text
  // Where booking requests are sent (FormSubmit.co). The first request sends an
  // activation email to this address; click it once and requests start arriving.
  formEmail: "reeliriecharters@gmail.com",
  email: "reeliriecharters@gmail.com",
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
    desc: "Two of our favorite spots in one trip. Wade onto a barrier island, swim a sandbar and soak up the ride between.",
    perks: ["2 island stops", "Swimming", "Shelling", "Sandbar time"],
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
    perks: ["Sunset views", "Golden hour photos", "Date night", "Celebrations"],
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
