import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/session";
import { stripe } from "@/lib/stripe";
import { PLANS, PlanId, SITE_URL, BRAND, PAID } from "@/lib/config";

export const maxDuration = 60;

// Admin-only, idempotent: creates products + monthly prices, the webhook and a customer-portal configuration.
// Returns the environment variables to paste into Vercel.
export async function GET() {
  if (!(await isAdmin())) return new NextResponse("forbidden", { status: 403 });
  const s = stripe();
  const env: Record<string, string> = {};
  const log: string[] = [];
  for (const id of PAID as PlanId[]) {
    const plan = PLANS[id];
    const lookup = `appelspro_${id}_monthly_${plan.price}`;
    const existing = await s.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
    let price = existing.data[0];
    if (!price) {
      const product = await s.products.create({ name: `${BRAND} ${plan.name}`, description: plan.tagline });
      price = await s.prices.create({ product: product.id, currency: "eur", unit_amount: plan.price * 100, recurring: { interval: "month" }, lookup_key: lookup, tax_behavior: "unspecified" });
      log.push(`prix créé : ${plan.name} ${plan.price} €/mois`);
    } else log.push(`prix existant : ${plan.name}`);
    env[plan.priceEnv] = price.id;
  }
  const url = `${SITE_URL}/api/stripe/webhook`;
  const hooks = await s.webhookEndpoints.list({ limit: 100 });
  for (const h of hooks.data.filter((h) => h.url === url)) await s.webhookEndpoints.del(h.id); // secret is only readable at creation
  const hook = await s.webhookEndpoints.create({
    url, description: BRAND,
    enabled_events: ["checkout.session.completed", "customer.subscription.updated", "customer.subscription.deleted", "invoice.payment_failed"],
  });
  env.STRIPE_WEBHOOK_SECRET = hook.secret || "";
  log.push(`webhook créé : ${url}`);
  const portal = await s.billingPortal.configurations.create({
    business_profile: { headline: `${BRAND} — gérez votre abonnement`, privacy_policy_url: `${SITE_URL}/confidentialite`, terms_of_service_url: `${SITE_URL}/cgv` },
    features: {
      customer_update: { enabled: true, allowed_updates: ["email", "address", "name"] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
    },
  });
  env.STRIPE_PORTAL_CONFIG = portal.id;
  log.push("portail client configuré (résiliation, factures, carte)");
  const block = Object.entries(env).map(([k, v]) => `${k}=${v}`).join("\n");
  return new NextResponse(`${log.join("\n")}\n\n--- À COLLER DANS VERCEL (Settings → Environment Variables), puis Redeploy ---\n\n${block}\n`, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
