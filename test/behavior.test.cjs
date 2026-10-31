"use strict";
// Core behavioral semantics of the middleware, exercised against the BUILT
// artifacts (dist/), not the source — packaging is where this package has
// historically regressed.
const assert = require("node:assert/strict");
const test = require("node:test");
const { createStore, applyMiddleware } = require("redux");

// The module keeps a singleton "onAddMiddleware" callback; tests that care
// about module state get a fresh instance of the built module.
function fresh() {
  const resolved = require.resolve("../dist/index.js");
  delete require.cache[resolved];
  return require(resolved);
}

const makeReducer = (log = []) =>
  (state = { n: 0 }, action) => {
    log.push(action);
    return action.type === "INC" ? { n: state.n + 1 } : state;
  };

const noopMiddleware = () => (next) => (action) => next(action);

test("exports two named functions", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  assert.equal(typeof injectableMiddleware, "function");
  assert.equal(typeof injectMiddleware, "function");
  assert.equal(injectableMiddleware.length, 1);
  assert.equal(injectMiddleware.length, 1);
});

test("store works normally with no injections", () => {
  const { injectableMiddleware } = fresh();
  const store = createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  store.dispatch({ type: "INC" });
  store.dispatch({ type: "INC" });
  assert.equal(store.getState().n, 2);
});

test("injected middleware observes actions dispatched after injection", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  const store = createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  store.dispatch({ type: "INC" }); // before any injection

  const seen = [];
  injectMiddleware((api) => (next) => (action) => {
    seen.push(action);
    return next(action);
  });

  store.dispatch({ type: "INC" });
  assert.equal(seen.length, 1, "must not see actions dispatched before injection");
  assert.equal(seen[0].type, "INC");
  assert.equal(store.getState().n, 2, "both INCs must reach the reducer");
});

test("injected middleware receives a working middleware API", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  const store = createStore(makeReducer(), applyMiddleware(injectableMiddleware));

  let api;
  injectMiddleware((mwApi) => (next) => (action) => {
    api = mwApi;
    return next(action);
  });
  store.dispatch({ type: "PING" });

  assert.equal(typeof api.getState, "function");
  assert.equal(typeof api.dispatch, "function");
  assert.deepEqual(api.getState(), store.getState());

  // `dispatch` on the middleware API re-enters the full outer chain.
  let reentered = 0;
  injectMiddleware(() => (next) => (action) => {
    reentered++;
    return next(action);
  });
  store.dispatch({ type: "PING" });
  assert.equal(reentered, 1);

  const before = store.getState().n;
  api.dispatch({ type: "INC" });
  assert.equal(reentered, 2, "api.dispatch must go through the whole chain");
  assert.equal(store.getState().n, before + 1);
});

test("injected middleware can short-circuit an action", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  const store = createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  injectMiddleware(() => (next) => (action) => {
    if (action.type === "BLOCK") return "blocked";
    return next(action);
  });

  const result = store.dispatch({ type: "BLOCK" });
  assert.equal(result, "blocked", "dispatch returns the middleware's return value");
  const n = store.getState().n;
  store.dispatch({ type: "BLOCK" });
  assert.equal(store.getState().n, n, "reducer must not run for short-circuited actions");
});

test("injected middleware can transform the action", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  const reducerLog = [];
  const store = createStore(makeReducer(reducerLog), applyMiddleware(injectableMiddleware));
  injectMiddleware(() => (next) => (action) => next({ ...action, tagged: true }));
  store.dispatch({ type: "TAG" });
  assert.equal(reducerLog.at(-1).type, "TAG");
  assert.equal(reducerLog.at(-1).tagged, true);
});

test("multiple injections compose LIFO: newest middleware runs first", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  const order = [];
  const store = createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  injectMiddleware(() => (next) => (action) => {
    order.push("A");
    return next(action);
  });
  injectMiddleware(() => (next) => (action) => {
    order.push("B");
    return next(action);
  });
  store.dispatch({ type: "PING" });
  assert.deepEqual(order, ["B", "A"]);
});

test("the same middleware injected twice wraps twice", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  let hits = 0;
  const counter = () => (next) => (action) => {
    hits++;
    return next(action);
  };
  const store = createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  injectMiddleware(counter);
  injectMiddleware(counter);
  store.dispatch({ type: "PING" });
  assert.equal(hits, 2);
});

test("injections compose at injectableMiddleware's position in the chain", () => {
  // A middleware registered BEFORE injectableMiddleware sits above it; an
  // action it blocks never reaches injected middleware.
  const { injectableMiddleware, injectMiddleware } = fresh();
  const seen = [];
  const top = () => (next) => (action) =>
    action.type === "STOP" ? "stopped" : next(action);
  const store = createStore(makeReducer(), applyMiddleware(top, injectableMiddleware));
  injectMiddleware(() => (next) => (action) => {
    seen.push(action.type);
    return next(action);
  });
  store.dispatch({ type: "PING" });
  store.dispatch({ type: "STOP" });
  assert.deepEqual(seen, ["PING"]);
});

test("injecting a non-function throws TypeError at injection time", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  assert.throws(() => injectMiddleware(false), TypeError);
  assert.throws(() => injectMiddleware(undefined), TypeError);
});

test("injectMiddleware returns undefined", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  assert.equal(injectMiddleware(noopMiddleware), undefined);
});

test("injections route to the most recently initialized store", () => {
  // The injected-callback registry is module-level state: the newest store
  // wins. This pins the current (documented) behavior.
  const rim = fresh();
  const seen1 = [];
  const seen2 = [];
  const store1 = createStore(makeReducer(), applyMiddleware(rim.injectableMiddleware));
  store1.dispatch({ type: "PING" });
  const store2 = createStore(makeReducer(), applyMiddleware(rim.injectableMiddleware));

  rim.injectMiddleware(() => (next) => (action) => {
    seen2.push(action.type);
    return next(action);
  });
  store1.dispatch({ type: "PING1" });
  store2.dispatch({ type: "PING2" });

  assert.deepEqual(seen2, ["PING2"], "the newest store receives injections");
  assert.deepEqual(seen1, [], "older stores stop receiving new injections");
  store1.dispatch({ type: "INC" });
  assert.equal(store1.getState().n, 1, "older stores keep working");
});

test("injected middleware sees state via getState at dispatch time", () => {
  const { injectableMiddleware, injectMiddleware } = fresh();
  const states = [];
  const store = createStore(makeReducer(), applyMiddleware(injectableMiddleware));
  injectMiddleware((api) => (next) => (action) => {
    states.push(api.getState().n);
    return next(action);
  });
  store.dispatch({ type: "INC" }); // sees n=0, produces n=1
  store.dispatch({ type: "INC" }); // sees n=1
  assert.deepEqual(states, [0, 1]);
});
