import { buildApp } from "./server.js";

let app = null;

export default async (req, res) => {
  if (!app) {
    try {
      const { server } = await buildApp();
      app = server;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to initialize server", message: String(err.message) }));
      return;
    }
  }
  app.emit("request", req, res);
};
