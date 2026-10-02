import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { DEPTS, TRADES, deptName, inDept, matches } from "@/lib/trades";
import { openNotices } from "@/lib/boamp";
import { NoticeList } from "@/components/NoticeList";
export const revalidate = 3600;
export async function generateMetadata({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  return { title: `Marchés publics ${inDept(dept)} (${dept}) : appels d'offres en cours`, description: `Les appels d'offres publics ouverts ${inDept(dept)}, par métier, mis à jour chaque jour. Alerte gratuite par email.` };
}
export default async function Dept({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  if (!DEPTS[dept]) notFound();
  const all = await openNotices(dept).catch(() => []);
  const counts = TRADES.map((t) => ({ t, n: all.filter((x) => matches(t, `${x.objet} ${x.desc.join(" ")}`, x.types)).length })).sort((a, b) => b.n - a.n);
  return (<><Header /><main className="container-x py-12">
    <div className="text-sm text-slate-500"><Link href="/marches">Départements</Link> › {deptName(dept)}</div>
    <h1 className="mt-2 text-3xl font-extrabold">Marchés publics {inDept(dept)} ({dept})</h1>
    <p className="mt-2 text-slate-600">{all.length} appels d&apos;offres ouverts en ce moment. Choisissez votre métier pour ne voir que les vôtres.</p>
    <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {counts.map(({ t, n }) => <Link key={t.id} href={`/marches/${dept}/${t.id}`} className="card flex justify-between px-4 py-3 text-sm hover:border-brand-500"><span className="font-semibold">{t.name}</span><span className="text-slate-500">{n}</span></Link>)}
    </div>
    <h2 className="mt-10 text-xl font-bold">Derniers avis publiés</h2>
    <div className="mt-4"><NoticeList list={all.slice(0, 25)} /></div>
    <div className="card mt-8 bg-brand-50 p-5"><b>Ne ratez plus les marchés de votre métier.</b> <Link href={`/commencer?dept=${dept}`} className="font-semibold text-brand-700">Créer mon alerte gratuite →</Link></div>
  </main><Footer /></>);
}
