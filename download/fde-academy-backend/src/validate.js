// src/validate.js — schema-based input validation for every endpoint. Unknown
// fields are stripped (clients can never smuggle extra columns like "role" or
// "score" into a query), known fields are type-checked with clear 422 details.
import { unprocessable, badRequest } from "./errors.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function check(rule, value, path, problems) {
  const [type, ...args] = rule.split(":");
  const push = (msg) => problems.push({ field: path, message: msg });
  switch (type) {
    case "string": {
      const [min = 1, max = 1000] = args.map(Number);
      if (typeof value !== "string") return push("must be a string");
      if (value.length < min) return push(`must be at least ${min} characters`);
      if (value.length > max) return push(`must be at most ${max} characters`);
      return;
    }
    case "email":
      if (typeof value !== "string" || !EMAIL_RE.test(value) || value !== value.toLowerCase())
        push("must be a valid lowercase email address");
      return;
    case "password":
      if (typeof value !== "string" || value.length < 10) push("must be at least 10 characters");
      if (typeof value === "string" && !/[a-zA-Z]/.test(value)) push("must contain a letter");
      if (typeof value === "string" && !/[0-9]/.test(value)) push("must contain a digit");
      return;
    case "uuid":
      if (typeof value !== "string" || !UUID_RE.test(value)) push("must be a UUID");
      return;
    case "int": {
      const [min = -Infinity, max = Infinity] = args.map(Number);
      if (!Number.isInteger(value) || value < min || value > max) push(`must be an integer between ${min} and ${max}`);
      return;
    }
    case "boolean":
      if (typeof value !== "boolean") push("must be true or false");
      return;
    case "enum": {
      const allowed = rule.slice("enum:".length).split(",").map(s => s.trim()).filter(Boolean);
      if (!allowed.includes(value)) push(`must be one of: ${allowed.join(", ")}`);
      return;
    }
    case "array": {
      const [max = 50] = args.map(Number);
      if (!Array.isArray(value)) return push("must be an array");
      if (value.length > max) return push(`must have at most ${max} items`);
      return;
    }
    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) push("must be an object");
      return;
    case "any":
      return;
    default:
      push(`unknown rule ${type}`);
  }
}

// validate({field: rule, ...}, body) -> {clean, problems}
// Required fields are rule names WITHOUT "?" suffix; optional ones use "?".
export function validate(schema, body) {
  const problems = [];
  const clean = {};
  const source = (typeof body === "object" && body !== null && !Array.isArray(body)) ? body : {};
  for (const [rawKey, rule] of Object.entries(schema)) {
    const optional = rawKey.endsWith("?");
    const key = optional ? rawKey.slice(0, -1) : rawKey;
    const present = Object.prototype.hasOwnProperty.call(source, key);
    if (!present || source[key] === undefined || source[key] === null) {
      if (!optional) problems.push({ field: key, message: "is required" });
      continue;
    }
    const value = source[key];
    if (rule === "skip" || rule?.startsWith("any")) { clean[key] = value; continue; }
    check(rule, value, key, problems);
    if (!problems.some(p => p.field === key)) clean[key] = value;
  }
  if (problems.length) throw unprocessable("Validation failed — check the fields and retry", problems);
  return clean;
}

// Query-string coercion: uuids and ints arrive as text.
export function queryUuid(value, name) {
  if (value === undefined || value === null || value === "") return null;
  if (!UUID_RE.test(String(value))) throw badRequest(`${name} must be a UUID`);
  return String(value);
}
export function queryInt(value, name, { min = 0, max = 100000, dflt = null } = {}) {
  if (value === undefined || value === null || value === "") return dflt;
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < min || n > max) throw badRequest(`${name} must be an integer between ${min} and ${max}`);
  return n;
}
