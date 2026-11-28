import { buildApp } from "./server.js";

let app = null;

export default async (req, res) => {
  if (!app) {
    const { server } = await buildApp();
    app = server;
  }
  app.emit("request", req, res);
};
