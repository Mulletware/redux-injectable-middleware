import assert from "node:assert/strict";
import test from "node:test";
// Named imports resolved through the package's own exports map ("import"
// condition → dist/index.mjs). Self-reference works because package.json
// declares "name" and "exports" — this is how a real ESM consumer resolves us.
import { injectMiddleware, injectableMiddleware } from "redux-injectable-middleware";
import * as ns from "redux-injectable-middleware";

test("named ESM import from the package works natively", () => {
  assert.equal(typeof injectMiddleware, "function");
  assert.equal(typeof injectableMiddleware, "function");
});

test("ESM namespace exposes the named exports plus a mirroring default", () => {
  assert.deepEqual(Object.keys(ns).sort(), [
    "default",
    "injectMiddleware",
    "injectableMiddleware",
  ]);
  assert.strictEqual(ns.injectMiddleware, injectMiddleware);
  assert.strictEqual(ns.injectableMiddleware, injectableMiddleware);
  assert.equal(ns.default.injectMiddleware, injectMiddleware);
  assert.equal(ns.default.injectableMiddleware, injectableMiddleware);
});

test("the two exports behave as a working middleware pair", async () => {
  const { createStore, applyMiddleware } = await import("redux");
  const store = createStore(
    (s = 0, a) => (a.type === "INC" ? s + 1 : s),
    applyMiddleware(injectableMiddleware)
  );
  injectMiddleware(() => (next) => (action) => next(action));
  store.dispatch({ type: "INC" });
  assert.equal(store.getState(), 1);
});
