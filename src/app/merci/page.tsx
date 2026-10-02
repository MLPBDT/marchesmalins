import { Header } from "@/components/Chrome";
export const metadata = { title: "Vérifiez votre boîte mail", robots: { index: false } };
export default function Merci() {
  return (<><Header /><main className="container-x max-w-xl py-24 text-center">
    <div className="text-5xl">📬</div>
    <h1 className="mt-4 text-3xl font-extrabold">Plus qu&apos;un clic</h1>
    <p className="mt-3 text-slate-600">On vient de vous envoyer un email de confirmation. Cliquez sur le bouton qu&apos;il contient pour activer votre alerte : vous recevrez aussitôt les marchés déjà ouverts.</p>
    <p className="mt-3 text-sm text-slate-500">Rien reçu dans 5 minutes ? Regardez dans les spams ou les « Promotions ».</p>
  </main></>);
}
