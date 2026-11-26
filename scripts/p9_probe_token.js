// scripts/p9_probe_token.js — debug single-use download token consumption.
process.env.FDE_JWT_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.FDE_LOG_LEVEL = "error";
process.env.FDE_SEED_DEMO_USERS = "1";
process.env.FDE_DEMO_PASSWORD = "DemoPass-2026";

const { buildApp } = await import("../download/fde-academy-backend/src/server.js");
const { seed } = await import("../download/fde-academy-backend/src/db/seed.js");
const app = await buildApp();
await seed();
await new Promise(r => app.server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${app.server.address().port}`;
const H = { "content-type": "application/json" };
const login = await (await fetch(base + "/api/v1/auth/login", {
  method: "POST", headers: H, body: JSON.stringify({ email: "student@fde.local", password: "DemoPass-2026" }) })).json();
H.authorization = "Bearer " + login.accessToken;

const issue = await (await fetch(base + "/api/v1/books/fm/downloads", { method: "POST", headers: H, body: "{}" })).json();
console.log("issue ok:", !!issue.token);
const f1 = await fetch(base + issue.downloadUrl, { headers: H });
console.log("first:", f1.status);
const dbState1 = await app.db.query(`SELECT used_at IS NOT NULL AS used FROM download_tokens WHERE token_hash IS NOT NULL`);
console.log("used after 1st:", dbState1.rows);
const f2 = await fetch(base + issue.downloadUrl, { headers: H });
console.log("second:", f2.status, (await f2.text()).slice(0, 80));
app.server.close(); await app.db.close();
