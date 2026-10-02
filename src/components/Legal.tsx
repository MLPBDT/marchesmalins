import { Header, Footer } from "./Chrome";
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (<><Header /><main className="container-x max-w-3xl py-14"><h1 className="text-3xl font-extrabold">{title}</h1><p className="mt-2 text-sm text-slate-500">Dernière mise à jour : 2 octobre 2026</p><div className="prose-legal mt-8">{children}</div></main><Footer /></>);
}
