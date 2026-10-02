// Prospection B2B (CNIL : message en rapport avec l'activité, identité, origine de l'adresse, opposition en 1 clic).
import nodemailer from "nodemailer";
import { db } from "./db";
import { allProspects, saveProspect, isSuppressed, Prospect } from "./prospects";
import { matchingNotices, daysLeft } from "./alerts";
import { tradeById, inDept } from "./trades";
import { SITE_URL, LEGAL, BRAND } from "./config";
import { sign } from "./models";

const DAY = 864e5;
const GAP = { sent1: 5 * DAY, sent2: 7 * DAY };

function boxes() {
  const users = (process.env.OUTREACH_SMTP_USERS || "").split(",").map((s) => s.trim()).filter(Boolean);
  const pw = (process.env.OUTREACH_SMTP_PASSWORDS || "").split(",").map((s) => s.replace(/\s+/g, ""));
  return users.map((u, i) => ({ user: u, pass: pw[i] || pw[0] }));
}
const listUrl = (p: Prospect, step: number) => `${SITE_URL}/marches/${p.dept}/${p.trade}?r=${p.slug}&s=${step}`;
const unsubUrl = (p: Prospect) => `${SITE_URL}/desinscription/${sign({ e: p.email, p: p.slug }, 60 * 60 * 24 * 365)}`;
const fmt = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }) : "");

export async function composeEmail(p: Prospect, step: 1 | 2 | 3) {
  const t = tradeById(p.trade)!;
  const all = await matchingNotices({ trades: [p.trade], depts: [p.dept], keywords: [] });
  const n = all.length;
  const newer = p.lastSentAt ? all.filter((x) => x.addedAt > p.lastSentAt!).length : n;
  const ex = all.filter((x) => (daysLeft(x.deadline) ?? 30) >= 7).slice(0, 2);
  const sender = process.env.OUTREACH_SENDER_NAME || "Mattéo";
  const host = (() => { try { return new URL(p.website || "").hostname.replace(/^www\./, ""); } catch { return "votre site internet"; } })();
  const footer = `\n\n--\n${sender} · ${BRAND} · ${LEGAL.name} · SIRET ${LEGAL.siret} · ${LEGAL.address}\n` +
    `Pourquoi ce message : votre adresse professionnelle est publiée sur ${host} et ce message concerne votre activité (${t.plural}). ` +
    `Pour ne plus rien recevoir, un clic : ${unsubUrl(p)} — Vos droits (accès, opposition, effacement) : ${SITE_URL}/confidentialite`;
  const pl = (k: number, one: string, many: string) => (k > 1 ? many : one);
  const subject1 = `${n} ${pl(n, "marché public", "marchés publics")} de ${t.plural} ${inDept(p.dept)}`;
  const examples = ex.map((x) => `- « ${x.objet.slice(0, 110)}${x.objet.length > 110 ? "…" : ""} » (${x.acheteur.slice(0, 60)})${x.deadline ? `, réponse avant le ${fmt(x.deadline)}` : ""}`).join("\n");
  if (step === 1) return {
    n, subject: subject1,
    text: `Bonjour,\n\nEn ce moment, ${n} ${pl(n, "marché public", "marchés publics")} de ${t.plural} ${pl(n, "est ouvert", "sont ouverts")} ${inDept(p.dept)}${ex.length ? ", par exemple :" : "."}\n${examples}\n\nLa liste complète et à jour, avec le lien vers chaque avis officiel :\n${listUrl(p, 1)}\n\nSi vous voulez les recevoir sans chercher : l'alerte du lundi est gratuite, ou 19 €/mois pour une alerte chaque matin avec un résumé de chaque marché (montant, lots, visite obligatoire, accessible ou non à une petite entreprise).\n\nBonne journée,\n${sender}${footer}`,
  };
  if (step === 2) return {
    n, subject: `Re: ${subject1}`,
    text: `Bonjour,\n\n${newer > 0 ? `Depuis mon message, ${newer} nouveau${newer > 1 ? "x" : ""} marché${newer > 1 ? "s" : ""} de ${t.plural} ${newer > 1 ? "sont sortis" : "est sorti"} ${inDept(p.dept)}.` : `Les marchés de ${t.plural} ${inDept(p.dept)} sont toujours ouverts.`} La liste à jour est ici :\n${listUrl(p, 2)}\n\nL'alerte du lundi est gratuite, il suffit de laisser votre email sur la page.\n\n${sender}${footer}`,
  };
  return {
    n, subject: `Dernier message — marchés ${t.plural}`,
    text: `Bonjour,\n\nJe ne vous écrirai plus après celui-ci. Si un jour vous voulez recevoir automatiquement les marchés publics de ${t.plural} de votre secteur, tout est ici :\n${listUrl(p, 3)}\n\nBonne continuation,\n${sender}${footer}`,
  };
}

export async function runOutreach(opts: { dryRun?: boolean; log?: (s: string) => void; maxPerRun?: number } = {}) {
  const log = opts.log || (() => {});
  const maxPerRun = opts.maxPerRun ?? 2;
  const bx = boxes();
  const limit = Number(process.env.OUTREACH_DAILY_LIMIT_PER_BOX || 10);
  const today = new Date().toISOString().slice(0, 10);
  const hour = Number(new Date().toLocaleString("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }));
  const dow = new Date().toLocaleString("en-GB", { timeZone: "Europe/Paris", weekday: "short" });
  if (!opts.dryRun && (hour < 8 || hour > 18 || dow === "Sat" || dow === "Sun")) { log("Hors plage d'envoi (lun-ven 8h-18h)."); return { sent: 0 }; }
  if (!opts.dryRun && process.env.OUTREACH_ENABLED !== "1") { log("Prospection désactivée (OUTREACH_ENABLED≠1)."); return { sent: 0 }; }
  const due = (await allProspects()).filter((p) =>
    p.status === "ready" ||
    (p.status === "sent1" && p.lastSentAt && Date.now() - +new Date(p.lastSentAt) > GAP.sent1) ||
    (p.status === "sent2" && p.lastSentAt && Date.now() - +new Date(p.lastSentAt) > GAP.sent2)
  ).sort((a, b) => Number(b.status !== "ready") - Number(a.status !== "ready") || b.score - a.score);
  let sent = 0;
  for (const p of due) {
    if (sent >= maxPerRun) break;
    if (await isSuppressed(p.email)) { p.status = "unsubscribed"; await saveProspect(p); continue; }
    const box = p.box ? bx.find((b) => b.user === p.box) : bx[sent % Math.max(1, bx.length)];
    if (!box && !opts.dryRun) { log("Aucune boîte d'envoi configurée."); break; }
    const key = `outreach-count:${today}:${box?.user || "dry"}`;
    if (((await db.get<number>(key)) || 0) >= limit) continue;
    const step = (p.status === "ready" ? 1 : p.status === "sent1" ? 2 : 3) as 1 | 2 | 3;
    const m = await composeEmail(p, step);
    if (step === 1 && m.n < 2) { log(`· ${p.name} : plus assez de marchés ouverts, reporté`); continue; }
    if (opts.dryRun) { log(`[dry] ${p.email} — ${m.subject}`); sent++; continue; }
    const tr = nodemailer.createTransport({ host: process.env.OUTREACH_SMTP_HOST, port: Number(process.env.OUTREACH_SMTP_PORT || 587), secure: Number(process.env.OUTREACH_SMTP_PORT) === 465, auth: { user: box!.user, pass: box!.pass } });
    try {
      await tr.sendMail({
        from: `"${(process.env.OUTREACH_SENDER_NAME || "Mattéo").replace(/"/g, "")}" <${box!.user}>`, to: p.email, subject: m.subject, text: m.text,
        headers: { "List-Unsubscribe": `<${unsubUrl(p).replace("/desinscription/", "/api/unsubscribe/")}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      p.status = step === 1 ? "sent1" : step === 2 ? "sent2" : "sent3"; p.lastSentAt = new Date().toISOString(); p.box = box!.user;
      await saveProspect(p); await db.incr(key, 60 * 60 * 36); sent++;
      log(`→ ${p.email} (étape ${step})`);
    } catch (e: any) {
      const rcpt = e.command === "RCPT TO" || /user unknown|does not exist|no such user|mailbox unavailable|recipient address rejected/i.test(e.message);
      if (rcpt && e.responseCode >= 500) { p.status = "bounced"; p.bounceReason = String(e.message).slice(0, 200); await saveProspect(p); log(`! ${p.email}: adresse refusée`); continue; }
      const msg = `ERREUR SMTP ${box!.user} [${e.code || ""} ${e.responseCode || ""}] ${e.message}`;
      log(msg); await db.set("outreach:lastError", { at: new Date().toISOString(), msg }, 60 * 60 * 24 * 7);
      break;
    }
  }
  return { sent };
}

export async function smtpTest(to: string, log: (s: string) => void) {
  const bx = boxes();
  if (!bx.length) { log("Aucune boîte : OUTREACH_SMTP_USERS vide"); return; }
  for (const b of bx) {
    const tr = nodemailer.createTransport({ host: process.env.OUTREACH_SMTP_HOST, port: Number(process.env.OUTREACH_SMTP_PORT || 587), secure: Number(process.env.OUTREACH_SMTP_PORT) === 465, auth: { user: b.user, pass: b.pass } });
    try { await tr.verify(); await tr.sendMail({ from: `"Test ${BRAND}" <${b.user}>`, to, subject: `Test envoi ${b.user}`, text: `Envoi OK depuis ${b.user}.` }); log(`OK ${b.user} → ${to}`); }
    catch (e: any) { log(`ERREUR ${b.user} [${e.code || ""} ${e.responseCode || ""}] ${e.message}`); }
  }
}
