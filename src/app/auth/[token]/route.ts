import { NextResponse } from "next/server";
import { verify } from "@/lib/models";
import { setSession } from "@/lib/session";
import { SITE_URL } from "@/lib/config";
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const p = verify<{ s: string }>((await params).token);
  const next = new URL(req.url).searchParams.get("next") || "/compte";
  if (!p) return NextResponse.redirect(`${SITE_URL}/compte/connexion?expire=1`);
  await setSession(p.s);
  return NextResponse.redirect(`${SITE_URL}${next.startsWith("/") ? next : "/compte"}`);
}
