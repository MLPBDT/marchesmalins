import Link from "next/link";
import { isAdmin } from "@/lib/session";
import { allSubs } from "@/lib/models";
import { allProspects } from "@/lib/prospects";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/config";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin", robots: { index: false } };

export default async function Admin() {
  if (!(await isAdmin())) return (
    <main className="container-x max-w-sm py-24"><h1 className="text-2xl font-extrabold">Admin</h1>
      <form action="/api/admin/login" method="post" className="mt-6 space-y-3"><input className="input" type="password" name="password" placeholder="Mot de passe" /><button className="btn btn-primary w-full">Entrer</button></form></main>);
  const subs = (await allSubs()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const active = subs.filter((s) => s.status === "active" && s.confirmed);
  const paid = active.filter((s) => s.plan !== "gratuit");
  const mrr = paid.reduce((t, s) => t + PLANS[s.plan].price, 0);
  const prospects = (await allProspects()).sort((a, b) => (b.lastSentAt || b.createdAt).localeCompare(a.lastSentAt || a.createdAt));
  const by = (st: string) => prospects.filter((p) => p.status === st).length;
  const sent = prospects.filter((p) => p.status.startsWith("sent") || ["replied", "converted", "unsubscribed", "bounced"].includes(p.status));
  const viewed = sent.filter((p) => (p.views || 0) > 0).length;
  const days = [...Array(7)].map((_, i) => new Date(Date.now() - i * 864e5).toISOString().slice(0, 10));
  const events = (await Promise.all(days.map((d) => db.get<any[]>(`events:${d}`)))).flatMap((x) => x || []).sort((a, b) => b.t.localeCompare(a.t)).slice(0, 40);
  const last = await db.get<any>("admin:lastlog");
  const ing = await db.get<any>("ingest:last");
  const smtpErr = await db.get<any>("outreach:lastError");
  const K = ({ k, v }: { k: string; v: any }) => <div className="card p-4"><div className="text-xs text-slate-500">{k}</div><div className="text-2xl font-extrabold text-brand-700">{v}</div></div>;
  return (
    <main className="container-x py-10">
      <div className="flex items-center justify-between"><h1 className="text-3xl font-extrabold">Pilotage</h1><Link href="/" className="text-sm text-slate-500">Site →</Link></div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <K k="MRR" v={`${mrr} €`} /><K k="Payants" v={paid.length} /><K k="Gratuits actifs" v={active.length - paid.length} /><K k="Prospects prêts" v={by("ready")} /><K k="Emails prospects" v={sent.length} /><K k="Listes vues" v={`${viewed} (${sent.length ? Math.round((viewed / sent.length) * 100) : 0} %)`} />
      </div>
      <p className="mt-3 text-sm text-slate-500">Dernière collecte BOAMP : {ing ? `${new Date(ing.at).toLocaleString("fr-FR")} — ${ing.fetched} avis, ${ing.added} nouveaux` : "jamais"}</p>
      <div className="card mt-4 flex flex-wrap items-center gap-2 p-4">
        <span className="mr-2 font-bold">Lancer :</span>
        {[["backfill", "Rattrapage (1re fois, à relancer)"], ["ingest", "Collecte BOAMP"], ["digest", "Alertes"], ["prospect", "Trouver des prospects"], ["outreach-dry", "Prospection (simulation)"], ["outreach", "Prospection (réel)"], ["smtp-test", "Tester SMTP"]].map(([j, l]) => (
          <form key={j} action="/api/admin/job" method="post"><input type="hidden" name="job" value={j} /><button className="btn btn-ghost !py-1.5 text-sm">{l}</button></form>
        ))}
      </div>
      {smtpErr && <div className="card mt-4 border-red-300 bg-red-50 p-4 text-sm text-red-800"><b>Envoi bloqué</b> ({new Date(smtpErr.at).toLocaleString("fr-FR")}) : {smtpErr.msg}</div>}
      {last && <pre id="log" className="card mt-4 max-h-72 overflow-auto whitespace-pre-wrap p-4 text-xs">{`${last.job} — ${last.at}\n` + last.logs.join("\n")}</pre>}

      <h2 className="mt-10 text-xl font-extrabold">Abonnés ({subs.length})</h2>
      <div className="card mt-3 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr>{["Entreprise", "Email", "Formule", "Statut", "Métiers", "Depts", "Dernière alerte", "Depuis"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{subs.slice(0, 200).map((s) => <tr key={s.id} className="border-t"><td className="p-3 font-semibold">{s.company}</td><td className="p-3">{s.email}</td><td className="p-3">{s.plan}</td><td className="p-3">{s.confirmed ? s.status : "non confirmé"}</td><td className="p-3">{s.trades.join(", ")}</td><td className="p-3">{s.depts.join(", ")}</td><td className="p-3">{s.lastDigestAt ? new Date(s.lastDigestAt).toLocaleDateString("fr-FR") : "—"}</td><td className="p-3">{new Date(s.createdAt).toLocaleDateString("fr-FR")}</td></tr>)}</tbody></table></div>

      <h2 id="prospects" className="mt-10 text-xl font-extrabold">Prospects ({prospects.length})</h2>
      <div className="card mt-3 overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left"><tr>{["Entreprise", "Dépt", "Métier", "Email", "Statut", "Vues", "Action"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
        <tbody>{prospects.slice(0, 150).map((p) => <tr key={p.slug} className="border-t"><td className="p-3"><Link className="font-semibold text-brand-700" href={`/marches/${p.dept}/${p.trade}`} target="_blank">{p.name}</Link></td><td className="p-3">{p.dept}</td><td className="p-3">{p.trade}</td><td className="p-3">{p.email}</td><td className="p-3">{p.status}</td><td className="p-3">{p.views || 0}</td>
          <td className="p-3"><form action="/api/admin/prospect" method="post" className="flex gap-1"><input type="hidden" name="slug" value={p.slug} /><select name="status" className="rounded border p-1"><option value="replied">a répondu</option><option value="excluded">exclure</option><option value="unsubscribed">désinscrire</option><option value="ready">remettre prêt</option></select><button className="rounded bg-slate-800 px-2 text-white">OK</button></form></td></tr>)}</tbody></table></div>

      <h2 className="mt-10 text-xl font-extrabold">Événements (7 j)</h2>
      <div className="card mt-3 p-4 text-sm">{events.length ? events.map((e, i) => <div key={i} className="border-b py-1 last:border-0"><span className="text-slate-400">{new Date(e.t).toLocaleString("fr-FR")}</span> — <b>{e.type}</b> {JSON.stringify({ ...e, t: undefined, type: undefined })}</div>) : "Rien pour l'instant."}</div>
    </main>
  );
}
