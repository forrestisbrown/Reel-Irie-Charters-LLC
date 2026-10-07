# Team Reel Irie

Website for Team Reel Irie, private fishing and island charters out of St. Pete / Clearwater, FL.

Plain static site: `index.html`, `styles.css`, `script.js`, plus `images/`. Hosted on Cloudflare (see `wrangler.jsonc`).

## Editing

Almost everything you'd want to change lives at the top of **`script.js`**:

- `CONFIG` holds the captain's name, phone, email and the Web3Forms key.
- `CHARTERS` is the trip menu. Each trip has a name, type (`fishing` or `island`), hours, max guests, price and a short description. Set `price: null` to show "Call" instead of a number.

## Booking form

Requests are emailed through [Web3Forms](https://web3forms.com) (free). Enter the captain's email there, paste the access key into `CONFIG.web3formsKey`, and requests land in that inbox. Until a key is set, the form opens the visitor's email app with the request already filled in.

## Preview locally

```
npx wrangler dev
```
