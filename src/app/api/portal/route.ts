import { NextResponse } from "next/server";
import { currentSub } from "@/lib/session";
import { portalUrl } from "@/lib/billing";
import { SITE_URL } from "@/lib/config";
export async function POST() {
  const s = await currentSub();
  if (!s?.stripeCustomerId) return NextResponse.redirect(`${SITE_URL}/compte`, 303);
  return NextResponse.redirect(await portalUrl(s), 303);
}
