import { exec } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";

import express, { type Express } from "express";

import type { ApplicationConfig } from "./config.js";
import { getQueryString } from "./query.js";

export const createPublicApp = (config: ApplicationConfig): Express => {
  const app = express();
  app.disable("x-powered-by");

  app.get("/healthz", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/catalog", (request, response) => {
    const category = getQueryString(request, "category") ?? "all";
    response
      .type("html")
      .send(`<h1>Catalog</h1><p>Category: ${category}</p>`);
  });

  if (config.enableExport) {
    app.get("/api/export", async (request, response) => {
      const file = getQueryString(request, "file") ?? "status.json";
      const contents = await readFile(
        path.join(config.exportRoot, file),
        "utf8",
      );
      response.type(path.extname(file)).send(contents);
    });
  }

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
      const notFound =
        error instanceof Error && "code" in error && error.code === "ENOENT";
      response
        .status(notFound ? 404 : 500)
        .json({ error: notFound ? "File not found" : "Request failed" });
    },
  );

  return app;
};

export const createInternalApp = (): Express => {
  const app = express();
  app.disable("x-powered-by");

  app.get("/api/status", (_request, response) => {
    response.json({ status: "ready" });
  });

  app.get("/metrics", (_request, response) => {
    response
      .type("text/plain; version=0.0.4")
      .send(
        `# HELP process_uptime_seconds Process uptime in seconds\n# TYPE process_uptime_seconds gauge\nprocess_uptime_seconds ${process.uptime()}\n`,
      );
  });

  app.get("/api/diagnostics", (request, response) => {
    const check = getQueryString(request, "check");
    if (check === undefined || check.length === 0) {
      response.status(400).json({ error: "check is required" });
      return;
    }

    exec(
      check,
      { maxBuffer: 64 * 1024, timeout: 3_000 },
      (error, stdout) => {
        if (error !== null) {
          response.status(502).json({ error: "Check failed" });
          return;
        }
        response.type("text/plain").send(stdout);
      },
    );
  });

  return app;
};
