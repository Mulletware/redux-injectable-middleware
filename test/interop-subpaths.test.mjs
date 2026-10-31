// Explicit subpath exports keep legacy deep imports (the old package had no
// exports map, so every file shipped and every path was reachable) working.
import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";

test("./dist/index.mjs subpath is importable", async () => {
  const ns = await import("redux-injectable-middleware/dist/index.mjs");
  assert.equal(typeof ns.injectMiddleware, "function");
  assert.equal(typeof ns.injectableMiddleware, "function");
});

test("./dist/index.js subpath is importable (CJS via lexer)", async () => {
  const ns = await import("redux-injectable-middleware/dist/index.js");
  assert.equal(typeof ns.injectMiddleware, "function");
  assert.equal(typeof ns.injectableMiddleware, "function");
  assert.equal(typeof ns.default, "object");
});

test("./dist/index.js subpath is requirable and identical to the root require", async () => {
  const req = createRequire(import.meta.url);
  const sub = req("redux-injectable-middleware/dist/index.js");
  const root = req("redux-injectable-middleware");
  assert.strictEqual(sub, root);
});

test("./src/index.js subpath resolves (bundler-only affordance)", async () => {
  const req = createRequire(import.meta.url);
  const resolved = req.resolve("redux-injectable-middleware/src/index.js");
  assert.ok(resolved.endsWith("src/index.js"));
});

test("./package.json subpath is reachable", async () => {
  const req = createRequire(import.meta.url);
  const pkg = req("redux-injectable-middleware/package.json");
  assert.equal(pkg.name, "redux-injectable-middleware");
});
