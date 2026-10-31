// Dual build:
//   dist/index.js  — CommonJS with statically-detectable named exports
//                    (`exports.foo = ...`), so Node's cjs-module-lexer can
//                    supply named exports when the CJS file is imported
//                    from native ESM. Do NOT switch this output back to a
//                    bundled-IIFE style (e.g. webpack's `commonjs2` target,
//                    which registers getters through a runtime helper the
//                    lexer cannot see) — named ESM imports would break.
//   dist/index.mjs — real ES module.
// `redux` stays external (it is a runtime dependency).
export default {
  input: "src/index.js",
  external: ["redux"],
  output: [
    { file: "dist/index.js", format: "cjs", exports: "named" },
    { file: "dist/index.mjs", format: "es" },
  ],
};
