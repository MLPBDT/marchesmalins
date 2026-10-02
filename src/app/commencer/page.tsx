import { Header, Footer } from "@/components/Chrome";
import { SignupForm } from "@/components/SignupForm";
import { PlanId, PLANS } from "@/lib/config";
export const metadata = { title: "Créer mon alerte marchés publics" };
export default async function Commencer({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const plan = (sp.plan && sp.plan in PLANS ? sp.plan : "gratuit") as PlanId;
  return (<><Header /><main className="container-x max-w-3xl py-14">
    <h1 className="text-3xl font-extrabold">Créer mon alerte</h1>
    <p className="mt-2 text-slate-600">Choisissez votre métier et votre secteur. Vous recevez les marchés publics qui vous correspondent, rien d&apos;autre.</p>
    {sp.annule && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Paiement annulé : rien n&apos;a été prélevé. Vous pouvez aussi commencer avec la formule gratuite.</div>}
    {sp.err && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{sp.err}</div>}
    <div className="card mt-8 p-6"><SignupForm plan={plan} email={sp.e} trade={sp.metier} dept={sp.dept} /></div>
  </main><Footer /></>);
}
