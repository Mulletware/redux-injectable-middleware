"use strict";
// True consumer simulation: a throwaway project with a REAL node_modules
// layout (this package + redux copied in), imported the way downstream apps
// do — bare specifiers, from nested paths, in ESM and CJS. No self-reference
// shortcuts, no bundler transform: plain Node resolution through the exports
// map, exactly like a fresh `npm install redux-injectable-middleware` gives
// a consumer.
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rim-consumer-"));

test.after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function setupConsumer() {
  fs.writeFileSync(
    path.join(tmp, "package.json"),
    JSON.stringify({ name: "consumer-sim", private: true, type: "module" }, null, 2)
  );
  // Install this package as it would be unpacked from the tarball.
  const pkgDir = path.join(tmp, "node_modules", "redux-injectable-middleware");
  fs.mkdirSync(pkgDir, { recursive: true });
  for (const entry of ["dist", "types", "src", "package.json", "README.md", "LICENSE"]) {
    fs.cpSync(path.join(root, entry), path.join(pkgDir, entry), { recursive: true });
  }
  // Install redux (our only runtime dependency) next to it.
  let reduxDir = path.dirname(require.resolve("redux"));
  while (!fs.existsSync(path.join(reduxDir, "package.json"))) {
    reduxDir = path.dirname(reduxDir);
  }
  assert.equal(
    require(path.join(reduxDir, "package.json")).name,
    "redux",
    "could not locate the installed redux package"
  );
  fs.cpSync(reduxDir, path.join(tmp, "node_modules", "redux"), { recursive: true });
  // redux 4 has runtime dependencies of its own (e.g. @babel/runtime); copy
  // whatever the installed redux declares so the simulation is self-sufficient.
  const reduxDeps = Object.keys(
    require(path.join(reduxDir, "package.json")).dependencies || {}
  );
  for (const dep of reduxDeps) {
    const depPath = path.dirname(require.resolve(path.join(dep, "package.json")));
    fs.cpSync(depPath, path.join(tmp, "node_modules", dep), { recursive: true });
  }
}

const ESM_CONSUMER = `
import { injectMiddleware, injectableMiddleware } from "redux-injectable-middleware";
import { createStore, applyMiddleware, compose as reduxCompose } from "redux";

const seen = [];
const reducer = (state = { n: 0 }, action) =>
  action.type === "INC" ? { n: state.n + 1 } : state;
const store = createStore(reducer, applyMiddleware(injectableMiddleware));
injectMiddleware(() => (next) => (action) => { seen.push(action.type); return next(action); });
store.dispatch({ type: "INC" });

if (seen.length !== 1) throw new Error("injected middleware did not observe the action: " + seen);
if (store.getState().n !== 1) throw new Error("reducer did not run");
if (typeof reduxCompose !== "function") throw new Error("redux not resolvable");
console.log("ESM_CONSUMER_OK");
`;

const CJS_CONSUMER = `
const { injectMiddleware, injectableMiddleware } = require("redux-injectable-middleware");
const { applyMiddleware } = require("redux");
if (typeof injectMiddleware !== "function" || typeof injectableMiddleware !== "function") {
  throw new Error("CJS named require failed");
}
console.log("CJS_CONSUMER_OK");
`;

const ASTROGLIDE_STYLE = `
// The exact pattern redux-astroglide's ESM entry uses after its interop fix:
// default import + runtime destructure. Must work against this build.
import rIM from "redux-injectable-middleware";
const { injectableMiddleware, injectMiddleware } = rIM;
if (typeof injectableMiddleware !== "function") throw new Error("no injectableMiddleware");
if (typeof injectMiddleware !== "function") throw new Error("no injectMiddleware");
console.log("ASTROGLIDE_STYLE_OK");
`;

function runNode(file, cwd = tmp) {
  return spawnSync(process.execPath, [file], { cwd, encoding: "utf8" });
}

test("simulated consumer: setup", () => {
  setupConsumer();
  assert.ok(fs.existsSync(path.join(tmp, "node_modules", "redux-injectable-middleware", "dist", "index.mjs")));
});

test("simulated consumer: native ESM named imports work (no bundler interop)", () => {
  fs.writeFileSync(path.join(tmp, "consumer.mjs"), ESM_CONSUMER);
  const r = runNode("consumer.mjs");
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /ESM_CONSUMER_OK/);
});

test("simulated consumer: plain require works", () => {
  fs.writeFileSync(path.join(tmp, "consumer.cjs"), CJS_CONSUMER);
  const r = runNode("consumer.cjs");
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /CJS_CONSUMER_OK/);
});

test("simulated consumer: default-import + destructure (astroglide pattern) works", () => {
  fs.writeFileSync(path.join(tmp, "astroglide-style.mjs"), ASTROGLIDE_STYLE);
  const r = runNode("astroglide-style.mjs");
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /ASTROGLIDE_STYLE_OK/);
});

test("simulated consumer: resolution works from deeply nested directories", () => {
  const deep = path.join(tmp, "a", "b", "c");
  fs.mkdirSync(deep, { recursive: true });
  fs.writeFileSync(path.join(deep, "deep.mjs"), ESM_CONSUMER.replace("ESM_CONSUMER_OK", "DEEP_OK"));
  const r = runNode("deep.mjs", deep);
  assert.equal(r.status, 0, `stderr: ${r.stderr}`);
  assert.match(r.stdout, /DEEP_OK/);
});
