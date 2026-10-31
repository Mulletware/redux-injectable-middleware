import type { Middleware } from "redux";

/**
 * Sideload a middleware into the store's dispatch chain.
 *
 * Must be called after the store has been initialized with
 * `injectableMiddleware`; calling it before throws.
 */
export declare const injectMiddleware: (middleware: Middleware) => void;

/**
 * The store middleware that enables `injectMiddleware`. Register it once at
 * store creation (e.g. via `applyMiddleware(injectableMiddleware)`).
 */
export declare const injectableMiddleware: Middleware;
