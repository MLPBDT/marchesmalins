import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer } from "@/components/Chrome";
import { DEPTS, tradeById, deptName, inDept } from "@/lib/trades";
import { matchingNotices } from "@/lib/alerts";
import { NoticeList } from "@/components/NoticeList";
import { SignupForm } from "@/components/SignupForm";
import { getProspect, saveProspect } from "@/lib/prospects";
import { logEvent } from "@/lib/models";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ dept: string; trade: string }> }) {
  const { dept, trade } = await params;
  const t = tradeById(trade);
  if (!t || !DEPTS[dept]) return {};
  return { title: `Marchés publics ${t.plural} ${inDept(dept)} (${dept})`, description: `Appels d'offres publics de ${t.plural} ouverts ${inDept(dept)}, mis à jour chaque jour. Recevez-les gratuitement par email.`, alternates: { canonical: `/marches/${dept}/${trade}` } };
}
export default async function Page({ params, searchParams }: { params: Promise<{ dept: string; trade: string }>; searchParams: Promise<{ r?: string }> }) {
  const { dept, trade } = await params;
  const { r } = await searchParams;
  const t = tradeById(trade);
  if (!t || !DEPTS[dept]) notFound();
  const list = await matchingNotices({ trades: [trade], depts: [dept], keywords: [] }).catch(() => []);
  let prospect = null;
  if (r) { prospect = await getProspect(r); if (prospect) { prospect.views = (prospect.views || 0) + 1; prospect.lastViewAt = new Date().toISOString(); await saveProspect(prospect); if (prospect.views === 1) await logEvent("prospect_view", { p: prospect.slug, name: prospect.name }); } }
  return (<><Header /><main className="container-x py-12">
    <div className="text-sm text-slate-500"><Link href="/marches">Départements</Link> › <Link href={`/marches/${dept}`}>{deptName(dept)}</Link> › {t.name}</div>
    <h1 className="mt-2 text-3xl font-extrabold">Marchés publics de {t.plural} {inDept(dept)}</h1>
    <p className="mt-2 text-slate-600">{list.length ? `${list.length} appel${list.length > 1 ? "s" : ""} d'offres ouvert${list.length > 1 ? "s" : ""} en ce moment` : "Aucun appel d'offres ouvert aujourd'hui"}, mis à jour chaque jour à partir du BOAMP.</p>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
      <div><NoticeList list={list} />{!list.length && <p className="text-slate-600">Créez une alerte : vous serez prévenu dès qu&apos;un marché sort.</p>}</div>
      <aside className="card h-fit p-5 lg:sticky lg:top-20">
        <div className="font-bold">Recevez-les automatiquement</div>
        <p className="mt-1 text-sm text-slate-600">Chaque lundi, les nouveaux marchés de {t.plural} {inDept(dept)}. Gratuit, désinscription en un clic.</p>
        <div className="mt-4"><SignupForm compact plan="gratuit" trade={trade} dept={dept} email={prospect?.email} source={prospect?.slug} /></div>
        <p className="mt-4 text-xs text-slate-500">Envie de les recevoir chaque matin, résumés en 3 lignes avec le montant et un verdict « accessible à une petite entreprise ? » ? <Link href={`/commencer?plan=solo&metier=${trade}&dept=${dept}`} className="font-semibold text-brand-700">Formule Solo, 19 €/mois</Link></p>
      </aside>
    </div>
  </main><Footer /></>);
}
