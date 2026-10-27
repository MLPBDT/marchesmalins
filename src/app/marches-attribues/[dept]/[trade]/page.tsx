import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { SignupForm } from "@/components/SignupForm";
import { DEPTS, tradeById, deptName, inDept, deT } from "@/lib/trades";
import { awards, stats, isLive, MIN_AWARDS_TO_INDEX } from "@/lib/decp";

export const revalidate = 86400; // données recalculées une fois par jour

const eur = (n: number | null) => (n == null ? "—" : new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n));
const pct = (x: number | null) => (x == null ? "—" : `${Math.round(x * 100)} %`);
const date = (d: string) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "");

export async function generateMetadata({ params }: { params: Promise<{ dept: string; trade: string }> }) {
  const { dept, trade } = await params;
  const t = tradeById(trade);
  if (!t || !DEPTS[dept]) return {};
  const s = stats(await awards(dept, trade).catch(() => []));
  const index = isLive(dept, trade) && s.contracts >= MIN_AWARDS_TO_INDEX;
  return {
    robots: index ? undefined : { index: false, follow: true },
    title: `Marchés publics ${deT(t)} attribués ${inDept(dept)} : qui gagne, à quel prix`,
    description: `${s.contracts} marchés ${deT(t)} attribués ${inDept(dept)} en 12 mois : entreprises gagnantes, montants, nombre d'offres reçues. Données officielles DECP.`,
    alternates: { canonical: `/marches-attribues/${dept}/${trade}` },
  };
}

export default async function Page({ params }: { params: Promise<{ dept: string; trade: string }> }) {
  const { dept, trade } = await params;
  const t = tradeById(trade);
  if (!t || !DEPTS[dept]) notFound();
  const list = await awards(dept, trade).catch(() => []);
  const s = stats(list);
  const where = inDept(dept);

  // Lecture des chiffres : l'élément original de la page (calculé, pas rédigé à la main)
  const insights: string[] = [];
  if (s.avgOffers != null) insights.push(`En moyenne, un marché ${deT(t)} ${where} reçoit ${s.avgOffers.toFixed(1).replace(".", ",")} offre${s.avgOffers >= 2 ? "s" : ""}${s.avgOffers < 3 ? " : la concurrence est faible, une offre sérieuse a de vraies chances" : s.avgOffers < 5 ? " : une concurrence modérée" : " : la concurrence est forte, soignez le mémoire technique"}.`);
  if (s.oneBidShare != null && s.oneBidShare >= 0.15) insights.push(`${pct(s.oneBidShare)} des marchés n'ont reçu qu'une seule offre. Autrement dit, l'acheteur n'avait pas le choix : être présent suffit souvent.`);
  if (s.smallShare != null) insights.push(`${pct(s.smallShare)} des marchés font moins de 90 000 € HT : des montants à la portée d'une petite entreprise ou d'un artisan seul.`);
  if (s.distinctWinners && s.contracts) insights.push(`${s.distinctWinners} entreprises différentes ont gagné au moins un marché : ${s.distinctWinners / s.contracts > 0.6 ? "le marché est ouvert, pas réservé à quelques habitués" : "quelques entreprises reviennent souvent, mais les acheteurs changent régulièrement de titulaire"}.`);

  return (<><Header /><main className="container-x py-12">
    <div className="text-sm text-slate-500"><Link href="/marches">Départements</Link> › <Link href={`/marches/${dept}`}>{deptName(dept)}</Link> › <Link href={`/marches/${dept}/${trade}`}>{t.name}</Link> › Marchés attribués</div>
    <h1 className="mt-2 text-3xl font-extrabold">Marchés publics {deT(t)} attribués {where} : qui gagne, à quel prix</h1>
    <p className="mt-3 max-w-3xl text-slate-600">Sur les 12 derniers mois, <strong>{s.contracts} marché{s.contracts > 1 ? "s" : ""} {deT(t)}</strong> {s.contracts > 1 ? "ont été attribués" : "a été attribué"} par les acheteurs publics {where} ({deptName(dept)}, {dept}). Voici qui les a gagnés, pour quels montants et face à combien de concurrents. Source : données essentielles de la commande publique (DECP), publiées par l&apos;État.</p>

    {s.contracts === 0 ? <p className="mt-8 text-slate-600">Pas encore de marché attribué publié pour ce métier dans ce département sur 12 mois.</p> : <>
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[["Marchés attribués", String(s.contracts)], ["Montant médian", eur(s.median)], ["Offres reçues (moyenne)", s.avgOffers == null ? "—" : s.avgOffers.toFixed(1).replace(".", ",")], ["Marchés < 90 000 €", pct(s.smallShare)], ["Entreprises gagnantes", String(s.distinctWinners)]].map(([k, v]) => (
          <div key={k} className="card p-4"><div className="text-2xl font-extrabold">{v}</div><div className="mt-1 text-xs text-slate-500">{k}</div></div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <h2 className="text-xl font-bold">Ce que disent ces chiffres</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">{insights.map((x) => <li key={x}>{x}</li>)}</ul>

          <h2 className="mt-10 text-xl font-bold">Les entreprises qui gagnent le plus</h2>
          <div className="mt-3 overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b text-left text-slate-500"><th className="py-2 pr-3">Entreprise</th><th className="py-2 pr-3">Ville</th><th className="py-2 pr-3 text-right">Marchés</th><th className="py-2 text-right">Montant cumulé</th></tr></thead>
            <tbody>{s.topWinners.map((w) => <tr key={w.name} className="border-b border-slate-100"><td className="py-2 pr-3 font-semibold">{w.name}</td><td className="py-2 pr-3 text-slate-600">{w.ville}</td><td className="py-2 pr-3 text-right">{w.n}</td><td className="py-2 text-right">{w.total ? eur(w.total) : "—"}</td></tr>)}</tbody>
          </table></div>

          <h2 className="mt-10 text-xl font-bold">Les acheteurs publics les plus actifs</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">{s.topBuyers.map(([b, n]) => <li key={b} className="card px-3 py-2 text-sm"><span className="font-semibold">{b}</span> · {n} marché{n > 1 ? "s" : ""}</li>)}</ul>

          <h2 className="mt-10 text-xl font-bold">Derniers marchés attribués</h2>
          <div className="mt-3 space-y-3">{list.slice(0, 30).map((a) => (
            <div key={`${a.uid}|${a.titulaireId}`} className="card p-4">
              <div className="text-xs text-slate-500">{a.acheteur || "Acheteur public"} · attribué le {date(a.date)}{a.procedure ? ` · ${a.procedure.toLowerCase()}` : ""}</div>
              <div className="mt-0.5 font-semibold">{a.objet}</div>
              <div className="mt-1 text-sm text-slate-700">Gagné par <strong>{a.titulaire}</strong>{a.titulaireVille ? ` (${a.titulaireVille})` : ""} · {eur(a.montant)}{a.offres ? ` · ${a.offres} offre${a.offres > 1 ? "s" : ""} reçue${a.offres > 1 ? "s" : ""}` : ""}{a.duree ? ` · ${a.duree} mois` : ""}</div>
            </div>))}</div>
        </div>

        <aside className="card h-fit p-5 lg:sticky lg:top-20">
          <div className="font-bold">Le prochain, c&apos;est pour vous ?</div>
          <p className="mt-1 text-sm text-slate-600">Recevez les nouveaux appels d&apos;offres {deT(t)} {where} avant la date limite. Gratuit, désinscription en un clic.</p>
          <div className="mt-4"><SignupForm compact plan="gratuit" trade={trade} dept={dept} /></div>
          <p className="mt-4 text-sm"><Link href={`/marches/${dept}/${trade}`} className="font-semibold text-brand-700">Voir les marchés ouverts en ce moment →</Link></p>
        </aside>
      </div>

      <h2 className="mt-12 text-xl font-bold">Questions fréquentes</h2>
      <div className="mt-3 max-w-3xl space-y-4 text-slate-700">
        <div><h3 className="font-semibold">D&apos;où viennent ces données ?</h3><p className="mt-1">Des « données essentielles de la commande publique » (DECP) que chaque acheteur public doit publier après l&apos;attribution d&apos;un marché de plus de 40 000 € HT, consolidées sur data.gouv.fr. Elles sont mises à jour chaque jour ici.</p></div>
        <div><h3 className="font-semibold">Pourquoi regarder les marchés déjà attribués ?</h3><p className="mt-1">Pour savoir quels acheteurs achètent votre métier, à quels prix et qui sont vos concurrents. Beaucoup de marchés reviennent tous les 1 à 4 ans : la durée du marché vous dit quand le prochain sera publié.</p></div>
        <div><h3 className="font-semibold">Un artisan seul peut-il gagner un marché public ?</h3><p className="mt-1">Oui. {s.smallShare != null ? `Ici, ${pct(s.smallShare)} des marchés font moins de 90 000 € HT` : "Beaucoup de marchés sont de petits montants"}, souvent en procédure adaptée (dossier allégé). Le plus dur est de les voir passer à temps : c&apos;est ce que fait l&apos;alerte gratuite.</p></div>
      </div>
    </>}
    <p className="mt-10 text-xs text-slate-400">Données : DECP consolidées (data.gouv.fr, licence ouverte 2.0). Montants HT tels que déclarés par les acheteurs ; un marché attribué à plusieurs entreprises apparaît pour chacune.</p>
  </main><Footer /></>);
}
