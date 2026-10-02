import { NextResponse } from "next/server";
import { setAdmin } from "@/lib/session";
import { SITE_URL } from "@/lib/config";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "x";
  if ((await db.incr(`admin-rl:${ip}`, 3600)) > 10) return NextResponse.redirect(`${SITE_URL}/admin?e=1`, 303);
  const pw = String((await req.formData()).get("password") || "");
  if (process.env.ADMIN_PASSWORD && pw === process.env.ADMIN_PASSWORD) await setAdmin();
  return NextResponse.redirect(`${SITE_URL}/admin`, 303);
}
