import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";

export const metadata = {
  title: "Veille marchés publics gratuite : 4 méthodes pour artisans",
  description: "Faire sa veille des appels d'offres sans payer d'abonnement : alertes BOAMP, TED, profils d'acheteurs et alerte gratuite par métier. Ce que chaque méthode couvre, et ses limites.",
  alternates: { canonical: "/veille-marches-publics-gratuite" },
};

const faq: [string, string][] = [
  ["Une veille des marchés publics gratuite, c'est suffisant pour une petite entreprise ?", "Pour démarrer, oui : une grande partie des avis publiés passent par le BOAMP, qui est gratuit. Ce qui coûte, c'est le temps de tri. Les services payants servent surtout à couvrir les petits marchés publiés uniquement sur les sites des acheteurs, et à trier plus finement."],
  ["Le BOAMP envoie-t-il des alertes gratuites ?", "Oui. Avec un compte gratuit sur boamp.fr, vous pouvez enregistrer une recherche et recevoir un email quand un nouvel avis correspond. Le filtrage se fait par mots-clés, département et type de marché : à vous de bien régler les mots-clés de votre métier."],
  ["Pourquoi je ne vois pas certains petits marchés ?", "Depuis 2026, les travaux de moins de 100 000 € HT et les fournitures et services de moins de 60 000 € HT peuvent être passés sans publicité. Une partie de ces marchés n'est donc publiée nulle part : il faut se faire connaître des acheteurs locaux (mairies, bailleurs, écoles) et suivre leurs sites."],
  ["Marchés Malins est-il vraiment gratuit ?", "La formule Gratuit l'est, sans carte bancaire : 1 métier, 1 département, un récapitulatif chaque lundi. Les formules payantes (dès 19 €/mois, sans engagement) ajoutent l'alerte quotidienne, le résumé de chaque marché et le verdict « accessible à une petite entreprise »."],
];

export default function Page() {
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
        <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">Veille marchés publics gratuite : les 4 méthodes qui marchent quand on est artisan</h1>
        <p className="mt-4 text-lg text-slate-600">Pas besoin de payer 100 € par mois pour repérer les appels d&apos;offres de votre métier. Les avis officiels sont publics et gratuits. Le vrai coût d&apos;une veille gratuite, c&apos;est le temps passé à trier. Voici comment le réduire.</p>

        <h2 className="mt-10 text-2xl font-extrabold">1. Les alertes du BOAMP (gratuites, officielles)</h2>
        <p className="mt-3 text-slate-700">Le BOAMP (Bulletin officiel des annonces des marchés publics) publie les avis des acheteurs publics français. En créant un compte gratuit sur boamp.fr, vous enregistrez une recherche (mots-clés, département, type de marché) et recevez un email à chaque nouvel avis.</p>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
          <li><b>Avantage :</b> source officielle, gratuite, exhaustive pour les avis publiés au BOAMP.</li>
          <li><b>Limite :</b> le tri se fait sur des mots-clés bruts. « Électricité » remonte aussi les achats d&apos;énergie ; « peinture » remonte le marquage routier. Il faut relire chaque avis pour savoir si c&apos;est pour vous.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-extrabold">2. TED pour les gros marchés européens</h2>
        <p className="mt-3 text-slate-700">TED (Tenders Electronic Daily) publie les marchés au-dessus des seuils européens. Les alertes y sont aussi gratuites. Pour un artisan, c&apos;est rarement prioritaire : ces marchés sont souvent trop gros, mais ils permettent de repérer les chantiers où se placer en sous-traitance.</p>

        <h2 className="mt-10 text-2xl font-extrabold">3. Les profils d&apos;acheteurs de votre secteur</h2>
        <p className="mt-3 text-slate-700">Chaque acheteur public publie ses consultations sur une plateforme (son « profil d&apos;acheteur »). Beaucoup proposent une alerte gratuite après création de compte. C&apos;est la meilleure façon de suivre les <b>petits marchés locaux</b> : votre mairie, le bailleur social du coin, le département.</p>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-slate-700">
          <li><b>Avantage :</b> vous voyez des consultations qui ne passent pas au BOAMP.</li>
          <li><b>Limite :</b> une plateforme par acheteur, donc des dizaines de comptes à suivre.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-extrabold">4. Une alerte triée par métier, gratuite</h2>
        <p className="mt-3 text-slate-700">C&apos;est ce que fait <b>Marchés Malins</b> : chaque jour, tous les nouveaux avis du BOAMP sont filtrés par métier (couvreur, plombier, électricien, paysagiste…) avec des règles qui écartent les faux positifs. La formule gratuite vous envoie chaque lundi les marchés de votre métier dans votre département, avec le lien direct vers l&apos;avis officiel.</p>
        <div className="card mt-5 p-5">
          <div className="font-bold">Alerte gratuite Marchés Malins</div>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            <li>✓ 1 métier, 1 département</li>
            <li>✓ Récapitulatif chaque lundi</li>
            <li>✓ Sans carte bancaire, désinscription en un clic</li>
          </ul>
          <Link href="/commencer?plan=gratuit" className="btn btn-primary mt-4">Créer mon alerte gratuite</Link>
        </div>

        <h2 className="mt-10 text-2xl font-extrabold">Gratuit ou payant : comment choisir ?</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="border-b border-slate-200"><th className="py-2 pr-4">Méthode</th><th className="py-2 pr-4">Coût</th><th className="py-2 pr-4">Tri par métier</th><th className="py-2">Petits marchés locaux</th></tr></thead>
            <tbody className="text-slate-700">
              <tr className="border-b border-slate-100"><td className="py-2 pr-4">Alertes BOAMP</td><td className="py-2 pr-4">Gratuit</td><td className="py-2 pr-4">Mots-clés bruts</td><td className="py-2">Seulement s&apos;ils sont publiés au BOAMP</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4">Profils d&apos;acheteurs</td><td className="py-2 pr-4">Gratuit</td><td className="py-2 pr-4">Variable</td><td className="py-2">Oui, acheteur par acheteur</td></tr>
              <tr className="border-b border-slate-100"><td className="py-2 pr-4">Marchés Malins Gratuit</td><td className="py-2 pr-4">Gratuit</td><td className="py-2 pr-4">Oui, par métier</td><td className="py-2">Ceux publiés au BOAMP</td></tr>
              <tr><td className="py-2 pr-4">Plateformes de veille payantes</td><td className="py-2 pr-4">De quelques dizaines à plusieurs centaines d&apos;€/mois</td><td className="py-2 pr-4">Oui</td><td className="py-2">Oui, s&apos;ils agrègent les profils d&apos;acheteurs</td></tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-slate-700">Notre conseil : commencez gratuit (BOAMP + une alerte triée + les 3 ou 4 acheteurs locaux qui comptent pour vous). Passez à un service payant seulement quand vous répondez régulièrement et que vous ratez des marchés.</p>

        <h2 className="mt-10 text-2xl font-extrabold">Questions fréquentes</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          {faq.map(([q, a]) => (
            <details key={q} className="card p-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2">{a}</p></details>
          ))}
        </div>

        <p className="mt-10 text-sm text-slate-500">Voir aussi : <Link href="/marches" className="underline">les marchés ouverts par département</Link> · <Link href="/alternative-vecteur-plus" className="underline">alternative à Vecteur Plus pour les artisans</Link></p>
      </main>
      <Footer />
    </>
  );
}
