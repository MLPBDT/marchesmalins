import Link from "next/link";
import { redirect } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { currentSub } from "@/lib/session";
import { PLANS } from "@/lib/config";
import { TRADES, DEPTS, deptName, tradeById } from "@/lib/trades";
import { matchingNotices, daysLeft } from "@/lib/alerts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon compte", robots: { index: false } };

export default async function Compte({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const s = await currentSub();
  if (!s) redirect("/compte/connexion");
  const sp = await searchParams;
  const plan = PLANS[s.plan];
  const list = (await matchingNotices(s)).slice(0, 30);
  const deptSlots = Array.from({ length: Math.min(plan.maxDepts, 3) }, (_, i) => s.depts[i] || "");
  const tradeSlots = Array.from({ length: Math.min(plan.maxTrades, 6) }, (_, i) => s.trades[i] || "");
  return (<><Header /><main className="container-x max-w-4xl py-12">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-3xl font-extrabold">{s.company}</h1><p className="text-slate-600">{s.email} · Formule <b>{plan.name}</b> · {s.status === "active" ? "alerte active" : s.status === "unsubscribed" ? "alerte en pause" : s.status}</p></div>
      <form action="/api/logout" method="post"><button className="btn btn-ghost !py-2 text-sm">Se déconnecter</button></form>
    </div>
    {sp.active && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">✅ Alerte activée. Les marchés déjà ouverts viennent de partir par email.</div>}
    {sp.ok && <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Modifications enregistrées.</div>}

    {s.plan === "gratuit" && <div className="card mt-6 border-brand-600 bg-brand-50 p-5"><b>Recevez chaque marché dès sa sortie, résumé et trié.</b><p className="mt-1 text-sm text-slate-700">Avec Solo (19 €/mois) : alerte chaque matin, résumé en 3 lignes, montant, lots, visite obligatoire, et verdict « accessible à une petite entreprise ? ». 14 jours d&apos;essai.</p><Link href={`/commencer?plan=solo&e=${encodeURIComponent(s.email)}&metier=${s.trades[0] || ""}&dept=${s.depts[0] || ""}`} className="btn btn-primary mt-3 !py-2 text-sm">Passer à Solo</Link></div>}

    <section className="card mt-6 p-6">
      <h2 className="text-lg font-bold">Mes critères</h2>
      <form action="/api/compte" method="post" className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {tradeSlots.map((t, i) => <select key={i} name="trades" defaultValue={t} className="input"><option value="">{i ? "— (métier en plus)" : "Choisir un métier"}</option>{TRADES.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {deptSlots.map((d, i) => <select key={i} name="depts" defaultValue={d} className="input"><option value="">{i ? "— (département en plus)" : "Choisir"}</option>{s.plan === "pro" && <option value="FR">Toute la France</option>}{Object.entries(DEPTS).map(([k, v]) => <option key={k} value={k}>{k} — {v}</option>)}</select>)}
        </div>
        {s.plan === "pro" && <input name="keywords" className="input" defaultValue={s.keywords.join(", ")} placeholder="Mots-clés en plus, séparés par des virgules" />}
        <button className="btn btn-primary !py-2 text-sm">Enregistrer</button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {s.stripeCustomerId && <form action="/api/portal" method="post"><button className="btn btn-ghost !py-2 text-sm">Factures, carte, résiliation</button></form>}
        <form action="/api/compte" method="post"><input type="hidden" name="action" value="pause" /><button className="btn btn-ghost !py-2 text-sm">{s.status === "unsubscribed" ? "Réactiver mes emails" : "Mettre mes emails en pause"}</button></form>
      </div>
    </section>

    <section className="mt-8">
      <h2 className="text-lg font-bold">Marchés ouverts pour vous en ce moment ({list.length})</h2>
      <p className="text-sm text-slate-500">{s.trades.map((t) => tradeById(t)?.name).join(", ")} · {s.depts.map((d) => (d === "FR" ? "toute la France" : deptName(d))).join(", ")}</p>
      <div className="mt-4 space-y-3">
        {list.map((n) => { const dl = daysLeft(n.deadline); return (
          <a key={n.id} href={n.url} target="_blank" rel="noopener" className="card block p-4 hover:border-brand-500">
            <div className="text-xs text-slate-500">{n.acheteur} · {n.depts.map(deptName).join(", ")}</div>
            <div className="font-semibold">{n.objet}</div>
            <div className={`mt-1 text-sm ${dl != null && dl <= 7 ? "text-red-700" : "text-slate-600"}`}>{n.deadline ? `Date limite : ${new Date(n.deadline).toLocaleDateString("fr-FR")} (dans ${dl} j)` : "Date limite non précisée"}</div>
          </a>); })}
        {!list.length && <p className="text-slate-600">Aucun marché ouvert pour ces critères aujourd&apos;hui. Élargissez à un département voisin pour en voir plus.</p>}
      </div>
    </section>
  </main><Footer /></>);
}
