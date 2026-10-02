import Stripe from "stripe";
import { PLANS, PlanId } from "./config";
let _s: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante");
  if (!_s) _s = new Stripe(process.env.STRIPE_SECRET_KEY);
  return _s;
}
export const priceFor = (plan: PlanId) => process.env[PLANS[plan].priceEnv] || "";
