// THE regression test for import_issues.md §2.3/§2.5: importing the CJS
// build directly from native ESM requires Node's cjs-module-lexer to see the
// named exports statically. Webpack's runtime-helper registration
// (`e.d(r, {...})`) was invisible to the lexer; rollup's
// `exports.foo = ...` output is not. If this test ever fails again, the CJS
// build has regressed to a lexer-opaque pattern.
import assert from "node:assert/strict";
import test from "node:test";
import rim, { injectMiddleware, injectableMiddleware } from "../dist/index.js";
import * as ns from "../dist/index.js";

test("named import from the CJS build works (cjs-module-lexer sees exports)", () => {
  assert.equal(typeof injectMiddleware, "function");
  assert.equal(typeof injectableMiddleware, "function");
});

test("default import is module.exports and carries the named exports", () => {
  assert.strictEqual(rim, ns.default);
  assert.strictEqual(rim.injectMiddleware, injectMiddleware);
  assert.strictEqual(rim.injectableMiddleware, injectableMiddleware);
});

test("CJS-build namespace shape includes default + the named exports", () => {
  // Node's CJS-ESM interop always exposes a literal "module.exports" key on
  // the namespace of an imported CJS module — that part is normal. The
  // regression this guards against is the OLD shape, where lexer detection
  // failed and the named exports were MISSING (only default +
  // module.exports, per import_issues.md §2.5).
  const keys = Object.keys(ns).sort();
  for (const required of ["default", "injectMiddleware", "injectableMiddleware"]) {
    assert.ok(keys.includes(required), `namespace is missing ${required}: got ${keys}`);
  }
});

test("the astroglide consumption pattern works: default import + destructure", () => {
  // This is exactly what redux-astroglide's ESM entry does once it switches
  // to default-import interop — prove it against this build.
  const { injectableMiddleware: im, injectMiddleware: inj } = rim;
  assert.equal(typeof im, "function");
  assert.equal(typeof inj, "function");
});
