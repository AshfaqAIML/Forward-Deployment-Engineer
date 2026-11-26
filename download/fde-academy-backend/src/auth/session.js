// src/auth/session.js — request authentication. Bearer access tokens only.
import { verifyAccessToken } from "./tokens.js";
import { unauthorized, forbidden } from "../errors.js";

export function extractBearer(req) {
  const h = req.headers.authorization || "";
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function authenticate(db) {
  return async (req) => {
    const token = extractBearer(req);
    if (!token) return null;
    const payload = verifyAccessToken(token);       // throws 401 on bad/expired
    const r = await db.query(
      `SELECT id, email, display_name, role, status FROM users WHERE id = $1`, [payload.sub]);
    const user = r.rows[0];
    if (!user) throw unauthorized("account no longer exists");
    if (user.status !== "active") throw forbidden("account is suspended");
    return { id: user.id, email: user.email, displayName: user.display_name, role: user.role };
  };
}

// Route guards. requireAuth: any signed-in active user. requireRole: specific role.
export const requireAuth = (ctx) => {
  if (!ctx.user) throw unauthorized();
  return ctx.user;
};
export const requireRole = (ctx, ...roles) => {
  const user = requireAuth(ctx);
  if (!roles.includes(user.role)) throw forbidden(`requires role: ${roles.join(" or ")}`);
  return user;
};
