"use strict";
// CJS consumption contract: plain `require` of the package and of the CJS
// build, through the `exports` map's "require" condition.
const assert = require("node:assert/strict");
const test = require("node:test");

const rim = require("../dist/index.js");

test("CJS build exposes the named exports plus a mirroring default", () => {
  assert.deepEqual(Object.keys(rim).sort(), [
    "default",
    "injectMiddleware",
    "injectableMiddleware",
  ]);
  assert.equal(typeof rim.injectMiddleware, "function");
  assert.equal(typeof rim.injectableMiddleware, "function");
});

test("self-referencing require resolves through the exports map to the CJS build", () => {
  const selfRef = require("redux-injectable-middleware");
  assert.strictEqual(selfRef, rim, "must resolve to the same module instance");
  assert.strictEqual(
    require.resolve("redux-injectable-middleware"),
    require.resolve("../dist/index.js")
  );
});

test("the CJS default export mirrors the named exports", () => {
  // The default exists so that `import rIM from ...` interop works against
  // both builds. It must carry the same functions. The old webpack artifact
  // leaked a bogus literal `module.exports` property; that must stay gone.
  assert.equal(rim.default.injectMiddleware, rim.injectMiddleware);
  assert.equal(rim.default.injectableMiddleware, rim.injectableMiddleware);
  assert.equal("module.exports" in rim, false);
});
