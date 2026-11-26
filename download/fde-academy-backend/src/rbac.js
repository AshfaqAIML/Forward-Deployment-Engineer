// src/rbac.js — role-based permissions. Roles live in the database (users.role);
// this matrix is the single place the API checks capability names against.
// Admins hold a wildcard; authors get content-authoring capabilities; students
// get read/learn capabilities. Every mutating route states its permission.
import { unauthorized, forbidden } from "./errors.js";

export const PERMISSIONS = {
  admin: ["*"],
  author: [
    "content:read", "draft:write", "draft:submit", "draft:read",
    "exercise:read", "analytics:own",
  ],
  student: [
    "content:read", "learn:track", "attempt:quiz", "submit:lab", "submit:project",
    "download:book", "search:use",
  ],
};

export function can(role, permission) {
  const perms = PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}

export function requirePermission(ctx, permission) {
  if (!ctx.user) throw unauthorized();
  if (!can(ctx.user.role, permission)) {
    throw forbidden(`Missing permission: ${permission}`);
  }
  return ctx.user;
}
