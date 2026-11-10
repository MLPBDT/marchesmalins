"use client";
// Mesure des pubs (pixel Meta, balise Google Ads), chargée seulement après accord de la personne (règles CNIL).
// Rien ne s'affiche ni ne se charge tant que NEXT_PUBLIC_META_PIXEL_ID ou NEXT_PUBLIC_GOOGLE_ADS_ID n'est pas renseigné.
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const META = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
const GADS = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ""; // AW-XXXXXXXXX
const GADS_SIGNUP = process.env.NEXT_PUBLIC_GOOGLE_ADS_SIGNUP_LABEL || ""; // libellé de la conversion « Inscription »
const KEY = "consent_pub";
// Page affichée juste après une inscription (formulaire envoyé)
const SIGNUP_PATH = "/merci";

type W = Window & { fbq?: any; _fbq?: any; gtag?: any; dataLayer?: any[] };

function read(): string | null { try { return localStorage.getItem(KEY); } catch { return null; } }
function write(v: string) { try { localStorage.setItem(KEY, v); } catch { /* navigation privée */ } }

let loaded = false;
function load() {
  if (loaded) return;
  loaded = true;
  const w = window as W;
  if (META) {
    const n: any = (w.fbq = function (...a: any[]) { n.callMethod ? n.callMethod(...a) : n.queue.push(a); });
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    const s = document.createElement("script"); s.async = true; s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    w.fbq("init", META);
  }
  if (GADS) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { (w.dataLayer as any[]).push(arguments); };
    w.gtag("js", new Date());
    w.gtag("config", GADS);
    const s = document.createElement("script"); s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GADS}`;
    document.head.appendChild(s);
  }
}

function track() {
  const w = window as W;
  if (META) w.fbq?.("track", "PageView");
  if (window.location.pathname === SIGNUP_PATH) {
    if (META) w.fbq?.("track", "CompleteRegistration");
    if (GADS && GADS_SIGNUP) w.gtag?.("event", "conversion", { send_to: `${GADS}/${GADS_SIGNUP}` });
  }
}

export function Tracking() {
  const path = usePathname();
  const [ask, setAsk] = useState(false);
  const active = !!(META || GADS);

  useEffect(() => {
    if (!active) return;
    const c = read();
    if (c === "oui") { load(); track(); }
    else if (c !== "non") setAsk(true);
    const reopen = () => setAsk(true);
    window.addEventListener("consent-pub:ouvrir", reopen);
    return () => window.removeEventListener("consent-pub:ouvrir", reopen);
  }, [path, active]);

  if (!active || !ask) return null;
  const choose = (v: "oui" | "non") => {
    write(v);
    setAsk(false);
    if (v === "oui") { load(); track(); }
  };
  return (
    <div role="dialog" aria-label="Cookies" style={{ position: "fixed", left: 16, right: 16, bottom: 16, zIndex: 50, maxWidth: 560, margin: "0 auto", background: "#fff", border: "1px solid #E3E6EB", borderRadius: 14, boxShadow: "0 10px 30px rgba(22,24,29,.12)", padding: 16 }}>
      <p style={{ margin: "0 0 12px", fontSize: 15, lineHeight: 1.5 }}>
        Acceptez-vous des cookies de mesure publicitaire (Meta, Google) ? Ils servent seulement à savoir quelles publicités nous amènent des inscriptions. <a href="/confidentialite" style={{ textDecoration: "underline" }}>En savoir plus</a>
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#fff", fontWeight: 700, cursor: "pointer" }} onClick={() => choose("non")}>Refuser</button>
        <button style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#fff", fontWeight: 700, cursor: "pointer" }} onClick={() => choose("oui")}>Accepter</button>
      </div>
    </div>
  );
}

/** Bouton pour revenir sur son choix (page Confidentialité). */
export function CookieChoiceButton() {
  return <button style={{ minHeight: 40, padding: "0 16px", borderRadius: 10, border: "1.5px solid #CBD5E1", background: "#fff", fontWeight: 700, cursor: "pointer" }} onClick={() => { try { localStorage.removeItem(KEY); } catch { /* */ } window.dispatchEvent(new Event("consent-pub:ouvrir")); }}>Modifier mon choix sur les cookies</button>;
}
