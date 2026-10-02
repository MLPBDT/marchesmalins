import { NextResponse } from "next/server";
import { verify } from "@/lib/models";
import { confirmFree } from "@/lib/billing";
import { setSession } from "@/lib/session";
import { SITE_URL } from "@/lib/config";
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const t = verify<{ s: string }>((await params).token);
  if (!t) return NextResponse.redirect(`${SITE_URL}/compte/connexion?expire=1`);
  const s = await confirmFree(t.s);
  if (!s) return NextResponse.redirect(`${SITE_URL}/compte/connexion?expire=1`);
  await setSession(s.id);
  return NextResponse.redirect(`${SITE_URL}/compte?active=1`);
}
