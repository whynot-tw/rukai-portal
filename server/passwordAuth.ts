import { createHash, timingSafeEqual } from "node:crypto";
import { jwtVerify, SignJWT } from "jose";

export const PORTAL_SESSION_COOKIE = "rukai_portal_access";
export const ADMIN_SESSION_COOKIE = "rukai_portal_admin";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const encoder = new TextEncoder();

function signingKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("缺少網站 session 簽章設定。");
  return encoder.encode(secret);
}

function verifySecret(candidate: string, expected?: string) {
  if (!expected || !candidate) return false;
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export function verifyPortalPassword(candidate: string) {
  return verifySecret(candidate, process.env.PORTAL_ACCESS_PASSWORD);
}

export function verifyAdminPassword(candidate: string) {
  return verifySecret(candidate, process.env.PORTAL_ADMIN_PASSWORD);
}

async function createSession(scope: "rukai-portal" | "rukai-portal-admin") {
  return new SignJWT({ scope })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(signingKey());
}

export function createPortalSession() {
  return createSession("rukai-portal");
}

export function createAdminSession() {
  return createSession("rukai-portal-admin");
}

async function hasValidSession(token: string | undefined, scope: "rukai-portal" | "rukai-portal-admin") {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, signingKey());
    return payload.scope === scope;
  } catch {
    return false;
  }
}

export function hasValidPortalSession(token?: string) {
  return hasValidSession(token, "rukai-portal");
}

export function hasValidAdminSession(token?: string) {
  return hasValidSession(token, "rukai-portal-admin");
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
export const ADMIN_SESSION_MAX_AGE_MS = SESSION_DURATION_SECONDS * 1000;
