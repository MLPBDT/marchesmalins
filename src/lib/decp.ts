// Marchés publics ATTRIBUÉS (DECP consolidées, data.gouv.fr, licence ouverte) — qui gagne, à quel prix.
import { TRADES, tradeById, norm, type Trade } from "./trades";

const API = "https://tabular-api.data.gouv.fr/api/resources/22847056-61df-452d-837d-8b8ceadbfc52/data/";

// Mots cherchés dans l'objet du marché côté API (sans accents : la recherche est insensible à la casse, pas aux accents).
const SEARCH: Record<string, string[]> = {
  couvreur: ["couverture", "toiture", "charpente", "tanch"],
  plombier: ["plomberie", "chauffage", "sanitaire"],
  electricien: ["lectricit", "courants faibles", "eclairage"],
  cvc: ["climatisation", "ventilation", "CVC"],
  macon: ["maconnerie", "maçonnerie", "gros oeuvre", "gros-oeuvre", "gros œuvre"],
  menuisier: ["menuiserie", "menuiseries"],
  peintre: ["peinture", "revetement", "revêtement"],
  platrier: ["platrerie", "plâtrerie", "cloisons", "plafond"],
  carreleur: ["carrelage"],
  paysagiste: ["espaces verts", "paysag", "elagage", "élagage"],
  vrd: ["terrassement", "VRD", "voirie"],
  serrurier: ["serrurerie", "metallerie", "métallerie"],
  demolition: ["demolition", "démolition", "desamiantage", "désamiantage"],
  nettoyage: ["nettoyage", "entretien des locaux"],
  securite: ["gardiennage", "surveillance"],
  informatique: ["informatique", "logiciel"],
  communication: ["communication", "graphi"],
  restauration: ["restauration", "repas"],
  transport: ["transport"],
  formation: ["formation"],
  ascenseur: ["ascenseur"],
  vitrier: ["vitrerie", "facade", "façade"],
};
const TYPE: Record<string, string> = { TRAVAUX: "Travaux", SERVICES: "Services", FOURNITURES: "Fournitures" };

export type Award = {
  uid: string; date: string; objet: string; acheteur: string; titulaire: string; titulaireId: string; titulaireVille: string;
  montant: number | null; offres: number | null; procedure: string; duree: number | null; type: string;
};

// Fenêtre glissante de 12 mois, alignée sur le 1er du mois pour que le cache (24 h) reste efficace.
export function since(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), 1));
  return d.toISOString().slice(0, 10);
}

async function query(dept: string, kw: string, type: string | undefined, from: string): Promise<any[]> {
  const q = new URLSearchParams({ donneesActuelles__exact: "true", acheteur_departement_code__in: dept, dateNotification__greater: from, objet__contains: kw, page_size: "200" });
  if (type) q.set("type__exact", type);
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${API}?${q}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(40000), next: { revalidate: 86400 } });
      if (r.ok) return (await r.json()).data || [];
      if (r.status < 500 && r.status !== 429) return [];
    } catch {}
    await new Promise((ok) => setTimeout(ok, 1500 * (i + 1)));
  }
  return [];
}

export async function awards(dept: string, tradeId: string): Promise<Award[]> {
  const t = tradeById(tradeId);
  if (!t) return [];
  const type = t.types?.length === 1 ? TYPE[t.types[0]] : undefined;
  const from = since();
  const kws = SEARCH[tradeId] || [t.plural];
  const rows: any[] = [];
  for (let i = 0; i < kws.length; i += 3) rows.push(...(await Promise.all(kws.slice(i, i + 3).map((k) => query(dept, k, type, from)))).flat()); // 3 requêtes en parallèle max
  const seen = new Set<string>();
  const out: Award[] = [];
  for (const r of rows) {
    const key = `${r.uid}|${r.titulaire_id}`;
    if (seen.has(key) || !r.objet || !r.titulaire_nom) continue;
    seen.add(key);
    // l'API a déjà filtré sur les mots du métier : on retire seulement les faux amis connus (ex. « fourniture d'électricité »)
    if (t.not?.some((k) => ` ${norm(r.objet)} `.includes(k))) continue;
    if (t.types?.length && r.type && !t.types.includes(String(r.type).toUpperCase() as any)) continue;
    const m = r.montant == null || r.montant === "" ? null : Number(r.montant);
    out.push({
      uid: r.uid, date: String(r.dateNotification || "").slice(0, 10), objet: String(r.objet).trim(), acheteur: String(r.acheteur_nom || "").trim(),
      titulaire: String(r.titulaire_nom).trim(), titulaireId: String(r.titulaire_id || ""), titulaireVille: String(r.titulaire_commune_nom || ""),
      montant: m != null && Number.isFinite(m) && !r.montant_anomalie ? m : null, offres: r.offresRecues == null ? null : Number(r.offresRecues),
      procedure: String(r.procedure || ""), duree: r.dureeMois == null ? null : Number(r.dureeMois), type: String(r.type || ""),
    });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

const median = (xs: number[]) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

export function stats(list: Award[]) {
  // un même marché attribué à un groupement = plusieurs lignes : on compte les marchés une fois
  const byUid = new Map<string, Award>();
  list.forEach((a) => { if (!byUid.has(a.uid)) byUid.set(a.uid, a); });
  const contracts = [...byUid.values()];
  const amounts = contracts.map((a) => a.montant).filter((x): x is number => x != null && x > 0);
  const offers = contracts.map((a) => a.offres).filter((x): x is number => x != null && x > 0 && x < 100);
  const winners = new Map<string, { name: string; ville: string; n: number; total: number }>();
  for (const a of list) {
    const k = a.titulaireId || a.titulaire;
    const w = winners.get(k) || { name: a.titulaire, ville: a.titulaireVille, n: 0, total: 0 };
    w.n++; w.total += a.montant || 0; winners.set(k, w);
  }
  const buyers = new Map<string, number>();
  contracts.forEach((a) => a.acheteur && buyers.set(a.acheteur, (buyers.get(a.acheteur) || 0) + 1));
  const small = contracts.filter((a) => a.montant != null && a.montant < 90000).length;
  const oneBid = offers.filter((x) => x === 1).length;
  return {
    contracts: contracts.length, total: amounts.reduce((s, x) => s + x, 0), median: median(amounts), avgOffers: offers.length ? offers.reduce((s, x) => s + x, 0) / offers.length : null,
    oneBidShare: offers.length ? oneBid / offers.length : null, smallShare: amounts.length ? small / amounts.length : null,
    distinctWinners: winners.size,
    topWinners: [...winners.values()].sort((a, b) => b.n - a.n || b.total - a.total).slice(0, 10),
    topBuyers: [...buyers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8),
  };
}

// Pages publiées progressivement (méthode SEO : 2 pages par semaine max). Avant sa date, une page existe mais reste hors Google (noindex) et hors sitemap.
export const ATTRIB_PAGES: { dept: string; trade: string; from: string }[] = [
  { dept: "83", trade: "couvreur", from: "2026-10-20" }, { dept: "83", trade: "electricien", from: "2026-10-20" },
  { dept: "13", trade: "couvreur", from: "2026-10-27" }, { dept: "83", trade: "nettoyage", from: "2026-10-27" },
  { dept: "06", trade: "paysagiste", from: "2026-11-03" }, { dept: "83", trade: "plombier", from: "2026-11-03" },
  { dept: "13", trade: "nettoyage", from: "2026-11-10" }, { dept: "83", trade: "macon", from: "2026-11-10" },
  { dept: "06", trade: "couvreur", from: "2026-11-17" }, { dept: "13", trade: "electricien", from: "2026-11-17" },
  { dept: "83", trade: "paysagiste", from: "2026-11-24" }, { dept: "75", trade: "nettoyage", from: "2026-11-24" },
  { dept: "13", trade: "plombier", from: "2026-12-01" }, { dept: "83", trade: "peintre", from: "2026-12-01" },
  { dept: "69", trade: "couvreur", from: "2026-12-08" }, { dept: "06", trade: "electricien", from: "2026-12-08" },
  { dept: "33", trade: "couvreur", from: "2026-12-15" }, { dept: "13", trade: "paysagiste", from: "2026-12-15" },
  { dept: "34", trade: "couvreur", from: "2026-12-22" }, { dept: "84", trade: "couvreur", from: "2026-12-22" },
];
export const isLive = (dept: string, trade: string, now = new Date()) =>
  ATTRIB_PAGES.some((p) => p.dept === dept && p.trade === trade && p.from <= now.toISOString().slice(0, 10));
export const MIN_AWARDS_TO_INDEX = 8;
export { TRADES };
export type { Trade };
