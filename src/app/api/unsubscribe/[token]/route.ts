import { NextResponse } from "next/server";
import { doUnsub } from "@/lib/unsub";
import { SITE_URL } from "@/lib/config";
// RFC 8058 one-click (POST) + browser GET
export async function POST(_: Request, { params }: { params: Promise<{ token: string }> }) { await doUnsub((await params).token); return new NextResponse("ok"); }
export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) { return NextResponse.redirect(`${SITE_URL}/desinscription/${(await params).token}`); }
