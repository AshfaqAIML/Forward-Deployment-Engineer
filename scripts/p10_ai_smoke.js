// scripts/p10_ai_smoke.js — live smoke of the AI tutor: real server, real
// PGlite database, real z-ai provider. Verifies grounding, citations and the
// refusal path.
process.env.FDE_JWT_SECRET = "test-secret-0123456789abcdef0123456789abcdef";
process.env.FDE_LOG_LEVEL = "error";
process.env.FDE_SEED_DEMO_USERS = "1";
process.env.FDE_DEMO_PASSWORD = "DemoPass-2026";
process.env.FDE_PGLITE_DIR = "/tmp/fde-ai-smoke";
process.env.FDE_DB = "pglite";
process.env.FDE_AI_PROVIDER = "cli";

import { rmSync } from "node:fs";
try { rmSync("/tmp/fde-ai-smoke", { recursive: true, force: true }); } catch {}

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

async function post(path, body) {
  const t0 = Date.now();
  const r = await fetch(base + path, { method: "POST", headers: H, body: JSON.stringify(body) });
  const j = await r.json();
  return { status: r.status, json: j, ms: Date.now() - t0 };
}
function show(label, r) {
  console.log(`\n=== ${label} (${r.status}, ${r.ms}ms, provider=${r.json?.provider}) ===`);
  console.log("grounded:", r.json?.grounded, "| sources:", r.json?.sources?.map(s => `${s.kind}:${s.code}`).join(", "));
  console.log(String(r.json?.answer || r.json?.hint || JSON.stringify(r.json)).slice(0, 600));
}

const status = await (await fetch(base + "/api/v1/ai/tutor/status")).json();
console.log("tutor status:", status.enabled, status.provider);
show("SIMPLER WORDS (pinned lesson fm-4)", await post("/api/v1/ai/tutor", {
  message: "I don't understand how the rule for subtracting negatives works. Can you explain it in simpler words?",
  lessonCode: "fm-4", mode: "explain" }));
show("VOCABULARY", await post("/api/v1/ai/tutor", {
  message: "What does 'contribution margin' mean in this course?", mode: "vocabulary" }));
show("MATH STEPS", await post("/api/v1/ai/tutor/math-steps", {
  problem: "Amara sells 6 rolls at £0.80 and buys 8 at £1.50 — what is her position? Show each step.", lessonCode: "fm-1" }));
show("OUT-OF-MATERIAL (refusal path)", await post("/api/v1/ai/tutor", {
  message: "What is the capital of France and who won the 1998 World Cup?", mode: "explain" }));
show("PROGRESSIVE HINT #2 (authored)", await post("/api/v1/ai/tutor/hints", {
  exerciseCode: "code-c1", hintIndex: 1 }));
show("PRACTICE GENERATION", await post("/api/v1/ai/tutor/practice", {
  lessonCode: "fm-1", count: 2 }));
show("PROGRAMMING ERROR", await post("/api/v1/ai/tutor/explain-error", {
  error: "TypeError: Cannot read properties of undefined (reading 'price')",
  code: "const total = items.reduce((s, it) => s + it.price, 0);", exerciseCode: "code-c1" }));

app.server.close(); await app.db.close();
console.log("\nAI TUTOR SMOKE DONE");
