import { Subscriber, saveSub, allSubs, sign, logEvent } from "./models";
import { Notice, openNotices } from "./boamp";
import { analyze, ACCESS_LABEL, Analysis } from "./analysis";
import { tradeById, matches, DEPTS, deptName } from "./trades";
import { PLANS, SITE_URL, BRAND } from "./config";
import { sendEmail, layout, button, esc } from "./email";

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }) : "non précisée");
export const daysLeft = (s: string | null) => (s ? Math.ceil((+new Date(s) - Date.now()) / 864e5) : null);

export async function matchingNotices(sub: Pick<Subscriber, "trades" | "depts" | "keywords">, memo: Map<string, Notice[]> = new Map()): Promise<Notice[]> {
  const depts = sub.depts.includes("FR") ? Object.keys(DEPTS) : sub.depts;
  const trades = sub.trades.map(tradeById).filter(Boolean);
  const seen = new Set<string>();
  const out: Notice[] = [];
  for (const d of depts) {
    if (!memo.has(d)) memo.set(d, await openNotices(d));
    for (const n of memo.get(d)!) {
      if (seen.has(n.id)) continue;
      const text = `${n.objet} ${n.desc.join(" ")}`;
      if (trades.some((t) => matches(t!, text, n.types, sub.keywords)) || (sub.keywords.length && trades.length === 0 && matches({ id: "kw", name: "", plural: "", kw: [] }, text, n.types, sub.keywords))) { seen.add(n.id); out.push(n); }
    }
  }
  return out.sort((a, b) => b.published.localeCompare(a.published));
}

function noticeHtml(n: Notice, a: Analysis | null) {
  const dl = daysLeft(n.deadline);
  const facts = a ? [a.montant && `💶 ${esc(a.montant)}`, a.lots && `📦 ${esc(a.lots)}`, a.duree && `⏱️ ${esc(a.duree)}`, a.visite && `👀 Visite : ${esc(a.visite)}`].filter(Boolean).join("<br>") : "";
  return `<div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin:0 0 14px">
<div style="font-size:12px;color:#64748b">${esc(n.acheteur)} · ${n.depts.map(deptName).join(", ")}</div>
<div style="font-weight:700;font-size:15px;margin:4px 0 6px">${esc(n.objet)}</div>
${a ? `<div style="font-size:14px;color:#334155;margin-bottom:6px">${esc(a.resume)}</div>${facts ? `<div style="font-size:13px;color:#334155;margin-bottom:6px">${facts}</div>` : ""}<div style="font-size:13px;margin-bottom:6px"><b>${ACCESS_LABEL[a.accessible]}</b> — ${esc(a.pourquoi || "")}</div>` : ""}
<div style="font-size:13px;color:${dl != null && dl <= 7 ? "#b91c1c" : "#334155"}">📅 Date limite : <b>${fmtDate(n.deadline)}</b>${dl != null ? ` (dans ${dl} j)` : ""}</div>
<div style="margin-top:8px"><a href="${n.url}" style="color:#1d4ed8;font-weight:700;font-size:13px">Voir l'avis officiel et le dossier →</a></div></div>`;
}

export async function digestFor(sub: Subscriber, memo: Map<string, Notice[]>, opts: { dryRun?: boolean; aiBudget?: () => boolean } = {}) {
  const plan = PLANS[sub.plan];
  const all = await matchingNotices(sub, memo);
  const fresh = all.filter((n) => !sub.sent.includes(n.id)).slice(0, plan.ai ? 15 : 10);
  // Pro: deadline reminders (5-6 days left) for notices already sent
  let reminders: Notice[] = [];
  if (sub.plan === "pro") reminders = all.filter((n) => sub.sent.includes(n.id) && [5, 6].includes(daysLeft(n.deadline) ?? -1) && !sub.sent.includes(`r:${n.id}`));
  if (!fresh.length && !reminders.length) return { sent: 0 };
  const analyses = new Map<string, Analysis | null>();
  if (plan.ai) for (const n of fresh) { if (opts.aiBudget && !opts.aiBudget()) break; analyses.set(n.id, await analyze(n)); }
  const manage = `${SITE_URL}/auth/${sign({ s: sub.id }, 60 * 60 * 24 * 30)}?next=/compte`;
  const unsub = `${SITE_URL}/api/unsubscribe/${sign({ s: sub.id }, 60 * 60 * 24 * 365)}`;
  const body = `
<p>${fresh.length ? `<b>${fresh.length} nouveau${fresh.length > 1 ? "x" : ""} marché${fresh.length > 1 ? "s" : ""}</b> pour vous${plan.daily ? " depuis hier" : " cette semaine"} :` : ""}</p>
${fresh.map((n) => noticeHtml(n, analyses.get(n.id) || null)).join("")}
${reminders.length ? `<h2 style="font-size:16px;margin:18px 0 8px">⏰ Dates limites dans moins d'une semaine</h2>${reminders.map((n) => noticeHtml(n, null)).join("")}` : ""}
${!plan.ai ? `<div style="background:#eff6ff;border-radius:10px;padding:14px 16px;margin-top:10px;font-size:14px"><b>Recevez-les chaque matin, résumés et triés</b> : alerte quotidienne, résumé en 3 lignes, montant, lots, visite obligatoire et verdict « accessible à une petite entreprise ? ». 19 €/mois, sans engagement.<br>${button(`${SITE_URL}/commencer?plan=solo&e=${encodeURIComponent(sub.email)}`, "Passer à l'alerte quotidienne")}</div>` : ""}
<p style="font-size:12px;color:#64748b;margin-top:18px">Données : BOAMP (DILA), licence ouverte. Les résumés sont générés automatiquement : vérifiez toujours l'avis officiel avant de répondre.<br><a href="${manage}" style="color:#64748b">Modifier mes métiers et départements</a> · <a href="${unsub}" style="color:#64748b">Me désabonner</a></p>`;
  const subject = fresh.length ? `${fresh.length} marché${fresh.length > 1 ? "s" : ""} : ${fresh[0].objet.slice(0, 60)}${fresh[0].objet.length > 60 ? "…" : ""}` : `⏰ ${reminders.length} date${reminders.length > 1 ? "s" : ""} limite${reminders.length > 1 ? "s" : ""} approche${reminders.length > 1 ? "nt" : ""}`;
  if (opts.dryRun) return { sent: fresh.length, subject, html: layout("Vos marchés publics", body) };
  await sendEmail(sub.email, subject, layout("Vos marchés publics", body), undefined, { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
  sub.sent.push(...fresh.map((n) => n.id), ...reminders.map((n) => `r:${n.id}`));
  sub.lastDigestAt = new Date().toISOString();
  await saveSub(sub);
  return { sent: fresh.length, subject };
}

export async function runDigests(log: (s: string) => void, left: () => number) {
  const isMonday = new Date().toLocaleString("en-GB", { timeZone: "Europe/Paris", weekday: "short" }) === "Mon";
  const today = new Date().toISOString().slice(0, 10);
  const subs = (await allSubs()).filter((s) => s.confirmed && (s.status === "active") && (PLANS[s.plan].daily || isMonday) && (s.lastDigestAt || "").slice(0, 10) !== today);
  const memo = new Map<string, Notice[]>();
  let n = 0;
  for (const s of subs) {
    if (left() < 12000) { log("budget épuisé, la suite au prochain passage"); break; }
    try { const r = await digestFor(s, memo, { aiBudget: () => left() > 15000 }); if (r.sent) { n++; log(`→ ${s.email} : ${r.sent} marché(s)`); } }
    catch (e: any) { log(`! ${s.email}: ${e.message}`); }
  }
  if (n) await logEvent("digests", { n });
  log(`${n} alerte(s) envoyée(s) sur ${subs.length} abonné(s) à traiter`);
}

export async function welcomeEmail(sub: Subscriber) {
  const list = await matchingNotices(sub);
  const link = `${SITE_URL}/auth/${sign({ s: sub.id }, 60 * 60 * 24 * 7)}?next=/compte`;
  await sendEmail(sub.email, `${BRAND} : votre alerte est active (${list.length} marché${list.length > 1 ? "s" : ""} ouvert${list.length > 1 ? "s" : ""} en ce moment)`, layout("Votre alerte est active", `
<p>${list.length ? `Il y a déjà <b>${list.length} marché${list.length > 1 ? "s" : ""} ouvert${list.length > 1 ? "s" : ""}</b> qui correspondent à vos critères. Les voici :` : "Aucun marché ouvert ne correspond à vos critères aujourd'hui. Vous serez prévenu dès qu'il en sort un."}</p>
${list.slice(0, 10).map((n) => noticeHtml(n, null)).join("")}
<p>${button(link, "Gérer mon alerte")}</p>`));
  sub.sent.push(...list.slice(0, 10).map((n) => n.id));
  await saveSub(sub);
}
