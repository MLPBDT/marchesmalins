import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { SITE_URL } from "@/lib/config";
export async function POST() { await clearSession(); return NextResponse.redirect(`${SITE_URL}/`, 303); }
