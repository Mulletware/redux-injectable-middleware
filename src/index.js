import { compose } from "redux";

const callbackObj = {
  onAddMiddleware: () => {
    throw Error(
      "You can't inject middleware until after the store has been initialized."
    );
  },
};

export const injectMiddleware = (middleware) => {
  callbackObj.onAddMiddleware(middleware);
};

export const injectableMiddleware = (store) => (_next) => {
  let next = _next;

  callbackObj.onAddMiddleware = (middleware) => {
    const currentNextFn = next;
    next = compose(middleware(store))(currentNextFn); // wrap the previous `next` function with this new one, a la redux
  };

  return (action) => next(action);
};
