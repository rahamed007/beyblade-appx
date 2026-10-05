import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users, type User } from "@/db/schema";

const COOKIE_NAME = "bx_session";
const SESSION_DAYS = 30;

export type SafeUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
};

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

/**
 * The preview is often embedded in an iframe on a different origin. In that
 * third-party context browsers drop `SameSite=Lax` cookies, so when we're
 * served over HTTPS we emit `SameSite=None; Secure` instead.
 */
async function isSecureRequest(): Promise<boolean> {
  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "";
    if (proto.split(",")[0]?.trim() === "https") return true;
    const origin = h.get("origin") ?? h.get("referer") ?? "";
    return origin.startsWith("https://");
  } catch {
    return false;
  }
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values({ token, userId, expiresAt });
  const secure = await isSecureRequest();
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }
  const secure = await isSecureRequest();
  store.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: secure ? "none" : "lax",
    secure,
    path: "/",
    expires: new Date(0),
  });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const rows = await db
      .select({ user: users })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);
    const row = rows[0];
    return row ? toSafeUser(row.user) : null;
  } catch {
    return null;
  }
}
