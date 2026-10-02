import Link from "next/link";
import { Header, Footer } from "@/components/Chrome";
import { DEPTS } from "@/lib/trades";
export const metadata = { title: "Marchés publics ouverts par département", description: "Tous les appels d'offres publics en cours, classés par département et par métier, mis à jour chaque jour à partir du BOAMP." };
export default function Marches() {
  return (<><Header /><main className="container-x py-12">
    <h1 className="text-3xl font-extrabold">Marchés publics ouverts, par département</h1>
    <p className="mt-2 text-slate-600">Appels d&apos;offres en cours, mis à jour chaque jour à partir du BOAMP. Choisissez votre département.</p>
    <div className="mt-8 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {Object.entries(DEPTS).map(([k, v]) => <Link key={k} href={`/marches/${k}`} className="card px-4 py-3 text-sm font-semibold hover:border-brand-500">{k} · {v}</Link>)}
    </div>
  </main><Footer /></>);
}
