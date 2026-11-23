import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createInternalApp, createPublicApp } from "../dist/apps.js";

const makeConfig = (overrides = {}) => ({
  enableExport: false,
  exportRoot: "/tmp/exports",
  internalPort: 8081,
  publicPort: 8080,
  ...overrides,
});

const withServer = async (app, run) => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  assert.notEqual(address, null);
  assert.equal(typeof address, "object");

  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error === undefined ? resolve() : reject(error)));
    });
  }
};

test("public health endpoint reports success", async () => {
  await withServer(createPublicApp(makeConfig()), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });
});

test("catalog renders the requested category", async () => {
  await withServer(createPublicApp(makeConfig()), async (baseUrl) => {
    const category = "<strong>featured</strong>";
    const response = await fetch(
      `${baseUrl}/api/catalog?category=${encodeURIComponent(category)}`,
    );
    assert.equal(response.status, 200);
    assert.match(await response.text(), /<strong>featured<\/strong>/);
  });
});

test("export route is absent by default", async () => {
  await withServer(createPublicApp(makeConfig()), async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/export`);
    assert.equal(response.status, 404);
  });
});

test("enabled export reads the requested file", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "reachability-export-"));
  const exportRoot = path.join(root, "exports");
  await mkdir(exportRoot);
  await writeFile(path.join(root, "result.txt"), "benchmark-ready\n");

  try {
    await withServer(
      createPublicApp(makeConfig({ enableExport: true, exportRoot })),
      async (baseUrl) => {
        const file = encodeURIComponent("../result.txt");
        const response = await fetch(`${baseUrl}/api/export?file=${file}`);
        assert.equal(response.status, 200);
        assert.equal(await response.text(), "benchmark-ready\n");
      },
    );
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("internal diagnostics runs the requested check", async () => {
  await withServer(createInternalApp(), async (baseUrl) => {
    const check = encodeURIComponent("printf benchmark-marker");
    const response = await fetch(
      `${baseUrl}/api/diagnostics?check=${check}`,
    );
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "benchmark-marker");
  });
});
