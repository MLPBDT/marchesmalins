import { LegalPage } from "@/components/Legal";
import { LEGAL, BRAND, PLANS } from "@/lib/config";
export const metadata = { title: "Conditions générales de vente et d'utilisation" };
export default function P() {
  return (
    <LegalPage title="Conditions générales de vente et d'utilisation">
      <h2>1. Objet</h2>
      <p>Les présentes conditions régissent le service {BRAND} fourni par {LEGAL.name} (« le Prestataire ») à tout utilisateur professionnel (« le Client »). Le service est réservé aux professionnels agissant pour les besoins de leur activité. L&apos;inscription vaut acceptation des présentes conditions.</p>
      <h2>2. Description du service</h2>
      <p>{BRAND} sélectionne, parmi les avis de marchés publics publiés au BOAMP, ceux qui correspondent aux métiers et départements choisis par le Client, et les lui envoie par email. Selon la formule, chaque avis est accompagné d&apos;un résumé et d&apos;une appréciation générés automatiquement par intelligence artificielle à partir du texte officiel. Le Prestataire est tenu à une obligation de moyens.</p>
      <h2>3. Limites</h2>
      <ul>
        <li>La sélection repose sur des mots-clés et peut omettre des avis pertinents ou en inclure d&apos;autres : le service ne remplace pas une veille exhaustive.</li>
        <li>Les résumés et appréciations sont indicatifs et peuvent comporter des erreurs. Seuls l&apos;avis officiel et le dossier de consultation font foi : le Client doit les consulter avant toute décision ou réponse.</li>
        <li>Le Prestataire ne répond pas aux marchés pour le compte du Client et ne garantit aucune attribution.</li>
        <li>Les délais d&apos;envoi dépendent de la publication des données par la DILA.</li>
      </ul>
      <h2>4. Prix et paiement</h2>
      <p>Formule Gratuite : 0 €. Formule Solo : {PLANS.solo.price} €/mois. Formule Pro : {PLANS.pro.price} €/mois. Prix en euros, TVA non applicable (art. 293 B du CGI). Un essai gratuit de 14 jours est proposé à la première souscription payante ; sauf annulation avant son terme, l&apos;abonnement démarre automatiquement à son issue. Paiement mensuel d&apos;avance par carte via Stripe, reconduction tacite chaque mois.</p>
      <h2>5. Durée et résiliation</h2>
      <p>Sans engagement. Résiliation à tout moment depuis le compte (« Factures, carte, résiliation »), effective à la fin de la période en cours, sans remboursement prorata. À l&apos;issue, le compte repasse en formule Gratuite, que le Client peut arrêter d&apos;un clic depuis n&apos;importe quel email.</p>
      <h2>6. Responsabilité</h2>
      <p>Le Prestataire ne saurait être tenu responsable d&apos;un avis non signalé, d&apos;une erreur de résumé, d&apos;une date limite manquée ni des décisions prises par le Client sur la base des informations transmises. Sa responsabilité totale est limitée aux sommes versées par le Client au cours des trois derniers mois.</p>
      <h2>7. Données personnelles</h2>
      <p>Voir la <a href="/confidentialite">politique de confidentialité</a>.</p>
      <h2>8. Droit applicable</h2>
      <p>Droit français. À défaut d&apos;accord amiable, compétence est attribuée aux tribunaux du ressort du siège du Prestataire. Contact : {LEGAL.email}.</p>
    </LegalPage>
  );
}
