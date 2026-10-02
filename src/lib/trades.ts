// Métiers → mots-clés cherchés dans l'objet et les descripteurs BOAMP (texte normalisé, sans accents).
export type Trade = { id: string; name: string; plural: string; kw: string[]; not?: string[]; types?: ("TRAVAUX" | "SERVICES" | "FOURNITURES")[] };
export const TRADES: Trade[] = [
  { id: "couvreur", name: "Couvreur", plural: "couverture et toiture", kw: ["couverture", "toiture", "zinguerie", "charpente", "etancheite", "gouttiere", "tous corps d'etat"], types: ["TRAVAUX"] },
  { id: "plombier", name: "Plombier-chauffagiste", plural: "plomberie et chauffage", kw: ["plomberie", "chauffage", "sanitaire", "chaufferie", "chaudiere", "eau chaude", "tous corps d'etat"], types: ["TRAVAUX", "SERVICES"] },
  { id: "electricien", name: "Électricien", plural: "électricité", kw: ["electricite (travaux)", "travaux d'electricite", "electricite courants", "installations electriques", "electrique", "courants forts", "courants faibles", "eclairage", "cablage", "borne de recharge", "tous corps d'etat"], not: ["fourniture d'electricite", "achat d'electricite", "acheminement", "electricite, gaz (fourniture)", "materiel electrique", "vehicules electriques"] },
  { id: "cvc", name: "Climatisation / CVC", plural: "climatisation, ventilation et CVC", kw: ["climatisation", "ventilation", "cvc", "pompe a chaleur", "vmc", "traitement d'air"] },
  { id: "macon", name: "Maçon / gros œuvre", plural: "maçonnerie et gros œuvre", kw: ["maconnerie", "gros oeuvre", "gros-oeuvre", "beton", "ravalement", "tous corps d'etat"], types: ["TRAVAUX"] },
  { id: "menuisier", name: "Menuisier", plural: "menuiserie", kw: ["menuiserie", "menuiseries", "fenetres", "portes", "agencement", "parquet", "tous corps d'etat"], types: ["TRAVAUX", "FOURNITURES"] },
  { id: "peintre", name: "Peintre", plural: "peinture et revêtements", kw: ["peinture", "revetements muraux", "revetement de sol", "sols souples", "ravalement de facade", "tous corps d'etat"], not: ["peinture routiere", "marquage"] },
  { id: "platrier", name: "Plaquiste / plâtrier", plural: "plâtrerie et cloisons", kw: ["platrerie", "cloisons", "faux plafonds", "faux-plafonds", "doublage", "isolation", "tous corps d'etat"], types: ["TRAVAUX"] },
  { id: "carreleur", name: "Carreleur", plural: "carrelage", kw: ["carrelage", "faience", "chape", "revetement de sol", "tous corps d'etat"], types: ["TRAVAUX"] },
  { id: "paysagiste", name: "Paysagiste", plural: "espaces verts", kw: ["espaces verts", "paysager", "paysagere", "plantations", "arrosage", "tonte", "debroussaillement", "elagage"] },
  { id: "vrd", name: "Terrassement / VRD", plural: "terrassement, voirie et réseaux", kw: ["terrassement", "vrd", "voirie", "enrobe", "assainissement", "reseaux humides", "canalisation"], types: ["TRAVAUX"] },
  { id: "serrurier", name: "Serrurier / métallier", plural: "serrurerie et métallerie", kw: ["serrurerie", "metallerie", "garde-corps", "portail", "cloture", "controle d'acces"] },
  { id: "demolition", name: "Démolition / désamiantage", plural: "démolition et désamiantage", kw: ["demolition", "desamiantage", "deconstruction", "curage", "amiante"], types: ["TRAVAUX"] },
  { id: "nettoyage", name: "Nettoyage", plural: "nettoyage et propreté", kw: ["nettoyage de locaux", "nettoyage des locaux", "nettoyage de batiments", "proprete des locaux", "entretien des locaux", "vitrerie", "desinfection"], types: ["SERVICES"] },
  { id: "securite", name: "Sécurité / gardiennage", plural: "sécurité et gardiennage", kw: ["gardiennage", "surveillance", "securite incendie", "ssiap", "agents de securite", "videoprotection"] },
  { id: "informatique", name: "Informatique / web", plural: "informatique et web", kw: ["informatique", "logiciel", "site internet", "site web", "application", "infogerance", "maintenance informatique", "reseau informatique", "cybersecurite"] },
  { id: "communication", name: "Communication / graphisme", plural: "communication et graphisme", kw: ["communication", "graphisme", "graphique", "conception graphique", "video", "photographie", "evenementiel", "impression", "signaletique"] },
  { id: "restauration", name: "Traiteur / restauration", plural: "restauration collective et traiteur", kw: ["restauration", "traiteur", "repas", "denrees alimentaires", "cantine"] },
  { id: "transport", name: "Transport / déménagement", plural: "transport et déménagement", kw: ["transport", "demenagement", "transport scolaire", "navette"], not: ["transport d'electricite"] },
  { id: "formation", name: "Formation", plural: "formation", kw: ["formation", "formations"], types: ["SERVICES"] },
  { id: "ascenseur", name: "Ascensoriste", plural: "ascenseurs", kw: ["ascenseur", "ascenseurs", "monte-charge", "elevateur"] },
  { id: "vitrier", name: "Vitrier / façadier", plural: "vitrerie et façades", kw: ["vitrerie", "vitrage", "facade", "bardage", "murs-rideaux"], types: ["TRAVAUX"] },
];
export const tradeById = (id: string) => TRADES.find((t) => t.id === id);

export const norm = (s: string) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ");

export function matches(t: Trade, text: string, type?: string[], extra: string[] = []): boolean {
  const n = ` ${norm(text)} `;
  if (t.types && type?.length && !type.some((x) => t.types!.includes(x as any))) return false;
  if (t.not?.some((k) => n.includes(k))) return false;
  return [...t.kw, ...extra.map(norm)].some((k) => k && new RegExp(`(^|[^a-z])${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`).test(n));
}

export const DEPTS: Record<string, string> = {
  "01": "Ain", "02": "Aisne", "03": "Allier", "04": "Alpes-de-Haute-Provence", "05": "Hautes-Alpes", "06": "Alpes-Maritimes", "07": "Ardèche", "08": "Ardennes", "09": "Ariège", "10": "Aube", "11": "Aude", "12": "Aveyron", "13": "Bouches-du-Rhône", "14": "Calvados", "15": "Cantal", "16": "Charente", "17": "Charente-Maritime", "18": "Cher", "19": "Corrèze", "2A": "Corse-du-Sud", "2B": "Haute-Corse", "21": "Côte-d'Or", "22": "Côtes-d'Armor", "23": "Creuse", "24": "Dordogne", "25": "Doubs", "26": "Drôme", "27": "Eure", "28": "Eure-et-Loir", "29": "Finistère", "30": "Gard", "31": "Haute-Garonne", "32": "Gers", "33": "Gironde", "34": "Hérault", "35": "Ille-et-Vilaine", "36": "Indre", "37": "Indre-et-Loire", "38": "Isère", "39": "Jura", "40": "Landes", "41": "Loir-et-Cher", "42": "Loire", "43": "Haute-Loire", "44": "Loire-Atlantique", "45": "Loiret", "46": "Lot", "47": "Lot-et-Garonne", "48": "Lozère", "49": "Maine-et-Loire", "50": "Manche", "51": "Marne", "52": "Haute-Marne", "53": "Mayenne", "54": "Meurthe-et-Moselle", "55": "Meuse", "56": "Morbihan", "57": "Moselle", "58": "Nièvre", "59": "Nord", "60": "Oise", "61": "Orne", "62": "Pas-de-Calais", "63": "Puy-de-Dôme", "64": "Pyrénées-Atlantiques", "65": "Hautes-Pyrénées", "66": "Pyrénées-Orientales", "67": "Bas-Rhin", "68": "Haut-Rhin", "69": "Rhône", "70": "Haute-Saône", "71": "Saône-et-Loire", "72": "Sarthe", "73": "Savoie", "74": "Haute-Savoie", "75": "Paris", "76": "Seine-Maritime", "77": "Seine-et-Marne", "78": "Yvelines", "79": "Deux-Sèvres", "80": "Somme", "81": "Tarn", "82": "Tarn-et-Garonne", "83": "Var", "84": "Vaucluse", "85": "Vendée", "86": "Vienne", "87": "Haute-Vienne", "88": "Vosges", "89": "Yonne", "90": "Territoire de Belfort", "91": "Essonne", "92": "Hauts-de-Seine", "93": "Seine-Saint-Denis", "94": "Val-de-Marne", "95": "Val-d'Oise", "971": "Guadeloupe", "972": "Martinique", "973": "Guyane", "974": "La Réunion", "976": "Mayotte",
};
export const deptName = (d: string) => DEPTS[d] || d;
const VOWEL = /^[aeiouyhâéèêîôû]/i;
// "dans le Var", "dans les Bouches-du-Rhône", "à Paris", "en Isère"
export function inDept(d: string) {
  const n = deptName(d);
  if (d === "75") return "à Paris";
  if (/^(Bouches|Alpes|Hautes|Hauts|Côtes|Pyrénées|Deux|Yvelines|Landes|Ardennes|Vosges)/.test(n)) return `dans les ${n}`;
  if (/^(La |Le )/.test(n)) return n.replace(/^La /, "à La ").replace(/^Le /, "dans le ");
  if (VOWEL.test(n)) return `dans l'${n}`;
  if (/^(Corse|Charente|Gironde|Haute|Loire|Marne|Manche|Mayenne|Meuse|Moselle|Nièvre|Dordogne|Drôme|Creuse|Corrèze|Sarthe|Savoie|Somme|Vendée|Vienne|Seine|Saône|Haute-|Lozère|Sarthe|Somme|Martinique|Guadeloupe|Guyane|Réunion)/.test(n)) return `en ${n}`;
  return `dans le ${n}`;
}
