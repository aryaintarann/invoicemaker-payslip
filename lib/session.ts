import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(payload: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Builds a signed "<expiry>.<signature>" session token.
 * `remember` controls the cookie's maxAge: omitted, the browser treats it as
 * a session cookie and drops it on close; set, it persists for 30 days.
 */
export function createSessionToken(remember: boolean): { value: string; maxAge: number | undefined } {
  const expiry = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiry);
  return { value: `${payload}.${sign(payload)}`, maxAge: remember ? SESSION_MAX_AGE_SECONDS : undefined };
}

/** Verifies a session token's signature and expiry. */
export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const expiry = Number(payload);
  return Number.isFinite(expiry) && Date.now() < expiry;
}

/** Constant-time credential check against AUTH_USERNAME / AUTH_PASSWORD. */
export function verifyCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.AUTH_USERNAME ?? "";
  const expectedPassword = process.env.AUTH_PASSWORD ?? "";
  if (!expectedUsername || !expectedPassword) return false;

  const userBuf = Buffer.from(username);
  const expectedUserBuf = Buffer.from(expectedUsername);
  const passBuf = Buffer.from(password);
  const expectedPassBuf = Buffer.from(expectedPassword);

  const userMatch =
    userBuf.length === expectedUserBuf.length && timingSafeEqual(userBuf, expectedUserBuf);
  const passMatch =
    passBuf.length === expectedPassBuf.length && timingSafeEqual(passBuf, expectedPassBuf);

  return userMatch && passMatch;
}
