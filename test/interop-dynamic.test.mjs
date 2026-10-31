import assert from "node:assert/strict";
import test from "node:test";
import { createRequire } from "node:module";
import * as staticNs from "redux-injectable-middleware";

test("dynamic import() of the package works and matches static import", async () => {
  const ns = await import("redux-injectable-middleware");
  assert.strictEqual(ns.injectMiddleware, staticNs.injectMiddleware);
  assert.strictEqual(ns.injectableMiddleware, staticNs.injectableMiddleware);
  assert.deepEqual(Object.keys(ns).sort(), [
    "default",
    "injectMiddleware",
    "injectableMiddleware",
  ]);
});

test("dynamic import() of the CJS build yields default + named exports", async () => {
  const ns = await import("../dist/index.js");
  assert.equal(typeof ns.default, "object");
  assert.equal(typeof ns.injectMiddleware, "function");
  assert.equal(typeof ns.injectableMiddleware, "function");
  assert.strictEqual(ns.default.injectableMiddleware, ns.injectableMiddleware);
});

test("createRequire can require() the package from ESM", async () => {
  const req = createRequire(import.meta.url);
  const a = req("redux-injectable-middleware");
  const b = req("../dist/index.js");
  assert.strictEqual(a, b);
  assert.equal(typeof a.injectMiddleware, "function");
  assert.equal(typeof a.injectableMiddleware, "function");
});
