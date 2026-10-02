import { NextResponse } from "next/server";
import { subByEmail, sign } from "@/lib/models";
import { sendEmail, layout, button } from "@/lib/email";
import { SITE_URL, BRAND } from "@/lib/config";
import { db } from "@/lib/db";
export async function POST(req: Request) {
  const email = String((await req.formData()).get("email") || "").trim().toLowerCase();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "x";
  if ((await db.incr(`login-rl:${ip}`, 3600)) <= 10) {
    const s = email ? await subByEmail(email) : null;
    if (s) await sendEmail(s.email, `Votre lien de connexion ${BRAND}`, layout("Connexion à votre compte", `<p>${button(`${SITE_URL}/auth/${sign({ s: s.id }, 60 * 60 * 24)}?next=/compte`, "Ouvrir mon compte")}</p><p style="font-size:13px;color:#6b7280">Lien valable 24 h. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`));
  }
  return NextResponse.redirect(`${SITE_URL}/compte/connexion?envoye=1`, 303);
}
