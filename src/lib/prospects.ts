// Prospects : entreprises du métier dans un département où des marchés sont ouverts en ce moment.
import { db } from "./db";
import { textSearch, LIGHT_FIELDS } from "./places";
import { TRADES, tradeById, deptName, DEPTS } from "./trades";
import { matchingNotices } from "./alerts";
import { MOCK } from "./config";
import crypto from "crypto";

export type PStatus = "ready" | "sent1" | "sent2" | "sent3" | "replied" | "unsubscribed" | "converted" | "bounced" | "excluded";
export type Prospect = {
  slug: string; placeId: string; name: string; city: string; dept: string; trade: string; email: string; website: string | null;
  status: PStatus; createdAt: string; lastSentAt?: string; box?: string; views?: number; lastViewAt?: string; bounceReason?: string; score: number;
};

export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
export async function getProspect(slug: string) { return db.get<Prospect>(`prospect:${slug}`); }
export async function saveProspect(p: Prospect) { await db.set(`prospect:${p.slug}`, p, 60 * 60 * 24 * 60); await db.sadd("prospects", p.slug); }
export async function allProspects(): Promise<Prospect[]> { const s = await db.smembers("prospects"); return (await Promise.all(s.map(getProspect))).filter(Boolean) as Prospect[]; }
export async function isSuppressed(email: string) { return db.sismember("suppression", email.toLowerCase().trim()); }
export async function suppress(email: string) { await db.sadd("suppression", email.toLowerCase().trim()); }

// Only addresses published by the business itself (own domain, or a business-looking freemail).
const FREEMAIL = /@(gmail|googlemail|hotmail|outlook|live|yahoo|orange|wanadoo|free|sfr|laposte|icloud|me|aol|bbox|neuf|numericable)\./i;
const GENERIC = /^(contact|info|infos|bonjour|hello|accueil|devis|commercial|secretariat|administration|admin|direction|gerance|bureau|entreprise|sarl|sas|atelier)[\w.-]*@/i;
const BAD = /@(google|facebook|instagram|wix|wixpress|sentry|godaddy|ovh|squarespace)\.|\.(png|jpe?g|gif|webp|svg)$|example\.|sentry|wixpress|domain\.|votre|your|email@|nom@|@2x/i;
export async function findEmail(website: string | null, bizName: string): Promise<string | null> {
  if (MOCK) return "contact@example.com";
  if (!website) return null;
  let host: string;
  try { host = new URL(website).hostname.replace(/^www\./, ""); } catch { return null; }
  // website hosted on a platform (Google Sites, business.site, Facebook, Wix…) → its emails belong to the platform, not the business
  if (/(^|\.)(google|business\.site|facebook|instagram|wix|wixsite|linktr\.ee|pagesjaunes|solocal|jimdo|webnode|square\.site|yelp|tripadvisor|doctolib|planity|treatwell|kiute|calendly)\b/i.test(host)) return null;
  const pages = [website, new URL("/contact", website).href, new URL("/mentions-legales", website).href, new URL("/nous-contacter", website).href];
  const found = new Set<string>();
  for (const url of pages) {
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (compatible; MarchesMalinsBot/1.0)" }, signal: AbortSignal.timeout(8000), redirect: "follow" });
      if (!res.ok) continue;
      const html = (await res.text()).replace(/&#64;|\[at\]|\(at\)/gi, "@");
      for (const m of html.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g)) found.add(m[0].toLowerCase());
    } catch { /* ignore */ }
    if (found.size) break;
  }
  const tok = slugify(bizName).split("-").filter((t) => t.length >= 4);
  const ok = [...found].filter((e) => !BAD.test(e)).filter((e) => {
    const [local, dom] = e.split("@");
    if (dom === host || dom.endsWith("." + host)) return true;
    if (FREEMAIL.test(e)) return GENERIC.test(e) || tok.some((t) => local.includes(t));
    return false;
  });
  return ok.sort((a, b) => Number(GENERIC.test(b)) - Number(GENERIC.test(a)))[0] || null;
}
export async function hasMx(email: string) {
  if (MOCK) return true;
  try { const dns = await import("dns/promises"); return (await dns.resolveMx(email.split("@")[1])).length > 0; } catch { return false; }
}

// Picks the next (trade, dept) pair that has ≥ MIN open calls, then sources businesses of that trade there.
const MIN_OPEN = Number(process.env.OUTREACH_MIN_OPEN || 2);
const TARGET_DEPTS = (process.env.PROSPECT_DEPTS || "83,13,06,84,04,05,30,34,31,33,69,38,44,35,59,67,75,92,93,94,77,78,91,95").split(",").map((s) => s.trim()).filter((d) => DEPTS[d]);
const TARGET_TRADES = (process.env.PROSPECT_TRADES || "couvreur,plombier,electricien,cvc,macon,menuisier,peintre,platrier,carreleur,paysagiste,serrurier,nettoyage,vitrier,demolition,vrd").split(",").filter((t) => tradeById(t));

export async function sourceStep(log: (s: string) => void, left: () => number, target: number) {
  let done = 0;
  const memo = new Map();
  for (let guard = 0; guard < 40 && done < target && left() > 20000; guard++) {
    const i = ((await db.get<number>("rot:pair")) || 0);
    await db.set("rot:pair", i + 1);
    const trade = TARGET_TRADES[i % TARGET_TRADES.length];
    const dept = TARGET_DEPTS[Math.floor(i / TARGET_TRADES.length) % TARGET_DEPTS.length];
    const open = await matchingNotices({ trades: [trade], depts: [dept], keywords: [] }, memo);
    if (open.length < MIN_OPEN) { log(`· ${trade} ${dept} : ${open.length} marché(s) ouvert(s), on passe`); continue; }
    const t = tradeById(trade)!;
    log(`recherche : ${t.name} ${deptName(dept)} (${open.length} marché(s) ouvert(s))`);
    let places;
    try { places = await textSearch(`${t.name.split(" /")[0]} ${deptName(dept)}`, 3, LIGHT_FIELDS); } catch (e: any) { log(`! Places : ${e.message}`); break; }
    for (const p of places) {
      if (done >= target || left() < 15000) break;
      if (await db.sismember("prospect-places", p.placeId)) continue;
      await db.sadd("prospect-places", p.placeId);
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      const email = await findEmail(p.website, p.name);
      if (!email) continue;
      if ((await isSuppressed(email)) || (await db.sismember("prospect-emails", email))) continue;
      if (!(await hasMx(email))) continue;
      const pr: Prospect = {
        slug: `${slugify(p.name) || "entreprise"}-${crypto.randomBytes(3).toString("hex")}`, placeId: p.placeId, name: p.name, city: p.city, dept, trade, email, website: p.website,
        status: "ready", createdAt: new Date().toISOString(), score: open.length + (p.reviewCount >= 10 ? 2 : 0),
      };
      await saveProspect(pr); await db.sadd("prospect-emails", email);
      done++;
      log(`+ ${p.name} (${email})`);
    }
  }
  return done;
}
export { TRADES };
