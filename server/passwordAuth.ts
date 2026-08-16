import { createHash, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const PORTAL_SESSION_COOKIE = "rukai_portal_access";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

function signingKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("缺少網站 session 簽章設定。");
  return encoder.encode(secret);
}

export function verifyPortalPassword(candidate: string) {
  const expected = process.env.PORTAL_ACCESS_PASSWORD;
  if (!expected || !candidate) return false;
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function createPortalSession() {
  return new SignJWT({ scope: "rukai-portal" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(signingKey());
}

export async function hasValidPortalSession(token?: string) {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, signingKey());
    return payload.scope === "rukai-portal";
  } catch {
    return false;
  }
}

export function readCookie(cookieHeader: string | undefined, cookieName: string) {
  if (!cookieHeader) return undefined;
  const value = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`))
    ?.slice(cookieName.length + 1);
  return value ? decodeURIComponent(value) : undefined;
}

export const PORTAL_SESSION_MAX_AGE_MS = SESSION_DURATION_SECONDS * 1000;
