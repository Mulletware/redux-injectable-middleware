import { compose } from "redux";

export const injectMiddleware = (middleware) => {
  middlewareApi.onAddMiddleware(middleware);
};

let middlewareApi = {
  onAddMiddleware: () => {
    throw Error(
      "You can't inject middleware until after the store has been initialized."
    );
  },
};

export const injectableMiddleware = (store) => (_next) => {
  let next = _next;

  middlewareApi.onAddMiddleware = (ware) => {
    const currentNextFn = next;
    next = compose(ware(store))(currentNextFn); // wrap the previous `next` function with this new one, a la redux
  };

  return (action) => next(action);
};
