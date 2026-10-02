import { cookies } from "next/headers";
import { sign, verify, getSub } from "./models";

const NAME = "ap_session";
export async function setSession(id: string) {
  (await cookies()).set(NAME, sign({ s: id }, 60 * 60 * 24 * 60), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 60 });
}
export async function clearSession() { (await cookies()).delete(NAME); }
export async function currentSub() {
  const t = (await cookies()).get(NAME)?.value;
  const p = t ? verify<{ s: string }>(t) : null;
  return p ? getSub(p.s) : null;
}
export async function isAdmin() {
  const t = (await cookies()).get("ap_admin")?.value;
  return !!(t && verify<{ admin: boolean }>(t)?.admin);
}
export async function setAdmin() {
  (await cookies()).set("ap_admin", sign({ admin: true }, 60 * 60 * 24 * 30), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
}
