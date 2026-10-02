import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SITE_URL, BRAND } from "@/lib/config";

const inter = localFont({
  src: [
    { path: "../fonts/inter-latin-400-normal.woff2", weight: "400" },
    { path: "../fonts/inter-latin-600-normal.woff2", weight: "600" },
    { path: "../fonts/inter-latin-700-normal.woff2", weight: "700" },
    { path: "../fonts/inter-latin-800-normal.woff2", weight: "800" },
  ],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} — Les marchés publics de votre métier, chaque matin`, template: `%s · ${BRAND}` },
  description: "Alerte marchés publics pour artisans et TPE : chaque appel d'offres de votre métier et de votre département, résumé en 3 lignes, avec le montant, les lots, la date limite et un verdict « accessible à une petite entreprise ? ». Gratuit ou 19 €/mois.",
  openGraph: { type: "website", locale: "fr_FR", siteName: BRAND },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
