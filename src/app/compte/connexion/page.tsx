import { Header } from "@/components/Chrome";
export const metadata = { title: "Connexion", robots: { index: false } };
export default async function Connexion({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <>
      <Header />
      <main className="container-x max-w-md py-20">
        <h1 className="text-3xl font-extrabold">Mon compte</h1>
        <p className="mt-2 text-slate-600">Entrez l&apos;email utilisé à l&apos;inscription : on vous envoie un lien de connexion (pas de mot de passe).</p>
        {sp.expire && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Ce lien a expiré, demandez-en un nouveau.</div>}
        {sp.envoye ? <div className="card mt-6 p-5 text-slate-700">📬 Si un compte existe pour cette adresse, le lien vient de partir. Pensez à vérifier vos spams.</div> : (
          <form action="/api/login" method="post" className="mt-6 space-y-4">
            <input className="input" type="email" name="email" required placeholder="vous@exemple.fr" />
            <button className="btn btn-primary w-full">Recevoir mon lien</button>
          </form>
        )}
      </main>
    </>
  );
}
