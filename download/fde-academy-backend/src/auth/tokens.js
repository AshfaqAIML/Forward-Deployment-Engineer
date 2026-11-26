// src/auth/tokens.js — access tokens (stateless HS256 JWTs, short-lived) and
// refresh tokens (opaque random values, stored hashed, rotated on every use,
// revocable). JWTs are implemented with node:crypto only.
import crypto from "node:crypto";
import { config } from "../config.js";
import { unauthorized } from "../errors.js";

const b64url = buf => Buffer.from(buf).toString("base64url");

/* ---------------- access tokens (JWT, HS256) ---------------- */
function sign(data) {
  return crypto.createHmac("sha256", config.jwtSecret).update(data).digest();
}

export function signAccessToken(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const body = b64url(JSON.stringify({ ...payload, iat: now, exp: now + config.accessTokenTtlMinutes * 60 }));
  const data = `${header}.${body}`;
  return `${data}.${b64url(sign(data))}`;
}

export function verifyAccessToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw unauthorized("malformed token");
  const data = `${parts[0]}.${parts[1]}`;
  const expected = sign(data);
  const given = Buffer.from(parts[2], "base64url");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    throw unauthorized("invalid token signature");
  }
  let payload;
  try { payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); }
  catch { throw unauthorized("malformed token payload"); }
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw unauthorized("token expired");
  }
  return payload;
}

/* ---------------- refresh tokens (opaque, hashed at rest, rotated) ---------------- */
export function generateOpaqueToken() {
  return crypto.randomBytes(32).toString("base64url");
}
export const hashOpaqueToken = token => crypto.createHash("sha256").update(token).digest("hex");

export async function issueRefreshToken(db, userId, { userAgent, ipHash } = {}) {
  const token = generateOpaqueToken();
  await db.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, user_agent, ip_hash)
     VALUES ($1, $2, now() + ($3 || ' days')::interval, $4, $5)`,
    [userId, hashOpaqueToken(token), config.refreshTokenTtlDays, userAgent || null, ipHash || null]);
  return token;
}

// Rotation: the presented token is revoked and a fresh one issued in the same
// transaction. A replayed (already-rotated) token is rejected — theft of an old
// refresh token is useless.
export async function rotateRefreshToken(db, presentedToken) {
  const tokenHash = hashOpaqueToken(presentedToken);
  const r = await db.query(
    `SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = $1`, [tokenHash]);
  const row = r.rows[0];
  if (!row) throw unauthorized("invalid refresh token");
  if (row.revoked_at) throw unauthorized("refresh token has been revoked");
  if (new Date(row.expires_at) < new Date()) throw unauthorized("refresh token expired");
  return await db.transaction(async tx => {
    await tx.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1`, [row.id]);
    const fresh = generateOpaqueToken();
    await tx.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, now() + ($3 || ' days')::interval)`,
      [row.user_id, hashOpaqueToken(fresh), config.refreshTokenTtlDays]);
    const u = await tx.query(`SELECT id, role, status, display_name FROM users WHERE id = $1`, [row.user_id]);
    return { user: u.rows[0], refreshToken: fresh };
  });
}

export async function revokeRefreshToken(db, presentedToken) {
  await db.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`,
    [hashOpaqueToken(presentedToken)]);
}

export async function revokeAllRefreshTokens(db, userId) {
  await db.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
}

/* ---------------- password reset tokens (single use, 1h, hashed) ---------------- */
export async function issuePasswordResetToken(db, userId) {
  const token = generateOpaqueToken();
  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 || ' minutes')::interval)`,
    [userId, hashOpaqueToken(token), config.passwordResetTtlMinutes]);
  return token;
}

// Returns the user id on success (single use enforced); null when the token is
// unknown, expired or already used — the caller responds generically either way.
export async function consumePasswordResetToken(db, presentedToken) {
  const tokenHash = hashOpaqueToken(presentedToken);
  return await db.transaction(async tx => {
    const r = await tx.query(
      `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1 FOR UPDATE`, [tokenHash]);
    const row = r.rows[0];
    if (!row || row.used_at || new Date(row.expires_at) < new Date()) return null;
    await tx.query(`UPDATE password_reset_tokens SET used_at = now() WHERE id = $1`, [row.id]);
    return row.user_id;
  });
}
