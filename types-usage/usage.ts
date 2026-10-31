import type { Middleware } from "redux";
import { createStore, applyMiddleware } from "redux";
import { injectMiddleware, injectableMiddleware } from "redux-injectable-middleware";

// Runtime-shaped usage — must compile under strict mode.
const reducer = (state: number = 0, action: { type: string }) =>
  action.type === "INC" ? state + 1 : state;
const store = createStore(reducer, applyMiddleware(injectableMiddleware));
const mw: Middleware = ({ getState, dispatch }) => (next) => (action) => {
  void getState;
  void dispatch;
  return next(action);
};
injectMiddleware(mw);
store.dispatch({ type: "INC" });

// Type-level assertions.
type IsMiddleware = typeof injectableMiddleware extends Middleware ? true : never;
const _middlewareCheck: IsMiddleware = true;

type InjectParam = Parameters<typeof injectMiddleware>[0];
const _injectTakesMiddleware: InjectParam extends Middleware ? true : never = true;

// Named exports are exactly the public API surface.
type ExportNames = keyof typeof import("redux-injectable-middleware");
const _namesCheck: ExportNames extends "injectMiddleware" | "injectableMiddleware"
  ? true
  : never = true;
