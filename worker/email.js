/**
 * The "new booking" email Captain Ron gets.
 *
 * Sends with Cloudflare Email Routing (the NOTIFY binding) once the domain is
 * connected. Until then it falls back to FormSubmit (FORMSUBMIT_EMAIL).
 */

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const prettyDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
};
const digits = (p) => String(p).replace(/[^\d+]/g, "");

export function bookingEmail(b, origin) {
  const guests = `${b.adults} adult${b.adults === 1 ? "" : "s"}${b.kids ? `, ${b.kids} kid${b.kids === 1 ? "" : "s"}${b.kid_ages ? ` (ages ${b.kid_ages})` : ""}` : ""}`;
  const subject = `New booking request: ${b.trip_name}, ${prettyDate(b.date)} (${b.name})`;
  const admin = `${origin}/admin/#booking-${b.id}`;
  const sms = `sms:${digits(b.phone)}?&body=${encodeURIComponent(`Hi ${b.name.split(" ")[0]}, this is Captain Ron with Reel Irie Charters about your ${b.trip_name} request for ${prettyDate(b.date)}.`)}`;

  const row = (k, v) => v ? `<tr><td style="padding:10px 0;color:#8a8478;font-size:13px;width:110px;vertical-align:top">${k}</td><td style="padding:10px 0;color:#141414;font-size:15px;font-weight:600">${v}</td></tr>` : "";
  const btn = (href, label, bg, fg) => `<a href="${href}" style="display:inline-block;background:${bg};color:${fg};text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:999px;margin:4px 6px 4px 0">${label}</a>`;

  const html = `<!doctype html><html><body style="margin:0;background:#f2efe7;font-family:Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2efe7;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
  <tr><td style="height:6px;background:linear-gradient(90deg,#19c83c 0 33%,#ffd614 33% 66%,#ec241c 66%);background-color:#ffd614"></td></tr>
  <tr><td style="background:#050505;padding:22px 24px" align="center">
    <img src="${origin}/images/wordmark.png" width="280" alt="Reel Irie Charters" style="display:block;max-width:100%;height:auto">
  </td></tr>
  <tr><td style="padding:26px 24px 8px">
    <p style="margin:0 0 4px;color:#b8860b;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">New booking request</p>
    <h1 style="margin:0 0 4px;color:#141414;font-size:24px">${esc(b.trip_name)}</h1>
    <p style="margin:0;color:#555;font-size:16px">${esc(prettyDate(b.date))}</p>
  </td></tr>
  <tr><td style="padding:8px 24px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee">
      ${row("Guests", esc(guests))}
      ${row("Island", esc(b.island))}
      ${row("Name", esc(b.name))}
      ${row("Phone", `<a href="tel:${esc(digits(b.phone))}" style="color:#141414">${esc(b.phone)}</a>`)}
      ${row("Email", `<a href="mailto:${esc(b.email)}" style="color:#141414">${esc(b.email)}</a>`)}
      ${row("Notes", esc(b.notes).replace(/\n/g, "<br>"))}
    </table>
  </td></tr>
  <tr><td style="padding:12px 24px 26px">
    ${btn(`tel:${esc(digits(b.phone))}`, "Call " + esc(b.name.split(" ")[0]), "#ffd614", "#000")}
    ${btn(esc(sms), "Text", "#141414", "#fff")}
    ${btn(admin, "Open Captain's Deck", "#19c83c", "#000")}
  </td></tr>
  <tr><td style="padding:14px 24px;background:#faf8f2;color:#8a8478;font-size:12px" align="center">Reel Irie Charters &middot; Reply to this email to answer ${esc(b.name.split(" ")[0])} directly</td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `New booking request #${b.id}`, "",
    `${b.trip_name} on ${prettyDate(b.date)}`,
    `Guests: ${guests}`,
    b.island ? `Island: ${b.island}` : "",
    `Name: ${b.name}`, `Phone: ${b.phone}`, `Email: ${b.email}`,
    b.notes ? `Notes: ${b.notes}` : "", "",
    `Captain's Deck: ${admin}`,
  ].filter((l) => l !== null).join("\n");

  return { subject, html, text };
}

export async function notifyCaptain(env, b, origin) {
  const { subject, html, text } = bookingEmail(b, origin);

  if (env.NOTIFY && env.NOTIFY_FROM && env.NOTIFY_TO) {
    const { EmailMessage } = await import("cloudflare:email");
    const boundary = "rirc-" + crypto.randomUUID();
    const encSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
    const b64 = (s) => btoa(unescape(encodeURIComponent(s))).replace(/.{76}/g, "$&\r\n");
    const raw = [
      `From: Reel Irie Website <${env.NOTIFY_FROM}>`,
      `To: ${env.NOTIFY_TO}`,
      `Reply-To: ${b.email}`,
      `Subject: ${encSubject}`,
      `Message-ID: <${crypto.randomUUID()}@${env.NOTIFY_FROM.split("@")[1]}>`,
      `Date: ${new Date().toUTCString()}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`, "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64(text),
      `--${boundary}`, "Content-Type: text/html; charset=UTF-8", "Content-Transfer-Encoding: base64", "", b64(html),
      `--${boundary}--`, "",
    ].join("\r\n");
    await env.NOTIFY.send(new EmailMessage(env.NOTIFY_FROM, env.NOTIFY_TO, raw));
    return;
  }

  if (env.FORMSUBMIT_EMAIL) {
    await fetch(`https://formsubmit.co/ajax/${env.FORMSUBMIT_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", Referer: origin + "/", Origin: origin },
      body: JSON.stringify({
        _subject: subject, _template: "table", _captcha: "false", _replyto: b.email,
        Trip: b.trip_name, Date: prettyDate(b.date), Adults: b.adults, Kids: b.kids, "Kids' ages": b.kid_ages,
        Island: b.island || "Captain's choice", name: b.name, phone: b.phone, email: b.email, Notes: b.notes,
        "Captain's Deck": `${origin}/admin/`,
      }),
    });
  }
}
