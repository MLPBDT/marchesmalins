import { Header } from "@/components/Chrome";
import { doUnsub } from "@/lib/unsub";
export const dynamic = "force-dynamic";
export const metadata = { title: "Désinscription", robots: { index: false } };
export default async function Unsub({ params }: { params: Promise<{ token: string }> }) {
  const ok = await doUnsub((await params).token);
  return (<><Header /><main className="container-x max-w-xl py-24 text-center"><h1 className="text-2xl font-extrabold">{ok ? "C'est fait." : "Lien invalide ou expiré."}</h1><p className="mt-3 text-slate-600">{ok ? "Vous ne recevrez plus de message de notre part. Vous pouvez réactiver votre alerte à tout moment depuis votre compte." : "Écrivez-nous et nous vous retirons de nos listes immédiatement."}</p></main></>);
}
