import { createInternalApp, createPublicApp } from "./apps.js";
import { loadConfig } from "./config.js";

const config = loadConfig();
const servers = [
  createPublicApp(config).listen(config.publicPort, "0.0.0.0"),
  createInternalApp().listen(config.internalPort, "0.0.0.0"),
];

function shutdown(): void {
  for (const server of servers) {
    server.close();
  }
}

process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
