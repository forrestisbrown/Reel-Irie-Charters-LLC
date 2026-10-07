# Reel Irie Charters

Website and booking system for Reel Irie Charters LLC: private island hopping and sunset boat charters with Captain Ron Brown, St. Pete / Clearwater, FL.

Hosted on Cloudflare: a static site plus a small Worker that stores bookings and runs the **Captain's Deck** (`/admin`).

## Where things live

| What | Where |
| --- | --- |
| Trips, prices, phone, weekly schedule | `public/config.js` |
| Home page content | `_src/home.html` |
| Island pages, shared header/menu/footer, booking pop up | `_src/build.py` |
| Styles / site behavior | `public/styles.css`, `public/script.js` |
| Captain's Deck (admin app) | `public/admin/` |
| Booking API, login check, availability | `worker/index.js` |
| Booking email Ron receives | `worker/email.js` |
| Database tables | `worker/schema.sql` |
| Logo and image generation | `_src/make_logos.py` |

Everything in `public/` is the live website. After editing anything in `_src/`, rebuild the pages:

```
python _src/build.py        # or: npm run pages
```

## Run it locally

```
npm install
npm run db:local        # first time only: creates the local database
npm run dev             # http://localhost:8787  (admin: /admin)
```

`.dev.vars` (not committed) holds local only settings. `DEV_ADMIN_EMAIL` lets you open `/admin` on your own machine without the Cloudflare login.

## How booking works

1. A customer books in the pop up (two steps: trip/date/guests, then contact info).
2. `POST /api/book` saves it to the database and emails Captain Ron.
3. Ron opens the Captain's Deck, taps **Confirm** or **Decline**, and can text the customer a ready made message.
4. Confirming can mark the day **booked**, which blocks it on the website forecast and booking form.
5. In the **Calendar** tab Ron taps any day to set it: Normal, All trips, Sunset only, Booked, On call or Off.

The normal week is `SCHEDULE` in `public/config.js` (weekdays: Sunset Irie Cruise only, weekends: every trip).

## Going live checklist

1. **Connect the domain** to this Cloudflare account, then uncomment `routes` in `wrangler.jsonc`.
2. **Create the database** (once):
   ```
   npx wrangler d1 create reel-irie
   ```
   Paste the `database_id` it prints into `wrangler.jsonc`, then run `npm run db:remote`.
3. **Lock down the admin** with Cloudflare Access (free):
   - Zero Trust → Access → Applications → Add → Self hosted
   - Domain: `reeliriecharters.com`, paths `admin` and `api/admin`
   - Policy: Allow → Emails → Ron's email (and yours)
   - Login method: One time PIN (a code is emailed), session duration 1 month
   - Copy the team domain (`<team>.cloudflareaccess.com`) and the app's **AUD tag** into `ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` in `wrangler.jsonc`, and set `ADMIN_EMAILS`.
4. **Branded booking emails** (optional, replaces FormSubmit): turn on Email Routing for the domain, verify Ron's email as a destination, then set `NOTIFY_FROM`, `NOTIFY_TO` and uncomment `send_email` in `wrangler.jsonc`.
5. Push to GitHub. Cloudflare builds and deploys from `main`.

## Forecast

The Boat Day Forecast uses [Open-Meteo](https://open-meteo.com) (free, no key) for weather, wind, rain chance, sunset, Gulf waves and water temperature. Ratings (Great / Good / Iffy / Rough) are set in `rate()` in `public/script.js`.

## Backups

If the API isn't reachable (for example, a plain static preview), the booking form emails requests straight through FormSubmit to `CONFIG.formEmail`. An optional Google Sheet can also feed availability (`CONFIG.availabilitySheet`, template from `python _src/make_availability_sheet.py`); the Captain's Deck calendar takes priority when it's live.
