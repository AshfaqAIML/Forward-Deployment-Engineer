// src/routes/auth.js — registration, login, token refresh (rotation), logout,
// password recovery. Security posture: user enumeration resistance, generic
// reset responses, hashed tokens at rest, all input validated.
import { Router } from "../http/router.js";
import { validate } from "../validate.js";
import { hashPassword, verifyPassword, passwordPolicyProblems } from "../auth/passwords.js";
import { signAccessToken, issueRefreshToken, rotateRefreshToken, revokeRefreshToken,
         revokeAllRefreshTokens, issuePasswordResetToken, consumePasswordResetToken } from "../auth/tokens.js";
import { unauthorized, conflict, badRequest } from "../errors.js";
import { logEvent } from "../activity.js";
import { config } from "../config.js";
import crypto from "node:crypto";

function sessionPayload(user, refreshToken) {
  return {
    user: { id: user.id, email: user.email, displayName: user.display_name, role: user.role },
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    refreshToken,
    tokenType: "Bearer",
    expiresInMinutes: config.accessTokenTtlMinutes,
  };
}

export function registerAuthRoutes(router) {

  // POST /api/v1/auth/register — open registration as a student.
  router.post("/api/v1/auth/register", async (ctx) => {
    const body = validate({
      email: "email", password: "password", displayName: "string:2:60",
    }, ctx.body);
    const existing = await ctx.db.query(`SELECT 1 FROM users WHERE email = $1`, [body.email]);
    if (existing.rows.length) throw conflict("An account with that email already exists");
    const passwordHash = hashPassword(body.password);
    const user = await ctx.db.transaction(async tx => {
      const r = await tx.query(
        `INSERT INTO users (email, password_hash, display_name, role) VALUES ($1, $2, $3, 'student') RETURNING *`,
        [body.email, passwordHash, body.displayName]);
      const u = r.rows[0];
      await tx.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [u.id]);
      await tx.query(`INSERT INTO learning_preferences (user_id) VALUES ($1)`, [u.id]);
      await tx.query(`INSERT INTO activity_events (user_id, kind) VALUES ($1, 'account_created')`, [u.id]);
      return u;
    });
    const refreshToken = await issueRefreshToken(ctx.db, user.id, { userAgent: ctx.req.headers["user-agent"] });
    return { status: 201, body: sessionPayload(user, refreshToken) };
  }, { public: true });

  // POST /api/v1/auth/login — verifies the scrypt hash; never reveals which
  // part failed (enumeration resistance).
  router.post("/api/v1/auth/login", async (ctx) => {
    const body = validate({ email: "email", password: "string:1:200" }, ctx.body);
    const r = await ctx.db.query(`SELECT * FROM users WHERE email = $1`, [body.email]);
    const user = r.rows[0];
    if (!user || !verifyPassword(body.password, user.password_hash)) {
      throw unauthorized("Email or password is incorrect");
    }
    if (user.status !== "active") throw unauthorized("This account is suspended");
    await ctx.db.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
    await logEvent(ctx.db, user.id, "login");
    const refreshToken = await issueRefreshToken(ctx.db, user.id, { userAgent: ctx.req.headers["user-agent"] });
    return sessionPayload(user, refreshToken);
  }, { public: true });

  // POST /api/v1/auth/refresh — rotates the refresh token; replay detection.
  router.post("/api/v1/auth/refresh", async (ctx) => {
    const body = validate({ refreshToken: "string:20:200" }, ctx.body);
    const { user, refreshToken } = await rotateRefreshToken(ctx.db, body.refreshToken);
    return sessionPayload(user, refreshToken);
  }, { public: true });

  // POST /api/v1/auth/logout — revokes the presented refresh token.
  router.post("/api/v1/auth/logout", async (ctx) => {
    const body = validate({ refreshToken: "string:20:200" }, ctx.body);
    await revokeRefreshToken(ctx.db, body.refreshToken);
    if (ctx.user) await logEvent(ctx.db, ctx.user.id, "logout");
    return { body: { ok: true } };
  }, { public: true, auth: true });

  // GET /api/v1/auth/me — the caller's own account (email included: it is
  // the caller's own data).
  router.get("/api/v1/auth/me", async (ctx) => {
    if (!ctx.user) throw unauthorized();
    return { body: { id: ctx.user.id, email: ctx.user.email, displayName: ctx.user.displayName, role: ctx.user.role } };
  });

  // POST /api/v1/auth/password-reset/request — always 200 with the same body,
  // whether or not the email exists. Delivery in production goes through the
  // configured mail provider; dev/test may expose the token (config-gated).
  router.post("/api/v1/auth/password-reset/request", async (ctx) => {
    const body = validate({ email: "email" }, ctx.body);
    const r = await ctx.db.query(`SELECT id FROM users WHERE email = $1 AND status = 'active'`, [body.email]);
    let devToken = undefined;
    if (r.rows[0]) {
      const token = await issuePasswordResetToken(ctx.db, r.rows[0].id);
      await logEvent(ctx.db, r.rows[0].id, "password_reset_requested");
      if (config.exposeResetTokens) devToken = token;
    }
    return { body: { ok: true, message: "If an account exists for that email, a reset link has been sent.",
      ...(devToken ? { devResetToken: devToken } : {}) } };
  }, { public: true });

  // POST /api/v1/auth/password-reset/confirm — consumes the single-use token,
  // re-hashes the new password, revokes every refresh token for the account.
  router.post("/api/v1/auth/password-reset/confirm", async (ctx) => {
    const body = validate({ token: "string:20:200", newPassword: "password" }, ctx.body);
    const problems = passwordPolicyProblems(body.newPassword);
    if (problems.length) throw badRequest(problems.join("; "));
    const userId = await consumePasswordResetToken(ctx.db, body.token);
    if (!userId) throw badRequest("This reset link is invalid, expired or already used");
    await ctx.db.transaction(async tx => {
      await tx.query(`UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2`,
        [hashPassword(body.newPassword), userId]);
      await tx.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [userId]);
      await tx.query(`INSERT INTO activity_events (user_id, kind) VALUES ($1, 'password_reset_completed')`, [userId]);
    });
    return { body: { ok: true, message: "Password updated. Sign in with your new password." } };
  }, { public: true });
}
