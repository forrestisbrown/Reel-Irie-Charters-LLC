/**
 * Pre-launch passcode screen for the whole site.
 * On only while the SITE_PASSCODE secret is set:
 *   npx wrangler secret put SITE_PASSCODE     (turn on / change the code)
 *   npx wrangler secret delete SITE_PASSCODE  (launch: open the site to everyone)
 */
const COOKIE = "ri_pass";
const DAYS = 30;
const OPEN = new Set(["/images/logo.png", "/favicon.png", "/robots.txt"]);

async function token(code) {
  const bytes = new TextEncoder().encode(`reel-irie:${code}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function hasCookie(request, value) {
  const cookies = request.headers.get("cookie") || "";
  return cookies.split(/;\s*/).includes(`${COOKIE}=${value}`);
}

// Returns a Response when the visitor must stop at the gate, or null to let them through
export async function gate(request, env, url) {
  const code = env.SITE_PASSCODE;
  if (!code) return null;
  if (OPEN.has(url.pathname)) return null; // the gate page's own logo and icon
  const good = await token(code);

  if (url.pathname === "/__unlock" && request.method === "POST") {
    const form = await request.formData().catch(() => null);
    const tried = String(form?.get("code") || "").trim();
    const next = String(form?.get("next") || "/");
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    if (tried === String(code)) {
      return new Response(null, {
        status: 303,
        headers: {
          location: safeNext,
          "set-cookie": `${COOKIE}=${good}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    await new Promise((r) => setTimeout(r, 1200)); // slows down guessing
    return page(safeNext, true);
  }

  if (hasCookie(request, good)) return null;
  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ error: "Site not open yet" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  return page(url.pathname + url.search, false);
}

function page(next, wrong) {
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Reel Irie Charters</title>
<link rel="icon" href="/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bevan&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px;
    background: radial-gradient(120% 80% at 50% 0%, #2a1606 0%, #050505 60%); color: #f4efe3; font-family: Outfit, system-ui, sans-serif; }
  .box { width: 100%; max-width: 360px; text-align: center; }
  img { width: 170px; height: auto; filter: drop-shadow(0 16px 30px rgba(0,0,0,.6)); }
  h1 { font-family: Bevan, Georgia, serif; font-weight: 400; font-size: 1.6rem; margin: 18px 0 6px; }
  p { color: #c9c3b4; margin: 0 0 22px; line-height: 1.5; }
  input { width: 100%; font: 700 1.6rem Outfit, sans-serif; letter-spacing: .4em; text-align: center; padding: 14px 12px;
    border-radius: 14px; border: 1px solid #333; background: #111; color: #fff; }
  input:focus { outline: 2px solid #ffd21a; outline-offset: 2px; }
  button { width: 100%; margin-top: 12px; padding: 15px; border: 0; border-radius: 999px; background: #ffd21a; color: #111;
    font: 700 1.05rem Outfit, sans-serif; cursor: pointer; }
  .err { color: #ff8a7a; font-weight: 600; margin: 12px 0 0; }
  .call { display: inline-block; margin-top: 26px; color: #ffd21a; text-decoration: none; font-weight: 600; }
</style></head>
<body><main class="box">
  <img src="/images/logo.png" alt="Reel Irie Charters">
  <h1>Coming Soon</h1>
  <p>We're getting the boat ready. Enter the passcode to take a look.</p>
  <form method="post" action="/__unlock">
    <input type="hidden" name="next" value="${esc(next)}">
    <input name="code" type="password" inputmode="numeric" autocomplete="off" aria-label="Passcode" autofocus required>
    <button type="submit">Come Aboard</button>
    ${wrong ? '<p class="err">That code didn\'t work. Try again.</p>' : ""}
  </form>
  <a class="call" href="tel:+17273861281">Call Captain Ron: (727) 386-1281</a>
</main></body></html>`;
  return new Response(html, {
    status: wrong ? 401 : 200,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" },
  });
}
