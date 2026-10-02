import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { PLANS, PlanId } from "@/lib/config";
import { db } from "@/lib/db";
import { openNotices } from "@/lib/boamp";

export const revalidate = 3600;

export default async function Home() {
  let var83 = 0;
  try { var83 = (await openNotices("83")).length; } catch { /* first deploy, empty DB */ }
  const last = await db.get<{ fetched: number }>("ingest:last").catch(() => null);
  return (
    <>
      <Header />
      <main>
        <section className="container-x grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">Pour les artisans et les TPE</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Les marchés publics de votre métier, <span className="text-brand-700">chaque matin dans votre boîte mail</span>.</h1>
            <p className="mt-5 text-lg text-slate-600">Écoles, mairies, offices HLM, hôpitaux : chaque jour, des centaines de chantiers et de prestations sont publiés. On les trie par métier et par département, on les résume en 3 lignes et on vous dit si c&apos;est jouable pour une petite entreprise.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/commencer" className="btn btn-primary">Créer mon alerte gratuite</Link>
              <Link href="/marches" className="btn btn-ghost">Voir les marchés ouverts</Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">{last?.fetched ? `${last.fetched} nouveaux avis analysés ces 2 derniers jours` : "Source officielle : BOAMP"}{var83 ? ` · ${var83} marchés ouverts dans le Var en ce moment` : ""}</p>
          </div>
          <div className="card p-5 shadow-sm">
            <div className="text-xs text-slate-500">Commune de La Garde · Var</div>
            <div className="mt-1 font-bold">Réfection de la toiture du groupe scolaire</div>
            <p className="mt-2 text-sm text-slate-700">Remplacement des tuiles et de la zinguerie sur 900 m², école occupée : travaux pendant les vacances d&apos;hiver.</p>
            <div className="mt-2 space-y-1 text-sm text-slate-700"><div>💶 Environ 85 000 € HT</div><div>📦 Lot unique</div><div>👀 Visite obligatoire le 12 octobre</div></div>
            <div className="mt-2 text-sm"><b>✅ Accessible à une petite entreprise</b> — montant modéré, pas de chiffre d&apos;affaires minimum exigé.</div>
            <div className="mt-2 text-sm text-red-700">📅 Date limite : 28 octobre (dans 21 j)</div>
            <div className="mt-3 text-xs text-slate-400">Exemple d&apos;alerte</div>
          </div>
        </section>

        <section id="comment" className="bg-slate-50 py-16">
          <div className="container-x">
            <h2 className="text-3xl font-extrabold">Comment ça marche</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-3">
              {[["1. Vous choisissez", "Votre métier et vos départements. 30 secondes, sans compte à créer."], ["2. On trie", "Chaque jour, tous les nouveaux avis du BOAMP sont filtrés. Seuls ceux de votre métier et de votre secteur passent."], ["3. Vous décidez", "Un email clair : quoi, où, combien, pour quand, et si c'est accessible à une petite structure. Un clic vers l'avis officiel et le dossier."]].map(([t, d]) => (
                <div key={t} className="card p-5"><div className="font-bold">{t}</div><p className="mt-2 text-sm text-slate-600">{d}</p></div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-500">Les marchés publics, ce n&apos;est pas que pour les grosses entreprises : les PME remportent plus de la moitié des marchés en nombre. Le plus dur, c&apos;est de les voir passer à temps.</p>
          </div>
        </section>

        <section id="tarifs" className="container-x py-16">
          <h2 className="text-3xl font-extrabold">Tarifs</h2>
          <p className="mt-2 text-slate-600">Sans engagement. 14 jours d&apos;essai sur les formules payantes.</p>
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {(Object.keys(PLANS) as PlanId[]).map((id) => {
              const p = PLANS[id];
              return (
                <div key={id} className={`card flex flex-col p-6 ${id === "solo" ? "border-brand-600 ring-2 ring-brand-100" : ""}`}>
                  <div className="font-bold">{p.name}</div>
                  <div className="mt-2 text-4xl font-extrabold">{p.price} €<span className="text-base font-semibold text-slate-500">{p.price ? " /mois" : ""}</span></div>
                  <div className="text-sm text-slate-500">{p.tagline}</div>
                  <ul className="mt-5 flex-1 space-y-2 text-sm">{p.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
                  <Link href={`/commencer?plan=${id}`} className={`btn mt-6 ${id === "solo" ? "btn-primary" : "btn-ghost"}`}>{p.price ? "Essayer 14 jours" : "Commencer gratuitement"}</Link>
                </div>
              );
            })}
          </div>
        </section>

        <section className="container-x pb-8">
          <h2 className="text-2xl font-extrabold">Questions fréquentes</h2>
          <div className="mt-6 space-y-4 text-sm text-slate-700">
            {[["D'où viennent les marchés ?", "Du BOAMP, le Bulletin officiel des annonces des marchés publics, publié en open data par l'État. Nous ne revendons pas les avis : nous les trions et les résumons."],
              ["Est-ce que vous répondez aux appels d'offres à ma place ?", "Non. On vous signale les bons marchés et on vous fait gagner le temps de lecture. La réponse reste la vôtre."],
              ["Les résumés sont-ils fiables ?", "Ils sont générés automatiquement à partir du texte officiel, sans rien inventer. Vérifiez toujours l'avis et le dossier avant de répondre."],
              ["Je peux arrêter quand je veux ?", "Oui : désinscription en un clic depuis chaque email, résiliation en un clic depuis votre compte."]].map(([q, a]) => (
              <details key={q} className="card p-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2">{a}</p></details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
