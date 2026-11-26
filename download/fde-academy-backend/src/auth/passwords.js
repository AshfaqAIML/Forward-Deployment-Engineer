// src/auth/passwords.js — scrypt password hashing (Node crypto, no dependencies).
// Stored format: scrypt$N$r$p$saltB64$hashB64 — per-user random salt, memory-hard
// KDF. Verification is constant-time. Plain-text passwords never touch storage.
import crypto from "node:crypto";

const N = 16384, R = 8, P = 1, KEYLEN = 64;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password, stored) {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = stored.split("$");
    if (scheme !== "scrypt") return false;
    const salt = Buffer.from(saltB64, "base64");
    const expected = Buffer.from(hashB64, "base64");
    const actual = crypto.scryptSync(password, salt, expected.length,
      { N: +n, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

// Password policy: 10+ characters with at least one letter and one digit.
export function passwordPolicyProblems(password) {
  const problems = [];
  if (typeof password !== "string" || password.length < 10) problems.push("password must be at least 10 characters");
  if (!/[a-zA-Z]/.test(password || "")) problems.push("password must contain a letter");
  if (!/[0-9]/.test(password || "")) problems.push("password must contain a digit");
  return problems;
}
