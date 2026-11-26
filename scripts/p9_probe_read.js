// scripts/p9_probe_read.js — debug the book read flow end to end.
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

const mk = await fetch(base + "/api/v1/books/fm/chapters/2/read", { method: "POST", headers: H, body: "{}" });
console.log("READ status:", mk.status, (await mk.text()).slice(0, 120));

const rows = await app.db.query(`SELECT user_id, chapter_id, read FROM book_reading_progress`);
console.log("ROWS:", rows.rows.length, rows.rows.slice(0, 3));
const view = await app.db.query(`SELECT * FROM v_book_progress`);
console.log("VIEW:", view.rows);
const list = await (await fetch(base + "/api/v1/books", { headers: H })).json();
console.log("API PROGRESS:", list.books.find(b => b.slug === "fm").progress);
app.server.close(); await app.db.close();
