import Link from "next/link";
import { BRAND, LEGAL } from "@/lib/config";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-extrabold text-lg tracking-tight ${className}`}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>
      </span>
      {BRAND}
    </Link>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-1 text-sm font-semibold">
          <Link href="/marches" className="hidden px-3 py-2 text-slate-600 hover:text-ink sm:block">Marchés ouverts</Link>
          <Link href="/#tarifs" className="hidden px-3 py-2 text-slate-600 hover:text-ink sm:block">Tarifs</Link>
          <Link href="/compte" className="whitespace-nowrap px-3 py-2 text-slate-600 hover:text-ink">Mon compte</Link>
          <Link href="/commencer" className="btn btn-primary whitespace-nowrap !py-2 text-sm">Alerte gratuite</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-100 bg-slate-50">
      <div className="container-x grid gap-8 py-12 text-sm text-slate-600 sm:grid-cols-3">
        <div><Logo /><p className="mt-3 max-w-xs">Les marchés publics de votre métier, triés et résumés pour les artisans et les petites entreprises.</p></div>
        <div className="space-y-2">
          <div className="font-semibold text-ink">Produit</div>
          <Link href="/marches" className="block hover:text-ink">Marchés ouverts par département</Link>
          <Link href="/#comment" className="block hover:text-ink">Comment ça marche</Link>
          <Link href="/#tarifs" className="block hover:text-ink">Tarifs</Link>
        </div>
        <div className="space-y-2">
          <div className="font-semibold text-ink">Légal</div>
          <Link href="/mentions-legales" className="block hover:text-ink">Mentions légales</Link>
          <Link href="/cgv" className="block hover:text-ink">Conditions générales</Link>
          <Link href="/confidentialite" className="block hover:text-ink">Confidentialité</Link>
          <a href={`mailto:${LEGAL.email}`} className="block hover:text-ink">{LEGAL.email}</a>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">© {new Date().getFullYear()} {BRAND} · {LEGAL.name} · SIRET {LEGAL.siret} · TVA non applicable, art. 293 B du CGI · Données BOAMP (DILA), licence ouverte Etalab</div>
    </footer>
  );
}
