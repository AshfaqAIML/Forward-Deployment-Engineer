import { buildApp } from "./server.js";

let server = null;
let initPromise = null;

export default async function handler(req, res) {
  if (!initPromise) {
    initPromise = (async () => {
      const { server: s } = await buildApp();
      server = s;
    })();
  }

  try {
    await initPromise;
    server.emit("request", req, res);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server init failed", message: String(err.message) }));
  }
}
