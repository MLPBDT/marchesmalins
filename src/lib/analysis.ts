import { chatJson } from "./ai";
import { db } from "./db";
import { Notice, noticeText } from "./boamp";

export type Analysis = {
  resume: string; montant: string | null; lots: string | null; duree: string | null; visite: string | null;
  criteres: string | null; accessible: "oui" | "plutot" | "difficile"; pourquoi: string; at: string;
};

const SYS = `Tu analyses des avis de marchés publics français pour des artisans et TPE. À partir du texte fourni, réponds en JSON strict :
{"resume":"2 phrases maximum : quoi, où, pour qui","montant":"montant estimé si indiqué, sinon null","lots":"nombre et intitulés courts des lots si indiqués, sinon null","duree":"durée ou délai d'exécution si indiqué, sinon null","visite":"visite obligatoire / conseillée + date si indiqué, sinon null","criteres":"critères d'attribution avec pondération si indiqués, sinon null","accessible":"oui | plutot | difficile","pourquoi":"1 phrase : pourquoi c'est (ou non) accessible à une entreprise de moins de 10 salariés (montant, allotissement, références ou certifications exigées, chiffre d'affaires minimum)"}
N'invente RIEN : si une information n'est pas dans le texte, mets null. Français simple, pas de jargon.`;

export async function analyze(n: Notice): Promise<Analysis | null> {
  const cached = await db.get<Analysis>(`ai:${n.id}`);
  if (cached) return cached;
  const text = await noticeText(n.id);
  const user = `Objet : ${n.objet}\nAcheteur : ${n.acheteur}\nProcédure : ${n.procedure}\nType : ${n.types.join(", ")}\nTexte de l'avis : ${text || "(indisponible)"}`;
  try {
    const a = await chatJson<Analysis>([{ role: "system", content: SYS }, { role: "user", content: user }], { temperature: 0.2, maxTokens: 500 });
    if (!a?.resume) return null;
    a.accessible = (["oui", "plutot", "difficile"].includes(a.accessible) ? a.accessible : "plutot") as any;
    for (const k of ["montant", "lots", "duree", "visite", "criteres"] as const) if (a[k] && /^(null|non (indiqu|pr[ée]cis)|n\/a|inconnu)/i.test(String(a[k]))) a[k] = null;
    a.at = new Date().toISOString();
    await db.set(`ai:${n.id}`, a, 60 * 60 * 24 * 120);
    return a;
  } catch { return null; }
}

export const ACCESS_LABEL = { oui: "✅ Accessible à une petite entreprise", plutot: "🟡 Accessible avec un dossier solide", difficile: "🔴 Plutôt pour une grosse structure" } as const;
