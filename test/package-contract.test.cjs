"use strict";
// Package.json contract: the packaging invariants that make native ESM/CJS
// interop work. If someone regresses any of these (points `module` back at
// raw source, drops the exports map, leaks build tooling into runtime
// dependencies...), this file fails before anything ships.
const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const pkg = require("../package.json");
const exists = (p) => fs.existsSync(path.join(root, p));

test("exports map: root entry has types/import/require pointing at real files", () => {
  const rootExport = pkg.exports["."];
  assert.equal(rootExport.types, "./types/index.d.ts");
  assert.equal(rootExport.import, "./dist/index.mjs");
  assert.equal(rootExport.require, "./dist/index.js");
  assert.ok(exists("types/index.d.ts"));
  assert.ok(exists("dist/index.mjs"));
  assert.ok(exists("dist/index.js"));
});

test("main/module/types fields point at built files, not raw source", () => {
  assert.equal(pkg.main, "dist/index.js");
  // Regression pin: this used to be "src/index.js" (untranspiled source).
  assert.equal(pkg.module, "dist/index.mjs");
  assert.equal(pkg.types, "types/index.d.ts");
  assert.ok(exists(pkg.main));
  assert.ok(exists(pkg.module));
  assert.ok(exists(pkg.types));
});

test("files whitelist ships the artifacts (dist is gitignored; files overrides)", () => {
  assert.ok(pkg.files.includes("dist"));
  assert.ok(pkg.files.includes("types"));
  assert.ok(pkg.files.includes("src"));
});

test("no build-time tooling leaks into runtime dependencies", () => {
  // The old package carried mkdirp/rimraf/webpack concerns in
  // "dependencies"; only redux is a true runtime dependency now.
  assert.deepEqual(Object.keys(pkg.dependencies), ["redux"]);
});

test("redux range covers both redux 4 and 5 (compose is identical in both)", () => {
  assert.match(pkg.dependencies.redux, /\^4\.\d+/);
  assert.match(pkg.dependencies.redux, /\|\|\s*\^5\.\d+/);
});

test("package stays CommonJS-by-default (no type: module)", () => {
  assert.equal(pkg.type, undefined);
});

test("tree-shaking hint and engines are sane", () => {
  assert.equal(pkg.sideEffects, false);
  assert.ok(pkg.engines && pkg.engines.node);
});

test("version is a valid semver and this is a minor bump over 1.0.5", () => {
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  const [major, minor] = pkg.version.split(".").map(Number);
  assert.equal(major, 1);
  assert.ok(minor >= 1, "packaging fix must ship as >= 1.1.0");
});

test("exports map covers the legacy deep-import paths", () => {
  for (const sub of [
    "./dist/index.js",
    "./dist/index.mjs",
    "./src/index.js",
    "./package.json",
  ]) {
    assert.ok(pkg.exports[sub], `missing subpath export ${sub}`);
  }
});
