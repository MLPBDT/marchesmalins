// Transactional emails + alerts (Resend, main domain). Prospecting uses lib/outreach.ts on a separate domain.
import { Resend } from "resend";
import { BRAND, LEGAL, SITE_URL } from "./config";
import fs from "fs";
import path from "path";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

export function layout(title: string, bodyHtml: string) {
  return `<!doctype html><html><body style="margin:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="font-weight:800;font-size:20px;color:#1d4ed8;margin-bottom:16px">${BRAND}</div>
<div style="background:#fff;border-radius:12px;padding:24px;line-height:1.55;font-size:15px">
<h1 style="font-size:19px;margin:0 0 12px">${esc(title)}</h1>${bodyHtml}</div>
<p style="font-size:11px;color:#6b7280;margin-top:16px">${BRAND} · ${esc(LEGAL.name)} · SIRET ${esc(LEGAL.siret)} · <a href="${SITE_URL}/compte" style="color:#6b7280">Mon compte</a></p>
</div></body></html>`;
}
export const button = (href: string, label: string, color = "#1d4ed8") =>
  `<a href="${href}" style="display:inline-block;background:${color};color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:700;margin:4px 6px 4px 0">${esc(label)}</a>`;
export { esc };

export async function sendEmail(to: string, subject: string, html: string, replyTo?: string, headers?: Record<string, string>) {
  if (!process.env.RESEND_API_KEY) {
    if (process.env.VERCEL) { console.warn(`[email non envoyé — RESEND_API_KEY manquante] ${to} : ${subject}`); return { id: "not-sent" }; }
    const dir = path.join(process.cwd(), ".data", "outbox");
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${Date.now()}-${to.replace(/[^a-z0-9]/gi, "_")}.html`), `<!-- to: ${to} | ${subject} -->\n${html}`);
    return { id: "dev" };
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const r = await resend.emails.send({ from: process.env.EMAIL_FROM || `${BRAND} <${LEGAL.email}>`, to, subject, html, replyTo: replyTo || LEGAL.email, ...(headers ? { headers } : {}) });
  if (r.error) throw new Error(`Resend: ${r.error.message}`);
  return r.data;
}
