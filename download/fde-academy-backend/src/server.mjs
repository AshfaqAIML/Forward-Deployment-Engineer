import { buildApp } from "./server.js";

let serverPromise = null;

export default async (req, res) => {
  if (!serverPromise) {
    serverPromise = buildApp().then(({ server }) => server);
  }
  try {
    const server = await serverPromise;
    server.emit("request", req, res);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Server initialization failed", message: String(err.message) }));
  }
};
