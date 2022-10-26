# Redux-Injectable-Middleware

Redux-Injectable-Middleware is a Redux library that allows asynchronous middleware injection of other middlewares.

For example, I wanted to create an `injectApi` function to mount a Redux Toolkit Query API without modifying the store file. There are plenty of examples of asynchronous reducer injection online but none of the middleware injection examples I found worked. This allowed me to keep my API code completely modular, even allowing full code splitting.

## Installation

`npm install redux-injectable-middleware`

or

`yarn add redux-injectable-middleware`

## Usage

First you'll need to register the middleware with redux when it's first initialized on startup. This is a requirement.

```
// app/store.js
import { injectableMiddleware } from "redux-injectable-middleware";

// using standard redux: 
  ...
  middleware: applyMiddleware([injectableMiddleware]),
  ...

// using redux toolkit:
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware(),
    injectableMiddleware,
  ],

```

Next, just pass your middleware to the `injectMiddleware` function and it will be sideloaded into the redux dispatch chain.

```
// api/user.js
import { createApi } from "@reduxjs/toolkit/query/react";
import { injectMiddleware } from "redux-injectable-middleware";
import { injectReducer } from "[some other package that does this]";

export const userApi = createApi({
  reducerPath: ...
});

injectMiddleware(api.middleware);
...
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
