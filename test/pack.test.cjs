"use strict";
// Publish hygiene: `npm pack --dry-run` must include the built artifacts.
// This repo's .gitignore excludes dist/* — without the `files` whitelist the
// published tarball would silently ship WITHOUT dist. This test pins the
// actual tarball contents.
const assert = require("node:assert/strict");
const test = require("node:test");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: root,
  encoding: "utf8",
});

test("npm pack --dry-run succeeds", () => {
  assert.equal(
    result.status,
    0,
    `npm pack failed:\n${result.stderr || result.stdout}`
  );
});

function packedPaths() {
  const start = result.stdout.indexOf("[");
  const end = result.stdout.lastIndexOf("]");
  assert.ok(start !== -1 && end !== -1, `no JSON in npm pack output`);
  const parsed = JSON.parse(result.stdout.slice(start, end + 1));
  return parsed[0].files.map((f) => f.path);
}

test("tarball includes all runtime artifacts", () => {
  const paths = packedPaths();
  for (const required of [
    "package.json",
    "README.md",
    "LICENSE",
    "dist/index.js",
    "dist/index.mjs",
    "types/index.d.ts",
    "src/index.js",
  ]) {
    assert.ok(
      paths.includes(required),
      `tarball is missing ${required}; got: ${paths.join(", ")}`
    );
  }
});

test("tarball excludes dev files", () => {
  const paths = packedPaths();
  const forbidden = paths.filter(
    (p) =>
      p.startsWith("test/") ||
      p.startsWith("node_modules") ||
      p === "rollup.config.mjs" ||
      p === "tsconfig.types.json" ||
      p === "webpack.config.js" ||
      p === "import_issues.md" ||
      p.startsWith("types-usage")
  );
  assert.deepEqual(forbidden, []);
});
