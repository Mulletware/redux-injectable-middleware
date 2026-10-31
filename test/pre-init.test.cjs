"use strict";
// MUST run in its own process (node --test gives each file its own process):
// this is the only place that exercises the pristine "nothing initialized
// yet" module state.
const assert = require("node:assert/strict");
const test = require("node:test");
const { injectMiddleware } = require("../dist/index.js");

test("injectMiddleware before any store initialization throws", () => {
  assert.throws(
    () => injectMiddleware(() => (next) => (action) => next(action)),
    {
      message:
        "You can't inject middleware until after the store has been initialized.",
    }
  );
});

test("the pre-init error is an Error instance", () => {
  try {
    injectMiddleware(() => (next) => (action) => next(action));
    assert.fail("expected throw");
  } catch (err) {
    assert.ok(err instanceof Error);
  }
});
