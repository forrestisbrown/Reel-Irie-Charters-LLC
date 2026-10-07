"""Builds every page of the Reel Irie Charters site.

Run from the repo root:  python _src/build.py

- _src/home.html is the body of the home page.
- ISLANDS below holds the content for each island page.
- The header, full screen menu and footer are shared, so edit them once here.
Trip cards, prices and contact details come from script.js at runtime.
"""
from html import escape
from pathlib import Path
import json

SRC = Path(__file__).parent
ROOT = SRC.parent
PUBLIC = ROOT / "public"  # everything in here is the live website

BUSINESS = "Reel Irie Charters"
LEGAL = "Reel Irie Charters LLC"
PHONE = "(727) 386-1281"
PHONE_DIAL = "+17273861281"

ISLANDS = [
    {
        "id": "shell-key",
        "name": "Shell Key",
        "color": "green",
        "tagline": "Wild, quiet and all sand.",
        "blurb": "Undeveloped barrier island with clear shallows, great shelling and quiet sand.",
        "facts": [
            ("Best for", "Shelling, swimming, quiet beach time"),
            ("Vibe", "Wild and untouched"),
            ("On the island", "No buildings or facilities"),
            ("Getting there", "By boat only"),
        ],
        "about": [
            "Shell Key Preserve is a protected barrier island just south of Pass-a-Grille. There are no roads, no buildings and no crowds, just a long stretch of open beach, clear shallow water and some of the best shelling in Pinellas County.",
            "Captain Ron anchors up in the shallows so you can wade right onto the sand. It's the kind of place where you lose track of time in the best way.",
        ],
        "do": [
            "Wade in from the boat and walk the beach",
            "Hunt for shells and sand dollars at low tide",
            "Float the clear shallows on the bay side",
            "Keep an eye out for wildlife like rays, wading birds and dolphins",
        ],
        "tips": [
            "There's no shade or restrooms on the island, so the boat is your home base.",
            "Some bird nesting areas are roped off in spring and summer. Please give them room.",
            "Water shoes make the walk from the boat to the beach a lot easier.",
            "Leave any shell with a living critter inside right where you found it.",
        ],
        "faq": [
            ("Can we get off the boat?", "Yes. We anchor in the shallows and you can wade straight onto the beach."),
            ("Are there bathrooms on Shell Key?", "No. The island is a nature preserve with no facilities, so plan ahead before we head out."),
            ("Will we see dolphins?", "There's a good chance. Dolphins often feed along the flats and passes around Shell Key, but they're wild animals, so sightings are never guaranteed."),
            ("When is the best time to go?", "Mornings are usually calm and less crowded, and lower tides open up more sandbar to explore. Captain Ron will suggest the best window for your date."),
        ],
    },
    {
        "id": "egmont-key",
        "name": "Egmont Key",
        "color": "gold",
        "tagline": "History, wildlife and clear water.",
        "blurb": "Fort ruins, a working lighthouse and gopher tortoises at the mouth of Tampa Bay.",
        "facts": [
            ("Best for", "History, snorkeling, wildlife"),
            ("Vibe", "Explorer day"),
            ("On the island", "Fort ruins, lighthouse, trails"),
            ("Getting there", "By boat only"),
        ],
        "about": [
            "Egmont Key sits right at the mouth of Tampa Bay and is a Florida State Park you can only reach by boat. It's home to the ruins of Fort Dade, built in 1898, old brick roads and a lighthouse that has stood since 1858.",
            "The island is also a wildlife refuge. Gopher tortoises wander the trails, shorebirds nest on the point, and the clear water around the old fort ruins makes for great snorkeling.",
        ],
        "do": [
            "Walk the brick roads and explore the Fort Dade ruins",
            "See the 1858 lighthouse",
            "Snorkel near the ruins along the shoreline",
            "Look for gopher tortoises and shorebirds along the trails",
        ],
        "tips": [
            "Currents near the shipping channel are strong. Swim close to shore and stay near the boat.",
            "Gopher tortoises are protected. Enjoy them from a distance and never pick one up.",
            "Pets aren't allowed on the island.",
            "Bring sturdy sandals if you want to walk the trails and ruins.",
        ],
        "faq": [
            ("How long do we spend on Egmont?", "On the Egmont Key Explorer you'll have plenty of time to walk the fort, see the lighthouse and get in the water. Captain Ron will plan the timing around tides and weather."),
            ("Can we snorkel there?", "Yes. The water around the old fort ruins is one of the most popular snorkel spots in the area when conditions are calm."),
            ("Can we bring our dog?", "Unfortunately no. Pets aren't allowed on Egmont Key."),
            ("Is it good for kids?", "Kids love it. Between the fort, the tortoises and the beach there's a lot to explore. Let us know their ages when you book so we bring the right life jackets."),
        ],
    },
    {
        "id": "caladesi-island",
        "name": "Caladesi Island",
        "color": "red",
        "tagline": "One of America's best beaches.",
        "blurb": "Named America's best beach. Soft white sand, clear water and no crowds.",
        "facts": [
            ("Best for", "Beach day, swimming"),
            ("Vibe", "Postcard perfect"),
            ("On the island", "State park with restrooms near the marina"),
            ("Getting there", "By boat or ferry"),
        ],
        "about": [
            "Caladesi Island State Park sits just north of Clearwater Beach and has been named America's best beach. The sand is soft and white, the water is clear, and because most people have to take a boat to get there it never feels crowded.",
            "It's the perfect spot for a long beach day: swim, walk the shoreline, find a quiet patch of sand and stay a while.",
        ],
        "do": [
            "Swim and float in calm, clear Gulf water",
            "Walk miles of natural beach",
            "Explore the nature trail through the island",
            "Enjoy the scenic ride up the coast",
        ],
        "tips": [
            "This is a state park, so park rules apply on the island.",
            "Bring plenty of water and sunscreen. Shade is limited on the beach.",
            "Caladesi is on the Clearwater side, so it pairs best with a half day or full day trip.",
        ],
        "faq": [
            ("Are there restrooms on Caladesi?", "Yes, the state park has restrooms near the marina."),
            ("Why is it so famous?", "Caladesi has been named America's best beach, and it's stayed natural and uncrowded because it's so hard to get to without a boat."),
            ("Which trip should we book?", "The Island Hopper or the Full Day Island Escape. Let us know you want Caladesi when you book and we'll plan the route."),
        ],
    },
    {
        "id": "pass-a-grille",
        "name": "Pass-a-Grille",
        "color": "green",
        "tagline": "Old Florida charm and the best sunsets around.",
        "blurb": "Historic beach town at the tip of St. Pete Beach with sunsets locals swear by.",
        "facts": [
            ("Best for", "Sunsets and cruising"),
            ("Vibe", "Old Florida, laid back"),
            ("Nearby", "Shops and restaurants on 8th Ave"),
            ("Getting there", "Cruise the channel"),
        ],
        "about": [
            "Pass-a-Grille sits at the southern tip of St. Pete Beach, with the Gulf on one side and the Pass-a-Grille Channel on the other. The whole area is a historic district full of old Florida charm, and it's famous for its sunsets.",
            "From the water you get the best seat in the house: the beach, the historic waterfront and the Don CeSar's pink glow just up the coast, with Shell Key right across the channel.",
        ],
        "do": [
            "Catch the sunset from the water",
            "Keep an eye out for wildlife in the channel",
            "Cruise past the historic waterfront",
            "Pair it with a stop at Shell Key",
        ],
        "tips": [
            "Sunset trips are popular, especially on weekends. Book early for the date you want.",
            "Bring a light layer. It can get breezy on the water once the sun goes down.",
            "Have your camera ready about 20 minutes before sunset for the best color.",
        ],
        "faq": [
            ("What's the best trip for Pass-a-Grille?", "The Sunset Irie Cruise. For more time on the water, Sandbar to Sunset adds an afternoon at the sandbar first."),
            ("What time do sunset trips leave?", "It changes with the season. Captain Ron times the departure so you're in position when the sun goes down."),
            ("Can we bring drinks?", "Absolutely. Bring whatever you like. Please skip glass bottles."),
        ],
    },
    {
        "id": "fort-de-soto",
        "name": "Fort De Soto",
        "color": "gold",
        "tagline": "Five keys, endless sandbars.",
        "blurb": "Five connected keys with sandbars made for anchoring up and swimming.",
        "facts": [
            ("Best for", "Sandbars, swimming, families"),
            ("Vibe", "Easygoing family fun"),
            ("On land", "Historic fort, beaches, restrooms"),
            ("Getting there", "Short ride from Tierra Verde"),
        ],
        "about": [
            "Fort De Soto Park spreads across five connected keys at the mouth of Tampa Bay. Its North Beach has been named America's best beach, and the water around the park is full of shallow sandbars that are perfect for anchoring up and swimming.",
            "It's a favorite for families. The water is calm and shallow, there's plenty of room to spread out, and there's often wildlife to watch around the park.",
        ],
        "do": [
            "Anchor at a sandbar and swim the shallows",
            "Look for sand dollars and shells",
            "Watch for rays, shorebirds and other wildlife",
            "See the historic fort from the water",
        ],
        "tips": [
            "Sandbars get busy on summer weekends. Weekday and morning trips are calmer.",
            "The shallows are great for little ones, but keep their life jackets handy.",
            "Water shoes help on the sandbars.",
        ],
        "faq": [
            ("Is Fort De Soto good for kids?", "It's one of the best. The sandbars are shallow and calm. Tell us kids' ages when you book so we have the right size life jackets on board."),
            ("Will it be crowded?", "Summer weekends can be busy at the popular sandbars. Captain Ron knows the quieter spots and the best times to go."),
            ("Can we combine it with another island?", "Yes. Fort De Soto pairs well with Shell Key or Egmont Key on the Island Hopper or Full Day Island Escape."),
        ],
    },
]

COLOR = {"green": "#19c83c", "gold": "#ffd614", "red": "#ec241c"}


def head(title, desc, extra=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{escape(title)}</title>
  <meta name="description" content="{escape(desc)}">
  <meta name="theme-color" content="#050505">
  <link rel="icon" type="image/png" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <meta property="og:title" content="{escape(title)}">
  <meta property="og:description" content="{escape(desc)}">
  <meta property="og:image" content="/images/og-image.jpg">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bevan&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css">
{extra}</head>
<body>
"""


ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
PHONE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>'
TEXT_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'


CHEVRON = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>'


def nav(current=None):
    drop = "\n".join(
        f'''          <a href="/islands/{i["id"]}/" class="drop-item{" is-current" if i["id"] == current else ""}" style="--dot:{COLOR[i["color"]]}">
            <span class="drop-name">{i["name"]}</span>
            <span class="drop-blurb">{i["blurb"]}</span>
          </a>'''
        for i in ISLANDS
    )
    menu_islands = "\n".join(
        f'          <a href="/islands/{i["id"]}/" style="--dot:{COLOR[i["color"]]}">{i["name"]}</a>' for i in ISLANDS
    )
    return f"""  <a class="skip" href="/#book">Skip to booking</a>

  <header class="nav">
    <div class="nav-stripe" aria-hidden="true"></div>
    <div class="wrap nav-inner">
      <a href="/" class="nav-logo" aria-label="{BUSINESS} home">
        <img src="/images/logo.webp" alt="{BUSINESS}" class="nav-badge" width="520" height="507">
      </a>
      <nav class="nav-links" aria-label="Main">
        <a href="/#charters">Charters</a>
        <div class="drop">
          <button type="button" aria-expanded="false" aria-haspopup="true">Islands
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div class="drop-panel">
{drop}
            <a href="/#islands" class="drop-all">See all islands {ARROW}</a>
          </div>
        </div>
        <a href="/#boat">The Boat</a>
        <a href="/#captain">Captain Ron</a>
        <a href="/#faq">FAQ</a>
      </nav>
      <div class="nav-actions">
        <a class="nav-phone" data-cfg-link="tel" href="tel:{PHONE_DIAL}">{PHONE_ICON}<span data-cfg="phone">{PHONE}</span></a>
        <a href="/#book" class="btn btn-primary btn-sm">Book Now</a>
      </div>
      <button class="nav-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="menu">
        <span class="nav-toggle-label">Menu</span>
        <span class="nav-toggle-bars" aria-hidden="true"><i></i><i></i><i></i></span>
      </button>
    </div>
  </header>

  <div class="menu" id="menu" aria-hidden="true" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="menu-stripe" aria-hidden="true"></div>
    <div class="menu-top">
      <img src="/images/logo.webp" alt="{BUSINESS}" class="menu-logo" width="520" height="507">
      <button class="menu-close" type="button" aria-label="Close menu">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
      </button>
    </div>
    <nav class="menu-links" aria-label="Menu">
      <a href="/#charters">Charters {CHEVRON}</a>
      <a href="/#forecast">Forecast {CHEVRON}</a>
      <a href="/#boat">The Boat {CHEVRON}</a>
      <a href="/#captain">Captain Ron {CHEVRON}</a>
      <a href="/#faq">FAQ {CHEVRON}</a>
      <p class="menu-sub">Islands</p>
      <div class="menu-islands">
{menu_islands}
      </div>
    </nav>
    <div class="menu-foot">
      <a href="/#book" class="btn btn-primary btn-lg btn-block">Book Your Trip {ARROW}</a>
      <div class="menu-contact">
        <a data-cfg-link="tel" href="tel:{PHONE_DIAL}" class="btn btn-ghost">{PHONE_ICON} Call</a>
        <a data-cfg-link="sms" href="sms:{PHONE_DIAL}" class="btn btn-ghost">{TEXT_ICON} Text</a>
      </div>
      <p class="menu-note">Free cancellation &middot; Weather reschedules on us</p>
    </div>
  </div>
"""


CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>'


def booking_modal():
    """The booking pop up. Lives on every page; any link to /#book opens it."""
    return f"""
  <dialog class="bk" id="booking" aria-labelledby="bk-title">
    <div class="bk-shell">
      <aside class="bk-side">
        <div class="bk-stripe" aria-hidden="true"></div>
        <img src="/images/logo-lg.webp" alt="" class="bk-fish" aria-hidden="true">
        <p class="eyebrow">Island Time Awaits</p>
        <h2 id="bk-title">Book Your Trip</h2>
        <div class="summary" aria-live="polite">
          <p class="summary-label">Your trip</p>
          <p class="summary-name" id="sum-name">Pick a trip</p>
          <p class="summary-meta" id="sum-meta">Choose one to get started.</p>
        </div>
        <ul class="bk-promises">
          <li>{CHECK} Free cancellation</li>
          <li>{CHECK} Weather? Reschedule or cancel free</li>
          <li>{CHECK} Nothing charged up front</li>
        </ul>
        <div class="bk-direct">
          <a data-cfg-link="tel" href="tel:{PHONE_DIAL}">{PHONE_ICON} Call</a>
          <a data-cfg-link="sms" href="sms:{PHONE_DIAL}">{TEXT_ICON} Text</a>
        </div>
      </aside>

      <div class="bk-main">
        <div class="bk-head">
          <div>
            <p class="bk-step" id="bk-step">Step 1 of 2</p>
            <h3 class="bk-heading" id="bk-heading">Pick your trip</h3>
          </div>
          <button class="bk-close" type="button" aria-label="Close booking">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <div class="bk-progress" aria-hidden="true"><i id="bk-bar"></i></div>

        <form class="book-form" id="book-form" novalidate>
          <input type="hidden" name="island" id="f-island">
          <input type="hidden" name="adults" id="f-adults" value="2">
          <input type="hidden" name="kids" id="f-kids" value="0">

          <div class="bk-pane" data-pane="1">
            <fieldset class="trip-pick" id="trip-pick">
              <legend class="lbl">Trip</legend>
              <div class="trip-options" id="trip-options"></div>
            </fieldset>

            <div class="field">
              <label class="lbl" for="f-date">Date</label>
              <input type="date" id="f-date" name="date" required>
            </div>
            <p class="date-note" id="date-note" hidden></p>

            <div class="guests" id="guest-row">
              <p class="lbl">Guests</p>
              <div class="stepper">
                <span>Adults</span>
                <div class="step-ctl">
                  <button type="button" data-count="adults" data-d="-1" aria-label="One less adult">&minus;</button>
                  <output id="out-adults">2</output>
                  <button type="button" data-count="adults" data-d="1" aria-label="One more adult">+</button>
                </div>
              </div>
              <div class="stepper">
                <span>Kids <small>under 13</small></span>
                <div class="step-ctl">
                  <button type="button" data-count="kids" data-d="-1" aria-label="One less kid">&minus;</button>
                  <output id="out-kids">0</output>
                  <button type="button" data-count="kids" data-d="1" aria-label="One more kid">+</button>
                </div>
              </div>
              <p class="guest-note" id="guest-note" hidden></p>
              <div class="field" id="kid-ages" hidden>
                <label class="lbl" for="f-ages">Kids' ages <small>for life jacket sizes</small></label>
                <input type="text" id="f-ages" name="kid_ages" placeholder="e.g. 3, 7 and 10">
              </div>
            </div>
          </div>

          <div class="bk-pane" data-pane="2" hidden>
            <button type="button" class="bk-recap" id="bk-recap" data-go="1"></button>
            <div class="field">
              <label class="lbl" for="f-name">Name</label>
              <input type="text" id="f-name" name="name" autocomplete="name" required>
            </div>
            <div class="field">
              <label class="lbl" for="f-phone">Phone</label>
              <input type="tel" id="f-phone" name="phone" autocomplete="tel" inputmode="tel" required>
            </div>
            <div class="field">
              <label class="lbl" for="f-email">Email</label>
              <input type="email" id="f-email" name="email" autocomplete="email" inputmode="email" required>
            </div>
            <div class="field">
              <label class="lbl" for="f-notes">Anything else? <small>optional</small></label>
              <textarea id="f-notes" name="notes" rows="3" placeholder="Preferred start time, an island you'd love to see, a birthday..."></textarea>
            </div>
            <input type="text" name="_honey" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
          </div>

          <div class="msg msg-err" id="msg-err" hidden>
            Something went wrong sending that. Please call or text <span data-cfg="phone">{PHONE}</span> instead.
          </div>

          <div class="bk-actions">
            <button type="button" class="btn btn-ghost bk-back" data-go="1" hidden>Back</button>
            <button type="submit" class="btn btn-primary btn-lg" id="submit-btn">Next &rarr;</button>
          </div>
          <p class="bk-help">No payment now &middot; Just a question? <a data-cfg-link="sms" href="sms:{PHONE_DIAL}">Text Ron</a></p>
        </form>

        <div class="bk-done" id="bk-done" hidden>
          <img src="/images/logo.webp" alt="" width="520" height="507">
          <h3>You're on the line!</h3>
          <p>Captain Ron will reach out soon to confirm your date, time and dock. Keep an eye on your phone.</p>
          <button type="button" class="btn btn-primary bk-close-done">Back to the Site</button>
        </div>
      </div>
    </div>
  </dialog>
"""


def footer():
    islands = "\n".join(f'          <li><a href="/islands/{i["id"]}/">{i["name"]}</a></li>' for i in ISLANDS)
    return f"""
  <footer class="footer">
    <div class="rasta-bar" aria-hidden="true"></div>
    <div class="wrap footer-grid">
      <div class="footer-brand">
        <img src="/images/logo.webp" alt="{BUSINESS}" width="520" height="507" loading="lazy">
        <p>Private island hopping and sunset charters out of St. Pete / Clearwater, Florida.</p>
      </div>
      <div>
        <h4>Explore</h4>
        <ul>
          <li><a href="/#charters">Charters</a></li>
          <li><a href="/#boat">The Boat</a></li>
          <li><a href="/#captain">Captain Ron</a></li>
          <li><a href="/#faq">FAQ</a></li>
          <li><a href="/#forecast">Forecast</a></li>
          <li><a href="/#book">Book a Trip</a></li>
        </ul>
      </div>
      <div>
        <h4>Islands</h4>
        <ul>
{islands}
        </ul>
      </div>
      <div>
        <h4>Get in Touch</h4>
        <ul>
          <li><a data-cfg-link="tel" href="tel:{PHONE_DIAL}">Call <span data-cfg="phone">{PHONE}</span></a></li>
          <li><a data-cfg-link="sms" href="sms:{PHONE_DIAL}">Send a text</a></li>
          <li><a href="/#book">Booking request</a></li>
        </ul>
      </div>
    </div>
    <div class="wrap footer-bottom">
      <p>&copy; <span data-year>2026</span> {LEGAL}. One love.</p>
      <p>Free cancellation &middot; Weather reschedules on us</p>
    </div>
  </footer>

  <div class="mobile-bar">
    <a data-cfg-link="tel" href="tel:{PHONE_DIAL}" class="btn btn-ghost">{PHONE_ICON} Call</a>
    <a href="/#book" class="btn btn-primary">Book Now</a>
  </div>

{booking_modal()}
  <script src="/config.js"></script>
  <script src="/script.js"></script>
</body>
</html>
"""


def local_business():
    data = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": LEGAL,
        "alternateName": BUSINESS,
        "description": "Private island hopping and sunset boat charters out of St. Pete and Clearwater, Florida.",
        "telephone": PHONE_DIAL,
        "image": "/images/og-image.jpg",
        "areaServed": ["St. Petersburg, FL", "Clearwater, FL", "Pinellas County, FL"],
        "address": {"@type": "PostalAddress", "addressLocality": "St. Petersburg", "addressRegion": "FL", "addressCountry": "US"},
    }
    return f'  <script type="application/ld+json">{json.dumps(data)}</script>\n'


def faq_schema(pairs):
    data = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in pairs
        ],
    }
    return f'  <script type="application/ld+json">{json.dumps(data)}</script>\n'


def island_page(i):
    c = COLOR[i["color"]]
    facts = "\n".join(
        f'          <div class="fact"><dt>{escape(k)}</dt><dd>{escape(v)}</dd></div>' for k, v in i["facts"]
    )
    about = "\n".join(f"          <p>{escape(p)}</p>" for p in i["about"])
    do = "\n".join(f"            <li>{escape(x)}</li>" for x in i["do"])
    tips = "\n".join(f"            <li>{escape(x)}</li>" for x in i["tips"])
    faq = "\n".join(
        f"""          <details>
            <summary>{escape(q)}</summary>
            <p>{escape(a)}</p>
          </details>"""
        for q, a in i["faq"]
    )
    others = "\n".join(
        f'''        <a href="/islands/{o["id"]}/" class="island-link" style="--accent:{COLOR[o["color"]]}">
          <h3>{o["name"]}</h3>
          <p>{o["blurb"]}</p>
          <span class="go">Explore {ARROW}</span>
        </a>'''
        for o in ISLANDS
        if o["id"] != i["id"]
    )
    title = f"{i['name']} Boat Trips | {BUSINESS}, St. Pete FL"
    desc = f"Private boat charters to {i['name']} with Captain Ron of {BUSINESS}. {i['blurb']}"
    return (
        head(title, desc, faq_schema(i["faq"]))
        + nav(i["id"])
        + f"""
  <main class="island-page" style="--accent:{c}">
    <section class="ihero">
      <div class="ihero-bg" aria-hidden="true"></div>
      <img src="/images/logo-lg.webp" alt="" class="ihero-fish" aria-hidden="true">
      <div class="wrap ihero-inner">
        <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/#islands">Islands</a><span>/</span><span aria-current="page">{i["name"]}</span></nav>
        <h1>{i["name"]}</h1>
        <p class="ihero-tag">{escape(i["tagline"])}</p>
        <div class="hero-ctas">
          <a href="/?island={i["id"]}#book" class="btn btn-primary btn-lg" data-book data-island="{i["id"]}">Book a Trip Here {ARROW}</a>
          <a data-cfg-link="tel" href="tel:{PHONE_DIAL}" class="btn btn-ghost btn-lg">{PHONE_ICON} <span data-cfg="phone">{PHONE}</span></a>
        </div>
      </div>
      <div class="wave" aria-hidden="true"><svg viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0 40 C 240 80 480 0 720 40 S 1200 80 1440 40 V80 H0Z"/></svg></div>
    </section>

    <section class="section section-tight">
      <div class="wrap">
        <dl class="facts">
{facts}
        </dl>
      </div>
    </section>

    <section class="section section-tight">
      <div class="wrap island-body">
        <div class="prose">
          <p class="eyebrow">About the Island</p>
          <h2>Why We Love It</h2>
{about}
        </div>
        <div class="side-cards">
          <div class="side-card">
            <h3>What We Do There</h3>
            <ul class="checks">
{do}
            </ul>
          </div>
          <div class="side-card side-card-tips">
            <h3>Good to Know</h3>
            <ul>
{tips}
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-alt">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Get There</p>
          <h2>Trips to {i["name"]}</h2>
          <p class="sub">Every charter is private, just you and your crew.</p>
        </div>
        <div class="trip-grid" id="trip-grid" data-island="{i["id"]}"></div>
      </div>
    </section>

    <section class="section">
      <div class="wrap narrow">
        <div class="section-head">
          <p class="eyebrow">Good to Know</p>
          <h2>{i["name"]} FAQ</h2>
        </div>
        <div class="faq">
{faq}
        </div>
        <p class="fine center">More questions? See the <a href="/#faq">general FAQ</a> or <a data-cfg-link="sms" href="sms:{PHONE_DIAL}">text Captain Ron</a>.</p>
      </div>
    </section>

    <section class="section section-alt">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Keep Exploring</p>
          <h2>More Islands</h2>
        </div>
        <div class="island-grid island-grid-4">
{others}
        </div>
      </div>
    </section>

    <section class="cta-band">
      <div class="wrap cta-inner">
        <div>
          <h2>Ready for <span class="rasta-text">island time?</span></h2>
          <p>Free cancellation, and if the weather turns we'll reschedule on us.</p>
        </div>
        <a href="/?island={i["id"]}#book" class="btn btn-primary btn-lg" data-book data-island="{i["id"]}">Book {i["name"]} {ARROW}</a>
      </div>
    </section>
  </main>
"""
        + footer()
    )


def island_cards():
    return "\n".join(
        f'''          <a href="/islands/{i["id"]}/" class="island-link" style="--accent:{COLOR[i["color"]]}">
            <h3>{i["name"]}</h3>
            <p>{i["blurb"]}</p>
            <span class="go">Explore {ARROW}</span>
          </a>'''
        for i in ISLANDS
    )


def main():
    body = (SRC / "home.html").read_text(encoding="utf-8")
    body = body.replace("{{ISLAND_CARDS}}", island_cards()).replace("{{ARROW}}", ARROW)
    body = body.replace("{{PHONE}}", PHONE).replace("{{PHONE_DIAL}}", PHONE_DIAL)
    body = body.replace("{{PHONE_ICON}}", PHONE_ICON).replace("{{TEXT_ICON}}", TEXT_ICON)
    home = (
        head(
            f"{BUSINESS} | St. Pete & Clearwater Island and Sunset Boat Charters",
            "Private island hopping and sunset boat charters with Captain Ron out of St. Pete and Clearwater, Florida. Shell Key, Egmont Key, Caladesi, Pass-a-Grille and Fort De Soto. Free cancellation.",
            local_business(),
        )
        + nav()
        + body
        + footer()
    )
    (PUBLIC / "index.html").write_text(home, encoding="utf-8")

    for i in ISLANDS:
        out = PUBLIC / "islands" / i["id"]
        out.mkdir(parents=True, exist_ok=True)
        (out / "index.html").write_text(island_page(i), encoding="utf-8")

    lost = (
        head(f"Lost at Sea | {BUSINESS}", "That page isn't here.")
        + nav()
        + f"""
  <main class="section center lost">
    <div class="wrap narrow">
      <img src="/images/logo.webp" alt="Reel Irie Charters" width="520" height="507" class="lost-fish">
      <h1>This one <span class="rasta-text">got away.</span></h1>
      <p class="sub">That page isn't here. Let's get you back on the water.</p>
      <p class="hero-ctas" style="justify-content:center"><a href="/" class="btn btn-primary btn-lg">Back to the Dock</a></p>
    </div>
  </main>
"""
        + footer()
    )
    (PUBLIC / "404.html").write_text(lost, encoding="utf-8")
    print("built index.html, 404.html and", len(ISLANDS), "island pages")


if __name__ == "__main__":
    main()
