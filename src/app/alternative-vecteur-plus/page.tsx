import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { PLANS } from "@/lib/config";
import { TRADES } from "@/lib/trades";

export const metadata = {
  title: "Alternative à Vecteur Plus pour artisans et TPE (sans devis)",
  description: "Vecteur Plus est pensé pour les équipes commerciales. Si vous êtes artisan et voulez juste les appels d'offres de votre métier, voici une alternative simple, à prix affiché et sans engagement.",
  alternates: { canonical: "/alternative-vecteur-plus" },
};

const faq: [string, string][] = [
  ["Combien coûte Vecteur Plus ?", "L'éditeur ne publie pas ses tarifs : l'accès complet passe par une démo et un devis. Un comparatif publié en 2026 (kalao-solution.fr) l'estime entre 300 et 500 € par mois, à titre indicatif. Demandez toujours un devis écrit."],
  ["Marchés Malins couvre-t-il les projets privés et les permis de construire ?", "Non. Marchés Malins se concentre sur les marchés publics publiés au BOAMP, triés par métier et par département. Si votre activité dépend de la détection de projets privés très en amont, un outil comme Vecteur Plus est plus adapté."],
  ["Y a-t-il un engagement ?", "Non. Les formules payantes sont mensuelles, sans engagement, avec 14 jours d'essai. La résiliation se fait en un clic depuis votre compte."],
  ["Je peux tester sans carte bancaire ?", "Oui, avec la formule Gratuit : 1 métier, 1 département, un récapitulatif chaque lundi."],
];

export default function Page() {
  const solo = PLANS.solo, pro = PLANS.pro;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <Header />
      <main className="container-x max-w-3xl py-12">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">Alternative à Vecteur Plus pour les artisans : les appels d&apos;offres de votre métier, sans devis ni engagement</h1>
        <p className="mt-4 text-lg text-slate-600">Vecteur Plus est un outil complet, conçu pour les services commerciaux des PME et ETI. Quand on est artisan ou petite entreprise et qu&apos;on veut simplement voir passer les marchés publics de son métier, c&apos;est souvent plus que nécessaire. Voici une comparaison honnête.</p>

        <h2 className="mt-10 text-2xl font-extrabold">En bref</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="py-2 pr-4"></th><th className="py-2 pr-4">Vecteur Plus</th><th className="py-2">Marchés Malins</th></tr></thead>
            <tbody className="text-slate-700">
              <tr className="border-b border-slate-100"><td className="py-2 pr-4 font-semibold">Pour qui</td><td className="py-2 pr-4">Équipes commerciales, PME/ETI du BTP et des services</td><td className="py-2">Artisans, TPE, indépendants</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4 font-semibold">Prix</td><td className="py-2 pr-4">Sur devis (non publié)</td><td className="py-2">Gratuit, puis {solo.price} € ou {pro.price} €/mois</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4 font-semibold">Engagement</td><td className="py-2 pr-4">Conditions non publiées</td><td className="py-2">Sans engagement, résiliation en un clic</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4 font-semibold">Sources</td><td className="py-2 pr-4">BOAMP, JOUE, presse, sites web, permis de construire, projets privés</td><td className="py-2">BOAMP (marchés publics), mis à jour chaque jour</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4 font-semibold">Tri par métier</td><td className="py-2 pr-4">Oui, plusieurs milliers de thèmes</td><td className="py-2">Oui, {TRADES.length} métiers du bâtiment et des services</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4 font-semibold">Aide à la décision</td><td className="py-2 pr-4">Analyse de DCE, outils de chiffrage, export CRM</td><td className="py-2">Résumé en 3 lignes + verdict « accessible à une petite entreprise ? »</td></tr>
              <tr><td className="py-2 pr-4 font-semibold">Mise en route</td><td className="py-2 pr-4">Démo commerciale</td><td className="py-2">30 secondes, sans appel</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Informations sur Vecteur Plus issues de sources publiques, au 26/10/2026. Vecteur Plus est une marque de son éditeur ; Marchés Malins n&apos;y est pas affilié.</p>

        <h2 className="mt-10 text-2xl font-extrabold">Quand rester sur Vecteur Plus</h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
          <li>Vous avez une équipe commerciale qui suit des projets privés et publics très en amont.</li>
          <li>Vous voulez analyser les dossiers de consultation et préparer vos chiffrages dans le même outil.</li>
          <li>Vous avez besoin d&apos;exporter les opportunités dans votre CRM.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-extrabold">Quand Marchés Malins suffit</h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
          <li>Vous êtes seul ou à quelques-uns, et vous répondez à quelques marchés par an.</li>
          <li>Vous voulez juste savoir, chaque matin, s&apos;il y a un chantier public de votre métier près de chez vous.</li>
          <li>Vous voulez un prix affiché, sans rendez-vous commercial ni engagement.</li>
        </ul>

        <div className="card mt-8 p-5">
          <div className="font-bold">Essayez sur votre métier et votre département</div>
          <p className="mt-1 text-sm text-slate-600">Gratuit pour commencer, sans carte bancaire. 14 jours d&apos;essai sur les formules payantes.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/commencer?plan=gratuit" className="btn btn-primary">Créer mon alerte gratuite</Link>
            <Link href="/#tarifs" className="btn btn-ghost">Voir les tarifs</Link>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-extrabold">Questions fréquentes</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {faq.map(([q, a]) => (
            <details key={q} className="card p-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2">{a}</p></details>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">Voir aussi : <Link href="/veille-marches-publics-gratuite" className="underline">faire sa veille des marchés publics gratuitement</Link> · <Link href="/marches" className="underline">les marchés ouverts par département</Link></p>
      </main>
      <Footer />
    </>
  );
}
