import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { db } from "./db";

export const ADMIN_COOKIE = "auction_admin_session";
export const USER_COOKIE = "auction_user_session";
const SESSION_DAYS = 7;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export async function setSessionCookie(name: string, token: string, maxAge = SESSION_DAYS * 86400) {
  const jar = await cookies();
  jar.set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge
  });
}

export async function clearSessionCookie(name: string) {
  const jar = await cookies();
  jar.set(name, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
}

export async function createAdminSession(adminId: string) {
  const token = newToken();
  await db.adminSession.create({
    data: { tokenHash: hashToken(token), adminId, expiresAt: new Date(Date.now() + SESSION_DAYS * 86400000) }
  });
  await setSessionCookie(ADMIN_COOKIE, token);
}

export async function createUserSession(userId: string) {
  const token = newToken();
  await db.userSession.create({
    data: { tokenHash: hashToken(token), userId, expiresAt: new Date(Date.now() + 30 * 86400000) }
  });
  await setSessionCookie(USER_COOKIE, token, 30 * 86400);
}

export async function getAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true }
  });
  if (!session || session.expiresAt <= new Date() || !session.admin.active) return null;
  return session.admin;
}

export async function getAuctionUser() {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  const session = await db.userSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}

// SameSite cookies + strict Origin verification for state-changing requests.
// This is the CSRF boundary for JSON API routes.
export async function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const configured = process.env.APP_ORIGIN;
  if (!origin || !configured) throw new Error("CSRF_ORIGIN");
  const a = new URL(origin).origin;
  const b = new URL(configured).origin;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length || !timingSafeEqual(aa, bb)) throw new Error("CSRF_ORIGIN");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) throw new Error("CSRF_FETCH_SITE");
}

export async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
