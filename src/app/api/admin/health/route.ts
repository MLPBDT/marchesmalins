import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { db } from "@/lib/db";
import { chat } from "@/lib/ai";
import { fetchSince } from "@/lib/boamp";

export const maxDuration = 60;

// Admin-only: checks every integration and runs one real AI reply (no rate limit).
export async function GET() {
  if (!(await isAdmin())) return new NextResponse("forbidden", { status: 403 });
  const env = (k: string) => (process.env[k] ? "ok" : "manquante");
  const out: Record<string, any> = {
    site: process.env.NEXT_PUBLIC_SITE_URL || "manquante",
    variables: Object.fromEntries(["APP_SECRET", "CRON_SECRET", "GROQ_API_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_SOLO", "STRIPE_PRICE_PRO", "RESEND_API_KEY", "EMAIL_FROM", "GOOGLE_PLACES_API_KEY", "OUTREACH_SMTP_HOST", "OUTREACH_ENABLED", "ADMIN_EMAIL"].map((k) => [k, env(k)])),
  };
  try { await db.set("health:ping", Date.now(), 60); out.database = (await db.get("health:ping")) ? "ok" : "erreur"; } catch (e: any) { out.database = `erreur : ${e.message}`; }
  try { out.ia_exemple = await chat([{ role: "user", content: "Réponds juste : OK" }], { maxTokens: 20 }); out.ia = "ok"; } catch (e: any) { out.ia = `erreur : ${e.message}`; }
  try { const n = await fetchSince(new Date(Date.now() - 864e5).toISOString().slice(0, 10), () => {}, 1); out.boamp = `ok (${n.length} avis sur la 1re page)`; out.boamp_exemple = n[0]; } catch (e: any) { out.boamp = `erreur : ${e.message}`; }
  return NextResponse.json(out, { headers: { "cache-control": "no-store" } });
}
