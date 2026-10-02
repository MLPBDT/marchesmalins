// BOAMP open data (DILA, licence ouverte) via l'API Opendatasoft.
import { db } from "./db";
import { MOCK } from "./config";

const API = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";
const SELECT = "idweb,objet,nomacheteur,code_departement,type_marche,descripteur_libelle,nature_libelle,procedure_libelle,dateparution,datelimitereponse,url_avis";

export type Notice = {
  id: string; objet: string; acheteur: string; depts: string[]; types: string[]; desc: string[];
  nature: string; procedure: string; published: string; deadline: string | null; url: string; addedAt: string;
};

const arr = (v: any): string[] => (v == null ? [] : Array.isArray(v) ? v.map(String) : String(v).split(/[,;|]/).map((s) => s.trim()).filter(Boolean));
const day = (v: any) => (v ? String(v).slice(0, 10) : "");

export function toNotice(r: any): Notice | null {
  const id = String(r.idweb || r.id || "");
  if (!id || !r.objet) return null;
  return {
    id, objet: String(r.objet).trim(), acheteur: String(r.nomacheteur || "").trim(), depts: arr(r.code_departement).map((d) => d.padStart(2, "0")),
    types: arr(r.type_marche).map((t) => t.toUpperCase()), desc: arr(r.descripteur_libelle), nature: String(r.nature_libelle || ""),
    procedure: String(r.procedure_libelle || ""), published: day(r.dateparution), deadline: r.datelimitereponse ? String(r.datelimitereponse) : null,
    url: String(r.url_avis || `https://www.boamp.fr/pages/avis/?q=idweb:${id}`), addedAt: new Date().toISOString(),
  };
}

// Only calls for tenders still open (no award / correction notices).
export const isOpenCall = (n: Notice, now = Date.now()) =>
  !/attribution|resultat|résultat|rectificatif|annulation|modification/i.test(n.nature) && (!n.deadline || +new Date(n.deadline) > now);

export async function fetchSince(sinceDay: string, log: (s: string) => void = () => {}, maxPages = 30, where?: string): Promise<Notice[]> {
  if (MOCK) return mockNotices();
  const out: Notice[] = [];
  let useSelect = true;
  for (let page = 0; page < maxPages; page++) {
    const q = new URLSearchParams({ where: where || `dateparution >= date'${sinceDay}'`, order_by: "dateparution desc", limit: "100", offset: String(page * 100) });
    if (useSelect) q.set("select", SELECT);
    const res = await fetch(`${API}?${q}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 400 && useSelect) { useSelect = false; page--; log("select refusé → champs complets"); continue; }
    if (!res.ok) throw new Error(`BOAMP ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const d = await res.json();
    const rs = (d.results || []).map(toNotice).filter(Boolean) as Notice[];
    out.push(...rs);
    if (rs.length < 100) break;
  }
  return out;
}

// Full notice text, for the AI analysis (fetched only for notices someone will receive).
export async function noticeText(id: string): Promise<string> {
  if (MOCK) return "Réfection de la toiture du groupe scolaire Jean Moulin. Lot unique. Durée 3 mois. Visite obligatoire le 12/10. Critères : prix 60 %, valeur technique 40 %. Montant estimé 85 000 € HT.";
  const q = new URLSearchParams({ where: `idweb = '${id.replace(/'/g, "")}'`, limit: "1" });
  const res = await fetch(`${API}?${q}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return "";
  const r = (await res.json()).results?.[0] || {};
  const parts: string[] = [];
  const walk = (v: any) => {
    if (v == null) return;
    if (typeof v === "string") { const t = v.trim(); if (t.length > 2 && !/^https?:|^\d+$/.test(t)) parts.push(t); return; }
    if (Array.isArray(v)) return v.forEach(walk);
    if (typeof v === "object") return Object.values(v).forEach(walk);
  };
  let donnees: any = r.donnees;
  if (typeof donnees === "string") { try { donnees = JSON.parse(donnees); } catch { /* raw text */ } }
  walk(donnees || r);
  return [...new Set(parts)].join(" · ").slice(0, 7000);
}

// ---------- storage ----------
const OPEN_CAP = 600;
export async function openNotices(dept: string): Promise<Notice[]> { return ((await db.get<Notice[]>(`open:${dept}`)) || []).filter((n) => isOpenCall(n)); }
export async function getNotice(id: string) { return db.get<Notice>(`notice:${id}`); }

export async function ingest(log: (s: string) => void = () => {}, only?: { dept: string }) {
  const since = new Date(Date.now() - 864e5).toISOString().slice(0, 10); // run 3-4×/day; yesterday + today
  const all = (only
    ? await fetchSince(since, log, 20, `code_departement = '${only.dept.replace(/^0/, "")}' and nature_libelle = 'Avis de marché' and datelimitereponse >= now()`)
    : await fetchSince(since, log)).filter((n) => isOpenCall(n));
  const byDept: Record<string, Notice[]> = {};
  for (const n of all) for (const d of n.depts) (byDept[d] ||= []).push(n);
  let added = 0;
  for (const [d, list] of Object.entries(byDept)) {
    const cur = (await db.get<Notice[]>(`open:${d}`)) || [];
    const seen = new Set(cur.map((n) => n.id));
    const fresh = list.filter((n) => !seen.has(n.id));
    if (!fresh.length && cur.every((n) => isOpenCall(n))) continue;
    added += fresh.length;
    const next = [...fresh, ...cur].filter((n) => isOpenCall(n)).slice(0, OPEN_CAP);
    await db.set(`open:${d}`, next, 60 * 60 * 24 * 90);
    for (const n of fresh) if (!(await db.get(`notice:${n.id}`))) await db.set(`notice:${n.id}`, n, 60 * 60 * 24 * 120);
  }
  if (!only) await db.set("ingest:last", { at: new Date().toISOString(), fetched: all.length, added }, 60 * 60 * 24 * 30);
  log(`BOAMP : ${all.length} avis ouverts récupérés depuis le ${since}, ${added} nouveaux`);
  return { fetched: all.length, added };
}

function mockNotices(): Notice[] {
  const t = new Date(); const dl = new Date(Date.now() + 20 * 864e5).toISOString();
  return [
    { id: "26-100001", objet: "Réfection de la toiture du groupe scolaire Jean Moulin", acheteur: "Commune de La Garde", depts: ["83"], types: ["TRAVAUX"], desc: ["Couverture"], nature: "Avis de marché", procedure: "Procédure adaptée", published: t.toISOString().slice(0, 10), deadline: dl, url: "https://www.boamp.fr/", addedAt: t.toISOString() },
    { id: "26-100002", objet: "Entretien des espaces verts des résidences", acheteur: "Toulon Habitat Méditerranée", depts: ["83"], types: ["SERVICES"], desc: ["Espaces verts"], nature: "Avis de marché", procedure: "Procédure adaptée", published: t.toISOString().slice(0, 10), deadline: dl, url: "https://www.boamp.fr/", addedAt: t.toISOString() },
    { id: "26-100003", objet: "Travaux d'électricité courants forts et faibles - Médiathèque", acheteur: "Métropole TPM", depts: ["83"], types: ["TRAVAUX"], desc: ["Électricité"], nature: "Avis de marché", procedure: "Procédure adaptée", published: t.toISOString().slice(0, 10), deadline: dl, url: "https://www.boamp.fr/", addedAt: t.toISOString() },
  ];
}

// One-off backfill of every call still open, department by department (rotation, budget-safe). Run until it says "terminé".
export async function backfill(log: (s: string) => void, left: () => number, depts: string[]) {
  let i = (await db.get<number>("backfill:i")) || 0;
  while (i < depts.length && left() > 15000) {
    const d = depts[i];
    try { const r = await ingest(() => {}, { dept: d }); log(`${d} : ${r.fetched} ouverts, ${r.added} ajoutés`); } catch (e: any) { log(`! ${d}: ${e.message}`); break; }
    i++; await db.set("backfill:i", i);
  }
  if (i >= depts.length) log("Rattrapage terminé ✅");
}
