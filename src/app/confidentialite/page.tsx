import { LegalPage } from "@/components/Legal";
import { LEGAL } from "@/lib/config";
export const metadata = { title: "Politique de confidentialité" };
export default function P() {
  return (
    <LegalPage title="Politique de confidentialité">
      <p>Responsable de traitement : {LEGAL.name}, {LEGAL.address} — {LEGAL.email}.</p>
      <h2>1. Abonnés</h2>
      <p>Données : email professionnel, nom de l&apos;entreprise, métiers et départements choisis, historique des alertes envoyées, données de facturation (traitées par Stripe). Finalité : envoi des alertes et facturation (exécution du contrat). Conservation : durée de l&apos;inscription puis 3 ans ; pièces comptables 10 ans.</p>
      <h2>2. Prospection commerciale (professionnels)</h2>
      <p>Nous contactons par email des entreprises à partir d&apos;informations publiques : fiche Google de l&apos;établissement et adresse email professionnelle publiée sur son site. Base légale : intérêt légitime (prospection B2B en rapport avec l&apos;activité du destinataire : marchés publics de son métier). Chaque message indique l&apos;origine des données et un lien d&apos;opposition immédiate. Données conservées 60 jours sans réponse ; les adresses désinscrites sont conservées dans une liste d&apos;opposition afin de ne plus être contactées. Nous n&apos;utilisons pas d&apos;adresses personnelles.</p>
      <h2>3. Sous-traitants</h2>
      <ul>
        <li>Vercel (hébergement) — États-Unis, clauses contractuelles types</li>
        <li>Upstash (base de données) — Union européenne</li>
        <li>Stripe (paiement) — Irlande / États-Unis</li>
        <li>Resend (emails) et Google Workspace (emails de prospection) — États-Unis, clauses contractuelles types</li>
        <li>Groq (résumés par IA du texte public des avis de marchés, aucune donnée d&apos;abonné transmise) — États-Unis</li>
        <li>Google Places (informations publiques des établissements prospectés) — États-Unis, clauses contractuelles types</li>
      </ul>
      <h2>4. Vos droits</h2>
      <p>Accès, rectification, effacement, opposition et limitation : écrivez à {LEGAL.email}. Réclamation possible auprès de la CNIL (cnil.fr).</p>
      <h2>5. Cookies</h2>
      <p>Un seul cookie technique de session pour le compte. Aucun cookie publicitaire ni de mesure d&apos;audience tierce.</p>
    </LegalPage>
  );
}
