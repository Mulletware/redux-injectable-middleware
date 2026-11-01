# Redux-Injectable-Middleware

Redux-Injectable-Middleware is a Redux library that allows asynchronous middleware injection of other middlewares.

For example, I wanted to create an `injectApi` function to mount a Redux Toolkit Query API without modifying the store file. There are plenty of examples of asynchronous reducer injection online but none of the middleware injection examples I found worked. This allowed me to keep my API code completely modular, even allowing full code splitting.

## Installation

`npm install redux-injectable-middleware`

or

`yarn add redux-injectable-middleware`

## Usage

First you'll need to register the middleware with redux when it's first initialized on startup. This is a requirement.

```js
// app/store.js
import { injectableMiddleware } from "redux-injectable-middleware";

// using standard redux: 
  ...
  middleware: applyMiddleware(injectableMiddleware),
  ...

// using redux toolkit:
  middleware: (getDefaultMiddleware) => [
    ...getDefaultMiddleware(),
    injectableMiddleware,
  ],

```

Next, just pass your middleware to the `injectMiddleware` function and it will be sideloaded into the redux dispatch chain.

```js
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

## Module format & TypeScript

Since 1.1.0 the package ships real ESM (`dist/index.mjs`) alongside
CommonJS (`dist/index.js`) behind a Node `exports` map, plus TypeScript
types. Named imports work natively in both ESM and CJS — no bundler interop
required:

```js
import { injectMiddleware, injectableMiddleware } from "redux-injectable-middleware";
```

A default export mirroring the named exports is also provided, so
default-import interop (`import rIM from "redux-injectable-middleware"`)
works identically against either build.

## Development

```bash
npm install
npm test        # builds dist/ first, then runs the full suite
npm run build   # dist/index.js (CJS) + dist/index.mjs (ESM)
npm run test:types
```

The test suite pins the packaging contract (native ESM named imports,
cjs-module-lexer detection of the CJS build, `npm pack` contents) — if you
change the build, keep those green.

## Releasing

Releases are automated: [semantic-release](https://github.com/semantic-release/semantic-release)
runs in GitHub Actions on every push to `main`. Use [conventional commit
messages](https://www.conventionalcommits.org) (`fix:`, `feat:`,
`feat!:`/`BREAKING CHANGE:`) — the version bump, changelog, git tag, GitHub
release, and npm publish all happen from CI. Do not `npm publish` manually
and do not hand-bump `version` in package.json.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
