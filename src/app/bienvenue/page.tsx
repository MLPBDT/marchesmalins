import Link from "next/link";
import { Header } from "@/components/Chrome";
import { activateFromSession } from "@/lib/billing";
export const dynamic = "force-dynamic";
export const metadata = { title: "Bienvenue", robots: { index: false } };
export default async function Bienvenue({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const s = session_id ? await activateFromSession(session_id).catch(() => null) : null;
  return (<><Header /><main className="container-x max-w-xl py-24 text-center">
    <div className="text-5xl">🎉</div>
    <h1 className="mt-4 text-3xl font-extrabold">{s ? "Votre alerte est active" : "Paiement en cours de validation"}</h1>
    <p className="mt-3 text-slate-600">{s ? "Les marchés ouverts qui vous correspondent viennent de partir par email. Ensuite, c'est chaque matin dès qu'un nouveau marché sort." : "Vous allez recevoir un email de confirmation dans quelques minutes."}</p>
    <p className="mt-3 text-sm text-slate-500">Rien ne sera prélevé avant la fin des 14 jours d&apos;essai. Résiliation en un clic depuis votre compte.</p>
    <Link href="/compte/connexion" className="btn btn-primary mt-8">Accéder à mon compte</Link>
  </main></>);
}
