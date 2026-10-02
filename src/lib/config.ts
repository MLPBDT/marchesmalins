export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const BRAND = process.env.NEXT_PUBLIC_BRAND || "Marchés Malins";
export const MOCK = process.env.MOCK === "1";

export const LEGAL = {
  name: process.env.BUSINESS_LEGAL_NAME || "Mattéo [NOM] — Entrepreneur individuel",
  siret: process.env.BUSINESS_SIRET || "[SIRET]",
  address: process.env.BUSINESS_ADDRESS || "[Adresse], 83210 La Farlède, France",
  email: process.env.CONTACT_EMAIL || "bonjour@marchesmalins.fr",
};

export type PlanId = "gratuit" | "solo" | "pro";
export const PLANS: Record<PlanId, { name: string; price: number; tagline: string; maxTrades: number; maxDepts: number; daily: boolean; ai: boolean; features: string[]; priceEnv: string }> = {
  gratuit: {
    name: "Gratuit", price: 0, priceEnv: "", tagline: "Pour tester", maxTrades: 1, maxDepts: 1, daily: false, ai: false,
    features: ["1 métier, 1 département", "Récap chaque lundi", "Lien direct vers chaque avis officiel"],
  },
  solo: {
    name: "Solo", price: 19, priceEnv: "STRIPE_PRICE_SOLO", tagline: "Pour l'artisan ou la TPE", maxTrades: 2, maxDepts: 3, daily: true, ai: true,
    features: ["2 métiers, 3 départements", "Alerte chaque matin dès qu'un marché sort", "Résumé IA de chaque marché en 3 lignes", "Verdict « accessible à une petite entreprise ? »", "Montant, lots, date limite, visite obligatoire"],
  },
  pro: {
    name: "Pro", price: 39, priceEnv: "STRIPE_PRICE_PRO", tagline: "Pour les PME multi-activités", maxTrades: 6, maxDepts: 101, daily: true, ai: true,
    features: ["Tout Solo", "6 métiers, toute la France", "Mots-clés personnalisés", "Rappel 5 jours avant la date limite"],
  },
};
export const PAID: PlanId[] = ["solo", "pro"];
