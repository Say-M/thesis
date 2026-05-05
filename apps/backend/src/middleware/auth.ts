import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

export type AuthContext = {
  userId: string;
};

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

function pickFirstNonEmpty(...vals: Array<string | undefined | null>) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * Minimal, pluggable auth shim.
 *
 * Today: extracts `userId` from a cookie (default name `userId`).
 * Later: replace `getUserIdFromRequest` implementation to validate a session id.
 */
export async function getUserIdFromRequest(
  c: Context,
): Promise<string | undefined> {
  const cookieName = process.env.AUTH_USER_ID_COOKIE_NAME?.trim() || "user_id";
  const userIdFromCookie = getCookie(c, cookieName);
  const userIdFromHeader = c.req.header("x-user-id");
  return pickFirstNonEmpty(userIdFromCookie, userIdFromHeader);
}

export function requireAuth() {
  return async (c: Context, next: Next) => {
    const userId = await getUserIdFromRequest(c);
    if (!userId) return c.json({ error: "unauthorized" }, 401);
    c.set("auth", { userId });
    await next();
  };
}
