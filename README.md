# Reel Irie Charters

Website for Reel Irie Charters LLC: private island hopping and sunset boat charters with Captain Ron Brown, St. Pete / Clearwater, FL.

Static site hosted on Cloudflare (see `wrangler.jsonc`). No framework, no install.

## Where things live

| What | Where |
| --- | --- |
| Trips, prices, phone, form email | top of `script.js` (`CONFIG`, `CHARTERS`) |
| Home page content | `_src/home.html` |
| Island pages, shared header/menu/footer | `_src/build.py` |
| Styles | `styles.css` |
| Logo and image generation | `_src/make_logos.py` |

After editing anything in `_src/`, rebuild the pages:

```
python _src/build.py
```

`index.html`, `404.html` and `islands/*/index.html` are generated, so edit their sources in `_src/` rather than the output.

## Booking form

Requests are sent with [FormSubmit](https://formsubmit.co) to `CONFIG.formEmail`. The first request sends an activation email to that address. Click it once and requests start arriving. FormSubmit then offers a random alias you can swap in for the email address so it isn't visible in the page source.

## Preview locally

```
python -m http.server 8931
```
