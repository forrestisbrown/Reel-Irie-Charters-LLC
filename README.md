# Reel Irie Charters

Website for Reel Irie Charters LLC: private island hopping and sunset boat charters with Captain Ron Brown, St. Pete / Clearwater, FL.

Static site hosted on Cloudflare (see `wrangler.jsonc`). No framework, no install.

## Where things live

| What | Where |
| --- | --- |
| Trips, prices, phone, form email | top of `script.js` (`CONFIG`, `CHARTERS`) |
| Home page content | `_src/home.html` |
| Booking pop up | `booking_modal()` in `_src/build.py` |
| Island pages, shared header/menu/footer | `_src/build.py` |
| Styles | `styles.css` |
| Logo and image generation | `_src/make_logos.py` |

After editing anything in `_src/`, rebuild the pages:

```
python _src/build.py
```

`index.html`, `404.html` and `islands/*/index.html` are generated, so edit their sources in `_src/` rather than the output.

## Schedule and availability

The weekly pattern is `SCHEDULE` at the top of `script.js` (right now: weekdays are Sunset Irie Cruise only, weekends run every trip). The trip cards, the forecast and the booking form all read from it.

For specific dates (on call days, booked days, days off), Ron uses a Google Sheet from his phone. A ready made template is built by `python _src/make_availability_sheet.py` (saves `Reel Irie Availability.xlsx` to Downloads), with a status dropdown, color coding and a How to use tab.

1. Upload the .xlsx to Google Drive, open it with Google Sheets, then File > Save as Google Sheets
2. File > Share > Publish to web > pick the **Availability** tab > **Comma separated values (.csv)** > Publish
3. Paste that link into `CONFIG.availabilitySheet` in `script.js` (one time)

Statuses: `off`, `on call`, `booked` (blocks the day), `sunset only`, `open` (every trip). Past dates are ignored.

After that, edits to the sheet show up on the site within a minute, with no code changes. `off`, `booked` and `on call` block the date in the form and grey it out in the forecast.

## Forecast

The Boat Day Forecast uses [Open-Meteo](https://open-meteo.com) (free, no key): weather, wind, rain chance and sunset from the forecast API, and Gulf wave height and water temperature from the marine API. Ratings (Great / Good / Iffy / Rough) are set in `rate()` in `script.js`.

## Booking form

Requests are sent with [FormSubmit](https://formsubmit.co) to `CONFIG.formEmail`. The first request sends an activation email to that address. Click it once and requests start arriving. FormSubmit then offers a random alias you can swap in for the email address so it isn't visible in the page source.

## Preview locally

```
python -m http.server 8931
```
