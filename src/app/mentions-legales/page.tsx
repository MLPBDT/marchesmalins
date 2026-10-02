import { LegalPage } from "@/components/Legal";
import { LEGAL, BRAND } from "@/lib/config";
export const metadata = { title: "Mentions légales" };
export default function P() {
  return (
    <LegalPage title="Mentions légales">
      <h2>Éditeur</h2>
      <p>{BRAND} est un service édité par {LEGAL.name}, entrepreneur individuel (micro-entreprise), SIRET {LEGAL.siret}, {LEGAL.address}. Contact : {LEGAL.email}. TVA non applicable, art. 293 B du CGI.</p>
      <p>Directeur de la publication : {LEGAL.name.split("—")[0].trim()}.</p>
      <h2>Hébergement</h2>
      <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com. Données applicatives hébergées par Upstash (région Union européenne).</p>
      <h2>Source des données</h2>
      <p>Les avis de marchés proviennent du Bulletin officiel des annonces des marchés publics (BOAMP), publié par la Direction de l&apos;information légale et administrative (DILA) et réutilisé sous Licence Ouverte / Open Licence Etalab. Les avis originaux font seuls foi ; chaque fiche renvoie à l&apos;avis officiel. Les résumés sont produits automatiquement et peuvent comporter des erreurs.</p>
      <h2>Indépendance</h2>
      <p>{BRAND} est un service privé indépendant, sans lien avec la DILA, le BOAMP ni les acheteurs publics.</p>
    </LegalPage>
  );
}
