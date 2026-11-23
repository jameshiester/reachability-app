import express from "express";

const publicApp = express();
const internalApp = express();

publicApp.get("/healthz", (_request, response) => {
  response.json({ status: "ok" });
});

publicApp.get("/api/catalog", (_request, response) => {
  response.json({ items: [] });
});

if (process.env.ENABLE_EXPORT === "true") {
  publicApp.get("/api/export", (_request, response) => {
    response.json({ exports: [] });
  });
}

internalApp.get("/api/status", (_request, response) => {
  response.json({ status: "ready" });
});

const servers = [
  publicApp.listen(8080, "0.0.0.0"),
  internalApp.listen(8081, "0.0.0.0"),
];

function shutdown(): void {
  for (const server of servers) {
    server.close();
  }
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
